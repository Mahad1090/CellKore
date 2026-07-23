'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { GridShimmer } from '@/components/shimmer'
import { useMarketplace, type Marketplace } from '@/contexts/marketplace-context'
import { fetchCatalogProducts } from '@/lib/data'
import type { Product } from '@/lib/types'

const TABS: { value: Marketplace; label: string }[] = [
	{ value: 'US', label: 'United States' },
	{ value: 'CA', label: 'Canada' },
	// { value: 'BOTH', label: 'Both Marketplaces' },
]

export default function MarketplacePage() {
	const { marketplace, setMarketplace, loading: marketLoading } = useMarketplace()
	const [products, setProducts] = useState<Product[] | null>(null)

	useEffect(() => {
		if (marketLoading) return
		setProducts(null)
		fetchCatalogProducts({ marketplace })
			.then(setProducts)
			.catch(() => setProducts([]))
	}, [marketplace, marketLoading])

	return (
		<main className="min-h-screen bg-background">
			<Navigation />

			<section className="relative text-white w-full min-h-[460px] md:min-h-[520px] py-20 sm:py-28 overflow-hidden flex items-center">
				<video
					key={marketplace}
					autoPlay
					loop
					muted
					playsInline
					preload="auto"
					src={
						marketplace === 'CA'
							? '/canada_marketplace_banner.mp4'
							: marketplace === 'US'
								? '/us_marketplace_banner.mp4'
								: '/all_marketplace_banner.mp4'
					}
					className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none z-0 transition-opacity duration-500"
				/>
				<div className="absolute inset-0 bg-black/60 z-10" />
				<div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
					<p className="text-sm uppercase tracking-[0.25em] text-white/80 mb-3 font-medium">
						{marketplace === 'CA' ? '🇨🇦 Canada Marketplace' : marketplace === 'US' ? '🇺🇸 US Marketplace' : '🌐 All Marketplaces'}
					</p>
					<h1 className="text-3xl md:text-5xl lg:text-6xl font-bold tracking-luxury uppercase text-white drop-shadow-md">
						{marketplace === 'CA' ? 'Shop Canada Marketplace' : marketplace === 'US' ? 'Shop US Marketplace' : 'Shop All Regional Inventory'}
					</h1>
					<p className="text-white/90 mt-4 text-base md:text-lg font-light max-w-2xl leading-relaxed drop-shadow-sm">
						{marketplace === 'CA'
							? 'Devices stored & shipped from Canadian fulfillment centers with direct CAD pricing and fast domestic delivery.'
							: marketplace === 'US'
								? 'Devices stored & shipped from US distribution hubs with express domestic shipping across all states.'
								: 'Browsing all products and devices available across both US and Canadian fulfillment centers.'}
					</p>
				</div>
			</section>

			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
				{/* Specific Heading & Marketplace Tabs */}
				<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-border">
					<div>
						<p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold">Catalog View</p>
						<h2 className="text-2xl sm:text-3xl font-bold text-foreground tracking-luxury uppercase">
							{marketplace === 'US' && 'US MARKETPLACE PRODUCTS'}
							{marketplace === 'CA' && 'CANADA MARKETPLACE PRODUCTS'}
							{marketplace === 'BOTH' && 'ALL MARKETPLACES PRODUCTS'}
						</h2>
					</div>

					{/* Marketplace Selector Tabs */}
					<div className="flex items-center rounded-full border border-border bg-card p-1 shadow-sm">
						{TABS.map((tab) => (
							<button
								key={tab.value}
								onClick={() => setMarketplace(tab.value)}
								className={`px-4 py-2 text-[11px] uppercase tracking-[0.16em] font-semibold rounded-full transition-all cursor-pointer ${
									marketplace === tab.value
										? 'bg-primary text-primary-foreground shadow-sm'
										: 'text-muted-foreground hover:text-foreground hover:bg-muted'
								}`}
							>
								{tab.label}
							</button>
						))}
					</div>
				</div>

				{products === null ? (
					<GridShimmer count={8} />
				) : products.length === 0 ? (
					<div className="text-center py-24 border border-dashed border-border rounded-3xl">
						<p className="text-muted-foreground text-sm">No devices are currently stocked for this marketplace.</p>
					</div>
				) : (
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
						{products.map((product) => (
							<ProductCard key={product.id} product={product} />
						))}
					</div>
				)}
			</section>

			<Footer />
		</main>
	)
}
