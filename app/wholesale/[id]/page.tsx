'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
	ArrowLeft,
	Package,
	Info,
	Layers,
	Lock,
	Unlock,
	Palette,
	HardDrive,
	ShieldCheck,
	Truck,
} from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { DetailShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { fetchProductById, fetchWholesaleColors } from '@/lib/data'
import { addToLocalCart } from '@/lib/cart'
import type { Product } from '@/lib/types'
import { totalStock } from '@/lib/types'

const FINAL_SALE_NOTICE = 'Returns and exchanges are not supported — all wholesale transactions are final.'

export default function WholesaleDetailPage() {
	const params = useParams()
	const router = useRouter()
	const { toast } = useToast()
	const id = typeof params.id === 'string' ? params.id : ''

	const [lot, setLot] = useState<Product | null | undefined>(undefined)
	const [lotColors, setLotColors] = useState<string[]>([])
	const [activeImage, setActiveImage] = useState<string | null>(null)

	useEffect(() => {
		if (!id) return
		Promise.all([fetchProductById(id), fetchWholesaleColors(id)])
			.then(([product, colors]) => {
				setLot(product)
				setLotColors(colors)
				const images = [...(product?.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)
				const primary = images.find((i) => i.is_primary) ?? images[0]
				setActiveImage(primary?.image_url ?? null)
			})
			.catch(() => setLot(null))
	}, [id])

	const specValue = (name: string) =>
		(lot?.product_specifications ?? []).find(
			(s) => s.spec_name.toLowerCase() === name.toLowerCase()
		)?.spec_value ?? '—'

	if (lot === undefined) {
		return (
			<main className="min-h-screen bg-background">
				<Navigation />
				<DetailShimmer />
				<Footer />
			</main>
		)
	}

	if (lot === null || !lot.is_wholesale) {
		return (
			<main className="min-h-screen bg-background">
				<Navigation />
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
					<h1 className="text-3xl font-bold text-foreground mb-4">Lot Not Found</h1>
					<Link href="/wholesale" className="text-primary hover:underline text-sm">
						Back to Wholesale
					</Link>
				</div>
				<Footer />
			</main>
		)
	}

	const variants = lot.product_variants ?? []
	const images = [...(lot.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order)
	const units = totalStock(lot)
	const soldOut = variants.length > 0 && units === 0
	const unitPrice = Number(lot.base_price)

	// Aggregate quick-glance specs across all item rows, falling back to lot-level values.
	const distinctStorage = Array.from(new Set(variants.map((v) => v.storage).filter((s): s is string => !!s)))
	const storageLabel = distinctStorage.length > 0 ? distinctStorage.join(', ') : specValue('Storage Capacity')
	const distinctLocks = Array.from(new Set(variants.map((v) => v.carrier_lock).filter(Boolean)))
	const lockLabel =
		distinctLocks.length === 0 ? null : distinctLocks.length === 1 ? distinctLocks[0] : 'Mixed'
	const distinctConditions = Array.from(new Set(variants.map((v) => v.condition).filter(Boolean)))
	const conditionLabel = distinctConditions.length === 1 ? distinctConditions[0] : distinctConditions.length > 1 ? 'Mixed' : lot.condition
	const colorsLabel = lotColors.length > 0 ? lotColors.join(', ') : Array.from(new Set(variants.map((v) => v.color).filter(Boolean))).join(', ')
	const colorSwatches = Array.from(
		new Map(
			variants
				.filter((v): v is typeof v & { color: string } => !!v.color)
				.map((v) => [v.color, v.swatch_hex || '#cccccc'])
		).entries()
	)

	const specChips = [
		{ icon: ShieldCheck, label: 'Condition', value: conditionLabel },
		units > 0 ? { icon: Layers, label: 'Units in Lot', value: String(units) } : null,
		lockLabel ? { icon: lockLabel === 'locked' ? Lock : Unlock, label: 'Carrier Lock', value: lockLabel } : null,
		storageLabel !== '—' ? { icon: HardDrive, label: 'Storage', value: storageLabel } : null,
		colorsLabel ? { icon: Palette, label: 'Color', value: colorsLabel } : null,
	].filter((c): c is { icon: typeof ShieldCheck; label: string; value: string } => c !== null)

	const handleCheckout = () => {
		if (soldOut) return
		addToLocalCart({ productId: lot.id, variantId: variants[0]?.id ?? null, quantity: 1 })
		toast({ title: 'Lot added to cart', description: lot.name, variant: 'success' })
		router.push('/checkout')
	}

	return (
		<main className="min-h-screen bg-background">
			<Navigation />

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
				{/* Breadcrumb Navigation */}
				<nav className="text-[10px] sm:text-xs text-muted-foreground mb-6 uppercase tracking-[0.16em] flex items-center flex-wrap gap-y-1">
					<Link href="/" className="hover:text-primary transition-colors">Home</Link>
					<span className="mx-2 opacity-60">/</span>
					<Link href="/wholesale" className="hover:text-primary transition-colors">Wholesale</Link>
					<span className="mx-2 opacity-60">/</span>
					<span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-xs">{lot.name}</span>
				</nav>

				{/* Full-width Title & Subtitle */}
				<div className="mb-8">
					<h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-foreground tracking-tight capitalize mb-3">
						{lot.name}
					</h1>
					<div className="flex flex-wrap items-center gap-2.5 text-xs text-muted-foreground font-semibold uppercase tracking-[0.14em]">
						<span className="px-3 py-1 rounded-full bg-primary/10 text-primary font-bold">
							{units} Unit{units === 1 ? '' : 's'}
						</span>
						<span className="opacity-40">•</span>
						<span>Grade {conditionLabel}</span>
						{lockLabel && (
							<>
								<span className="opacity-40">•</span>
								<span>{lockLabel} Carrier</span>
							</>
						)}
					</div>
				</div>

				{/* Mobile-only CTA */}
				<div className="lg:hidden mb-6">
					<button
						onClick={handleCheckout}
						disabled={soldOut}
						className={`w-full py-4 rounded-full text-xs font-bold uppercase tracking-[0.18em] transition-all ${
							soldOut
								? 'bg-muted text-muted-foreground cursor-not-allowed'
								: 'bg-primary text-primary-foreground hover:opacity-90 active:scale-95 cursor-pointer shadow-lg'
						}`}
					>
						{soldOut ? 'Sold Out' : `Proceed to Checkout — $${unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
					</button>
				</div>

				<div className="grid lg:grid-cols-5 gap-8 lg:gap-10 items-start">
					{/* Left: gallery, specs, purchase card */}
					<div className="lg:col-span-2 space-y-6">
						{/* Gallery */}
						<div>
							<div className="relative aspect-[4/3] bg-muted rounded-3xl overflow-hidden mb-3 border border-primary/30 group flex items-center justify-center p-2">
								{activeImage ? (
									<img src={activeImage} alt={lot.name} className="w-full h-full object-contain group-hover:scale-102 transition-transform duration-500" />
								) : (
									<div className="w-full h-full flex items-center justify-center">
										<Package className="w-16 h-16 text-muted-foreground/30" />
									</div>
								)}
								<div className="absolute top-4 left-4 bg-background/90 backdrop-blur-md border border-border/80 text-foreground text-[9px] uppercase tracking-[0.16em] font-bold px-3 py-1.5 rounded-full shadow-sm flex items-center gap-1.5">
									<span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
									Verified Lot
								</div>
							</div>
							{images.length > 1 && (
								<div className="flex gap-2.5 overflow-x-auto no-scrollbar py-1">
									{images.map((img) => (
										<button
											key={img.id}
											onClick={() => setActiveImage(img.image_url)}
											className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-colors cursor-pointer bg-muted p-1 ${
												activeImage === img.image_url ? 'border-primary' : 'border-border hover:border-primary/50'
											}`}
										>
											<img src={img.image_url} alt="" className="w-full h-full object-contain" />
										</button>
									))}
								</div>
							)}
						</div>


						{/* Purchase card */}
						<div className="bg-card border border-primary/30 rounded-3xl p-6 shadow-md shadow-black/5 lg:sticky lg:top-28">
							<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
								Lot Price
							</p>
							<div className="flex items-baseline gap-2 mb-2">
								<span className="text-3xl font-extrabold text-primary tracking-tight">
									${unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
								</span>
								{units > 0 && (
									<span className="text-xs text-muted-foreground font-semibold">
										(${ (unitPrice / units).toFixed(2) } / unit)
									</span>
								)}
							</div>
							<p className="text-xs text-muted-foreground mb-6">
								For the entire lot of {units} unit{units === 1 ? '' : 's'} — sold as one fixed bundle.
							</p>

							<button
								onClick={handleCheckout}
								disabled={soldOut}
								className={`w-full py-4 rounded-full text-xs font-bold uppercase tracking-[0.2em] transition-all duration-300 shadow-lg ${
									soldOut
										? 'bg-muted text-muted-foreground cursor-not-allowed shadow-none'
										: 'bg-primary text-primary-foreground hover:bg-primary/95 hover:scale-[1.01] active:scale-95 cursor-pointer shadow-primary/15'
								}`}
							>
								{soldOut ? 'Sold Out' : 'Proceed to Checkout'}
							</button>

							<div className="flex items-start gap-2.5 mt-4 p-3 bg-secondary/40 border border-border/50 rounded-2xl">
								<Info className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
								<p className="text-[9px] text-foreground/75 leading-relaxed font-medium">{FINAL_SALE_NOTICE}</p>
							</div>
						</div>
					</div>

					{/* Right: manifest + description */}
					<div className="lg:col-span-3 space-y-8">
						<div>
							<h2 className="text-xs font-extrabold uppercase tracking-[0.2em] text-foreground mb-4 flex items-center gap-2.5 pb-2 border-b border-border/50">
								<Package className="w-4 h-4 text-primary" />
								Manifest Inventory
							</h2>
							<div className="border border-primary/30 rounded-3xl overflow-hidden overflow-x-auto bg-card shadow-sm">
								<table className="w-full text-sm min-w-[560px]">
									<thead>
										<tr className="bg-secondary text-left border-b border-border">
											{['', 'Model', 'Storage', 'Lock', 'Grade', 'Qty', 'Color'].map((h, i) => (
												<th
													key={i}
													className="px-3.5 py-4 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground first:pl-5"
												>
													{h}
												</th>
											))}
										</tr>
									</thead>
									<tbody className="divide-y divide-border">
										{variants.length > 0 ? (
											variants.map((variant) => (
												<tr key={variant.id} className="hover:bg-muted/30 transition-colors">
													<td className="pl-5 pr-2 py-3.5">
														<div className="w-10 h-10 rounded-lg overflow-hidden bg-muted border border-border shrink-0 flex items-center justify-center p-1">
															{variant.image_url ? (
																<img src={variant.image_url} alt="" className="w-full h-full object-contain" />
															) : (
																<Package className="w-4 h-4 text-muted-foreground/40" />
															)}
														</div>
													</td>
													<td className="px-3.5 py-3.5 font-bold text-foreground whitespace-nowrap">
														{variant.model_name ?? (lot.brand ? `${lot.brand} ${lot.name}` : lot.name)}
													</td>
													<td className="px-3.5 py-3.5 text-foreground/80 font-medium whitespace-nowrap">{variant.storage ?? specValue('Storage Capacity')}</td>
													<td className="px-3.5 py-3.5 text-foreground/80 font-medium capitalize whitespace-nowrap">{variant.carrier_lock ?? '—'}</td>
													<td className="px-3.5 py-3.5 text-foreground/80 font-medium capitalize whitespace-nowrap">
														{variant.condition ?? (specValue('Grade') !== '—' ? specValue('Grade') : lot.condition)}
													</td>
													<td className="px-3.5 py-3.5 font-bold text-foreground">{variant.stock_quantity}</td>
													<td className="px-3.5 py-3.5 text-foreground/80 font-medium whitespace-nowrap">
														{variant.color ? (
															<span className="inline-flex items-center gap-1.5">
																<span
																	className="w-3 h-3 rounded-full border border-black/10 shrink-0"
																	style={{ backgroundColor: variant.swatch_hex || '#cccccc' }}
																/>
																{variant.color}
															</span>
														) : (
															'—'
														)}
													</td>
												</tr>
											))
										) : (
											<tr className="hover:bg-muted/30 transition-colors">
												<td className="pl-5 pr-2 py-3.5">
													<div className="w-10 h-10 rounded-lg overflow-hidden bg-muted border border-border shrink-0" />
												</td>
												<td className="px-3.5 py-3.5 font-bold text-foreground whitespace-nowrap">
													{lot.brand ? `${lot.brand} ` : ''}{lot.name}
												</td>
												<td className="px-3.5 py-3.5 text-foreground/80 font-medium">{specValue('Storage Capacity')}</td>
												<td className="px-3.5 py-3.5 text-foreground/80 font-medium">—</td>
												<td className="px-3.5 py-3.5 text-foreground/80 font-medium capitalize">{lot.condition}</td>
												<td className="px-3.5 py-3.5 font-bold text-foreground">—</td>
												<td className="px-3.5 py-3.5 text-foreground/80 font-medium">{lotColors.join(', ') || '—'}</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>

						{/* Description Card */}
						{lot.description && (
							<div className="border border-primary/30 rounded-3xl p-7 bg-[#fdfdfd] shadow-sm">
								<h2 className="text-xs font-extrabold uppercase tracking-[0.2em] text-foreground mb-4 flex items-center gap-2.5 pb-2 border-b border-border/50">
									<Info className="w-4 h-4 text-primary" />
									Description
								</h2>
								<p className="text-xs sm:text-sm text-foreground/80 leading-relaxed font-medium whitespace-pre-line">
									{lot.description}
								</p>
							</div>
						)}

						{/* Specs Card */}
						<div className="border border-primary/30 rounded-3xl p-7 bg-[#fdfdfd] shadow-sm">
							<h2 className="text-xs font-extrabold uppercase tracking-[0.2em] text-foreground mb-4 flex items-center gap-2.5 pb-2 border-b border-border/50">
								<Layers className="w-4 h-4 text-primary" />
								Lot Specifications
							</h2>
							<div className="grid grid-cols-2 gap-2.5">
								{specChips.map(({ icon: Icon, label, value }) => (
									<div
										key={label}
										className="flex items-center gap-3 rounded-2xl border border-border/80 bg-secondary/30 px-3.5 py-3 hover:bg-secondary/60 hover:border-primary/30 transition-all duration-300 shadow-sm"
									>
										{label === 'Color' && colorSwatches.length > 0 ? (
											<div className="flex items-center -space-x-1.5 shrink-0">
												{colorSwatches.slice(0, 3).map(([color, hex]) => (
													<span
														key={color}
														className="w-4 h-4 rounded-full border-2 border-[#fdfdfd] shadow-sm"
														style={{ backgroundColor: hex }}
														title={color}
													/>
												))}
												{colorSwatches.length > 3 && (
													<span className="w-4 h-4 rounded-full border-2 border-[#fdfdfd] bg-muted-foreground/20 flex items-center justify-center text-[7px] font-bold text-foreground/70">
														+{colorSwatches.length - 3}
													</span>
												)}
											</div>
										) : (
											<div className="w-8 h-8 rounded-lg bg-primary/5 text-primary flex items-center justify-center shrink-0 border border-primary/10">
												<Icon className="w-4 h-4" />
											</div>
										)}
										<div className="min-w-0">
											<p className="text-[9px] font-bold uppercase tracking-[0.12em] text-muted-foreground leading-none">
												{label}
											</p>
											<p className="text-xs font-semibold text-foreground capitalize truncate mt-1">{value}</p>
										</div>
									</div>
								))}
							</div>
						</div>
					</div>
				</div>
			</div>

			<Footer />
		</main>
	)
}
