'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { GridShimmer } from '@/components/shimmer'
import { useMarketplace } from '@/contexts/marketplace-context'
import { fetchCatalogProducts } from '@/lib/data'
import type { Product } from '@/lib/types'

export default function SparePartsPage() {
	const { marketplace, loading: marketLoading } = useMarketplace()
	const [parts, setParts] = useState<Product[] | null>(null)

	useEffect(() => {
		if (marketLoading) return
		setParts(null)
		fetchCatalogProducts({
			marketplace,
			categorySlug: 'spare-parts',
		})
			.then(setParts)
			.catch(() => setParts([]))
	}, [marketplace, marketLoading])

	return (
		<main className="min-h-screen bg-background">
			<Navigation />

			{/* Hero Section */}
			<section className="relative text-white w-full min-h-[500px] md:min-h-[560px] overflow-hidden flex items-end pt-40 md:pt-48 pb-28 md:pb-32">
				<video
					autoPlay
					loop
					muted
					playsInline
					preload="auto"
					src="/spare_parts_banner.mp4"
					className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none z-0"
				/>
				<div className="absolute inset-0 bg-black/45 z-10" />
				<div className="relative w-full px-4 sm:px-8 lg:px-12 z-10">
					<p className="text-sm uppercase tracking-[0.25em] opacity-80 mb-3">
						<span className="text-amber-400 font-semibold">Shop</span>
					</p>
					<h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-luxury uppercase leading-none">
						Spare Parts
					</h1>
					<p className="text-sm md:text-base text-primary-foreground/90 mt-6 max-w-2xl font-light leading-relaxed tracking-wide">
						Premium OEM & high-quality replacement parts. Screen assemblies, battery replacements, ports, and micro-soldering components.
					</p>
				</div>
			</section>

			{/* Products Grid */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-5 border-b border-border/60 gap-4">
					<div>
						<div className="flex items-center gap-2 mb-2">
							<span className="h-0.5 w-6 bg-primary rounded-full inline-block" />
							<p className="text-[10px] uppercase tracking-[0.28em] text-primary font-bold">Spare Parts Catalog</p>
						</div>
						<h2 className="text-2xl sm:text-4xl font-extrabold tracking-luxury uppercase text-foreground">
							Available Parts
						</h2>
					</div>
					<Link
						href="/products?category=spare-parts"
						className="glow-outline-btn glow-outline-primary"
					>
						<span className="glow-outline-beam" />
						<span className="glow-outline-inner px-4.5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
							Search Parts Catalog
						</span>
					</Link>
				</div>

				{parts === null ? (
					<GridShimmer count={10} />
				) : parts.length === 0 ? (
					<div className="text-center py-20 border border-dashed border-border rounded-3xl">
						<p className="text-muted-foreground text-sm">
							No spare parts are currently listed in this marketplace. Check back soon.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
						{parts.map((product) => (
							<ProductCard key={product.id} product={product} />
						))}
					</div>
				)}
			</section>

			<Footer />
		</main>
	)
}
