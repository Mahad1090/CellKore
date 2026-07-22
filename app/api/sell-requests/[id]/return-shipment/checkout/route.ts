import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase-server'
import { authorizeSellRequestCustomer } from '@/lib/sell-request-auth'
import { paypalApiBase, paypalAccessToken } from '@/lib/paypal-server'

interface ReturnAddressInput {
	line1: string
	line2?: string
	city: string
	stateProvince?: string
	postalCode?: string
	country: string
	phone?: string
}

// Customer-facing: pays the return shipping fee for a rejected, already-
// received device. Saves the shipping address and starts a Stripe
// Checkout session or PayPal order for the fee amount admin set.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	const body = await request.json()
	const provider = body.provider === 'paypal' ? 'paypal' : 'stripe'
	const address: ReturnAddressInput = body.address ?? {}
	if (!address.line1?.trim() || !address.city?.trim() || !address.country?.trim()) {
		return NextResponse.json({ error: 'A complete shipping address is required' }, { status: 400 })
	}

	const service = createServiceClient()
	const { data: existing, error: fetchError } = await service
		.from('sell_phone_requests')
		.select('id, user_id, status, contact_email, contact_phone')
		.eq('id', id)
		.maybeSingle()
	if (fetchError || !existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

	const authError = await authorizeSellRequestCustomer(request, body, existing)
	if (authError) return authError

	if (existing.status !== 'rejected') {
		return NextResponse.json({ error: 'This request does not have a return shipment to pay for' }, { status: 400 })
	}

	const { data: shipment, error: shipmentFetchError } = await service
		.from('sell_phone_return_shipments')
		.select('id, fee_amount, paid_at')
		.eq('request_id', id)
		.maybeSingle()
	if (shipmentFetchError || !shipment) {
		return NextResponse.json({ error: 'No return shipping fee has been set for this request' }, { status: 400 })
	}
	if (shipment.paid_at) {
		return NextResponse.json({ error: 'The return shipping fee has already been paid' }, { status: 400 })
	}

	const { error: addressError } = await service
		.from('sell_phone_return_shipments')
		.update({
			address_line1: address.line1.trim(),
			address_line2: address.line2?.trim() || null,
			city: address.city.trim(),
			state_province: address.stateProvince?.trim() || null,
			postal_code: address.postalCode?.trim() || null,
			country: address.country.trim(),
			phone: address.phone?.trim() || null,
			updated_at: new Date().toISOString(),
		})
		.eq('request_id', id)
	if (addressError) return NextResponse.json({ error: addressError.message }, { status: 500 })

	const fee = Number(shipment.fee_amount)

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
							currency: 'usd',
							unit_amount: Math.round(fee * 100),
							product_data: { name: 'Return Shipping Fee' },
						},
					},
				],
				success_url: `${origin}/sell/track?id=${id}&return_paid=1`,
				cancel_url: `${origin}/sell/track?id=${id}`,
				metadata: { type: 'sell_return_shipping', request_id: id },
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
						custom_id: JSON.stringify({ type: 'sell_return_shipping', request_id: id }),
						amount: { currency_code: 'USD', value: fee.toFixed(2) },
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
