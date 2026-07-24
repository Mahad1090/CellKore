'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Filter, SlidersHorizontal, RotateCcw, Sparkles, X, Search } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { ProductCard } from '@/components/product-card'
import { GridShimmer } from '@/components/shimmer'
import { useMarketplace } from '@/contexts/marketplace-context'
import { fetchActiveCategories, fetchCatalogProducts } from '@/lib/data'
import type { Category, Product } from '@/lib/types'
import { getDiscountedPrice } from '@/lib/types'

// Granular Individual Models for Every Category
const IPHONE_MODELS = [
	{ label: 'All iPhone Models', value: 'all' },
	{ label: 'iPhone 16 Pro Max', value: 'iPhone 16 Pro Max' },
	{ label: 'iPhone 16 Pro', value: 'iPhone 16 Pro' },
	{ label: 'iPhone 16 Plus', value: 'iPhone 16 Plus' },
	{ label: 'iPhone 16', value: 'iPhone 16' },
	{ label: 'iPhone 15 Pro Max', value: 'iPhone 15 Pro Max' },
	{ label: 'iPhone 15 Pro', value: 'iPhone 15 Pro' },
	{ label: 'iPhone 15 Plus', value: 'iPhone 15 Plus' },
	{ label: 'iPhone 15', value: 'iPhone 15' },
	{ label: 'iPhone 14 Pro Max', value: 'iPhone 14 Pro Max' },
	{ label: 'iPhone 14 Pro', value: 'iPhone 14 Pro' },
	{ label: 'iPhone 14 Plus', value: 'iPhone 14 Plus' },
	{ label: 'iPhone 14', value: 'iPhone 14' },
	{ label: 'iPhone 13 Pro Max', value: 'iPhone 13 Pro Max' },
	{ label: 'iPhone 13 Pro', value: 'iPhone 13 Pro' },
	{ label: 'iPhone 13 Mini', value: 'iPhone 13 Mini' },
	{ label: 'iPhone 13', value: 'iPhone 13' },
	{ label: 'iPhone 12 Pro Max', value: 'iPhone 12 Pro Max' },
	{ label: 'iPhone 12 Pro', value: 'iPhone 12 Pro' },
	{ label: 'iPhone 12 Mini', value: 'iPhone 12 Mini' },
	{ label: 'iPhone 12', value: 'iPhone 12' },
	{ label: 'iPhone 11 Pro Max', value: 'iPhone 11 Pro Max' },
	{ label: 'iPhone 11 Pro', value: 'iPhone 11 Pro' },
	{ label: 'iPhone 11', value: 'iPhone 11' },
	{ label: 'iPhone SE (3rd Gen)', value: 'iPhone SE 3' },
	{ label: 'iPhone SE (2nd Gen)', value: 'iPhone SE 2' },
	{ label: 'iPhone XS Max', value: 'iPhone XS Max' },
	{ label: 'iPhone XS', value: 'iPhone XS' },
	{ label: 'iPhone XR', value: 'iPhone XR' },
]

const IPAD_MODELS = [
	{ label: 'All iPad Models', value: 'all' },
	{ label: 'iPad Pro 13" M4', value: 'iPad Pro 13' },
	{ label: 'iPad Pro 12.9" (M2 / M1)', value: 'iPad Pro 12.9' },
	{ label: 'iPad Pro 11" (M4 / M2 / M1)', value: 'iPad Pro 11' },
	{ label: 'iPad Air 13" (M2)', value: 'iPad Air 13' },
	{ label: 'iPad Air 11" (M2 / M1 / 5th Gen)', value: 'iPad Air 11' },
	{ label: 'iPad Air 4th Gen', value: 'iPad Air 4' },
	{ label: 'iPad Mini 6th Gen', value: 'iPad Mini 6' },
	{ label: 'iPad Mini 5th Gen', value: 'iPad Mini 5' },
	{ label: 'iPad 10th Gen (10.9")', value: 'iPad 10th' },
	{ label: 'iPad 9th Gen (10.2")', value: 'iPad 9th' },
]

const SAMSUNG_MODELS = [
	{ label: 'All Samsung Galaxy Models', value: 'all' },
	{ label: 'Galaxy S24 Ultra', value: 'Galaxy S24 Ultra' },
	{ label: 'Galaxy S24+', value: 'Galaxy S24+' },
	{ label: 'Galaxy S24', value: 'Galaxy S24' },
	{ label: 'Galaxy S23 Ultra', value: 'Galaxy S23 Ultra' },
	{ label: 'Galaxy S23+', value: 'Galaxy S23+' },
	{ label: 'Galaxy S23', value: 'Galaxy S23' },
	{ label: 'Galaxy S22 Ultra', value: 'Galaxy S22 Ultra' },
	{ label: 'Galaxy S22+', value: 'Galaxy S22+' },
	{ label: 'Galaxy S22', value: 'Galaxy S22' },
	{ label: 'Galaxy S21 Ultra', value: 'Galaxy S21 Ultra' },
	{ label: 'Galaxy S21+', value: 'Galaxy S21+' },
	{ label: 'Galaxy S21', value: 'Galaxy S21' },
	{ label: 'Galaxy Z Fold 6 / Fold 5 / Fold 4', value: 'Galaxy Z Fold' },
	{ label: 'Galaxy Z Flip 6 / Flip 5 / Flip 4', value: 'Galaxy Z Flip' },
	{ label: 'Galaxy A55 / A54 / A53', value: 'Galaxy A' },
	{ label: 'Galaxy Note 20 Ultra / Note 20', value: 'Galaxy Note' },
]

const LAPTOP_MODELS = [
	{ label: 'All Laptop Models', value: 'all' },
	{ label: 'MacBook Pro 16" (M3 / M2 / M1)', value: 'MacBook Pro 16' },
	{ label: 'MacBook Pro 14" (M3 / M2 / M1)', value: 'MacBook Pro 14' },
	{ label: 'MacBook Pro 13"', value: 'MacBook Pro 13' },
	{ label: 'MacBook Air 15" (M3 / M2)', value: 'MacBook Air 15' },
	{ label: 'MacBook Air 13" (M3 / M2 / M1)', value: 'MacBook Air 13' },
	{ label: 'Dell XPS 15 / XPS 13', value: 'Dell XPS' },
	{ label: 'Dell Latitude Series', value: 'Dell Latitude' },
	{ label: 'Dell Inspiron Series', value: 'Dell Inspiron' },
	{ label: 'HP Spectre x360', value: 'HP Spectre' },
	{ label: 'HP Envy Series', value: 'HP Envy' },
	{ label: 'HP EliteBook Series', value: 'HP EliteBook' },
	{ label: 'Lenovo ThinkPad X1', value: 'ThinkPad' },
	{ label: 'Lenovo Yoga Series', value: 'Yoga' },
	{ label: 'ASUS ROG / TUF Gaming', value: 'ASUS' },
	{ label: 'Acer Predator / Aspire', value: 'Acer' },
]

const TABLET_MODELS = [
	{ label: 'All Tablets', value: 'all' },
	{ label: 'iPad Pro 12.9" / 11"', value: 'iPad Pro' },
	{ label: 'iPad Air', value: 'iPad Air' },
	{ label: 'iPad Mini', value: 'iPad Mini' },
	{ label: 'iPad 10th / 9th Gen', value: 'iPad 10th' },
	{ label: 'Samsung Galaxy Tab S9 Ultra / S9', value: 'Galaxy Tab S9' },
	{ label: 'Samsung Galaxy Tab S8 Ultra / S8', value: 'Galaxy Tab S8' },
	{ label: 'Samsung Galaxy Tab A Series', value: 'Galaxy Tab A' },
]

const WATCH_MODELS = [
	{ label: 'All Smartwatches', value: 'all' },
	{ label: 'Apple Watch Ultra 2', value: 'Apple Watch Ultra 2' },
	{ label: 'Apple Watch Ultra', value: 'Apple Watch Ultra' },
	{ label: 'Apple Watch Series 9', value: 'Series 9' },
	{ label: 'Apple Watch Series 8', value: 'Series 8' },
	{ label: 'Apple Watch Series 7', value: 'Series 7' },
	{ label: 'Apple Watch SE (2nd Gen)', value: 'Apple Watch SE' },
	{ label: 'Galaxy Watch 6 Classic / Watch 6', value: 'Galaxy Watch 6' },
	{ label: 'Galaxy Watch 5 Pro / Watch 5', value: 'Galaxy Watch 5' },
]

const SPARE_PART_MODELS = [
	{ label: 'All Replacement Parts', value: 'all' },
	{ label: 'OLED Screen Assemblies', value: 'OLED' },
	{ label: 'LCD Display Assemblies', value: 'LCD' },
	{ label: 'OEM Battery Cells', value: 'Batteries' },
	{ label: 'USB-C / Lightning Charging Ports', value: 'Charging Ports' },
	{ label: 'Housing, Frame & Back Glass', value: 'Housing & Glass' },
	{ label: 'Camera Modules & Lenses', value: 'Camera Modules' },
]

const ACCESSORY_MODELS = [
	{ label: 'All Accessories', value: 'all' },
	{ label: 'MagSafe & USB-C Power Adapters', value: 'Chargers & Cables' },
	{ label: 'Fast Charging Cables', value: 'Cables' },
	{ label: 'MagSafe Protective Cases', value: 'Cases & Protection' },
	{ label: 'AirPods Pro / AirPods Max', value: 'Audio & AirPods' },
	{ label: 'Tempered Glass Screen Protectors', value: 'Screen Protectors' },
]

// Strictly Category-Specific Model Maps
const MODEL_SUB_FILTERS: Record<string, { label: string; value: string }[]> = {
	iphones: IPHONE_MODELS,
	iphone: IPHONE_MODELS,
	ipads: IPAD_MODELS,
	ipad: IPAD_MODELS,
	samsungs: SAMSUNG_MODELS,
	samsung: SAMSUNG_MODELS,
	laptops: LAPTOP_MODELS,
	laptop: LAPTOP_MODELS,
	tablets: TABLET_MODELS,
	tablet: TABLET_MODELS,
	watches: WATCH_MODELS,
	watch: WATCH_MODELS,
	'spare-parts': SPARE_PART_MODELS,
	spare_parts: SPARE_PART_MODELS,
	accessories: ACCESSORY_MODELS,
}

// Strictly Category-Specific Brand Filter Maps
const BRAND_SUB_FILTERS: Record<string, { label: string; value: string }[]> = {
	iphones: [{ label: 'Apple', value: 'Apple' }],
	iphone: [{ label: 'Apple', value: 'Apple' }],
	ipads: [{ label: 'Apple', value: 'Apple' }],
	ipad: [{ label: 'Apple', value: 'Apple' }],
	samsungs: [{ label: 'Samsung', value: 'Samsung' }],
	samsung: [{ label: 'Samsung', value: 'Samsung' }],
	laptops: [
		{ label: 'All Brands', value: 'all' },
		{ label: 'Apple', value: 'Apple' },
		{ label: 'Dell', value: 'Dell' },
		{ label: 'HP', value: 'HP' },
		{ label: 'Lenovo', value: 'Lenovo' },
		{ label: 'ASUS', value: 'ASUS' },
		{ label: 'Acer', value: 'Acer' },
	],
	laptop: [
		{ label: 'All Brands', value: 'all' },
		{ label: 'Apple', value: 'Apple' },
		{ label: 'Dell', value: 'Dell' },
		{ label: 'HP', value: 'HP' },
		{ label: 'Lenovo', value: 'Lenovo' },
		{ label: 'ASUS', value: 'ASUS' },
		{ label: 'Acer', value: 'Acer' },
	],
	watches: [
		{ label: 'All Brands', value: 'all' },
		{ label: 'Apple', value: 'Apple' },
		{ label: 'Samsung', value: 'Samsung' },
	],
}

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

	// Filter states
	const [brandFilter, setBrandFilter] = useState('all')
	const [modelFilter, setModelFilter] = useState('all')
	const [storageFilter, setStorageFilter] = useState('all')
	const [conditionFilter, setConditionFilter] = useState('all')
	const [lockStatusFilter, setLockStatusFilter] = useState('all')
	const [priceFilter, setPriceFilter] = useState('all')

	const isIphoneSelected = selectedCategory === 'iphones' || selectedCategory === 'iphone'
	const isSamsungSelected = selectedCategory === 'samsungs' || selectedCategory === 'samsung'
	const isIpadSelected = selectedCategory === 'ipads' || selectedCategory === 'ipad'
	const isLaptopSelected = selectedCategory === 'laptops' || selectedCategory === 'laptop'
	const isTabletSelected = selectedCategory === 'tablets' || selectedCategory === 'tablet'
	const isWatchSelected = selectedCategory === 'watches' || selectedCategory === 'watch'
	const isSparePartsSelected = selectedCategory === 'spare-parts' || selectedCategory === 'spare_parts'
	const isAccessoriesSelected = selectedCategory === 'accessories'

	const bannerVideo = isIphoneSelected
		? 'iphone_banner'
		: isSamsungSelected
			? 'samsung_banner'
			: isIpadSelected
				? 'ipad_banner'
				: isLaptopSelected
					? 'laptop_banner'
					: isTabletSelected
						? 'tablet_banner'
						: isWatchSelected
							? 'watch_banner'
							: isSparePartsSelected
								? 'spare_parts_banner'
								: isAccessoriesSelected
									? 'accessories_banner'
									: marketplace === 'CA'
										? 'canada_marketplace_banner'
										: marketplace === 'US'
											? 'us_marketplace_banner'
											: 'all_marketplace_banner'

	useEffect(() => {
		setSelectedCategory(searchParams.get('category') || 'all')
		setSearchQuery(searchParams.get('search') || '')
		setModelFilter('all')
		setBrandFilter('all')
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

	// Reset sub-filters when category changes
	const handleCategoryChange = (slug: string) => {
		setSelectedCategory(slug)
		setBrandFilter('all')
		setModelFilter('all')
		setStorageFilter('all')
		setConditionFilter('all')
		setLockStatusFilter('all')
		setPriceFilter('all')
	}

	const resetAllFilters = () => {
		setSearchQuery('')
		setBrandFilter('all')
		setModelFilter('all')
		setStorageFilter('all')
		setConditionFilter('all')
		setLockStatusFilter('all')
		setPriceFilter('all')
	}

	const hasActiveSubFilters =
		brandFilter !== 'all' ||
		modelFilter !== 'all' ||
		storageFilter !== 'all' ||
		conditionFilter !== 'all' ||
		lockStatusFilter !== 'all' ||
		priceFilter !== 'all' ||
		searchQuery !== ''

	// REAL DATABASE FILTERING ENGINE
	const filteredProducts = useMemo(() => {
		if (!products) return null
		return products.filter((product) => {
			const pName = product.name.toLowerCase()
			const pDesc = (product.description || '').toLowerCase()
			const pBrand = (product.brand || '').toLowerCase()
			const pCond = (product.condition || '').toLowerCase()

			// 1. Brand Filter
			if (brandFilter !== 'all') {
				const b = brandFilter.toLowerCase()
				const matchesBrand = pBrand.includes(b) || pName.includes(b) || pDesc.includes(b)
				if (!matchesBrand) return false
			}

			// 2. Condition Filter
			if (conditionFilter !== 'all') {
				if (conditionFilter === 'new' && pCond !== 'new') return false
				if (conditionFilter === 'refurbished' && pCond !== 'refurbished') return false
				if (conditionFilter === 'used' && pCond !== 'used' && pCond !== 'pre-owned') return false
			}

			// 3. Storage Filter
			if (storageFilter !== 'all') {
				const stg = storageFilter.toLowerCase()
				const matchesName = pName.includes(stg)
				const matchesVariant = product.product_variants?.some((v) => (v.storage || '').toLowerCase().includes(stg))
				const matchesSpec = JSON.stringify(product.mobile_specifications || {}).toLowerCase().includes(stg)
				if (!matchesName && !matchesVariant && !matchesSpec) return false
			}

			// 4. Carrier Lock Status
			if (lockStatusFilter !== 'all') {
				if (lockStatusFilter === 'unlocked') {
					const isUnlocked = pName.includes('unlocked') || pDesc.includes('unlocked') || product.product_variants?.some((v) => (v.carrier_lock || '').toLowerCase().includes('unlocked'))
					if (!isUnlocked) return false
				}
				if (lockStatusFilter === 'locked') {
					const isLocked = pName.includes('locked') || pDesc.includes('locked') || product.product_variants?.some((v) => (v.carrier_lock || '').toLowerCase().includes('locked'))
					if (!isLocked) return false
				}
			}

			// 5. Price Filter
			const price = getDiscountedPrice(product)
			if (priceFilter === 'under-100' && price >= 100) return false
			if (priceFilter === '100-300' && (price < 100 || price > 300)) return false
			if (priceFilter === '300-700' && (price < 300 || price > 700)) return false
			if (priceFilter === '700-1200' && (price < 700 || price > 1200)) return false
			if (priceFilter === 'over-1200' && price <= 1200) return false

			// 6. Specific Model Matching
			if (modelFilter !== 'all') {
				const m = modelFilter.toLowerCase()
				const fullSpecString = (pName + ' ' + pDesc + ' ' + pBrand + ' ' + JSON.stringify(product.mobile_specifications || {})).toLowerCase()

				// iPhone model matching
				if (m.includes('iphone')) {
					if (m.includes('pro max') && !fullSpecString.includes('pro max')) return false
					if (m.includes('pro') && !m.includes('pro max') && (fullSpecString.includes('pro max') || !fullSpecString.includes('pro'))) return false
					if (m.includes('plus') && !fullSpecString.includes('plus')) return false
					if (m.includes('mini') && !fullSpecString.includes('mini')) return false
					const numMatch = m.match(/\d+/)?.[0]
					if (numMatch && !fullSpecString.includes(numMatch)) return false
				}
				// iPad model matching
				else if (m.includes('ipad')) {
					if (m.includes('pro') && !fullSpecString.includes('ipad pro')) return false
					if (m.includes('air') && !fullSpecString.includes('ipad air')) return false
					if (m.includes('mini') && !fullSpecString.includes('ipad mini')) return false
					if (m.includes('10th') && !fullSpecString.includes('10')) return false
					if (m.includes('9th') && !fullSpecString.includes('9')) return false
				}
				// Samsung Galaxy matching
				else if (m.includes('s24') || m.includes('s23') || m.includes('s22') || m.includes('s21')) {
					const sNum = m.match(/s\d+/i)?.[0]?.toLowerCase()
					if (sNum && !fullSpecString.includes(sNum)) return false
					if (m.includes('ultra') && !fullSpecString.includes('ultra')) return false
					if (m.includes('+') && !fullSpecString.includes('+') && !fullSpecString.includes('plus')) return false
				}
				// Generic model keyword fallback
				else {
					const cleanTokens = m.replace(/[^a-z0-9\s]/gi, ' ').split(/\s+/).filter(t => t.length > 1 && t !== 'all' && t !== 'models' && t !== 'series')
					const matchesAllTokens = cleanTokens.every(tok => fullSpecString.includes(tok))
					if (!matchesAllTokens) return false
				}
			}

			return true
		})
	}, [products, brandFilter, conditionFilter, storageFilter, lockStatusFilter, priceFilter, modelFilter])

	const sorted = useMemo(() => {
		if (!filteredProducts) return null
		const list = [...filteredProducts]
		if (sortBy === 'price-low') list.sort((a, b) => getDiscountedPrice(a) - getDiscountedPrice(b))
		if (sortBy === 'price-high') list.sort((a, b) => getDiscountedPrice(b) - getDiscountedPrice(a))
		if (sortBy === 'name') list.sort((a, b) => a.name.localeCompare(b.name))
		return list
	}, [filteredProducts, sortBy])

	const activeModelOptions = MODEL_SUB_FILTERS[selectedCategory] || null
	const activeBrandOptions = BRAND_SUB_FILTERS[selectedCategory] || [
		{ label: 'All Brands', value: 'all' },
		{ label: 'Apple', value: 'Apple' },
		{ label: 'Samsung', value: 'Samsung' },
		{ label: 'Dell', value: 'Dell' },
		{ label: 'HP', value: 'HP' },
		{ label: 'Lenovo', value: 'Lenovo' },
		{ label: 'ASUS', value: 'ASUS' },
		{ label: 'Acer', value: 'Acer' },
		{ label: 'Google', value: 'Google' },
	]

	return (
		<main className="min-h-screen bg-background">
			<Navigation />

			<section className="relative bg-primary text-primary-foreground pt-40 md:pt-48 pb-28 md:pb-32 overflow-hidden min-h-[500px] md:min-h-[560px] flex items-end">
				{bannerVideo && (
					<>
						<video
							key={bannerVideo}
							src={`/${bannerVideo}.mp4`}
							poster={(bannerVideo === 'us_marketplace_banner' || bannerVideo === 'canada_marketplace_banner' || bannerVideo === 'all_marketplace_banner') ? undefined : `/${bannerVideo}_poster.jpg`}
							autoPlay
							loop
							muted
							playsInline
							preload="auto"
							className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none"
						/>
						<div className="absolute inset-0 bg-black/45" />
					</>
				)}
				<div className="relative w-full px-4 sm:px-8 lg:px-12 z-10">
					<p className="text-sm uppercase tracking-[0.25em] opacity-80 mb-3">
						{(isIphoneSelected || isSamsungSelected || isIpadSelected || isLaptopSelected || isTabletSelected || isWatchSelected || isSparePartsSelected || isAccessoriesSelected) ? (
							<span className="text-amber-400 font-semibold">Shop</span>
						) : (
							'Catalog'
						)}
					</p>
					<h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-luxury uppercase leading-none">
						{isIphoneSelected ? 'Apple' : isSamsungSelected ? 'Samsung' : isIpadSelected ? 'iPads' : isLaptopSelected ? 'Laptops' : isTabletSelected ? 'Tablets' : isWatchSelected ? 'Watches' : isSparePartsSelected ? 'Spare Parts' : isAccessoriesSelected ? 'Accessories' : 'Shop Devices'}
					</h1>
					{isIphoneSelected && (
						<p className="text-sm md:text-base text-primary-foreground/90 mt-6 max-w-2xl font-light leading-relaxed tracking-wide">
							Premium, certified pre-owned and refurbished iPhones. Fully tested, unlocked, and backed by our complete warranty.
						</p>
					)}
					{isSamsungSelected && (
						<p className="text-sm md:text-base text-primary-foreground/90 mt-6 max-w-2xl font-light leading-relaxed tracking-wide">
							Premium, certified pre-owned and refurbished Samsung Galaxy devices. Fully tested, unlocked, and backed by our complete warranty.
						</p>
					)}
					{isIpadSelected && (
						<p className="text-sm md:text-base text-primary-foreground/90 mt-6 max-w-2xl font-light leading-relaxed tracking-wide">
							Premium, certified pre-owned and refurbished iPads. Fully tested, unlocked, and backed by our complete warranty.
						</p>
					)}
					{isLaptopSelected && (
						<p className="text-sm md:text-base text-primary-foreground/90 mt-6 max-w-2xl font-light leading-relaxed tracking-wide">
							Premium, certified pre-owned and refurbished laptops from Apple, Dell, HP, Lenovo, and more.
						</p>
					)}
					{isTabletSelected && (
						<p className="text-sm md:text-base text-primary-foreground/90 mt-6 max-w-2xl font-light leading-relaxed tracking-wide">
							Premium, certified pre-owned and refurbished tablets. Fully tested, unlocked, and backed by our complete warranty.
						</p>
					)}
					{isWatchSelected && (
						<p className="text-sm md:text-base text-primary-foreground/90 mt-6 max-w-2xl font-light leading-relaxed tracking-wide">
							Premium, certified pre-owned and refurbished smartwatches. Fully tested, unlocked, and backed by our complete warranty.
						</p>
					)}
					{isSparePartsSelected && (
						<p className="text-sm md:text-base text-primary-foreground/90 mt-6 max-w-2xl font-light leading-relaxed tracking-wide">
							Premium OEM & high-quality replacement parts. Screen assemblies, battery replacements, ports, and micro-soldering components.
						</p>
					)}
					{isAccessoriesSelected && (
						<p className="text-sm md:text-base text-primary-foreground/90 mt-6 max-w-2xl font-light leading-relaxed tracking-wide">
							Premium, original-grade power adapters, fast-charging cables, protective cases, screen protectors, and audio accessories.
						</p>
					)}
				</div>
			</section>

			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
				{/* Top Search & Category Selection Bar */}
				<div className="flex flex-wrap items-center gap-3">
					{/* Search input */}
					<div className="relative flex-1 min-w-[220px] max-w-xs">
						<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							placeholder="Search brand, model, specs..."
							className="w-full pl-9 pr-4 py-2.5 border border-border rounded-xl bg-background text-xs sm:text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-all"
						/>
					</div>

					{/* Category Chips (Square Rounded Corners - rounded-xl) */}
					<div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
						<button
							onClick={() => handleCategoryChange('all')}
							className={`px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-[0.14em] border transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
								selectedCategory === 'all'
									? 'bg-primary text-primary-foreground border-primary'
									: 'border-border bg-card text-foreground/75 hover:border-primary hover:text-primary'
							}`}
						>
							All Products
						</button>
						{categories.map((category) => (
							<button
								key={category.id}
								onClick={() => handleCategoryChange(category.slug)}
								className={`px-4 py-2.5 rounded-xl text-[10px] sm:text-xs font-bold uppercase tracking-[0.14em] border transition-all cursor-pointer whitespace-nowrap shadow-2xs ${
									selectedCategory === category.slug
										? 'bg-primary text-primary-foreground border-primary'
										: 'border-border bg-card text-foreground/75 hover:border-primary hover:text-primary'
								}`}
							>
								{category.name}
							</button>
						))}
					</div>

					{/* Sort Dropdown */}
					<select
						value={sortBy}
						onChange={(e) => setSortBy(e.target.value)}
						className="ml-auto px-4 py-2.5 border border-border rounded-xl bg-background text-xs font-bold text-foreground focus:outline-none focus:border-primary cursor-pointer shadow-2xs"
					>
						<option value="newest">Sort: Newest</option>
						<option value="price-low">Price: Low to High</option>
						<option value="price-high">Price: High to Low</option>
						<option value="name">Name A–Z</option>
					</select>
				</div>

				{/* Comprehensive Filter Card (Square Rounded Corners - rounded-xl) */}
				<div className="bg-card border border-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
					<div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
						<div className="flex items-center gap-2">
							<SlidersHorizontal className="w-4 h-4 text-primary" />
							<span className="text-xs font-extrabold uppercase tracking-[0.16em] text-foreground">
								FILTER
							</span>
						</div>
						{hasActiveSubFilters && (
							<button
								onClick={resetAllFilters}
								className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-destructive/10 hover:bg-destructive/20 text-destructive text-[10px] font-extrabold uppercase tracking-wider transition-colors cursor-pointer"
							>
								<RotateCcw className="w-3 h-3" />
								Reset Filters
							</button>
						)}
					</div>

					{/* Category-Specific Filter Select Dropdowns Grid */}
					<div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-1">
						{/* 1. Brand Filter Dropdown */}
						<div>
							<label className="block text-[9px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Brand</label>
							<select
								value={brandFilter}
								onChange={(e) => setBrandFilter(e.target.value)}
								className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary cursor-pointer shadow-2xs"
							>
								{activeBrandOptions.map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>

						{/* 2. Specific Model Select Dropdown */}
						<div>
							<label className="block text-[9px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground mb-1.5">
								{isIphoneSelected ? 'iPhone Model' : isSamsungSelected ? 'Galaxy Model' : isIpadSelected ? 'iPad Model' : isLaptopSelected ? 'Laptop Model' : isWatchSelected ? 'Watch Model' : isSparePartsSelected ? 'Part Type' : isAccessoriesSelected ? 'Accessory Type' : 'Model'}
							</label>
							<select
								value={modelFilter}
								onChange={(e) => setModelFilter(e.target.value)}
								className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary cursor-pointer shadow-2xs"
							>
								{(activeModelOptions || IPHONE_MODELS).map((opt) => (
									<option key={opt.value} value={opt.value}>
										{opt.label}
									</option>
								))}
							</select>
						</div>

						{/* 3. Storage Capacity Dropdown */}
						<div>
							<label className="block text-[9px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Storage Capacity</label>
							<select
								value={storageFilter}
								onChange={(e) => setStorageFilter(e.target.value)}
								className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary cursor-pointer shadow-2xs"
							>
								<option value="all">All Storage</option>
								<option value="64GB">64GB</option>
								<option value="128GB">128GB</option>
								<option value="256GB">256GB</option>
								<option value="512GB">512GB</option>
								<option value="1TB">1TB+</option>
							</select>
						</div>

						{/* 4. Condition Dropdown */}
						<div>
							<label className="block text-[9px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Condition</label>
							<select
								value={conditionFilter}
								onChange={(e) => setConditionFilter(e.target.value)}
								className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary cursor-pointer shadow-2xs"
							>
								<option value="all">All Conditions</option>
								<option value="new">Brand New</option>
								<option value="refurbished">Refurbished</option>
								<option value="used">Pre-Owned / Used</option>
							</select>
						</div>

						{/* 5. Carrier Lock Status Dropdown */}
						<div>
							<label className="block text-[9px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Carrier Status</label>
							<select
								value={lockStatusFilter}
								onChange={(e) => setLockStatusFilter(e.target.value)}
								className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary cursor-pointer shadow-2xs"
							>
								<option value="all">All Statuses</option>
								<option value="unlocked">Factory Unlocked</option>
								<option value="locked">Carrier Locked</option>
							</select>
						</div>

						{/* 6. Price Range Dropdown */}
						<div>
							<label className="block text-[9px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Price Range</label>
							<select
								value={priceFilter}
								onChange={(e) => setPriceFilter(e.target.value)}
								className="w-full px-3 py-2.5 border border-border rounded-xl bg-background text-xs font-semibold text-foreground focus:outline-none focus:border-primary cursor-pointer shadow-2xs"
							>
								<option value="all">All Prices</option>
								<option value="under-100">Under $100</option>
								<option value="100-300">$100 – $300</option>
								<option value="300-700">$300 – $700</option>
								<option value="700-1200">$700 – $1,200</option>
								<option value="over-1200">Over $1,200</option>
							</select>
						</div>
					</div>
				</div>

				{/* Result Stats */}
				{sorted !== null && (
					<div className="flex items-center justify-between text-xs text-muted-foreground px-1">
						<span>
							Showing <strong className="text-foreground font-bold">{sorted.length}</strong> {sorted.length === 1 ? 'product' : 'products'}
						</span>
						{hasActiveSubFilters && (
							<span className="text-[11px] text-primary font-bold">Filtered Results Active</span>
						)}
					</div>
				)}

				{sorted === null ? (
					<GridShimmer count={12} />
				) : sorted.length === 0 ? (
					<div className="text-center py-20 border border-dashed border-border rounded-2xl bg-card">
						<p className="text-foreground font-bold text-base mb-1">No products match your selected filters.</p>
						<p className="text-muted-foreground text-xs mb-5">Try adjusting brand, model, storage, or price options.</p>
						<button
							onClick={resetAllFilters}
							className="px-5 py-2.5 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer shadow-xs"
						>
							Clear All Filters
						</button>
					</div>
				) : (
					<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
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
