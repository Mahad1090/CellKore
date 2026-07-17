'use client'

import { supabase } from '@/lib/supabase'

export interface LocalCartItem {
	productId: string
	variantId: string | null
	quantity: number
}

const CART_KEY = 'cellkore_cart'
const WISHLIST_KEY = 'cellkore_wishlist'

function emitCartChange() {
	window.dispatchEvent(new Event('cellkore-cart-change'))
}

export function getLocalCart(): LocalCartItem[] {
	if (typeof window === 'undefined') return []
	try {
		return JSON.parse(localStorage.getItem(CART_KEY) || '[]')
	} catch {
		return []
	}
}

export function setLocalCart(items: LocalCartItem[]) {
	localStorage.setItem(CART_KEY, JSON.stringify(items))
	emitCartChange()
}

export function addToLocalCart(item: LocalCartItem) {
	const cart = getLocalCart()
	const existing = cart.find(
		(c) => c.productId === item.productId && c.variantId === item.variantId
	)
	if (existing) {
		existing.quantity += item.quantity
	} else {
		cart.push(item)
	}
	setLocalCart(cart)
}

export function removeFromLocalCart(productId: string, variantId: string | null) {
	setLocalCart(getLocalCart().filter((c) => !(c.productId === productId && c.variantId === variantId)))
}

export function updateLocalCartQuantity(productId: string, variantId: string | null, quantity: number) {
	const cart = getLocalCart()
	const item = cart.find((c) => c.productId === productId && c.variantId === variantId)
	if (item) {
		item.quantity = Math.max(1, quantity)
		setLocalCart(cart)
	}
}

export function clearLocalCart() {
	localStorage.removeItem(CART_KEY)
	emitCartChange()
}

export function getWishlist(): string[] {
	if (typeof window === 'undefined') return []
	try {
		return JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]')
	} catch {
		return []
	}
}

export function toggleWishlist(productId: string): boolean {
	const list = getWishlist()
	const index = list.indexOf(productId)
	let added: boolean
	if (index >= 0) {
		list.splice(index, 1)
		added = false
	} else {
		list.push(productId)
		added = true
	}
	localStorage.setItem(WISHLIST_KEY, JSON.stringify(list))
	emitCartChange()
	return added
}

/**
 * Guest-cart merge: when a guest signs in, merge localStorage items into the
 * user's database cart (incrementing quantities on matches), push unique
 * guest items, then clear local storage.
 */
export async function mergeGuestCartIntoAccount(userId: string): Promise<void> {
	const guestItems = getLocalCart()

	let { data: cart } = await supabase
		.from('carts')
		.select('id')
		.eq('user_id', userId)
		.maybeSingle()

	if (!cart) {
		const { data: created, error } = await supabase
			.from('carts')
			.insert({ user_id: userId })
			.select('id')
			.single()
		if (error) throw error
		cart = created
	}

	if (guestItems.length > 0) {
		const { data: dbItems, error: itemsError } = await supabase
			.from('cart_items')
			.select('id, product_id, variant_id, quantity')
			.eq('cart_id', cart.id)
		if (itemsError) throw itemsError

		for (const guest of guestItems) {
			const match = (dbItems ?? []).find(
				(d) => d.product_id === guest.productId && (d.variant_id ?? null) === guest.variantId
			)
			if (match) {
				await supabase
					.from('cart_items')
					.update({ quantity: match.quantity + guest.quantity })
					.eq('id', match.id)
			} else {
				await supabase.from('cart_items').insert({
					cart_id: cart.id,
					product_id: guest.productId,
					variant_id: guest.variantId,
					quantity: guest.quantity,
				})
			}
		}
		clearLocalCart()
	}
}

/**
 * Load the effective cart: DB cart for signed-in users, localStorage for guests.
 * Also drops cart rows whose variant was deleted by an admin.
 */
export async function loadCartItems(userId: string | null): Promise<LocalCartItem[]> {
	if (!userId) return getLocalCart()

	const { data: cart } = await supabase
		.from('carts')
		.select('id')
		.eq('user_id', userId)
		.maybeSingle()
	if (!cart) return []

	const { data: items, error } = await supabase
		.from('cart_items')
		.select('id, product_id, variant_id, quantity')
		.eq('cart_id', cart.id)
	if (error) throw error

	const result: LocalCartItem[] = []
	for (const item of items ?? []) {
		if (item.variant_id) {
			const { data: variant } = await supabase
				.from('product_variants')
				.select('id')
				.eq('id', item.variant_id)
				.maybeSingle()
			if (!variant) {
				// Variant deleted by an admin while sitting in the cart — auto-remove.
				await supabase.from('cart_items').delete().eq('id', item.id)
				continue
			}
		}
		result.push({ productId: item.product_id, variantId: item.variant_id, quantity: item.quantity })
	}
	return result
}

export async function persistCartForUser(userId: string, items: LocalCartItem[]): Promise<void> {
	let { data: cart } = await supabase.from('carts').select('id').eq('user_id', userId).maybeSingle()
	if (!cart) {
		const { data: created, error } = await supabase
			.from('carts')
			.insert({ user_id: userId })
			.select('id')
			.single()
		if (error) throw error
		cart = created
	}
	await supabase.from('cart_items').delete().eq('cart_id', cart.id)
	if (items.length > 0) {
		await supabase.from('cart_items').insert(
			items.map((i) => ({
				cart_id: cart!.id,
				product_id: i.productId,
				variant_id: i.variantId,
				quantity: i.quantity,
			}))
		)
	}
}
