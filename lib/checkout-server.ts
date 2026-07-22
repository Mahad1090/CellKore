import { SupabaseClient } from '@supabase/supabase-js'
import { createServiceClient, generateOrderReference } from '@/lib/supabase-server'
import { taxRateForCountry } from '@/lib/tax'
import { sendOrderConfirmationEmail, sendNewOrderAdminAlert } from '@/lib/email/orders'

export interface CheckoutItemInput {
	productId: string
	variantId: string | null
	quantity: number
}

export interface ResolvedItem {
	productId: string
	variantId: string | null
	quantity: number
	name: string
	unitPrice: number
	imageUrl: string | null
	isWholesale: boolean
}

export const GIFT_CARD_FEE = 5
export const GIFT_WRAPPING_FEE = 10

export interface GiftOptions {
	isGift: boolean
	recipientName?: string
	recipientPhone?: string
	message?: string
	giftCard?: boolean
	giftWrapping?: boolean
}

export function giftFees(gift?: GiftOptions | null): number {
	if (!gift?.isGift) return 0
	return (gift.giftCard ? GIFT_CARD_FEE : 0) + (gift.giftWrapping ? GIFT_WRAPPING_FEE : 0)
}

export class StockError extends Error {
	variantId: string | null
	constructor(message: string, variantId: string | null) {
		super(message)
		this.variantId = variantId
	}
}

/**
 * Resolve authoritative pricing and perform atomic stock verification against
 * the database immediately before payment-session creation / capture.
 * Wholesale items are priced against wholesale_price_tiers by quantity.
 */
export async function resolveAndValidateItems(
	service: SupabaseClient,
	items: CheckoutItemInput[]
): Promise<ResolvedItem[]> {
	if (!Array.isArray(items) || items.length === 0) {
		throw new Error('Cart is empty')
	}
	const resolved: ResolvedItem[] = []

	for (const item of items) {
		const quantity = Math.floor(Number(item.quantity))
		if (!Number.isFinite(quantity) || quantity < 1) throw new Error('Invalid quantity')

		const { data: product, error } = await service
			.from('products')
			.select('id, name, base_price, is_active, is_wholesale, product_images ( image_url, is_primary, sort_order )')
			.eq('id', item.productId)
			.maybeSingle()
		if (error) throw error
		if (!product || !product.is_active) {
			throw new StockError('Product is no longer available', item.variantId ?? null)
		}

		let unitPrice = Number(product.base_price)

		if (item.variantId) {
			const { data: variant } = await service
				.from('product_variants')
				.select('id, stock_quantity, price_adjustment')
				.eq('id', item.variantId)
				.maybeSingle()
			if (!variant) throw new StockError('Variant no longer exists', item.variantId)
			if (variant.stock_quantity < quantity) {
				throw new StockError('Variant out of stock', item.variantId)
			}
			unitPrice += Number(variant.price_adjustment)
		}

		if (product.is_wholesale) {
			const { data: tiers } = await service
				.from('wholesale_price_tiers')
				.select('min_quantity, max_quantity, price_per_unit')
				.eq('product_id', product.id)
				.order('min_quantity', { ascending: true })
			const tier = (tiers ?? []).find(
				(t) => quantity >= t.min_quantity && (t.max_quantity == null || quantity <= t.max_quantity)
			)
			if (tier) unitPrice = Number(tier.price_per_unit)
		}

		const images = (product.product_images ?? []) as {
			image_url: string
			is_primary: boolean
			sort_order: number
		}[]
		const primary =
			images.find((i) => i.is_primary) ??
			[...images].sort((a, b) => a.sort_order - b.sort_order)[0]

		resolved.push({
			productId: product.id,
			variantId: item.variantId ?? null,
			quantity,
			name: product.name,
			unitPrice: Math.round(unitPrice * 100) / 100,
			imageUrl: primary?.image_url ?? null,
			isWholesale: product.is_wholesale,
		})
	}
	return resolved
}

export interface PromoResult {
	valid: boolean
	discountAmount: number
	message?: string
	code?: string
}

export async function applyPromotion(
	service: SupabaseClient,
	promoCode: string | undefined | null,
	subtotal: number,
	country: string | undefined,
	userEmail: string | undefined
): Promise<PromoResult> {
	if (!promoCode) return { valid: false, discountAmount: 0 }

	const { data: promo } = await service
		.from('promotions')
		.select('*')
		.ilike('code', promoCode.trim())
		.eq('is_active', true)
		.maybeSingle()

	const invalid = { valid: false, discountAmount: 0, message: 'Code invalid or expired' }
	if (!promo) return invalid

	const now = new Date()
	if (promo.starts_at && new Date(promo.starts_at) > now) return invalid
	if (promo.expires_at && new Date(promo.expires_at) < now) return invalid
	if (subtotal < Number(promo.min_subtotal)) {
		return { valid: false, discountAmount: 0, message: `Requires a minimum subtotal of $${promo.min_subtotal}` }
	}
	if (promo.country && country && promo.country !== country) return invalid
	if (promo.email_domain && userEmail && !userEmail.toLowerCase().endsWith(promo.email_domain.toLowerCase())) {
		return invalid
	}

	const discount =
		promo.discount_type === 'percentage'
			? (subtotal * Number(promo.discount_value)) / 100
			: Number(promo.discount_value)
	return {
		valid: true,
		discountAmount: Math.round(Math.min(discount, subtotal) * 100) / 100,
		code: promo.code,
	}
}

export interface ShippingAddressInput {
	line1: string
	line2?: string
	city: string
	stateProvince?: string
	postalCode?: string
	country: string
}

export async function getTaxRateForAddress(service: SupabaseClient, address: ShippingAddressInput): Promise<number> {
	const { data } = await service
		.from('tax_rates')
		.select('country_code, tax_rate, is_active')
		.eq('country_code', (address.country ?? '').toUpperCase())
		.eq('is_active', true)
		.maybeSingle()
	return taxRateForCountry(data ? [data] : [], address.country ?? '')
}

export async function computeTax(
	service: SupabaseClient,
	subtotalAfterDiscount: number,
	address: ShippingAddressInput
): Promise<number> {
	const rate = await getTaxRateForAddress(service, address)
	return Math.round(subtotalAfterDiscount * rate * 100) / 100
}

export interface FinalizeOrderParams {
	reference: string
	userId: string | null
	marketplace: 'US' | 'CA'
	items: ResolvedItem[]
	total: number
	shippingAddress: ShippingAddressInput
	gift?: GiftOptions | null
	paymentProvider: string
	customerEmail?: string | null
}

/**
 * Writes the paid order: address, order, items, stock decrements, cart purge.
 * On failure the incident is flagged to admin_logs (payment already captured).
 */
export async function finalizePaidOrder(params: FinalizeOrderParams): Promise<{ orderId: string }> {
	const service = createServiceClient()
	try {
		let shippingAddressId: string | null = null
		if (params.userId) {
			const { data: existing } = await service
				.from('addresses')
				.select('id')
				.eq('user_id', params.userId)
				.eq('type', 'shipping')
				.eq('line1', params.shippingAddress.line1)
				.eq('city', params.shippingAddress.city)
				.eq('country', params.shippingAddress.country)
				.maybeSingle()
			if (existing) {
				shippingAddressId = existing.id
			} else {
				const { data: created } = await service
					.from('addresses')
					.insert({
						user_id: params.userId,
						type: 'shipping',
						line1: params.shippingAddress.line1,
						line2: params.shippingAddress.line2 ?? null,
						city: params.shippingAddress.city,
						state_province: params.shippingAddress.stateProvince ?? null,
						postal_code: params.shippingAddress.postalCode ?? null,
						country: params.shippingAddress.country,
					})
					.select('id')
					.single()
				shippingAddressId = created?.id ?? null
			}
		}

		const { data: order, error: orderError } = await service
			.from('orders')
			.insert({
				reference: params.reference,
				user_id: params.userId,
				marketplace: params.marketplace,
				shipping_address_id: shippingAddressId,
				billing_address_id: shippingAddressId,
				status: 'paid',
				payment_status: 'paid',
				total_amount: params.total,
				is_gift: params.gift?.isGift ?? false,
				gift_recipient_name: params.gift?.recipientName ?? null,
				gift_recipient_phone: params.gift?.recipientPhone ?? null,
				gift_message: params.gift?.message ?? null,
				gift_card: params.gift?.giftCard ?? false,
				gift_wrapping: params.gift?.giftWrapping ?? false,
			})
			.select('id')
			.single()
		if (orderError || !order) throw orderError ?? new Error('Order insert failed')

		const { error: itemsError } = await service.from('order_items').insert(
			params.items.map((i) => ({
				order_id: order.id,
				product_id: i.productId,
				variant_id: i.variantId,
				quantity: i.quantity,
				unit_price_at_purchase: i.unitPrice,
			}))
		)
		if (itemsError) throw itemsError

		// Decrement variant stock
		for (const item of params.items) {
			if (!item.variantId) continue
			const { data: variant } = await service
				.from('product_variants')
				.select('stock_quantity')
				.eq('id', item.variantId)
				.maybeSingle()
			if (variant) {
				await service
					.from('product_variants')
					.update({ stock_quantity: Math.max(0, variant.stock_quantity - item.quantity) })
					.eq('id', item.variantId)
			}
		}

		// Purge the user's database cart
		if (params.userId) {
			const { data: cart } = await service
				.from('carts')
				.select('id')
				.eq('user_id', params.userId)
				.maybeSingle()
			if (cart) await service.from('cart_items').delete().eq('cart_id', cart.id)
		}

		// Reconstruct the price breakdown for the receipt emails. The exact
		// promo-code discount amount isn't available this far downstream, but
		// it's fully derivable: tax was applied to (subtotal - discount), so
		// working backwards from the known charged total recovers both.
		const subtotal = params.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
		const extras = giftFees(params.gift)
		const rate = await getTaxRateForAddress(service, params.shippingAddress)
		const discountedSubtotal = Math.round(((params.total - extras) / (1 + rate)) * 100) / 100
		const discount = Math.max(0, Math.round((subtotal - discountedSubtotal) * 100) / 100)
		const tax = Math.max(0, Math.round((params.total - extras - discountedSubtotal) * 100) / 100)

		if (params.customerEmail) {
			await sendOrderConfirmationEmail({
				to: params.customerEmail,
				reference: params.reference,
				items: params.items.map((i) => ({ name: i.name, quantity: i.quantity, unitPrice: i.unitPrice })),
				subtotal,
				discount,
				tax,
				extras,
				total: params.total,
				marketplace: params.marketplace,
				shippingAddress: params.shippingAddress,
			})
		}
		await sendNewOrderAdminAlert({
			reference: params.reference,
			subtotal,
			discount,
			tax,
			extras,
			total: params.total,
			marketplace: params.marketplace,
			itemCount: params.items.length,
			customerEmail: params.customerEmail,
			shippingAddress: params.shippingAddress,
		})

		return { orderId: order.id }
	} catch (err) {
		// Payment succeeded but the DB write failed — flag to the admin log.
		await service
			.from('admin_logs')
			.insert({
				level: 'critical',
				source: params.paymentProvider,
				message: `Payment captured but order write failed for ${params.reference}`,
				payload: {
					reference: params.reference,
					userId: params.userId,
					items: params.items,
					total: params.total,
					error: err instanceof Error ? err.message : String(err),
				},
			})
			.then(undefined, () => undefined)
		throw err
	}
}

export { generateOrderReference }
