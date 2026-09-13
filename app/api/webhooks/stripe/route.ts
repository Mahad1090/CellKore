import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { finalizePaidOrder } from '@/lib/checkout-server'
import { createServiceClient } from '@/lib/supabase-server'
import { markReturnShipmentPaid } from '@/lib/sell-request-return'
import { markRepairPaid } from '@/lib/repair-payment'
import { stripeSecretKey, stripeWebhookSecret } from '@/lib/payments-env'
import type { ShippingCarrier } from '@/lib/types'

export async function POST(request: NextRequest) {
	const stripeSecret = stripeSecretKey()
	const webhookSecret = stripeWebhookSecret()
	if (!stripeSecret || !webhookSecret) {
		return NextResponse.json({ error: 'Stripe webhook is not configured' }, { status: 500 })
	}
	const stripe = new Stripe(stripeSecret)

	const signature = request.headers.get('stripe-signature')
	if (!signature) {
		return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
	}

	let event: Stripe.Event
	try {
		const rawBody = await request.text()
		event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret)
	} catch {
		return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
	}

	// checkout.session.completed fires as soon as the customer finishes
	// Checkout, but for delayed payment methods (ACH debit, SEPA, etc.) the
	// session is still payment_status 'unpaid' at that point — the money
	// hasn't cleared yet. Only finalize immediately for methods that pay
	// instantly (cards); for delayed ones, wait for the async event that
	// fires once the payment actually succeeds or fails.
	if (event.type === 'checkout.session.completed') {
		const session = event.data.object as Stripe.Checkout.Session
		if (session.payment_status === 'paid') {
			await finalizeStripeSession(session)
		}
		return NextResponse.json({ received: true })
	}

	if (event.type === 'checkout.session.async_payment_succeeded') {
		await finalizeStripeSession(event.data.object as Stripe.Checkout.Session)
		return NextResponse.json({ received: true })
	}

	if (event.type === 'checkout.session.async_payment_failed') {
		const session = event.data.object as Stripe.Checkout.Session
		const meta = session.metadata ?? {}
		// Nothing was ever finalized for this session, so there's nothing to
		// reverse — just flag it so admin isn't left guessing why a customer
		// thinks they paid.
		await createServiceClient()
			.from('admin_logs')
			.insert({
				level: 'warning',
				source: 'stripe-webhook',
				message: `Delayed payment failed for session ${session.id}`,
				payload: { reference: meta.order_reference ?? meta.request_id ?? null, type: meta.type ?? 'checkout' },
			})
			.then(undefined, () => undefined)
		return NextResponse.json({ received: true })
	}

	return NextResponse.json({ received: true })
}

async function finalizeStripeSession(session: Stripe.Checkout.Session): Promise<void> {
	const meta = session.metadata ?? {}

	if (meta.type === 'sell_return_shipping' && meta.request_id) {
		try {
			await markReturnShipmentPaid(createServiceClient(), meta.request_id, 'stripe', session.id)
		} catch {
			// Swallow — acknowledge with 200 so Stripe does not retry indefinitely.
		}
		return
	}

	if (meta.type === 'repair_payment' && meta.request_id) {
		try {
			await markRepairPaid(createServiceClient(), meta.request_id, 'stripe', session.id)
		} catch {
			// Swallow — acknowledge with 200 so Stripe does not retry indefinitely.
		}
		return
	}

	try {
		const items = JSON.parse(meta.items || '[]') as {
			p: string
			v: string | null
			q: number
			u: number
			n: string
		}[]
		await finalizePaidOrder({
			reference: meta.order_reference || `CK-${new Date().getFullYear()}-00000`,
			userId: meta.user_id || null,
			marketplace: meta.marketplace === 'CA' ? 'CA' : 'US',
			items: items.map((i) => ({
				productId: i.p,
				variantId: i.v,
				quantity: i.q,
				unitPrice: i.u,
				name: i.n,
				imageUrl: null,
				isWholesale: false,
				weightKg: null,
				lengthCm: null,
				widthCm: null,
				heightCm: null,
			})),
			subtotal: Number(meta.subtotal || 0),
			discount: Number(meta.discount || 0),
			tax: Number(meta.tax || 0),
			taxBreakdown: meta.tax_breakdown ? JSON.parse(meta.tax_breakdown) : null,
			taxCalculationId: meta.tax_calculation_id || null,
			total: Number(meta.total || (session.amount_total ?? 0) / 100),
			shippingAddress: {
				fullName: meta.full_name || undefined,
				line1: meta.shipping_address_line1 || '',
				line2: meta.shipping_address_line2 || undefined,
				city: meta.city || '',
				stateProvince: meta.state_province || undefined,
				postalCode: meta.postal_code || undefined,
				country: meta.country || 'US',
				phone: meta.phone || undefined,
				deliveryNotes: meta.delivery_notes || undefined,
			},
			shipping: {
				carrier: (['ups', 'canada_post', 'stallion'].includes(meta.shipping_carrier) ? meta.shipping_carrier : 'canada_post') as ShippingCarrier,
				serviceCode: meta.shipping_service_code || '',
				serviceName: meta.shipping_service_name || '',
				cost: Number(meta.shipping_cost || 0),
				currency: meta.shipping_currency || (meta.marketplace === 'CA' ? 'CAD' : 'USD'),
				snapshot: {},
			},
			gift: JSON.parse(meta.gift || 'null'),
			paymentProvider: 'stripe-webhook',
			customerEmail: session.customer_details?.email ?? session.customer_email ?? null,
			notes: meta.delivery_notes || null,
		})
	} catch {
		// finalizePaidOrder already flagged the incident to admin_logs.
		// Acknowledge with 200 so Stripe does not retry indefinitely.
	}
}
