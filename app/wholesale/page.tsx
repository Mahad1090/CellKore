'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, Tag, Truck, ShieldCheck } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { GridShimmer } from '@/components/shimmer'
import { useMarketplace } from '@/contexts/marketplace-context'
import { fetchWholesaleLots } from '@/lib/data'
import type { Product } from '@/lib/types'
import { primaryImage, totalStock } from '@/lib/types'

const PERKS = [
	{ icon: Package, title: 'Manifested Lots', text: 'Full inventory manifests before you commit' },
	{ icon: Tag, title: 'Tiered Pricing', text: 'Price breaks that scale with quantity' },
	{ icon: Truck, title: 'Freight Ready', text: 'Palletized and shipped across US & Canada' },
	{ icon: ShieldCheck, title: 'Certified Grading', text: 'Every unit tested and graded' },
]

export default function WholesalePage() {
	const { marketplace, loading: marketLoading } = useMarketplace()
	const [lots, setLots] = useState<Product[] | null>(null)

	useEffect(() => {
		if (marketLoading) return
		setLots(null)
		fetchWholesaleLots(marketplace)
			.then(setLots)
			.catch(() => setLots([]))
	}, [marketplace, marketLoading])

	return (
		<main className="min-h-screen bg-background">
			<Navigation />

			<section className="relative text-white w-full min-h-[350px] py-16 sm:py-20 overflow-hidden flex items-center">
				<video
					autoPlay
					loop
					muted
					playsInline
					preload="auto"
					src="/bulk_banner.mp4"
					className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none z-0"
				/>
				<div className="absolute inset-0 bg-black/60 z-10" />
				<div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
					<p className="text-sm uppercase tracking-[0.25em] text-white/80 mb-3">Wholesale</p>
					<h1 className="text-3xl md:text-5xl font-bold tracking-luxury uppercase text-white drop-shadow-md">Bulk Device Lots</h1>
					<p className="text-white/90 mt-4 text-base md:text-lg font-light max-w-2xl leading-relaxed drop-shadow-sm">
						Manifested wholesale lots with transparent bulk pricing tiers. All wholesale transactions are final.
					</p>
				</div>
			</section>

			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
				<div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
					{PERKS.map((perk) => (
						<div key={perk.title} className="bg-card border border-border rounded-2xl p-5 flex items-start gap-3 hover:border-primary transition-colors">
							<perk.icon className="w-5 h-5 text-primary shrink-0 mt-0.5" />
							<div>
								<p className="text-xs font-bold uppercase tracking-[0.12em] text-card-foreground">{perk.title}</p>
								<p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{perk.text}</p>
							</div>
						</div>
					))}
				</div>

				<h2 className="text-2xl font-bold text-foreground tracking-luxury uppercase mb-8">Available Lots</h2>

				{lots === null ? (
					<GridShimmer count={6} />
				) : lots.length === 0 ? (
					<div className="text-center py-24 border border-dashed border-border rounded-3xl">
						<p className="text-muted-foreground text-sm">No wholesale lots are currently listed for this marketplace.</p>
					</div>
				) : (
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
						{lots.map((lot) => {
							const image = primaryImage(lot)
							const units = totalStock(lot)
							const soldOut = (lot.product_variants ?? []).length > 0 && units === 0
							return (
								<Link key={lot.id} href={`/wholesale/${lot.id}`} className="group block">
									<div className="border-beam-container h-full">
										<div className="border-beam-glow" />
										<div className="border-beam-inner overflow-hidden flex flex-col h-full">
											<div className="relative aspect-[4/3] bg-muted overflow-hidden">
												{image ? (
													<img
														src={image}
														alt={lot.name}
														className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
														loading="lazy"
													/>
												) : (
													<div className="w-full h-full flex items-center justify-center">
														<Package className="w-12 h-12 text-muted-foreground/30" />
													</div>
												)}
												<span className="absolute top-3 left-3 px-3 py-1 rounded-full bg-background/90 backdrop-blur border border-border text-[9px] font-semibold uppercase tracking-[0.14em] text-foreground/80 capitalize">
													{lot.condition}
												</span>
												{soldOut && (
													<span className="absolute top-3 right-3 px-3 py-1 rounded-full bg-destructive text-white text-[9px] font-semibold uppercase tracking-[0.14em]">
														Sold Out
													</span>
												)}
											</div>
											<div className="p-6 flex flex-col flex-1">
												<h3 className="text-base font-medium text-card-foreground group-hover:text-primary transition-colors leading-snug">
													{lot.name}
												</h3>
												<div className="mt-auto pt-4 flex items-end justify-between">
													<div>
														<p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Lot Price</p>
														<p className="text-xl font-bold text-card-foreground">
															${Number(lot.base_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
														</p>
													</div>
													{units > 0 && (
														<div className="text-right">
															<p className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Units</p>
															<p className="text-sm font-semibold text-card-foreground">{units}</p>
														</div>
													)}
												</div>
											</div>
										</div>
									</div>
								</Link>
							)
						})}
					</div>
				)}
			</section>

			<Footer />
		</main>
	)
}
