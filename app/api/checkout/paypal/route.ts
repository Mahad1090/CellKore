import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import {
	resolveAndValidateItems,
	applyPromotion,
	computeTax,
	giftFees,
	generateOrderReference,
	StockError,
	type CheckoutItemInput,
	type ShippingAddressInput,
	type GiftOptions,
} from '@/lib/checkout-server'
import { paypalApiBase, paypalAccessToken } from '@/lib/paypal-server'

/** Creates a PayPal order after atomic stock verification. */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const cartItems: CheckoutItemInput[] = body.cartItems
		const shippingAddress: ShippingAddressInput = body.shippingAddress
		const gift: GiftOptions | null = body.gift ?? null
		const marketplace: 'US' | 'CA' = body.marketplace === 'CA' ? 'CA' : 'US'

		const service = createServiceClient()
		const items = await resolveAndValidateItems(service, cartItems)
		const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
		const promo = await applyPromotion(service, body.promoCode, subtotal, shippingAddress?.country, body.userEmail)
		const discounted = subtotal - promo.discountAmount
		const tax = await computeTax(service, discounted, shippingAddress)
		const total = Math.round((discounted + tax + giftFees(gift)) * 100) / 100

		const orderReference = generateOrderReference()
		const accessToken = await paypalAccessToken()

		const res = await fetch(`${paypalApiBase()}/v2/checkout/orders`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${accessToken}`,
			},
			body: JSON.stringify({
				intent: 'CAPTURE',
				purchase_units: [
					{
						reference_id: orderReference,
						custom_id: JSON.stringify({
							ref: orderReference,
							uid: body.userId ?? null,
							m: marketplace,
						}),
						amount: {
							currency_code: marketplace === 'CA' ? 'CAD' : 'USD',
							value: total.toFixed(2),
						},
					},
				],
			}),
		})
		const order = await res.json()
		if (!res.ok) {
			return NextResponse.json({ error: 'PayPal order creation failed' }, { status: 502 })
		}

		return NextResponse.json({
			paypalOrderId: order.id,
			orderReference,
			total,
			// echo the validated payload so /capture can rebuild the order server-side
			checkout: {
				items: items.map((i) => ({ p: i.productId, v: i.variantId, q: i.quantity, u: i.unitPrice, n: i.name })),
				shippingAddress,
				gift,
				marketplace,
				userId: body.userId ?? null,
			},
		})
	} catch (err) {
		if (err instanceof StockError) {
			return NextResponse.json({ error: err.message, variantId: err.variantId }, { status: 400 })
		}
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : 'PayPal checkout failed' },
			{ status: 500 }
		)
	}
}
