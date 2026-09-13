'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LayoutGrid, ArrowRight, Package } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { fetchActiveCategories } from '@/lib/data'
import type { Category } from '@/lib/types'

export default function CategoriesPageClient() {
	const [categories, setCategories] = useState<Category[] | null>(null)

	useEffect(() => {
		fetchActiveCategories()
			.then((list) => {
				const hasPhones = list.some((c) => c.slug === 'iphones' || c.slug === 'samsungs')
				if (hasPhones) {
					const filtered = list.filter((c) => c.slug !== 'iphones' && c.slug !== 'samsungs' && c.slug !== 'iphone' && c.slug !== 'samsung')
					const phonesCategory: Category = {
						id: 'phones-merged-id',
						name: 'Phones',
						slug: 'phones',
						image_url: '/iphone_category.webp',
						is_active: true,
						sort_order: 1,
						created_at: new Date().toISOString(),
					}
					setCategories([phonesCategory, ...filtered].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)))
				} else {
					setCategories(list)
				}
			})
			.catch(() => setCategories([]))
	}, [])

	return (
		<main className="min-h-screen bg-background">
			<Navigation />

			{/* Page Header */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-8">
				<div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-5 border-b border-border/60">
					<h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight font-sans bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent animate-text-gradient">
						All Categories
					</h1>
					<Link href="/products" className="glow-outline-btn glow-outline-primary">
						<span className="glow-outline-beam" />
						<span className="glow-outline-inner px-4.5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary inline-flex items-center gap-2">
							Browse All Products
							<ArrowRight className="w-3.5 h-3.5" />
						</span>
					</Link>
				</div>
			</section>

			{/* Category Grid */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
				{categories === null ? (
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
						{Array.from({ length: 8 }).map((_, i) => (
							<div key={i} className="animate-pulse bg-muted rounded-2xl h-48" />
						))}
					</div>
				) : categories.length === 0 ? (
					<div className="text-center py-16 border border-dashed border-border rounded-3xl">
						<p className="text-muted-foreground text-sm">No categories are currently available.</p>
					</div>
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
						{categories.map((category) => {
							const isPhone = category.slug === 'phones'
							const isIpad = category.slug === 'ipads' || category.slug === 'ipad'
							const isTablet = category.slug === 'tablets' || category.slug === 'tablet'
							const isWatch = category.slug === 'watches' || category.slug === 'watch'
							const isLaptop = category.slug === 'laptops' || category.slug === 'laptop'
							const isSpareParts = category.slug === 'spare-parts' || category.slug === 'spare_parts'
							const isAccessories = category.slug === 'accessories'
							const hasCustomCover = isPhone || isIpad || isTablet || isWatch || isLaptop || isSpareParts || isAccessories

							let coverImage = null
							if (isPhone) coverImage = '/phones.png'
							else if (isIpad) coverImage = '/ipad_category.webp'
							else if (isTablet) coverImage = '/tablets_category.webp'
							else if (isWatch) coverImage = '/watches_category.webp'
							else if (isLaptop) coverImage = '/laptop_category.webp'
							else if (isSpareParts) coverImage = '/spare_parts_category.png?v=2'
							else if (isAccessories) coverImage = '/accessories_category.png?v=1'

							const targetHref = isSpareParts ? '/spare-parts' : `/products?category=${category.slug}`

							return (
								<Link key={category.id} href={targetHref} className="group">
									<div
										className={`relative bg-card border border-border/80 rounded-2xl text-center shadow-sm hover:shadow-xl hover:border-primary hover:-translate-y-1.5 transition-all duration-300 cursor-pointer h-full flex flex-col items-center justify-center overflow-hidden ${
											hasCustomCover ? 'p-0 min-h-[180px] sm:min-h-[200px]' : 'p-8 min-h-[180px] sm:min-h-[200px]'
										}`}
									>
										{hasCustomCover ? (
											<>
												<img
													src={coverImage || ''}
													alt={category.name}
													className={`w-full h-full object-cover transition-transform duration-500 ${
														isTablet ? 'object-bottom scale-105 group-hover:scale-[1.10]' : 'object-center scale-100 group-hover:scale-[1.05]'
													}`}
												/>
												<div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent px-3 py-3">
													<h2 className="font-semibold text-white text-xs sm:text-sm uppercase tracking-wider">
														{category.name}
													</h2>
												</div>
											</>
										) : (
											<>
												<div className="mb-4 w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-105 transition-all duration-300 overflow-hidden">
													{category.image_url ? (
														<img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
													) : (
														<LayoutGrid className="w-7 h-7 text-primary" />
													)}
												</div>
												<h2 className="font-semibold text-foreground text-xs sm:text-sm uppercase tracking-wider group-hover:text-primary transition-colors">
													{category.name}
												</h2>
											</>
										)}
									</div>
								</Link>
							)
						})}

						{/* All Products card — always shown last */}
						<Link href="/products" className="group">
							<div className="relative bg-card border border-dashed border-primary/40 rounded-2xl text-center shadow-sm hover:shadow-xl hover:border-primary hover:-translate-y-1.5 transition-all duration-300 cursor-pointer h-full min-h-[180px] sm:min-h-[200px] flex flex-col items-center justify-center p-8">
							<div className="mb-4 w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-105 transition-all duration-300">
								<Package className="w-7 h-7 text-primary" />
							</div>
							<h2 className="font-semibold text-foreground text-xs sm:text-sm uppercase tracking-wider group-hover:text-primary transition-colors">
								All Products
							</h2>
							</div>
						</Link>
					</div>
				)}
			</section>

			<Footer />
		</main>
	)
}
