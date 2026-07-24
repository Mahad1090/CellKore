import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import {
	finalizePaidOrder,
	resolveAndValidateItems,
	StockError,
	type ShippingAddressInput,
	type GiftOptions,
	type PricedShipping,
} from '@/lib/checkout-server'
import { paypalApiBase, paypalAccessToken } from '@/lib/paypal-server'
import type { TaxBreakdownLine } from '@/lib/stripe-tax'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const paypalOrderId: string = body.paypalOrderId
		if (!paypalOrderId) {
			return NextResponse.json({ error: 'paypalOrderId is required' }, { status: 400 })
		}
		const checkout = body.checkout as {
			items: { p: string; v: string | null; q: number; u: number; n: string }[]
			shippingAddress: ShippingAddressInput
			shipping: PricedShipping
			gift: GiftOptions | null
			marketplace: 'US' | 'CA'
			userId: string | null
			subtotal: number
			discount: number
			tax: number
			taxBreakdown: TaxBreakdownLine[] | null
			taxCalculationId: string | null
		}
		const orderReference: string = body.orderReference

		const service = createServiceClient()

		// Re-verify stock atomically right before capture
		await resolveAndValidateItems(
			service,
			checkout.items.map((i) => ({ productId: i.p, variantId: i.v, quantity: i.q }))
		)

		const accessToken = await paypalAccessToken()
		const captureRes = await fetch(
			`${paypalApiBase()}/v2/checkout/orders/${paypalOrderId}/capture`,
			{
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${accessToken}`,
				},
			}
		)
		const capture = await captureRes.json()
		if (!captureRes.ok || capture.status !== 'COMPLETED') {
			return NextResponse.json({ error: 'PayPal payment was not completed' }, { status: 402 })
		}

		const capturedTotal = Number(
			capture.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ?? 0
		)

		const { orderId } = await finalizePaidOrder({
			reference: orderReference,
			userId: checkout.userId,
			marketplace: checkout.marketplace,
			items: checkout.items.map((i) => ({
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
			subtotal: checkout.subtotal,
			discount: checkout.discount,
			tax: checkout.tax,
			taxBreakdown: checkout.taxBreakdown,
			taxCalculationId: checkout.taxCalculationId,
			total: capturedTotal,
			shippingAddress: checkout.shippingAddress,
			shipping: checkout.shipping,
			gift: checkout.gift,
			paymentProvider: 'paypal-capture',
			customerEmail: capture.payer?.email_address ?? null,
		})

		// No longer needed — either this call just finalized it, or the
		// webhook backstop already beat us to it (finalizePaidOrder is
		// idempotent by reference either way).
		await service.from('paypal_pending_checkouts').delete().eq('paypal_order_id', paypalOrderId).then(undefined, () => undefined)

		return NextResponse.json({ success: true, orderId, orderReference })
	} catch (err) {
		if (err instanceof StockError) {
			return NextResponse.json({ error: err.message, variantId: err.variantId }, { status: 400 })
		}
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : 'PayPal capture failed' },
			{ status: 500 }
		)
	}
}
