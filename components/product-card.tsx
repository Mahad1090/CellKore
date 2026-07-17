'use client'

import Link from 'next/link'
import { MapPin, Smartphone } from 'lucide-react'
import type { Product } from '@/lib/types'
import { primaryImage, totalStock } from '@/lib/types'

const CONDITION_LABELS: Record<string, string> = {
	new: 'New',
	used: 'Used',
	refurbished: 'Refurbished',
}

export function ProductCard({ product }: { product: Product }) {
	const image = primaryImage(product)
	const hasVariants = (product.product_variants ?? []).length > 0
	const outOfStock = hasVariants && totalStock(product) === 0
	const href = product.is_wholesale ? `/wholesale/${product.id}` : `/products/${product.id}`

	return (
		<Link href={href} className="group block">
			<div className="border-beam-container h-full">
				<div className="border-beam-glow" />
				<div className="border-beam-inner overflow-hidden flex flex-col h-full">
					<div className="relative aspect-square bg-muted overflow-hidden">
						{image ? (
							<img
								src={image}
								alt={product.name}
								className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
								loading="lazy"
							/>
						) : (
							<div className="w-full h-full flex items-center justify-center">
								<Smartphone className="w-10 h-10 text-muted-foreground/40" />
							</div>
						)}
						<span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-background/90 backdrop-blur border border-border text-[9px] font-semibold uppercase tracking-[0.14em] text-foreground/80">
							{CONDITION_LABELS[product.condition] ?? product.condition}
						</span>
						{outOfStock && (
							<span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-destructive text-white text-[9px] font-semibold uppercase tracking-[0.14em]">
								{product.is_wholesale ? 'Sold Out' : 'Out of Stock'}
							</span>
						)}
					</div>
					<div className="p-5 flex flex-col flex-1">
						{product.brand && (
							<p className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5">{product.brand}</p>
						)}
						<h3 className="text-sm font-medium text-card-foreground leading-snug group-hover:text-primary transition-colors line-clamp-2">
							{product.name}
						</h3>
						<div className="mt-auto pt-3 flex items-end justify-between gap-2">
							<span className="text-base font-semibold text-card-foreground">
								${Number(product.base_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
							</span>
							{product.location && (
								<span className="flex items-center gap-1 text-[10px] text-muted-foreground">
									<MapPin className="w-3 h-3" />
									{product.location}
								</span>
							)}
						</div>
					</div>
				</div>
			</div>
		</Link>
	)
}
