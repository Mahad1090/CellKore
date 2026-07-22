import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'
import { sendSellRequestStatusEmail } from '@/lib/email/sell-requests'
import type { SellPhoneStatus } from '@/lib/types'

const VALID_STATUSES = [
	'submitted',
	'approved',
	'offer_accepted',
	'shipment_submitted',
	'awaiting_package',
	'under_inspection',
	'quoted',
	'payment_confirmed',
	'rejected',
	'cancelled',
]

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireAdmin(request, 'sell-requests:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const body = await request.json()

	const update: Record<string, unknown> = {}
	let statusChanged = false
	if (body.status !== undefined) {
		if (!VALID_STATUSES.includes(body.status)) {
			return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
		}
		if (body.status === 'rejected' && !String(body.rejection_reason ?? '').trim()) {
			return NextResponse.json({ error: 'A rejection reason is required' }, { status: 400 })
		}
		update.status = body.status
		statusChanged = true
	}
	if (body.rejection_reason !== undefined) {
		update.rejection_reason = body.rejection_reason ? String(body.rejection_reason).trim() : null
	}
	if (body.offered_price !== undefined) {
		update.offered_price = body.offered_price === null ? null : Number(body.offered_price)
	}
	if (body.payout_amount !== undefined) {
		update.payout_amount = body.payout_amount === null ? null : Number(body.payout_amount)
	}
	if (body.payout_reference !== undefined) {
		update.payout_reference = body.payout_reference ? String(body.payout_reference).trim() : null
	}
	if (body.payout_notes !== undefined) {
		update.payout_notes = body.payout_notes ? String(body.payout_notes).trim() : null
	}
	if (body.payout_confirmed_at !== undefined) {
		update.payout_confirmed_at = body.payout_confirmed_at || null
	}
	const returnShippingFee = body.return_shipping_fee !== undefined && body.return_shipping_fee !== null && body.return_shipping_fee !== ''
		? Number(body.return_shipping_fee)
		: null
	if (returnShippingFee !== null && (Number.isNaN(returnShippingFee) || returnShippingFee <= 0)) {
		return NextResponse.json({ error: 'Return shipping fee must be a positive number' }, { status: 400 })
	}

	if (Object.keys(update).length === 0 && returnShippingFee === null) {
		return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
	}

	const service = createServiceClient()

	if (Object.keys(update).length > 0) {
		update.updated_at = new Date().toISOString()
		const { error } = await service.from('sell_phone_requests').update(update).eq('id', id)
		if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	}

	// A return shipping fee only makes sense once we're rejecting a device
	// we already physically received (inspection stage or later).
	if (returnShippingFee !== null) {
		const { error: shipmentError } = await service
			.from('sell_phone_return_shipments')
			.upsert({ request_id: id, fee_amount: returnShippingFee }, { onConflict: 'request_id' })
		if (shipmentError) return NextResponse.json({ error: shipmentError.message }, { status: 500 })
	}

	if (statusChanged) {
		const note =
			body.status === 'rejected'
				? String(body.rejection_reason ?? '').trim()
				: body.note
					? String(body.note).trim()
					: null
		await service.from('sell_phone_status_history').insert({
			request_id: id,
			status: body.status,
			note,
			changed_by: 'admin',
		})

		const { data: updated } = await service
			.from('sell_phone_requests')
			.select('id, contact_email, device_brand, device_model, condition, offered_price, payout_amount, rejection_reason')
			.eq('id', id)
			.maybeSingle()
		if (updated) {
			await sendSellRequestStatusEmail(updated, body.status as SellPhoneStatus)
		}
	}

	return NextResponse.json({ success: true })
}
