'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LayoutGrid, Store, Globe, Package, DollarSign, Wrench, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react'
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
		fetchCatalogProducts({ marketplace, limit: 10 })
			.then(setProducts)
			.catch(() => setProducts([]))
	}, [marketplace, marketLoading])

	return (
		<main className="min-h-screen bg-background">
			<Navigation />

			{/* 1. Main Hero Banner */}
			<section className="relative text-white w-full min-h-[440px] sm:min-h-[500px] md:min-h-[540px] overflow-hidden flex items-center justify-center">
				<video
					autoPlay
					loop
					muted
					playsInline
					preload="auto"
					poster="/hero_banner_poster.jpg"
					className="absolute inset-0 w-full h-full object-cover z-0"
				>
					<source src="/hero_banner_video.mp4" type="video/mp4" />
				</video>
				<div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/60 to-primary/30 z-10" />

				<div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full text-center">
					<div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/90 backdrop-blur-md mb-6 text-xs font-semibold uppercase tracking-[0.2em]">
						<Sparkles className="w-3.5 h-3.5 text-primary" /> Premium Certified Marketplace
					</div>
					<h1 className="text-3xl sm:text-5xl md:text-7xl font-bold mb-4 tracking-luxury uppercase drop-shadow-md">
						Welcome to CellKore
					</h1>
					<p className="text-base sm:text-xl md:text-2xl opacity-90 mb-8 font-light max-w-2xl mx-auto drop-shadow-sm leading-relaxed">
						Your Premium Electronics Hub — buy retail, wholesale bulk, sell devices, and book OEM repairs
					</p>
					<div className="flex flex-wrap gap-4 justify-center">
						<Link
							href="/products"
							className="px-8 py-3.5 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition font-bold text-xs uppercase tracking-[0.18em] shadow-lg hover:scale-105 active:scale-95 duration-200"
						>
							Shop All Products
						</Link>
						<Link
							href="/wholesale"
							className="px-8 py-3.5 border border-white/40 bg-black/40 text-white backdrop-blur-md rounded-full hover:bg-white hover:text-black transition font-bold text-xs uppercase tracking-[0.18em] shadow-lg hover:scale-105 active:scale-95 duration-200"
						>
							Wholesale Lots
						</Link>
					</div>
				</div>
			</section>

			{/* 2. Shop Categories Section */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
				<div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 pb-5 border-b border-border/60 gap-4">
					<div>
						<div className="flex items-center gap-2 mb-2">
							<span className="h-0.5 w-6 bg-primary rounded-full inline-block" />
							<p className="text-[10px] uppercase tracking-[0.28em] text-primary font-bold">CellKore Catalog</p>
						</div>
						<h2 className="text-2xl sm:text-4xl font-extrabold tracking-luxury uppercase text-foreground bg-gradient-to-r from-foreground via-foreground/90 to-primary/80 bg-clip-text text-transparent">
							Shop by Device Type
						</h2>
					</div>
					<Link href="/products" className="glow-outline-btn glow-outline-primary">
						<span className="glow-outline-beam" />
						<span className="glow-outline-inner px-4.5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
							View All Categories
						</span>
					</Link>
				</div>

				{categories === null ? (
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
						{Array.from({ length: 6 }).map((_, i) => (
							<div key={i} className="animate-pulse bg-muted rounded-2xl h-40" />
						))}
					</div>
				) : (
					<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
						{categories.map((category) => {
							const isIphone = category.slug === 'iphones' || category.slug === 'iphone'
							const isSamsung = category.slug === 'samsungs' || category.slug === 'samsung'
							const isIpad = category.slug === 'ipads' || category.slug === 'ipad'
							const isTablet = category.slug === 'tablets' || category.slug === 'tablet'
							const isWatch = category.slug === 'watches' || category.slug === 'watch'
							const isLaptop = category.slug === 'laptops' || category.slug === 'laptop'
							const hasCustomCover = isIphone || isSamsung || isIpad || isTablet || isWatch || isLaptop

							let coverImage = null
							if (isIphone) coverImage = '/iphone_category.webp'
							else if (isSamsung) coverImage = '/samsung_category.webp'
							else if (isIpad) coverImage = '/ipad_category.webp'
							else if (isTablet) coverImage = '/tablets_category.webp'
							else if (isWatch) coverImage = '/watches_category.webp'
							else if (isLaptop) coverImage = '/laptop_category.webp'

							return (
								<Link key={category.id} href={`/products?category=${category.slug}`}>
									<div className={`bg-card border border-border/80 rounded-2xl text-center shadow-sm hover:shadow-xl hover:border-primary hover:-translate-y-1.5 transition-all duration-300 cursor-pointer h-full flex flex-col items-center justify-center group relative overflow-hidden ${
										hasCustomCover ? 'p-0 min-h-[160px]' : 'p-6'
									}`}>
										{hasCustomCover ? (
											<img 
												src={coverImage || ''} 
												alt={category.name} 
												className={`w-full h-full object-cover scale-100 transition-transform duration-500 group-hover:scale-[1.05] ${
													isSamsung ? 'object-[40%_center]' : 'object-center'
												}`} 
											/>
										) : (
											<>
												<div className="mb-4 w-14 h-14 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-105 transition-all duration-300 overflow-hidden">
													{category.image_url ? (
														<img src={category.image_url} alt={category.name} className="w-full h-full object-cover" />
													) : (
														<LayoutGrid className="w-7 h-7 text-primary" />
													)}
												</div>
												<h3 className="font-semibold text-foreground text-xs uppercase tracking-wider group-hover:text-primary transition-colors">
													{category.name}
												</h3>
											</>
										)}
									</div>
								</Link>
							)
						})}
					</div>
				)}
			</section>

			{/* 3. Featured Products Grid */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<div className="flex flex-wrap items-end justify-between gap-4 mb-10 pb-5 border-b border-border/60">
					<div>
						<div className="flex items-center gap-2 mb-2">
							<span className="h-0.5 w-6 bg-primary rounded-full inline-block" />
							<p className="text-[10px] uppercase tracking-[0.28em] text-primary font-bold">Authenticated Stock</p>
						</div>
						<h2 className="text-2xl sm:text-4xl font-extrabold text-foreground tracking-luxury uppercase bg-gradient-to-r from-foreground via-foreground/90 to-primary/80 bg-clip-text text-transparent">
							Featured Devices
						</h2>
					</div>
					<Link href="/products" className="glow-outline-btn glow-outline-primary">
						<span className="glow-outline-beam" />
						<span className="glow-outline-inner px-4.5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
							Explore All
						</span>
					</Link>
				</div>
				{products === null ? (
					<GridShimmer count={10} />
				) : products.length === 0 ? (
					<div className="text-center py-16 border border-dashed border-border rounded-3xl">
						<p className="text-muted-foreground text-sm">
							No products are currently listed for this marketplace. Try switching marketplaces from the header.
						</p>
					</div>
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
						{products.map((product) => (
							<ProductCard key={product.id} product={product} />
						))}
					</div>
				)}
			</section>

			{/* ========================================================================= */}
			{/* DEDICATED FEATURE SECTIONS WITH RUNNING VIDEO BANNERS FOR EACH NAVBAR PORTAL */}
			{/* ========================================================================= */}

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-20 py-12">

				{/* FEATURE SECTION 1: WHOLESALE BULK LOTS (Running Video Banner: /bulk_banner.mp4) */}
				<div className="space-y-5">
					<div className="flex flex-col sm:flex-row sm:items-end justify-between pb-4 border-b border-border/60 gap-4">
						<div>
							<div className="flex items-center gap-2 mb-2">
								<span className="h-0.5 w-6 bg-primary rounded-full inline-block" />
								<p className="text-[10px] uppercase tracking-[0.28em] text-primary font-bold">B2B & Commercial Contracts</p>
							</div>
							<h2 className="text-2xl sm:text-4xl font-extrabold tracking-luxury uppercase text-foreground bg-gradient-to-r from-foreground via-foreground/90 to-primary/80 bg-clip-text text-transparent">
								Wholesale & Bulk Lots
							</h2>
						</div>
						<Link href="/wholesale" className="glow-outline-btn glow-outline-primary">
							<span className="glow-outline-beam" />
							<span className="glow-outline-inner px-4.5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
								Explore Wholesale
							</span>
						</Link>
					</div>

					<section className="relative text-white w-full rounded-3xl overflow-hidden min-h-[380px] md:min-h-[460px] flex items-center justify-center border border-border shadow-2xl group">
						<video
							autoPlay
							loop
							muted
							playsInline
							preload="auto"
							className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-700 group-hover:scale-105"
						>
							<source src="/bulk_banner.mp4" type="video/mp4" />
						</video>
						<div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40 z-10" />

						<div className="relative z-20 p-8 sm:p-12 md:p-16 w-full max-w-3xl mr-auto">
							<div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-primary/20 border border-primary/40 text-primary-foreground backdrop-blur-md mb-4 text-[10px] font-bold uppercase tracking-[0.2em]">
								<Package className="w-3.5 h-3.5 text-primary" /> B2B & Commercial Contracts
							</div>
							<h3 className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-4 tracking-luxury uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-emerald-100 to-primary drop-shadow-lg leading-tight">
								Wholesale Bulk Lots
							</h3>
							<p className="text-white/90 text-xs sm:text-sm md:text-base font-light mb-8 max-w-xl leading-relaxed">
								Gain access to volume pricing, verified grading manifests, and commercial bulk inventory lots. Built for electronics retailers, repair shops, and distributors.
							</p>
							<div className="flex flex-wrap items-center gap-4">
								<Link
									href="/wholesale"
									className="px-7 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 transition font-bold text-xs uppercase tracking-[0.16em] shadow-lg flex items-center gap-2"
								>
									Browse Wholesale Manifests
								</Link>
								<div className="flex items-center gap-4 text-xs text-white/80 font-medium">
									<span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Verified Manifests</span>
									<span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Tiered Bulk Pricing</span>
								</div>
							</div>
						</div>
					</section>
				</div>

				{/* FEATURE SECTION 2: SELL YOUR DEVICE (Running Video Banner: /sell_ur_phone_banner.mp4) */}
				<div className="space-y-5">
					<div className="flex flex-col sm:flex-row sm:items-end justify-between pb-4 border-b border-border/60 gap-4">
						<div>
							<div className="flex items-center gap-2 mb-2">
								<span className="h-0.5 w-6 bg-emerald-500 rounded-full inline-block" />
								<p className="text-[10px] uppercase tracking-[0.28em] text-emerald-600 dark:text-emerald-400 font-bold">Trade-In & Valuation</p>
							</div>
							<h2 className="text-2xl sm:text-4xl font-extrabold tracking-luxury uppercase text-foreground bg-gradient-to-r from-foreground via-foreground/90 to-emerald-600 dark:to-emerald-400 bg-clip-text text-transparent">
								Sell Your Device
							</h2>
						</div>
						<Link href="/sell" className="glow-outline-btn glow-outline-emerald">
							<span className="glow-outline-beam" />
							<span className="glow-outline-inner px-4.5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-400">
								Get Valuation Quote
							</span>
						</Link>
					</div>

					<section className="relative text-white w-full rounded-3xl overflow-hidden min-h-[380px] md:min-h-[460px] flex items-center justify-center border border-border shadow-2xl group">
						<video
							autoPlay
							loop
							muted
							playsInline
							preload="auto"
							className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-700 group-hover:scale-105"
						>
							<source src="/sell_ur_phone_banner.mp4" type="video/mp4" />
						</video>
						<div className="absolute inset-0 bg-gradient-to-l from-black/90 via-black/70 to-black/40 z-10" />

						<div className="relative z-20 p-8 sm:p-12 md:p-16 w-full max-w-3xl ml-auto text-right flex flex-col items-end">
							<div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 backdrop-blur-md mb-4 text-[10px] font-bold uppercase tracking-[0.2em]">
								<DollarSign className="w-3.5 h-3.5 text-emerald-400" /> Fast Payouts & Trade-Ins
							</div>
							<h3 className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-4 tracking-luxury uppercase text-transparent bg-clip-text bg-gradient-to-l from-white via-emerald-100 to-emerald-400 drop-shadow-lg leading-tight">
								Sell Your Device
							</h3>
							<p className="text-white/90 text-xs sm:text-sm md:text-base font-light mb-8 max-w-xl leading-relaxed">
								Turn your pre-owned smartphones, tablets, and laptops into cash. Submit your device details in seconds to receive an official top-dollar quote from our team.
							</p>
							<div className="flex flex-wrap items-center justify-end gap-4">
								<div className="flex items-center gap-4 text-xs text-white/80 font-medium mr-2">
									<span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Free Shipping Label</span>
									<span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-400" /> Same-Day Evaluation</span>
								</div>
								<Link
									href="/sell"
									className="px-7 py-3 bg-white text-black hover:bg-white/90 transition font-bold text-xs uppercase tracking-[0.16em] shadow-lg rounded-full flex items-center gap-2"
								>
									Get Official Quote
								</Link>
							</div>
						</div>
					</section>
				</div>

				{/* FEATURE SECTION 3: DEVICE REPAIR & RESTORATION (Running Video Banner: /laptop_banner.mp4) */}
				<div className="space-y-5">
					<div className="flex flex-col sm:flex-row sm:items-end justify-between pb-4 border-b border-border/60 gap-4">
						<div>
							<div className="flex items-center gap-2 mb-2">
								<span className="h-0.5 w-6 bg-teal-500 rounded-full inline-block" />
								<p className="text-[10px] uppercase tracking-[0.28em] text-teal-600 dark:text-teal-400 font-bold">OEM Certified Service</p>
							</div>
							<h2 className="text-2xl sm:text-4xl font-extrabold tracking-luxury uppercase text-foreground bg-gradient-to-r from-foreground via-foreground/90 to-teal-600 bg-clip-text text-transparent">
								Device Repair & Maintenance
							</h2>
						</div>
						<Link href="/repair" className="glow-outline-btn glow-outline-teal">
							<span className="glow-outline-beam" />
							<span className="glow-outline-inner px-4.5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-400">
								Book Repair Portal
							</span>
						</Link>
					</div>

					<section className="relative text-white w-full rounded-3xl overflow-hidden min-h-[380px] md:min-h-[460px] flex items-center justify-center border border-border shadow-2xl group">
						<video
							autoPlay
							loop
							muted
							playsInline
							preload="auto"
							className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-700 group-hover:scale-105"
						>
							<source src="/repair_banner.mp4" type="video/mp4" />
						</video>
						<div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/40 z-10" />

						<div className="relative z-20 p-8 sm:p-12 md:p-16 w-full max-w-3xl mr-auto">
							<div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-300 backdrop-blur-md mb-4 text-[10px] font-bold uppercase tracking-[0.2em]">
								<Wrench className="w-3.5 h-3.5 text-teal-400" /> Certified Technicians & OEM Parts
							</div>
							<h3 className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-4 tracking-luxury uppercase text-transparent bg-clip-text bg-gradient-to-r from-white via-teal-200 to-teal-400 drop-shadow-lg leading-tight">
								Device Repair & Service
							</h3>
							<p className="text-white/90 text-xs sm:text-sm md:text-base font-light mb-8 max-w-xl leading-relaxed">
								From cracked screen replacement and battery swaps to complex board-level soldering. Book your mail-in or store drop-off service with full diagnostic tracking.
							</p>
							<div className="flex flex-wrap items-center gap-4">
								<Link
									href="/repair"
									className="px-7 py-3 bg-teal-600 hover:bg-teal-500 text-white transition font-bold text-xs uppercase tracking-[0.16em] shadow-lg rounded-full flex items-center gap-2"
								>
									Book Repair Service
								</Link>
								<div className="flex items-center gap-4 text-xs text-white/80 font-medium">
									<span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-teal-400" /> Mail-in & Drop-off</span>
									<span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-teal-400" /> 90-Day Repair Warranty</span>
								</div>
							</div>
						</div>
					</section>
				</div>

				{/* FEATURE SECTION 4: REGIONAL MARKETPLACES (Running Video Banner: /us_marketplace_banner.mp4) */}
				<div className="space-y-5">
					<div className="flex flex-col sm:flex-row sm:items-end justify-between pb-4 border-b border-border/60 gap-4">
						<div>
							<div className="flex items-center gap-2 mb-2">
								<span className="h-0.5 w-6 bg-blue-500 rounded-full inline-block" />
								<p className="text-[10px] uppercase tracking-[0.28em] text-blue-600 dark:text-blue-400 font-bold">North America Regional Hub</p>
							</div>
							<h2 className="text-2xl sm:text-4xl font-extrabold tracking-luxury uppercase text-foreground bg-gradient-to-r from-foreground via-foreground/90 to-blue-500 bg-clip-text text-transparent">
								Regional Marketplaces
							</h2>
						</div>
						<Link href="/marketplace" className="glow-outline-btn glow-outline-blue">
							<span className="glow-outline-beam" />
							<span className="glow-outline-inner px-4.5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-blue-600 dark:text-blue-400">
								View Regional Portals
							</span>
						</Link>
					</div>

					<section className="relative text-white w-full rounded-3xl overflow-hidden min-h-[380px] md:min-h-[460px] flex items-center justify-center border border-border shadow-2xl group">
						<video
							autoPlay
							loop
							muted
							playsInline
							preload="auto"
							className="absolute inset-0 w-full h-full object-cover z-0 transition-transform duration-700 group-hover:scale-105"
						>
							<source src="/us_marketplace_banner.mp4" type="video/mp4" />
						</video>
						<div className="absolute inset-0 bg-gradient-to-l from-black/90 via-black/70 to-black/40 z-10" />

						<div className="relative z-20 p-8 sm:p-12 md:p-16 w-full max-w-3xl ml-auto text-right flex flex-col items-end">
							<div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 backdrop-blur-md mb-4 text-[10px] font-bold uppercase tracking-[0.2em]">
								<Globe className="w-3.5 h-3.5 text-blue-400" /> US & Canada Localized Catalogs
							</div>
							<h3 className="text-3xl sm:text-5xl md:text-6xl font-extrabold mb-4 tracking-luxury uppercase text-transparent bg-clip-text bg-gradient-to-l from-white via-blue-100 to-blue-400 drop-shadow-lg leading-tight">
								Regional Marketplaces
							</h3>
							<p className="text-white/90 text-xs sm:text-sm md:text-base font-light mb-8 max-w-xl leading-relaxed">
								Browse curated inventory tailored specifically to your marketplace region. Enjoy localized pricing, fast regional dispatch, and zero customs hassle.
							</p>
							<div className="flex flex-wrap items-center justify-end gap-4">
								<div className="flex items-center gap-4 text-xs text-white/80 font-medium mr-2">
									<span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-blue-400" /> United States</span>
									<span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-blue-400" /> Canada</span>
								</div>
								<Link
									href="/marketplace"
									className="px-7 py-3 bg-blue-600 hover:bg-blue-500 text-white transition font-bold text-xs uppercase tracking-[0.16em] shadow-lg rounded-full flex items-center gap-2"
								>
									Explore Marketplaces
								</Link>
							</div>
						</div>
					</section>
				</div>

			</div>

			<Footer />
		</main>
	)
}
