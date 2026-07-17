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
	{ value: 'BOTH', label: 'Both Marketplaces' },
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

			<section className="bg-primary text-primary-foreground py-10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="max-w-3xl">
						<p className="text-sm uppercase tracking-[0.25em] opacity-80 mb-3">Marketplace</p>
						<h1 className="text-3xl md:text-4xl font-bold">Devices available by country</h1>
						<p className="opacity-90 mt-3 text-base md:text-lg font-light">
							Select US or Canada to browse only the devices stocked for that market. Your selection is
							remembered across the whole store.
						</p>
					</div>
				</div>
			</section>

			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
				<div className="inline-flex rounded-full border border-border overflow-hidden bg-background mb-10">
					{TABS.map((tab) => (
						<button
							key={tab.value}
							onClick={() => setMarketplace(tab.value)}
							className={`px-6 py-2.5 text-[11px] uppercase tracking-[0.16em] font-semibold transition-colors cursor-pointer ${
								marketplace === tab.value
									? 'bg-primary text-primary-foreground'
									: 'text-foreground/70 hover:bg-muted'
							}`}
						>
							{tab.label}
						</button>
					))}
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
