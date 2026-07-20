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
	FileCheck2,
	Boxes,
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

const TRUST_POINTS = [
	{ icon: FileCheck2, text: 'Manifest is fixed and verified — the units listed are exactly what ships.' },
	{ icon: Boxes, text: 'Bulk invoice and packing documentation included for resale/import.' },
	{ icon: Truck, text: 'Ships in sealed, palletized packaging within 2 business days of payment.' },
]

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
				<Link
					href="/wholesale"
					className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-primary transition-colors mb-6 sm:mb-8"
				>
					<ArrowLeft className="w-3.5 h-3.5" />
					All Wholesale Lots
				</Link>

				{/* Mobile-only: title + CTA up top so the action is reachable without scrolling past the gallery */}
				<div className="lg:hidden mb-6">
					<h1 className="text-2xl font-bold text-foreground tracking-luxury capitalize mb-4">{lot.name}</h1>
					<button
						onClick={handleCheckout}
						disabled={soldOut}
						className={`w-full py-3.5 rounded-full text-xs font-bold uppercase tracking-[0.18em] transition-all ${
							soldOut
								? 'bg-muted text-muted-foreground cursor-not-allowed'
								: 'bg-primary text-primary-foreground hover:opacity-90 active:scale-95 cursor-pointer shadow-lg'
						}`}
					>
						{soldOut ? 'Sold Out' : `Proceed to Checkout — $${unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
					</button>
				</div>

				<div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
					{/* Left: gallery, specs, purchase card */}
					<div className="lg:col-span-2">
						{/* Gallery */}
						<div className="aspect-[4/3] bg-muted rounded-3xl overflow-hidden mb-3 border border-border">
							{activeImage ? (
								<img src={activeImage} alt={lot.name} className="w-full h-full object-cover" />
							) : (
								<div className="w-full h-full flex items-center justify-center">
									<Package className="w-16 h-16 text-muted-foreground/30" />
								</div>
							)}
						</div>
						{images.length > 1 && (
							<div className="flex gap-2.5 mb-6 overflow-x-auto no-scrollbar">
								{images.map((img) => (
									<button
										key={img.id}
										onClick={() => setActiveImage(img.image_url)}
										className={`w-16 h-16 rounded-xl overflow-hidden border-2 shrink-0 transition-colors cursor-pointer ${
											activeImage === img.image_url ? 'border-primary' : 'border-border hover:border-primary/50'
										}`}
									>
										<img src={img.image_url} alt="" className="w-full h-full object-cover" />
									</button>
								))}
							</div>
						)}
						{images.length <= 1 && <div className="mb-6" />}

						<h1 className="hidden lg:block text-2xl md:text-3xl font-bold text-foreground tracking-luxury mb-4 capitalize">
							{lot.name}
						</h1>

						{/* Spec grid */}
						<div className="grid grid-cols-2 gap-2.5 mb-6">
							{specChips.map(({ icon: Icon, label, value }) => (
								<div
									key={label}
									className="flex items-center gap-3 rounded-2xl border border-border bg-secondary/60 px-3.5 py-3"
								>
									{label === 'Color' && colorSwatches.length > 0 ? (
										<div className="flex items-center -space-x-1.5 shrink-0">
											{colorSwatches.slice(0, 3).map(([color, hex]) => (
												<span
													key={color}
													className="w-4 h-4 rounded-full border-2 border-secondary shadow-sm"
													style={{ backgroundColor: hex }}
													title={color}
												/>
											))}
											{colorSwatches.length > 3 && (
												<span className="w-4 h-4 rounded-full border-2 border-secondary bg-muted-foreground/20 flex items-center justify-center text-[7px] font-bold text-foreground/70">
													+{colorSwatches.length - 3}
												</span>
											)}
										</div>
									) : (
										<div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
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

						{lot.description && (
							<p className="text-sm text-foreground/75 leading-relaxed mb-8">{lot.description}</p>
						)}

						{/* Purchase card */}
						<div className="bg-card border border-border rounded-3xl p-6 shadow-sm lg:sticky lg:top-28">
							<p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1.5">
								Lot Price
							</p>
							<p className="text-3xl font-bold text-primary tracking-tight mb-1">
								${unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
							</p>
							<p className="text-xs text-muted-foreground mb-6">
								For the entire lot of {units} unit{units === 1 ? '' : 's'} — sold as one fixed bundle.
							</p>

							<button
								onClick={handleCheckout}
								disabled={soldOut}
								className={`w-full py-4 rounded-full text-xs font-bold uppercase tracking-[0.18em] transition-all ${
									soldOut
										? 'bg-muted text-muted-foreground cursor-not-allowed'
										: 'bg-primary text-primary-foreground hover:opacity-90 hover:scale-[1.01] active:scale-95 cursor-pointer shadow-lg shadow-primary/20'
								}`}
							>
								{soldOut ? 'Sold Out' : 'Proceed to Checkout'}
							</button>

							<div className="flex items-start gap-2 mt-4 px-1">
								<Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
								<p className="text-[11px] text-muted-foreground leading-relaxed">{FINAL_SALE_NOTICE}</p>
							</div>
						</div>
					</div>

					{/* Right: manifest + trust */}
					<div className="lg:col-span-3 space-y-8">
						<div>
							<h2 className="text-lg font-bold text-foreground tracking-luxury uppercase mb-4">
								Manifest Inventory
							</h2>
							<div className="border border-border rounded-3xl overflow-hidden overflow-x-auto">
								<table className="w-full text-sm min-w-[560px]">
									<thead>
										<tr className="bg-secondary text-left">
											{['', 'Model', 'Storage', 'Lock', 'Grade', 'Qty', 'Color'].map((h, i) => (
												<th
													key={i}
													className="px-3 py-3.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70 first:pl-4"
												>
													{h}
												</th>
											))}
										</tr>
									</thead>
									<tbody className="divide-y divide-border">
										{variants.length > 0 ? (
											variants.map((variant) => (
												<tr key={variant.id} className="hover:bg-muted/50 transition-colors">
													<td className="pl-4 pr-2 py-3">
														<div className="w-10 h-10 rounded-lg overflow-hidden bg-muted border border-border shrink-0">
															{variant.image_url ? (
																<img src={variant.image_url} alt="" className="w-full h-full object-cover" />
															) : (
																<div className="w-full h-full flex items-center justify-center">
																	<Package className="w-4 h-4 text-muted-foreground/40" />
																</div>
															)}
														</div>
													</td>
													<td className="px-3 py-3 font-medium text-foreground whitespace-nowrap">
														{variant.model_name ?? (lot.brand ? `${lot.brand} ${lot.name}` : lot.name)}
													</td>
													<td className="px-3 py-3 text-foreground/75 whitespace-nowrap">{variant.storage ?? specValue('Storage Capacity')}</td>
													<td className="px-3 py-3 text-foreground/75 capitalize whitespace-nowrap">{variant.carrier_lock ?? '—'}</td>
													<td className="px-3 py-3 text-foreground/75 capitalize whitespace-nowrap">
														{variant.condition ?? (specValue('Grade') !== '—' ? specValue('Grade') : lot.condition)}
													</td>
													<td className="px-3 py-3 font-semibold text-foreground">{variant.stock_quantity}</td>
													<td className="px-3 py-3 text-foreground/75 whitespace-nowrap">
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
											<tr>
												<td className="pl-4 pr-2 py-3">
													<div className="w-10 h-10 rounded-lg overflow-hidden bg-muted border border-border shrink-0" />
												</td>
												<td className="px-3 py-3 font-medium text-foreground whitespace-nowrap">
													{lot.brand ? `${lot.brand} ` : ''}{lot.name}
												</td>
												<td className="px-3 py-3 text-foreground/75">{specValue('Storage Capacity')}</td>
												<td className="px-3 py-3 text-foreground/75">—</td>
												<td className="px-3 py-3 text-foreground/75 capitalize">{lot.condition}</td>
												<td className="px-3 py-3 font-semibold text-foreground">—</td>
												<td className="px-3 py-3 text-foreground/75">{lotColors.join(', ') || '—'}</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
						</div>

						{/* Trust / what's included */}
						<div className="border border-border rounded-3xl p-6 bg-secondary/40">
							<h2 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground mb-4">
								What's Included
							</h2>
							<div className="space-y-3.5">
								{TRUST_POINTS.map(({ icon: Icon, text }) => (
									<div key={text} className="flex items-start gap-3">
										<div className="w-7 h-7 rounded-lg bg-card border border-border text-primary flex items-center justify-center shrink-0">
											<Icon className="w-3.5 h-3.5" />
										</div>
										<p className="text-xs text-foreground/75 leading-relaxed pt-1">{text}</p>
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
