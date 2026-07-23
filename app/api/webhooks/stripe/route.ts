import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { finalizePaidOrder } from '@/lib/checkout-server'
import { createServiceClient } from '@/lib/supabase-server'
import { markReturnShipmentPaid } from '@/lib/sell-request-return'
import { markRepairPaid } from '@/lib/repair-payment'

export async function POST(request: NextRequest) {
	const stripeSecret = process.env.STRIPE_SECRET_KEY
	const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
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

	if (event.type === 'checkout.session.completed') {
		const session = event.data.object as Stripe.Checkout.Session
		const meta = session.metadata ?? {}

		if (meta.type === 'sell_return_shipping' && meta.request_id) {
			try {
				await markReturnShipmentPaid(createServiceClient(), meta.request_id, 'stripe', session.id)
			} catch {
				// Swallow — acknowledge with 200 so Stripe does not retry indefinitely.
			}
			return NextResponse.json({ received: true })
		}

		if (meta.type === 'repair_payment' && meta.request_id) {
			try {
				await markRepairPaid(createServiceClient(), meta.request_id, 'stripe', session.id)
			} catch {
				// Swallow — acknowledge with 200 so Stripe does not retry indefinitely.
			}
			return NextResponse.json({ received: true })
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
				})),
				total: Number(meta.total || (session.amount_total ?? 0) / 100),
				shippingAddress: {
					fullName: meta.full_name || undefined,
					line1: meta.shipping_address_line1 || '',
					line2: meta.shipping_address_line2 || undefined,
					city: meta.city || '',
					stateProvince: meta.state_province || undefined,
					postalCode: meta.postal_code || undefined,
					country: meta.country || 'US',
					deliveryNotes: meta.delivery_notes || undefined,
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

	return NextResponse.json({ received: true })
}
