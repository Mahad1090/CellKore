'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LayoutGrid } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { GridShimmer } from '@/components/shimmer'
import { useMarketplace } from '@/contexts/marketplace-context'
import { fetchActiveCategories, fetchCatalogProducts } from '@/lib/data'
import type { Category, Product } from '@/lib/types'

export default function Home() {
	const { marketplace, loading: marketLoading } = useMarketplace()
	const [categories, setCategories] = useState<Category[] | null>(null)
	const [products, setProducts] = useState<Product[] | null>(null)

	useEffect(() => {
		fetchActiveCategories().then(setCategories).catch(() => setCategories([]))
	}, [])

	useEffect(() => {
		if (marketLoading) return
		setProducts(null)
		fetchCatalogProducts({ marketplace, limit: 12 })
			.then(setProducts)
			.catch(() => setProducts([]))
	}, [marketplace, marketLoading])

	return (
		<main className="min-h-screen bg-background">
			<Navigation />

			{/* Hero Section */}
			<section className="relative text-white w-full aspect-video max-h-[500px] overflow-hidden flex items-center justify-center">
				<video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover z-0">
					<source src="/hero_banner_video.mp4" type="video/mp4" />
				</video>
				<div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/50 to-primary/40 z-10"></div>

				<div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
					<div className="text-center">
						<h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-luxury uppercase drop-shadow-md">
							Welcome to CellKore
						</h1>
						<p className="text-lg md:text-2xl opacity-90 mb-8 font-light max-w-2xl mx-auto drop-shadow-sm">
							Your Premium Electronics Hub — buy, wholesale, and sell devices with confidence
						</p>
						<div className="flex flex-col sm:flex-row gap-4 justify-center">
							<Link
								href="/products"
								className="px-8 py-3 bg-background text-primary rounded-full hover:bg-muted transition font-semibold shadow-lg hover:scale-105 active:scale-95 duration-200"
							>
								Shop Now
							</Link>
							<Link
								href="/wholesale"
								className="px-8 py-3 border-2 border-white rounded-full hover:bg-white hover:text-primary transition font-semibold shadow-lg hover:scale-105 active:scale-95 duration-200"
							>
								Wholesale Lots
							</Link>
						</div>
					</div>
				</div>
			</section>

			{/* Categories (dynamic) */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<h2 className="text-3xl font-bold mb-8 text-foreground tracking-luxury uppercase">Shop by Category</h2>
				{categories === null ? (
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="animate-pulse bg-muted rounded-2xl h-40" />
						))}
					</div>
				) : (
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
						{categories.map((category) => (
							<Link key={category.id} href={`/products?category=${category.slug}`}>
								<div className="bg-card border border-border/80 rounded-2xl p-6 text-center shadow-sm hover:shadow-xl hover:border-primary hover:-translate-y-1.5 transition-all duration-300 cursor-pointer h-full flex flex-col items-center justify-center group">
									<div className="mb-4 w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-105 transition-all duration-300 overflow-hidden">
										{category.image_url ? (
											<img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
										) : (
											<LayoutGrid className="w-8 h-8 text-primary" />
										)}
									</div>
									<h3 className="font-semibold text-foreground text-sm tracking-wide group-hover:text-primary transition-colors duration-300">
										{category.name}
									</h3>
								</div>
							</Link>
						))}
					</div>
				)}
			</section>

			{/* Latest Products (marketplace-filtered) */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="flex items-end justify-between mb-8">
					<h2 className="text-3xl font-bold text-foreground tracking-luxury uppercase">Featured Products</h2>
					<Link
						href="/products"
						className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary hover:opacity-80 transition-opacity"
					>
						View All →
					</Link>
				</div>
				{products === null ? (
					<GridShimmer count={8} />
				) : products.length === 0 ? (
					<div className="text-center py-16 border border-dashed border-border rounded-3xl">
						<p className="text-muted-foreground text-sm">
							No products are currently listed for this marketplace. Try switching marketplaces from the header.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
						{products.map((product) => (
							<ProductCard key={product.id} product={product} />
						))}
					</div>
				)}
			</section>

			{/* Wholesale CTA */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-3xl p-8 md:p-12 text-center shadow-lg">
					<h2 className="text-3xl font-bold mb-4 tracking-luxury uppercase">Wholesale Program Available</h2>
					<p className="text-lg opacity-90 mb-6 font-light">
						Are you a business owner? Get bulk pricing and exclusive wholesale lot manifests
					</p>
					<Link
						href="/wholesale"
						className="inline-block px-8 py-3 bg-background text-primary rounded-full hover:bg-muted transition font-semibold"
					>
						Browse Wholesale Lots
					</Link>
				</div>
			</section>

			<Footer />
		</main>
	)
}
