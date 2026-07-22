import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase-server'
import { matchesContact } from '@/lib/sell-request-contact'
import { sendSellRequestCustomerDecisionAdminAlert } from '@/lib/email/sell-requests'

// Customer-facing endpoint: once admin has approved a request and set an
// offered_price, the customer accepts or rejects that offer here. Accepting
// unlocks the shipment-details form; rejecting cancels the request. Same
// dual-auth pattern as the shipment route (signed-in JWT, or guest contact
// match for requests with no user_id).
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	const body = await request.json()
	const decision = body.decision
	if (decision !== 'accept' && decision !== 'reject') {
		return NextResponse.json({ error: 'Invalid decision' }, { status: 400 })
	}

	const service = createServiceClient()
	const { data: existing, error: fetchError } = await service
		.from('sell_phone_requests')
		.select('id, user_id, status, offered_price, contact_email, contact_phone, device_brand, device_model')
		.eq('id', id)
		.maybeSingle()
	if (fetchError || !existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

	const token = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
	if (existing.user_id) {
		if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
		const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
		const { data: userData, error: userError } = await anon.auth.getUser(token)
		if (userError || !userData.user || userData.user.id !== existing.user_id) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}
	} else {
		const contact = String(body.contact ?? '').trim()
		if (!contact || !matchesContact(existing, contact)) {
			return NextResponse.json({ error: 'Request ID and contact info do not match' }, { status: 403 })
		}
	}

	if (existing.status !== 'approved') {
		return NextResponse.json({ error: 'This request does not have a pending offer to respond to' }, { status: 400 })
	}

	const nextStatus = decision === 'accept' ? 'offer_accepted' : 'cancelled'
	const { error: updateError } = await service
		.from('sell_phone_requests')
		.update({ status: nextStatus, updated_at: new Date().toISOString() })
		.eq('id', id)
	if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

	await service.from('sell_phone_status_history').insert({
		request_id: id,
		status: nextStatus,
		note:
			decision === 'accept'
				? `Customer accepted the offer of $${Number(existing.offered_price ?? 0).toFixed(2)}`
				: 'Customer declined the offer',
		changed_by: 'customer',
	})

	await sendSellRequestCustomerDecisionAdminAlert(existing, decision)

	return NextResponse.json({ success: true })
}
