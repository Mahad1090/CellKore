import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { authorizeSellRequestCustomer } from '@/lib/sell-request-auth'
import { notifyRepairStatusChange } from '@/lib/repair-notifications'
import type { RepairShippingOption } from '@/lib/types'

// Customer-facing: accept or decline the repair charge quote. Accepting
// requires picking one of the shipping-back options offered on the
// quote, which sets the final total to pay.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	const body = await request.json()
	const action = body.action === 'accept' ? 'accept' : body.action === 'reject' ? 'reject' : null
	if (!action) return NextResponse.json({ error: 'action must be "accept" or "reject"' }, { status: 400 })

	const service = createServiceClient()
	const { data: existing, error: fetchError } = await service
		.from('repair_requests')
		.select('id, user_id, status, contact_email, contact_phone, quote_total, shipping_options')
		.eq('id', id)
		.maybeSingle()
	if (fetchError || !existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

	const authError = await authorizeSellRequestCustomer(request, body, existing)
	if (authError) return authError

	if (existing.status !== 'quote_sent') {
		return NextResponse.json({ error: 'This request does not have a pending quote to respond to' }, { status: 400 })
	}

	if (action === 'reject') {
		await service
			.from('repair_requests')
			.update({ status: 'cancelled', updated_at: new Date().toISOString() })
			.eq('id', id)
		await service.from('repair_status_history').insert({
			request_id: id,
			status: 'cancelled',
			note: 'Customer declined the repair quote',
			changed_by: 'customer',
		})
		await notifyRepairStatusChange(existing, 'cancelled')
		return NextResponse.json({ success: true })
	}

	const selected: RepairShippingOption = body.selected_shipping_option ?? {}
	const options: RepairShippingOption[] = existing.shipping_options ?? []
	const match = options.find((o) => o.label === selected.label && Number(o.cost) === Number(selected.cost))
	if (!match) {
		return NextResponse.json({ error: 'Select one of the offered shipping options' }, { status: 400 })
	}

	const quoteTotal = Number(existing.quote_total ?? 0)
	const shippingCost = Number(match.cost)
	const grandTotal = quoteTotal + shippingCost

	await service
		.from('repair_requests')
		.update({
			status: 'quote_accepted',
			selected_shipping_option: match,
			shipping_cost: shippingCost,
			grand_total: grandTotal,
			updated_at: new Date().toISOString(),
		})
		.eq('id', id)

	await service.from('repair_status_history').insert({
		request_id: id,
		status: 'quote_accepted',
		note: `Selected shipping: ${match.label}`,
		changed_by: 'customer',
	})
	await notifyRepairStatusChange(existing, 'quote_accepted')

	return NextResponse.json({ success: true, grand_total: grandTotal })
}
