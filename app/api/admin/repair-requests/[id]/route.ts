import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'
import { getRepairShippingRateOptions } from '@/lib/shipping-rates'
import { notifyRepairStatusChange } from '@/lib/repair-notifications'
import type { RepairQuoteItem } from '@/lib/types'

const VALID_STATUSES = [
	'submitted',
	'quote_sent',
	'quote_accepted',
	'payment_confirmed',
	'awaiting_device',
	'device_shipped',
	'device_received',
	'in_repair',
	'repaired',
	'shipped_back',
	'completed',
	'rejected',
	'cancelled',
]

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireAdmin(request, 'repair-requests:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const body = await request.json()

	const service = createServiceClient()
	const { data: existing, error: fetchError } = await service
		.from('repair_requests')
		.select('id, contact_email, contact_phone, device_brand, device_model, address_line1, address_line2, city, state_province, postal_code, country')
		.eq('id', id)
		.maybeSingle()
	if (fetchError || !existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

	const update: Record<string, unknown> = {}
	let statusChanged = false
	let newStatus: string | undefined

	if (body.status !== undefined) {
		if (!VALID_STATUSES.includes(body.status)) {
			return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
		}
		if (body.status === 'rejected' && !String(body.rejection_reason ?? '').trim()) {
			return NextResponse.json({ error: 'A rejection reason is required' }, { status: 400 })
		}
		if (body.status === 'quote_sent') {
			const items: RepairQuoteItem[] = Array.isArray(body.quote_items) ? body.quote_items : []
			const cleanItems = items
				.map((i) => ({ label: String(i.label ?? '').trim(), amount: Number(i.amount) }))
				.filter((i) => i.label && !Number.isNaN(i.amount) && i.amount > 0)
			if (cleanItems.length === 0) {
				return NextResponse.json({ error: 'At least one quote line item is required' }, { status: 400 })
			}
			const quoteTotal = cleanItems.reduce((sum, i) => sum + i.amount, 0)
			const quoteCurrency = body.quote_currency === 'CAD' ? 'CAD' : 'USD'
			const shippingOptions = await getRepairShippingRateOptions({
				line1: existing.address_line1 ?? '',
				line2: existing.address_line2,
				city: existing.city ?? '',
				stateProvince: existing.state_province,
				postalCode: existing.postal_code,
				country: existing.country ?? '',
			})
			update.quote_items = cleanItems
			update.quote_total = quoteTotal
			update.quote_currency = quoteCurrency
			update.quote_notes = body.quote_notes ? String(body.quote_notes).trim() : null
			update.quote_sent_at = new Date().toISOString()
			update.shipping_options = shippingOptions
		}
		update.status = body.status
		newStatus = body.status
		statusChanged = true
	}
	if (body.rejection_reason !== undefined) {
		update.rejection_reason = body.rejection_reason ? String(body.rejection_reason).trim() : null
	}

	if (Object.keys(update).length === 0) {
		return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
	}

	update.updated_at = new Date().toISOString()
	const { error } = await service.from('repair_requests').update(update).eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })

	if (statusChanged && newStatus) {
		const note =
			newStatus === 'rejected'
				? String(body.rejection_reason ?? '').trim()
				: body.note
					? String(body.note).trim()
					: null
		await service.from('repair_status_history').insert({
			request_id: id,
			status: newStatus,
			note,
			changed_by: 'admin',
		})
		await notifyRepairStatusChange(
			{
				...existing,
				quote_items: (update.quote_items as RepairQuoteItem[] | undefined) ?? undefined,
				quote_total: (update.quote_total as number | undefined) ?? undefined,
				quote_currency: (update.quote_currency as 'USD' | 'CAD' | undefined) ?? undefined,
			},
			newStatus as any
		)
	}

	return NextResponse.json({ success: true })
}
