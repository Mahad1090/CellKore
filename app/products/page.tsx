'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { GridShimmer } from '@/components/shimmer'
import { useMarketplace } from '@/contexts/marketplace-context'
import { fetchActiveCategories, fetchCatalogProducts } from '@/lib/data'
import type { Category, Product } from '@/lib/types'

export default function ProductsPage() {
	return (
		<Suspense
			fallback={
				<main className="min-h-screen bg-background">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
						<GridShimmer />
					</div>
				</main>
			}
		>
			<ProductsPageContent />
		</Suspense>
	)
}

function ProductsPageContent() {
	const searchParams = useSearchParams()
	const { marketplace, loading: marketLoading } = useMarketplace()
	const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'all')
	const [sortBy, setSortBy] = useState('newest')
	const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
	const [categories, setCategories] = useState<Category[]>([])
	const [products, setProducts] = useState<Product[] | null>(null)

	useEffect(() => {
		setSelectedCategory(searchParams.get('category') || 'all')
		setSearchQuery(searchParams.get('search') || '')
	}, [searchParams])

	useEffect(() => {
		fetchActiveCategories().then(setCategories).catch(() => setCategories([]))
	}, [])

	useEffect(() => {
		if (marketLoading) return
		setProducts(null)
		const timer = setTimeout(() => {
			fetchCatalogProducts({
				marketplace,
				search: searchQuery.trim() || undefined,
				categorySlug: selectedCategory === 'all' ? undefined : selectedCategory,
			})
				.then(setProducts)
				.catch(() => setProducts([]))
		}, 200)
		return () => clearTimeout(timer)
	}, [marketplace, marketLoading, searchQuery, selectedCategory])

	const sorted = useMemo(() => {
		if (!products) return null
		const list = [...products]
		if (sortBy === 'price-low') list.sort((a, b) => a.base_price - b.base_price)
		if (sortBy === 'price-high') list.sort((a, b) => b.base_price - a.base_price)
		if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
		return list
	}, [products, sortBy])

	return (
		<main className="min-h-screen bg-background">
			<Navigation />

			<section className="bg-primary text-primary-foreground py-10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<p className="text-sm uppercase tracking-[0.25em] opacity-80 mb-3">Catalog</p>
					<h1 className="text-3xl md:text-4xl font-bold tracking-luxury uppercase">Shop Devices</h1>
				</div>
			</section>

			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
				{/* Filters */}
				<div className="flex flex-wrap items-center gap-3 mb-8">
					<input
						type="text"
						value={searchQuery}
						onChange={(e) => setSearchQuery(e.target.value)}
						placeholder="Search products..."
						className="px-4 py-2.5 border border-border rounded-full bg-background text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-all w-full sm:w-64"
					/>
					<div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
						<button
							onClick={() => setSelectedCategory('all')}
							className={`px-4 py-2 rounded-full text-[10px] font-semibold uppercase tracking-[0.14em] border transition-all cursor-pointer whitespace-nowrap ${
								selectedCategory === 'all'
									? 'bg-primary text-primary-foreground border-primary'
									: 'border-border text-foreground/70 hover:border-primary hover:text-primary'
							}`}
						>
							All
						</button>
						{categories.map((category) => (
							<button
								key={category.id}
								onClick={() => setSelectedCategory(category.slug)}
								className={`px-4 py-2 rounded-full text-[10px] font-semibold uppercase tracking-[0.14em] border transition-all cursor-pointer whitespace-nowrap ${
									selectedCategory === category.slug
										? 'bg-primary text-primary-foreground border-primary'
										: 'border-border text-foreground/70 hover:border-primary hover:text-primary'
								}`}
							>
								{category.name}
							</button>
						))}
					</div>
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value)}
						className="ml-auto px-4 py-2.5 border border-border rounded-full bg-background text-xs text-foreground focus:outline-none focus:border-primary cursor-pointer"
					>
						<option value="newest">Newest</option>
						<option value="price-low">Price: Low to High</option>
						<option value="price-high">Price: High to Low</option>
						<option value="name">Name A–Z</option>
					</select>
				</div>

				{sorted === null ? (
					<GridShimmer count={12} />
				) : sorted.length === 0 ? (
					<div className="text-center py-24 border border-dashed border-border rounded-3xl">
						<p className="text-muted-foreground text-sm">No products match your filters in this marketplace.</p>
					</div>
				) : (
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
						{sorted.map((product) => (
							<ProductCard key={product.id} product={product} />
						))}
					</div>
				)}
			</section>

			<Footer />
		</main>
	)
}
