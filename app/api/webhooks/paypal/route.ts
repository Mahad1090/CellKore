import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { finalizePaidOrder, type ShippingAddressInput, type GiftOptions, type PricedShipping } from '@/lib/checkout-server'
import { markReturnShipmentPaid } from '@/lib/sell-request-return'
import { markRepairPaid } from '@/lib/repair-payment'
import { verifyPaypalWebhookSignature, paypalAccessToken, paypalApiBase } from '@/lib/paypal-server'
import type { TaxBreakdownLine } from '@/lib/stripe-tax'

// Backstop for all three PayPal payment flows (main checkout, repair
// payment, sell-request return shipping). Each already finalizes normally
// from the browser right after PayPal approval — this only matters when
// that request never makes it back to us (tab closed, network dropped)
// after PayPal already captured the money. markRepairPaid,
// markReturnShipmentPaid, and finalizePaidOrder are all idempotent, so it's
// safe for this to race the client-driven capture routes.
export async function POST(request: NextRequest) {
	const rawBody = await request.text()

	const verified = await verifyPaypalWebhookSignature(request.headers, rawBody).catch(() => false)
	if (!verified) {
		return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
	}

	const event = JSON.parse(rawBody)
	if (event.event_type !== 'PAYMENT.CAPTURE.COMPLETED') {
		return NextResponse.json({ received: true })
	}

	const capture = event.resource ?? {}
	let custom: { type?: string; request_id?: string; ref?: string; uid?: string | null; m?: string } = {}
	try {
		custom = JSON.parse(capture.custom_id || '{}')
	} catch {
		custom = {}
	}

	const service = createServiceClient()

	try {
		if (custom.type === 'repair_payment' && custom.request_id) {
			await markRepairPaid(service, custom.request_id, 'paypal', capture.id)
			return NextResponse.json({ received: true })
		}

		if (custom.type === 'sell_return_shipping' && custom.request_id) {
			await markReturnShipmentPaid(service, custom.request_id, 'paypal', capture.id)
			return NextResponse.json({ received: true })
		}

		if (custom.ref) {
			const { data: pending } = await service
				.from('paypal_pending_checkouts')
				.select('payload')
				.eq('order_reference', custom.ref)
				.maybeSingle()

			if (pending) {
				const payload = pending.payload as {
					items: { p: string; v: string | null; q: number; u: number; n: string }[]
					shippingAddress: ShippingAddressInput
					shipping: PricedShipping
					gift: GiftOptions | null
					subtotal: number
					discount: number
					tax: number
					taxBreakdown: TaxBreakdownLine[] | null
					taxCalculationId: string | null
				}

				let customerEmail: string | null = null
				const orderId = capture.supplementary_data?.related_ids?.order_id
				if (orderId) {
					try {
						const accessToken = await paypalAccessToken()
						const orderRes = await fetch(`${paypalApiBase()}/v2/checkout/orders/${orderId}`, {
							headers: { Authorization: `Bearer ${accessToken}` },
						})
						if (orderRes.ok) {
							const orderJson = await orderRes.json()
							customerEmail = orderJson?.payer?.email_address ?? null
						}
					} catch {
						// customerEmail is optional — finalizePaidOrder just skips the receipt email
					}
				}

				await finalizePaidOrder({
					reference: custom.ref,
					userId: custom.uid ?? null,
					marketplace: custom.m === 'CA' ? 'CA' : 'US',
					items: payload.items.map((i) => ({
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
					subtotal: payload.subtotal,
					discount: payload.discount,
					tax: payload.tax,
					taxBreakdown: payload.taxBreakdown,
					taxCalculationId: payload.taxCalculationId,
					total: Number(capture.amount?.value ?? 0),
					shippingAddress: payload.shippingAddress,
					shipping: payload.shipping,
					gift: payload.gift,
					paymentProvider: 'paypal-webhook',
					customerEmail,
				})

				await service.from('paypal_pending_checkouts').delete().eq('order_reference', custom.ref)
			}
		}
	} catch {
		// finalizePaidOrder / markRepairPaid / markReturnShipmentPaid already
		// flag failures to admin_logs where relevant. Acknowledge with 200 so
		// PayPal does not retry indefinitely.
	}

	return NextResponse.json({ received: true })
}
