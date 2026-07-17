import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
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

export async function POST(request: NextRequest) {
	const stripeSecret = process.env.STRIPE_SECRET_KEY
	if (!stripeSecret) {
		return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
	}
	const stripe = new Stripe(stripeSecret)

	try {
		const body = await request.json()
		const cartItems: CheckoutItemInput[] = body.cartItems
		const shippingAddress: ShippingAddressInput = body.shippingAddress
		const gift: GiftOptions | null = body.gift ?? null
		const promoCode: string | undefined = body.promoCode
		const userId: string | null = body.userId ?? null
		const userEmail: string | undefined = body.userEmail
		const marketplace: 'US' | 'CA' = body.marketplace === 'CA' ? 'CA' : 'US'

		if (!shippingAddress?.line1 || !shippingAddress?.city || !shippingAddress?.country) {
			return NextResponse.json({ error: 'A complete shipping address is required' }, { status: 400 })
		}

		const service = createServiceClient()

		// Atomic stock + authoritative price verification immediately before session creation
		const items = await resolveAndValidateItems(service, cartItems)

		const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
		const promo = await applyPromotion(service, promoCode, subtotal, shippingAddress.country, userEmail)
		if (promoCode && !promo.valid) {
			return NextResponse.json({ error: promo.message ?? 'Code invalid or expired' }, { status: 400 })
		}
		const discounted = subtotal - promo.discountAmount
		const tax = computeTax(discounted, shippingAddress)
		const extras = giftFees(gift)
		const total = Math.round((discounted + tax + extras) * 100) / 100

		const orderReference = generateOrderReference()
		const origin =
			request.headers.get('origin') ||
			`${request.headers.get('x-forwarded-proto') ?? 'https'}://${request.headers.get('host')}`

		const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => ({
			quantity: item.quantity,
			price_data: {
				currency: marketplace === 'CA' ? 'cad' : 'usd',
				unit_amount: Math.round(item.unitPrice * 100),
				product_data: {
					name: item.name,
					...(item.imageUrl ? { images: [item.imageUrl] } : {}),
				},
			},
		}))
		if (tax > 0) {
			lineItems.push({
				quantity: 1,
				price_data: {
					currency: marketplace === 'CA' ? 'cad' : 'usd',
					unit_amount: Math.round(tax * 100),
					product_data: { name: 'Sales Tax' },
				},
			})
		}
		if (extras > 0) {
			lineItems.push({
				quantity: 1,
				price_data: {
					currency: marketplace === 'CA' ? 'cad' : 'usd',
					unit_amount: Math.round(extras * 100),
					product_data: { name: 'Gift Options' },
				},
			})
		}
		if (promo.discountAmount > 0) {
			// Stripe line items cannot be negative; carry the discount via a coupon
		}

		let discounts: Stripe.Checkout.SessionCreateParams.Discount[] | undefined
		if (promo.discountAmount > 0) {
			const coupon = await stripe.coupons.create({
				amount_off: Math.round(promo.discountAmount * 100),
				currency: marketplace === 'CA' ? 'cad' : 'usd',
				duration: 'once',
				name: promo.code ?? 'Promotion',
			})
			discounts = [{ coupon: coupon.id }]
		}

		const session = await stripe.checkout.sessions.create({
			mode: 'payment',
			line_items: lineItems,
			discounts,
			success_url: `${origin}/checkout/success?ref=${orderReference}&session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${origin}/checkout?cancelled=1`,
			customer_email: userEmail,
			metadata: {
				order_reference: orderReference,
				user_id: userId ?? '',
				marketplace,
				shipping_address_line1: shippingAddress.line1,
				shipping_address_line2: shippingAddress.line2 ?? '',
				city: shippingAddress.city,
				state_province: shippingAddress.stateProvince ?? '',
				postal_code: shippingAddress.postalCode ?? '',
				country: shippingAddress.country,
				total: String(total),
				gift: JSON.stringify(gift ?? { isGift: false }),
				items: JSON.stringify(
					items.map((i) => ({ p: i.productId, v: i.variantId, q: i.quantity, u: i.unitPrice, n: i.name.slice(0, 40) }))
				),
			},
		})

		return NextResponse.json({ sessionId: session.id, url: session.url })
	} catch (err) {
		if (err instanceof StockError) {
			return NextResponse.json({ error: err.message, variantId: err.variantId }, { status: 400 })
		}
		const message = err instanceof Error ? err.message : 'Checkout failed'
		return NextResponse.json({ error: message }, { status: 500 })
	}
}
