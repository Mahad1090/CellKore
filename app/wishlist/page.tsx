'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { GridShimmer } from '@/components/shimmer'
import { getWishlist } from '@/lib/cart'
import { fetchProductById } from '@/lib/data'
import type { Product } from '@/lib/types'

export default function WishlistPage() {
	const [products, setProducts] = useState<Product[] | null>(null)

	useEffect(() => {
		const ids = getWishlist()
		if (ids.length === 0) {
			setProducts([])
			return
		}
		Promise.all(ids.map((id) => fetchProductById(id).catch(() => null)))
			.then((results) => setProducts(results.filter((p): p is Product => !!p && p.is_active)))
			.catch(() => setProducts([]))
	}, [])

	return (
		<main className="min-h-screen bg-background">
			<Navigation />

			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<h1 className="text-3xl font-bold text-foreground tracking-luxury uppercase mb-10">Wishlist</h1>

				{products === null ? (
					<GridShimmer count={4} />
				) : products.length === 0 ? (
					<div className="text-center py-24 border border-dashed border-border rounded-3xl">
						<Heart className="w-10 h-10 text-muted-foreground/40 mx-auto mb-4" />
						<p className="text-muted-foreground text-sm mb-6">Your wishlist is empty.</p>
						<Link
							href="/products?category=iphones"
							className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-[0.18em] hover:opacity-90 transition-all"
						>
							Discover Products
						</Link>
					</div>
				) : (
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
						{products.map((product) => (
							<ProductCard key={product.id} product={product} />
						))}
					</div>
				)}
			</div>

			<Footer />
		</main>
	)
}
