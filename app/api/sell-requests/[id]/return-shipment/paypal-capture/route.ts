import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { authorizeSellRequestCustomer } from '@/lib/sell-request-auth'
import { markReturnShipmentPaid } from '@/lib/sell-request-return'
import { paypalApiBase, paypalAccessToken } from '@/lib/paypal-server'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	const body = await request.json()
	const paypalOrderId: string = body.paypalOrderId
	if (!paypalOrderId) return NextResponse.json({ error: 'paypalOrderId is required' }, { status: 400 })

	const service = createServiceClient()
	const { data: existing, error: fetchError } = await service
		.from('sell_phone_requests')
		.select('id, user_id, status, contact_email, contact_phone')
		.eq('id', id)
		.maybeSingle()
	if (fetchError || !existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

	const authError = await authorizeSellRequestCustomer(request, body, existing)
	if (authError) return authError

	try {
		const accessToken = await paypalAccessToken()
		const captureRes = await fetch(`${paypalApiBase()}/v2/checkout/orders/${paypalOrderId}/capture`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
		})
		const capture = await captureRes.json()
		if (!captureRes.ok || capture.status !== 'COMPLETED') {
			return NextResponse.json({ error: 'PayPal payment was not completed' }, { status: 402 })
		}

		await markReturnShipmentPaid(service, id, 'paypal', paypalOrderId)

		return NextResponse.json({ success: true })
	} catch (err) {
		return NextResponse.json({ error: err instanceof Error ? err.message : 'PayPal capture failed' }, { status: 500 })
	}
}
