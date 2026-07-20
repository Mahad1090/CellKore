'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Package, AlertTriangle, Minus, Plus } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { DetailShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { fetchProductById, fetchWholesaleTiers, fetchWholesaleColors } from '@/lib/data'
import { addToLocalCart } from '@/lib/cart'
import type { Product, WholesalePriceTier } from '@/lib/types'
import { primaryImage, totalStock } from '@/lib/types'

const FINAL_SALE_NOTICE = 'Returns and Exchanges are not supported. All wholesale transactions are final.'

export default function WholesaleDetailPage() {
	const params = useParams()
	const router = useRouter()
	const { toast } = useToast()
	const id = typeof params.id === 'string' ? params.id : ''

	const [lot, setLot] = useState<Product | null | undefined>(undefined)
	const [tiers, setTiers] = useState<WholesalePriceTier[]>([])
	const [lotColors, setLotColors] = useState<string[]>([])
	const [quantity, setQuantity] = useState(1)

	useEffect(() => {
		if (!id) return
		Promise.all([fetchProductById(id), fetchWholesaleTiers(id), fetchWholesaleColors(id)])
			.then(([product, priceTiers, colors]) => {
				setLot(product)
				setTiers(priceTiers)
				setLotColors(colors)
				if (priceTiers.length > 0) setQuantity(priceTiers[0].min_quantity)
			})
			.catch(() => setLot(null))
	}, [id])

	const specValue = (name: string) =>
		(lot?.product_specifications ?? []).find(
			(s) => s.spec_name.toLowerCase() === name.toLowerCase()
		)?.spec_value ?? '—'

	const activeTier = useMemo(
		() =>
			tiers.find(
				(t) => quantity >= t.min_quantity && (t.max_quantity == null || quantity <= t.max_quantity)
			),
		[tiers, quantity]
	)

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
	const units = totalStock(lot)
	const soldOut = variants.length > 0 && units === 0
	const image = primaryImage(lot)
	const unitPrice = activeTier ? Number(activeTier.price_per_unit) : Number(lot.base_price)

	const handleCheckout = () => {
		if (soldOut) return
		addToLocalCart({ productId: lot.id, variantId: variants[0]?.id ?? null, quantity })
		toast({ title: 'Lot added to cart', description: `${lot.name} × ${quantity} units`, variant: 'success' })
		router.push('/checkout')
	}

	return (
		<main className="min-h-screen bg-background">
			<Navigation />

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<Link
					href="/wholesale"
					className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted-foreground hover:text-primary transition-colors mb-8"
				>
					<ArrowLeft className="w-3.5 h-3.5" />
					All Wholesale Lots
				</Link>

				<div className="grid lg:grid-cols-5 gap-10">
					{/* Lot overview */}
					<div className="lg:col-span-2">
						<div className="aspect-[4/3] bg-muted rounded-3xl overflow-hidden mb-6">
							{image ? (
								<img src={image} alt={lot.name} className="w-full h-full object-cover" />
							) : (
								<div className="w-full h-full flex items-center justify-center">
									<Package className="w-16 h-16 text-muted-foreground/30" />
								</div>
							)}
						</div>

						<h1 className="text-2xl md:text-3xl font-bold text-foreground mb-3">{lot.name}</h1>
						<div className="flex items-center gap-3 mb-6">
							<span className="px-3 py-1 rounded-full bg-secondary text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/80 capitalize">
								{lot.condition}
							</span>
							{units > 0 && (
								<span className="text-xs text-muted-foreground">{units} units in lot</span>
							)}
						</div>
						{lot.description && (
							<p className="text-sm text-foreground/75 leading-relaxed mb-8">{lot.description}</p>
						)}

						{/* Checkout box */}
						<div className="bg-card border border-border rounded-3xl p-6">
							<div className="flex items-end justify-between mb-5">
								<div>
									<p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Unit Price</p>
									<p className="text-2xl font-bold text-primary">
										${unitPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
									</p>
								</div>
								<div className="text-right">
									<p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Total</p>
									<p className="text-xl font-bold text-card-foreground">
										${(unitPrice * quantity).toLocaleString(undefined, { minimumFractionDigits: 2 })}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-3 mb-5">
								<span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Quantity</span>
								<div className="flex items-center border border-border rounded-full overflow-hidden ml-auto">
									<button
										onClick={() => setQuantity((q) => Math.max(1, q - 1))}
										className="p-2.5 hover:bg-muted transition-colors cursor-pointer"
										aria-label="Decrease quantity"
									>
										<Minus className="w-3.5 h-3.5" />
									</button>
									<input
										type="number"
										min={1}
										value={quantity}
										onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
										className="w-16 text-center text-sm font-semibold bg-transparent focus:outline-none"
									/>
									<button
										onClick={() => setQuantity((q) => q + 1)}
										className="p-2.5 hover:bg-muted transition-colors cursor-pointer"
										aria-label="Increase quantity"
									>
										<Plus className="w-3.5 h-3.5" />
									</button>
								</div>
							</div>

							<button
								onClick={handleCheckout}
								disabled={soldOut}
								className={`w-full py-3.5 rounded-full text-xs font-bold uppercase tracking-[0.18em] transition-all ${
									soldOut
										? 'bg-muted text-muted-foreground cursor-not-allowed'
										: 'bg-primary text-primary-foreground hover:opacity-90 hover:scale-[1.01] active:scale-95 cursor-pointer shadow-lg'
								}`}
							>
								{soldOut ? 'Sold Out' : 'Proceed to Checkout'}
							</button>

							<div className="flex items-start gap-2.5 mt-5 p-4 bg-secondary rounded-2xl">
								<AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
								<p className="text-[11px] text-foreground/75 leading-relaxed">{FINAL_SALE_NOTICE}</p>
							</div>
						</div>
					</div>

					{/* Manifest + tiers */}
					<div className="lg:col-span-3 space-y-10">
						{/* Manifest inventory table */}
						<div>
							<h2 className="text-lg font-bold text-foreground tracking-luxury uppercase mb-4">
								Manifest Inventory
							</h2>
							<div className="border border-border rounded-3xl overflow-hidden overflow-x-auto">
								<table className="w-full text-sm min-w-[640px]">
									<thead>
										<tr className="bg-secondary text-left">
											{['Model', 'Storage Capacity', 'Lock Status', 'Grade', 'Quantity', 'Color'].map((h) => (
												<th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/80">
													{h}
												</th>
											))}
										</tr>
									</thead>
									<tbody>
										{variants.length > 0 ? (
											variants.map((variant, index) => (
												<tr key={variant.id} className={index % 2 === 1 ? 'bg-muted/40' : ''}>
													<td className="px-5 py-3.5 font-medium text-foreground">
														{variant.model_name ?? (lot.brand ? `${lot.brand} ${lot.name}` : lot.name)}
													</td>
													<td className="px-5 py-3.5 text-foreground/75">{variant.storage ?? specValue('Storage Capacity')}</td>
													<td className="px-5 py-3.5 text-foreground/75 capitalize">{variant.carrier_lock ?? '—'}</td>
													<td className="px-5 py-3.5 text-foreground/75 capitalize">
														{variant.condition ?? (specValue('Grade') !== '—' ? specValue('Grade') : lot.condition)}
													</td>
													<td className="px-5 py-3.5 font-semibold text-foreground">{variant.stock_quantity}</td>
													<td className="px-5 py-3.5 text-foreground/75">{variant.color ?? '—'}</td>
												</tr>
											))
										) : (
											<tr>
												<td className="px-5 py-3.5 font-medium text-foreground">
													{lot.brand ? `${lot.brand} ` : ''}{lot.name}
												</td>
												<td className="px-5 py-3.5 text-foreground/75">{specValue('Storage Capacity')}</td>
												<td className="px-5 py-3.5 text-foreground/75">—</td>
												<td className="px-5 py-3.5 text-foreground/75 capitalize">{lot.condition}</td>
												<td className="px-5 py-3.5 font-semibold text-foreground">—</td>
												<td className="px-5 py-3.5 text-foreground/75">{lotColors.join(', ') || '—'}</td>
											</tr>
										)}
									</tbody>
								</table>
							</div>
							{lotColors.length > 0 && variants.length > 0 && (
								<p className="text-xs text-muted-foreground mt-3">
									Lot colors: {lotColors.join(', ')}
								</p>
							)}
						</div>

						{/* Bulk pricing tiers */}
						<div>
							<h2 className="text-lg font-bold text-foreground tracking-luxury uppercase mb-4">
								Bulk Pricing Tiers
							</h2>
							{tiers.length === 0 ? (
								<div className="border border-dashed border-border rounded-3xl p-10 text-center">
									<p className="text-sm text-muted-foreground">
										No quantity price breaks — the lot price applies to all quantities.
									</p>
								</div>
							) : (
								<div className="border border-border rounded-3xl overflow-hidden">
									<table className="w-full text-sm">
										<thead>
											<tr className="bg-secondary text-left">
												<th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/80">Quantity Range</th>
												<th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/80">Price Per Unit</th>
											</tr>
										</thead>
										<tbody>
											{tiers.map((tier, index) => {
												const isActive = activeTier?.id === tier.id
												return (
													<tr
														key={tier.id}
														className={`transition-colors ${isActive ? 'bg-primary/5' : index % 2 === 1 ? 'bg-muted/40' : ''}`}
													>
														<td className="px-5 py-3.5">
															<span className={isActive ? 'font-semibold text-primary' : 'text-foreground/80'}>
																{tier.min_quantity}
																{tier.max_quantity == null ? '+' : ` – ${tier.max_quantity}`} units
															</span>
															{isActive && (
																<span className="ml-2 px-2 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold uppercase tracking-wider">
																	Your Tier
																</span>
															)}
														</td>
														<td className={`px-5 py-3.5 font-semibold ${isActive ? 'text-primary' : 'text-foreground'}`}>
															${Number(tier.price_per_unit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
														</td>
													</tr>
												)
											})}
										</tbody>
									</table>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>

			<Footer />
		</main>
	)
}
