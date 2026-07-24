import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import {
	resolveAndValidateItems,
	applyPromotion,
	giftFees,
	generateOrderReference,
	validateAndPriceShipping,
	StockError,
	ShippingRateError,
	type CheckoutItemInput,
	type ShippingAddressInput,
	type GiftOptions,
	type ShippingRateInput,
} from '@/lib/checkout-server'
import { paypalApiBase, paypalAccessToken } from '@/lib/paypal-server'
import { calculateOrderTax } from '@/lib/stripe-tax'

/** Creates a PayPal order after atomic stock verification. */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const cartItems: CheckoutItemInput[] = body.cartItems
		const shippingAddress: ShippingAddressInput = body.shippingAddress
		const gift: GiftOptions | null = body.gift ?? null
		const marketplace: 'US' | 'CA' = body.marketplace === 'CA' ? 'CA' : 'US'
		const shippingRate: ShippingRateInput = body.shippingRate

		if (!shippingRate?.carrier || !shippingRate?.serviceCode) {
			return NextResponse.json({ error: 'A shipping method must be selected' }, { status: 400 })
		}

		const service = createServiceClient()
		const items = await resolveAndValidateItems(service, cartItems)
		const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
		const promo = await applyPromotion(service, body.promoCode, subtotal, shippingAddress?.country, body.userEmail)
		const discounted = subtotal - promo.discountAmount
		const shipping = await validateAndPriceShipping(items, shippingAddress, shippingRate)
		const taxResult = await calculateOrderTax({
			items: items.map((i) => ({
				reference: i.variantId ? `${i.productId}:${i.variantId}` : i.productId,
				amount: i.unitPrice * i.quantity,
				quantity: i.quantity,
			})),
			shippingAddress,
			shippingCost: shipping.cost,
			discountAmount: promo.discountAmount,
			currency: marketplace === 'CA' ? 'cad' : 'usd',
		})
		const tax = taxResult.taxAmount
		const total = Math.round((discounted + tax + giftFees(gift) + shipping.cost) * 100) / 100

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

		// Best-effort: lets the PayPal webhook finalize this order if the
		// browser never makes it back to /capture (custom_id is too small to
		// carry the full payload, so it's stashed here instead). If this
		// insert fails, the normal client-driven /capture flow below is
		// unaffected — the order just has no webhook backstop.
		await service
			.from('paypal_pending_checkouts')
			.insert({
				paypal_order_id: order.id,
				order_reference: orderReference,
				payload: {
					items: items.map((i) => ({ p: i.productId, v: i.variantId, q: i.quantity, u: i.unitPrice, n: i.name })),
					shippingAddress,
					shipping,
					gift,
					subtotal,
					discount: promo.discountAmount,
					tax,
					taxBreakdown: taxResult.breakdown,
					taxCalculationId: taxResult.calculationId,
				},
			})
			.then(undefined, () => undefined)

		return NextResponse.json({
			paypalOrderId: order.id,
			orderReference,
			total,
			// echo the validated payload so /capture can rebuild the order server-side
			checkout: {
				items: items.map((i) => ({ p: i.productId, v: i.variantId, q: i.quantity, u: i.unitPrice, n: i.name })),
				shippingAddress,
				shipping,
				gift,
				marketplace,
				userId: body.userId ?? null,
				subtotal,
				discount: promo.discountAmount,
				tax,
				taxBreakdown: taxResult.breakdown,
				taxCalculationId: taxResult.calculationId,
			},
		})
	} catch (err) {
		if (err instanceof StockError) {
			return NextResponse.json({ error: err.message, variantId: err.variantId }, { status: 400 })
		}
		if (err instanceof ShippingRateError) {
			return NextResponse.json({ error: err.message }, { status: 400 })
		}
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : 'PayPal checkout failed' },
			{ status: 500 }
		)
	}
}
