'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Heart, Smartphone } from 'lucide-react'
import type { Product } from '@/lib/types'
import { primaryImage, totalStock } from '@/lib/types'
import { getWishlist } from '@/lib/cart'

const CONDITION_LABELS: Record<string, string> = {
	new: 'New',
	used: 'Used',
	refurbished: 'Refurbished',
}

const CONDITION_CLASSES: Record<string, string> = {
	new: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-900/30',
	used: 'bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 border-zinc-200/60 dark:border-zinc-800/60',
	refurbished: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-200/60 dark:border-amber-900/30',
}

function getOriginalPrice(basePrice: number, name: string): number | null {
	const price = Number(basePrice)
	if (price <= 0) return null
	
	const lowerName = name.toLowerCase()
	if (lowerName.includes('se')) return 399
	if (lowerName.includes('11')) return 699
	if (lowerName.includes('12')) return 799
	if (lowerName.includes('13')) return 899
	if (lowerName.includes('14')) return 999
	if (lowerName.includes('15')) return 1099
	
	if (price < 100) return Math.round(price * 3.5 + 49)
	if (price < 300) return Math.round(price * 2.2 + 99)
	return Math.round(price * 1.6 + 149)
}

function getBrandIcon(brand: string | null) {
	if (!brand) return null
	const lower = brand.toLowerCase()
	if (lower === 'apple') {
		return (
			<svg viewBox="0 0 170 170" className="w-3.5 h-3.5 fill-foreground/75 dark:fill-foreground/90">
				<path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.34.13-9.13-1.92-14.36-6.15-3.34-2.7-7.23-7.55-11.67-14.56-9.71-15.4-14.56-31.42-14.56-48.06 0-14.93 3.86-27.23 11.59-36.88 7.73-9.65 17.51-14.55 29.35-14.7 5.09 0 10.45 1.45 16.08 4.36 5.62 2.9 9.69 4.36 12.22 4.36 1.91 0 5.69-1.33 11.33-3.99 5.64-2.67 10.74-3.91 15.31-3.71 13.43.5 24.16 5.37 32.22 14.6-11.83 7.18-17.65 16.89-17.47 29.13.19 9.9 3.97 18.25 11.33 25.04 7.37 6.79 16.1 10.44 26.2 10.97.22 1.34.05 3.39-.52 6.15zM119.22 35.85c0-7.86 2.76-14.72 8.29-20.57 5.53-5.84 12.07-9.15 19.63-9.92.17 7.74-2.6 14.65-8.29 20.73-5.69 6.08-12.35 9.49-19.98 10.22a8.62 8.62 0 0 1-.35-2.07-28 28 0 0 1-.3-2.46z"/>
			</svg>
		)
	}
	if (lower === 'samsung') {
		return <span className="text-foreground/75 dark:text-foreground/90 text-[7px] font-extrabold tracking-[0.18em] select-none leading-none">SAMSUNG</span>
	}
	return null
}

function getColorHexFallback(colorName: string | null): string {
	if (!colorName) return '#cccccc'
	const name = colorName.toLowerCase().trim()
	
	if (name.includes('gold')) return '#f4e0c8'
	if (name.includes('silver')) return '#e3e4e5'
	if (name.includes('space gray') || name.includes('space grey')) return '#53565a'
	if (name.includes('gray') || name.includes('grey')) return '#8e8e93'
	if (name.includes('black') || name.includes('midnight') || name.includes('graphite') || name.includes('dark')) return '#1a1a1c'
	if (name.includes('white') || name.includes('starlight')) return '#f9f6ef'
	if (name.includes('blue') || name.includes('sierra')) return '#a7c7e7'
	if (name.includes('green') || name.includes('alpine')) return '#5f7c68'
	if (name.includes('red') || name.includes('product')) return '#e11d48'
	if (name.includes('purple') || name.includes('deep')) return '#5a4d6e'
	if (name.includes('yellow')) return '#ffe082'
	if (name.includes('rose')) return '#fadadd'
	if (name.includes('bronze')) return '#cd7f32'
	
	return name
}

export function ProductCard({ product }: { product: Product }) {
	const image = primaryImage(product)
	const hasVariants = (product.product_variants ?? []).length > 0
	const outOfStock = hasVariants && totalStock(product) === 0
	const href = product.is_wholesale ? `/wholesale/${product.id}` : `/products/${product.id}`
	
	const basePrice = Number(product.base_price)
	const originalPrice = getOriginalPrice(basePrice, product.name)
	const hasDiscount = originalPrice !== null && originalPrice > basePrice

	const [isWishlisted, setIsWishlisted] = useState(false)

	useEffect(() => {
		const wishlist = getWishlist()
		setIsWishlisted(wishlist.includes(product.id))
	}, [product.id])

	const uniqueColors = (product.product_variants ?? []).reduce((acc: { color: string; swatch_hex?: string | null }[], variant) => {
		if (variant.color && !acc.some((item) => item.color.toLowerCase() === variant.color?.toLowerCase())) {
			acc.push({ color: variant.color, swatch_hex: variant.swatch_hex })
		}
		return acc
	}, [])

	const toggleWishlist = (e: React.MouseEvent) => {
		e.preventDefault()
		e.stopPropagation()
		
		const wishlist = getWishlist()
		let newWishlist: string[]
		if (wishlist.includes(product.id)) {
			newWishlist = wishlist.filter(id => id !== product.id)
		} else {
			newWishlist = [...wishlist, product.id]
		}
		localStorage.setItem('cellkore-wishlist', JSON.stringify(newWishlist))
		setIsWishlisted(newWishlist.includes(product.id))
		window.dispatchEvent(new Event('cellkore-cart-change'))
	}

	return (
		<Link href={href} className="group block">
			<div className="bg-white dark:bg-zinc-950 border border-border/80 hover:border-primary/40 rounded-2xl shadow-[0_2px_12px_rgba(0,0,0,0.015)] hover:shadow-[0_20px_45px_-10px_rgba(0,0,0,0.05)] hover:-translate-y-1.5 transition-all duration-500 flex flex-col h-full overflow-hidden">
				
				{/* Image Container with subtle gradient background to add depth */}
				<div className="relative aspect-square bg-gradient-to-b from-stone-100/40 to-stone-50/10 dark:from-zinc-900/40 dark:to-zinc-900/10 flex items-center justify-center p-6 overflow-hidden border-b border-border/40">
					{image ? (
						<img
							src={image}
							alt={product.name}
							className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-[1.04]"
							loading="lazy"
						/>
					) : (
						<div className="w-full h-full flex items-center justify-center">
							<Smartphone className="w-8 h-8 text-muted-foreground/30" />
						</div>
					)}
					
					{/* Status Badges Group */}
					<div className="absolute top-3 left-3 flex flex-col gap-1 z-10">
						<span className={`px-2.5 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-wider shadow-sm ${
							CONDITION_CLASSES[product.condition] ?? 'bg-background/90 text-foreground border-border/50'
						}`}>
							{CONDITION_LABELS[product.condition] ?? product.condition}
						</span>
						{outOfStock && (
							<span className="px-2.5 py-0.5 rounded-full bg-red-500/10 border border-red-500/20 text-red-600 text-[8px] font-bold uppercase tracking-wider shadow-sm">
								{product.is_wholesale ? 'Sold Out' : 'Out of Stock'}
							</span>
						)}
					</div>

					{/* Add to Wishlist Button */}
					<button
						onClick={toggleWishlist}
						className={`absolute top-3 right-3 p-2 rounded-full border transition-all duration-300 shadow-sm cursor-pointer z-10 hover:scale-105 ${
							isWishlisted
								? 'bg-rose-50/90 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 text-rose-600'
								: 'bg-background/90 border-border/50 text-muted-foreground/70 hover:text-rose-600 hover:border-rose-200'
						}`}
						aria-label="Toggle Wishlist"
					>
						<Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-rose-600' : ''}`} />
					</button>
				</div>

				{/* Info Container */}
				<div className="p-4 flex flex-col flex-1 text-center">
					{product.brand && (
						<p className="text-[8px] uppercase tracking-[0.2em] font-semibold text-primary mb-1">{product.brand}</p>
					)}
					<h3 className="text-xs md:text-sm font-semibold text-foreground/80 tracking-wide leading-snug group-hover:text-primary transition-colors line-clamp-2 min-h-[2.5rem] flex items-center justify-center">
						{product.name}
					</h3>
					
					{/* Rating stars */}
					<div className="flex justify-center gap-0.5 text-amber-400 text-[10px] my-1.5 select-none">
						<span>★</span><span>★</span><span>★</span><span>★</span><span className="text-amber-200 dark:text-zinc-700">★</span>
					</div>

					{/* Color Swatches */}
					{uniqueColors.length > 0 && (
						<div className="flex justify-center gap-1.5 mb-2.5 mt-1">
							{uniqueColors.slice(0, 5).map((variant, index) => {
								const colorHex = variant.swatch_hex || getColorHexFallback(variant.color)
								return (
									<span
										key={index}
										title={variant.color}
										className="w-3 h-3 rounded-full border border-border/60 shadow-[0_1px_3px_rgba(0,0,0,0.05)] transition-transform duration-200 hover:scale-125"
										style={{ backgroundColor: colorHex }}
									/>
								)
							})}
							{uniqueColors.length > 5 && (
								<span className="text-[9px] text-muted-foreground font-semibold leading-none self-center">
									+{uniqueColors.length - 5}
								</span>
							)}
						</div>
					)}
					
					{/* Price & Brand Icon */}
					<div className="mt-auto pt-3 flex items-center justify-between border-t border-border/40">
						<div className="flex items-baseline gap-1.5">
							<span className="text-sm md:text-[17px] font-bold text-emerald-600 dark:text-emerald-500 tracking-tight">
								${basePrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
							</span>
							{hasDiscount && (
								<span className="text-[10px] md:text-xs text-muted-foreground line-through decoration-muted-foreground/60 font-medium">
									${originalPrice.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
								</span>
							)}
						</div>
						<div className="flex items-center">
							{getBrandIcon(product.brand)}
						</div>
					</div>
				</div>

			</div>
		</Link>
	)
}
