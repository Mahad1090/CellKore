import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServiceClient } from '@/lib/supabase-server'
import { authorizeSellRequestCustomer } from '@/lib/sell-request-auth'
import { paypalApiBase, paypalAccessToken } from '@/lib/paypal-server'
import { getShippingRates } from '@/lib/shipping/aggregator'
import { computePackageForItems } from '@/lib/shipping/package'
import type { ShippingCarrier } from '@/lib/types'

interface ReturnAddressInput {
	line1: string
	line2?: string
	city: string
	stateProvince?: string
	postalCode?: string
	country: string
	phone?: string
}

interface ShippingRateInput {
	carrier: ShippingCarrier
	serviceCode: string
}

// Customer-facing: pays the return shipping fee for a rejected, already-
// received device. Saves the shipping address, re-validates the live
// carrier rate the customer selected on the /rates endpoint (never
// trusts the client's submitted price — same posture as
// lib/checkout-server.ts's validateAndPriceShipping), and starts a
// Stripe Checkout session or PayPal order for that cost.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	const body = await request.json()
	const provider = body.provider === 'paypal' ? 'paypal' : 'stripe'
	const address: ReturnAddressInput = body.address ?? {}
	const shippingRate: ShippingRateInput = body.shippingRate
	if (!address.line1?.trim() || !address.city?.trim() || !address.country?.trim() || !address.phone?.trim()) {
		return NextResponse.json({ error: 'A complete shipping address and phone number are required' }, { status: 400 })
	}
	if (!shippingRate?.carrier || !shippingRate?.serviceCode) {
		return NextResponse.json({ error: 'A shipping method must be selected' }, { status: 400 })
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

	const { data: existingShipment } = await service
		.from('sell_phone_return_shipments')
		.select('id, paid_at')
		.eq('request_id', id)
		.maybeSingle()
	if (existingShipment?.paid_at) {
		return NextResponse.json({ error: 'The return shipping fee has already been paid' }, { status: 400 })
	}

	const pkg = computePackageForItems([{ quantity: 1 }])
	const { rates } = await getShippingRates(pkg, {
		name: 'Customer',
		phone: address.phone,
		line1: address.line1,
		line2: address.line2,
		city: address.city,
		stateProvince: address.stateProvince ?? '',
		postalCode: address.postalCode ?? '',
		country: address.country,
	})
	const match = rates.find((r) => r.carrier === shippingRate.carrier && r.serviceCode === shippingRate.serviceCode)
	if (!match) {
		return NextResponse.json(
			{ error: 'The selected shipping rate is no longer available. Please choose again.' },
			{ status: 400 }
		)
	}
	const fee = match.cost
	const currency = match.currency

	const { error: upsertError } = await service.from('sell_phone_return_shipments').upsert(
		{
			request_id: id,
			address_line1: address.line1.trim(),
			address_line2: address.line2?.trim() || null,
			city: address.city.trim(),
			state_province: address.stateProvince?.trim() || null,
			postal_code: address.postalCode?.trim() || null,
			country: address.country.trim(),
			phone: address.phone.trim(),
			carrier: match.carrier,
			service_code: match.serviceCode,
			service_name: match.serviceName,
			fee_amount: fee,
			currency,
			updated_at: new Date().toISOString(),
		},
		{ onConflict: 'request_id' }
	)
	if (upsertError) return NextResponse.json({ error: upsertError.message }, { status: 500 })

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
							unit_amount: Math.round(fee * 100),
							product_data: { name: `Return Shipping — ${match.serviceName}` },
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
						amount: { currency_code: currency, value: fee.toFixed(2) },
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
