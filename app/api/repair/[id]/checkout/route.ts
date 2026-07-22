import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase-server'
import { authorizeSellRequestCustomer } from '@/lib/sell-request-auth'
import { paypalApiBase, paypalAccessToken } from '@/lib/paypal-server'

// Customer-facing: pays the total (repair charges + chosen shipping-back
// option) for an accepted repair quote. Starts a Stripe Checkout session
// or PayPal order for the grand total.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	const body = await request.json()
	const provider = body.provider === 'paypal' ? 'paypal' : 'stripe'

	const service = createServiceClient()
	const { data: existing, error: fetchError } = await service
		.from('repair_requests')
		.select('id, user_id, status, contact_email, contact_phone, grand_total, quote_currency, paid_at')
		.eq('id', id)
		.maybeSingle()
	if (fetchError || !existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

	const authError = await authorizeSellRequestCustomer(request, body, existing)
	if (authError) return authError

	if (existing.status !== 'quote_accepted') {
		return NextResponse.json({ error: 'This request does not have an accepted quote ready for payment' }, { status: 400 })
	}
	if (existing.paid_at) {
		return NextResponse.json({ error: 'This repair has already been paid for' }, { status: 400 })
	}

	const total = Number(existing.grand_total ?? 0)
	if (!total || total <= 0) {
		return NextResponse.json({ error: 'No payable total is set on this request' }, { status: 400 })
	}
	const currency = existing.quote_currency === 'CAD' ? 'CAD' : 'USD'

	try {
		if (provider === 'stripe') {
			const stripeSecret = process.env.STRIPE_SECRET_KEY
			if (!stripeSecret) return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
			const stripe = new Stripe(stripeSecret)
			const origin =
				request.headers.get('origin') ||
				`${request.headers.get('x-forwarded-proto') ?? 'https'}://${request.headers.get('host')}`

			const session = await stripe.checkout.sessions.create({
				mode: 'payment',
				line_items: [
					{
						quantity: 1,
						price_data: {
							currency: currency.toLowerCase(),
							unit_amount: Math.round(total * 100),
							product_data: { name: 'Repair Charges & Return Shipping' },
						},
					},
				],
				success_url: `${origin}/repair/status?id=${id}&paid=1`,
				cancel_url: `${origin}/repair/status?id=${id}`,
				metadata: { type: 'repair_payment', request_id: id },
			})
			return NextResponse.json({ url: session.url })
		}

		const accessToken = await paypalAccessToken()
		const res = await fetch(`${paypalApiBase()}/v2/checkout/orders`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
			body: JSON.stringify({
				intent: 'CAPTURE',
				purchase_units: [
					{
						reference_id: id,
						custom_id: JSON.stringify({ type: 'repair_payment', request_id: id }),
						amount: { currency_code: currency, value: total.toFixed(2) },
					},
				],
			}),
		})
		const order = await res.json()
		if (!res.ok) return NextResponse.json({ error: 'PayPal order creation failed' }, { status: 502 })
		return NextResponse.json({ paypalOrderId: order.id })
	} catch (err) {
		return NextResponse.json({ error: err instanceof Error ? err.message : 'Payment setup failed' }, { status: 500 })
	}
}
