'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Trash2, ArrowRight, Minus, Plus, ShoppingCart, Smartphone } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { TableShimmer } from '@/components/shimmer'
import { useAuth } from '@/contexts/auth-context'
import { useMarketplace } from '@/contexts/marketplace-context'
import {
	loadCartItems,
	getLocalCart,
	setLocalCart,
	persistCartForUser,
	type LocalCartItem,
} from '@/lib/cart'
import { fetchProductById } from '@/lib/data'
import { getTaxRate } from '@/lib/tax'
import type { Product } from '@/lib/types'
import { primaryImage } from '@/lib/types'

interface HydratedItem extends LocalCartItem {
	product: Product
}

export default function CartPage() {
	const { user, loading: authLoading } = useAuth()
	const { marketplace } = useMarketplace()
	const [items, setItems] = useState<HydratedItem[] | null>(null)

	useEffect(() => {
		if (authLoading) return
		let cancelled = false
		;(async () => {
			try {
				const raw = await loadCartItems(user?.id ?? null)
				const hydrated: HydratedItem[] = []
				for (const item of raw) {
					const product = await fetchProductById(item.productId)
					if (!product || !product.is_active) continue
					// If an admin deleted the selected variant, drop it from the cart
					if (item.variantId && !(product.product_variants ?? []).some((v) => v.id === item.variantId)) {
						continue
					}
					hydrated.push({ ...item, product })
				}
				if (!cancelled) {
					setItems(hydrated)
					if (!user) setLocalCart(hydrated.map(({ product, ...rest }) => rest))
				}
			} catch {
				if (!cancelled) setItems([])
			}
		})()
		return () => {
			cancelled = true
		}
	}, [user, authLoading])

	const syncItems = (next: HydratedItem[]) => {
		setItems(next)
		const raw = next.map(({ product, ...rest }) => rest)
		if (user) {
			persistCartForUser(user.id, raw).catch(() => undefined)
			setLocalCart(raw) // keep the header badge in sync
		} else {
			setLocalCart(raw)
		}
	}

	const unitPrice = (item: HydratedItem) => {
		const variant = (item.product.product_variants ?? []).find((v) => v.id === item.variantId)
		return Number(item.product.base_price) + Number(variant?.price_adjustment ?? 0)
	}

	const subtotal = useMemo(
		() => (items ?? []).reduce((sum, item) => sum + unitPrice(item) * item.quantity, 0),
		[items]
	)
	// Indicative tax estimate for the cart view; the exact amount is computed at checkout
	const estimatedTaxRate = getTaxRate(marketplace === 'CA' ? 'CA' : 'US', '')
	const estimatedTax = subtotal * estimatedTaxRate

	return (
		<main className="min-h-screen bg-background">
			<Navigation />

			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<h1 className="text-3xl font-bold text-foreground tracking-luxury uppercase mb-10">Shopping Cart</h1>

				{items === null ? (
					<TableShimmer rows={4} />
				) : items.length === 0 ? (
					<div className="text-center py-24 border border-dashed border-border rounded-3xl">
						<ShoppingCart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
						<p className="text-muted-foreground text-sm mb-6">Your cart is empty.</p>
						<Link
							href="/products"
							className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-[0.18em] hover:opacity-90 transition-all"
						>
							Browse Products
						</Link>
					</div>
				) : (
					<div className="grid lg:grid-cols-3 gap-10">
						<div className="lg:col-span-2 space-y-4">
							{items.map((item, index) => {
								const variant = (item.product.product_variants ?? []).find((v) => v.id === item.variantId)
								const image = primaryImage(item.product)
								const maxStock = variant?.stock_quantity ?? 99
								return (
									<div
										key={`${item.productId}-${item.variantId}`}
										className="flex gap-5 bg-card border border-border rounded-3xl p-5 hover:border-primary/40 transition-colors"
									>
										<Link href={`/products/${item.productId}`} className="w-24 h-24 rounded-2xl overflow-hidden bg-muted shrink-0">
											{image ? (
												<img src={image} alt={item.product.name} className="w-full h-full object-cover" />
											) : (
												<div className="w-full h-full flex items-center justify-center">
													<Smartphone className="w-8 h-8 text-muted-foreground/40" />
												</div>
											)}
										</Link>
										<div className="flex-1 min-w-0">
											<Link
												href={`/products/${item.productId}`}
												className="text-sm font-medium text-card-foreground hover:text-primary transition-colors line-clamp-2"
											>
												{item.product.name}
											</Link>
											{variant?.color && (
												<p className="text-xs text-muted-foreground mt-1">Color: {variant.color}</p>
											)}
											<div className="flex items-center justify-between mt-3 flex-wrap gap-3">
												<div className="flex items-center border border-border rounded-full overflow-hidden">
													<button
														onClick={() => {
															const next = [...items]
															next[index] = { ...item, quantity: Math.max(1, item.quantity - 1) }
															syncItems(next)
														}}
														className="p-2 hover:bg-muted transition-colors cursor-pointer"
														aria-label="Decrease quantity"
													>
														<Minus className="w-3 h-3" />
													</button>
													<span className="w-9 text-center text-xs font-semibold">{item.quantity}</span>
													<button
														onClick={() => {
															const next = [...items]
															next[index] = { ...item, quantity: Math.min(maxStock, item.quantity + 1) }
															syncItems(next)
														}}
														className="p-2 hover:bg-muted transition-colors cursor-pointer"
														aria-label="Increase quantity"
													>
														<Plus className="w-3 h-3" />
													</button>
												</div>
												<div className="flex items-center gap-4">
													<span className="text-sm font-bold text-card-foreground">
														${(unitPrice(item) * item.quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
													</span>
													<button
														onClick={() => syncItems(items.filter((_, i) => i !== index))}
														className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
														aria-label="Remove item"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												</div>
											</div>
										</div>
									</div>
								)
							})}
						</div>

						{/* Summary */}
						<div className="bg-card border border-border rounded-3xl p-7 h-fit sticky top-32">
							<h2 className="text-sm font-bold uppercase tracking-[0.18em] text-card-foreground mb-6">Order Summary</h2>
							<div className="space-y-3 text-sm">
								<div className="flex justify-between text-foreground/75">
									<span>Subtotal</span>
									<span className="font-medium text-card-foreground">
										${subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
									</span>
								</div>
								<div className="flex justify-between text-foreground/75">
									<span>Estimated Tax</span>
									<span className="font-medium text-card-foreground">
										${estimatedTax.toLocaleString(undefined, { minimumFractionDigits: 2 })}
									</span>
								</div>
								<div className="border-t border-border pt-3 flex justify-between text-base font-bold text-card-foreground">
									<span>Estimated Total</span>
									<span>${(subtotal + estimatedTax).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
								</div>
								<p className="text-[11px] text-muted-foreground">
									Final tax is calculated from your shipping state or province at checkout.
								</p>
							</div>
							<Link
								href="/checkout"
								className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-[0.18em] hover:opacity-90 hover:scale-[1.01] active:scale-95 transition-all shadow-lg"
							>
								Proceed to Checkout
								<ArrowRight className="w-4 h-4" />
							</Link>
						</div>
					</div>
				)}
			</div>

			<Footer />
		</main>
	)
}
