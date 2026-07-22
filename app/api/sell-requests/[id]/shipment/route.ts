import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createServiceClient } from '@/lib/supabase-server'
import { matchesContact } from '@/lib/sell-request-contact'

// Customer-facing endpoint: once a customer has accepted the offer, they
// report how they shipped the device to us. Runs server-side
// (service role) so it can validate the status transition and write the
// timeline entry atomically, rather than relying on RLS column-level
// restrictions the browser client can't enforce.
//
// Two ways to authorize:
//  - Signed-in customer: Authorization: Bearer <access_token>, must own the request.
//  - Guest submitter (no account, user_id is null on the row): body.contact
//    must match the email/phone used at submission time.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	const body = await request.json()
	const courier = String(body.courier ?? '').trim()
	const tracking = String(body.tracking_number ?? '').trim()
	if (!courier || !tracking) {
		return NextResponse.json({ error: 'Courier and tracking number are required' }, { status: 400 })
	}

	const service = createServiceClient()
	const { data: existing, error: fetchError } = await service
		.from('sell_phone_requests')
		.select('id, user_id, status, contact_email, contact_phone')
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

	if (existing.status !== 'offer_accepted') {
		return NextResponse.json({ error: 'Shipment details can only be submitted after you accept the offer' }, { status: 400 })
	}

	const { error: updateError } = await service
		.from('sell_phone_requests')
		.update({
			shipping_courier: courier,
			shipping_tracking_number: tracking,
			status: 'shipment_submitted',
			updated_at: new Date().toISOString(),
		})
		.eq('id', id)
	if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

	await service.from('sell_phone_status_history').insert({
		request_id: id,
		status: 'shipment_submitted',
		note: `Courier: ${courier} · Tracking #: ${tracking}`,
		changed_by: 'customer',
	})

	return NextResponse.json({ success: true })
}
