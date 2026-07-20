'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, Loader2, Pencil, Search, Layers } from 'lucide-react'
import { PageTitle, EmptyState, adminButton, adminButtonGhost, adminInput, Panel, StatusBadge } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import type { WholesalePriceTier, Category } from '@/lib/types'
import {
	WholesaleFormModal,
	wholesaleToForm,
	type WholesaleFormValue,
} from '@/components/admin/wholesale-form'
import { WholesaleLotWizard } from '@/components/admin/wholesale-wizard'

export default function AdminWholesalePage() {
	const { toast, confirm } = useToast()
	const { can } = useAdmin()
	
	const [lots, setLots] = useState<any[] | null>(null)
	const [categories, setCategories] = useState<Category[]>([])
	const [search, setSearch] = useState('')
	const [editing, setEditing] = useState<WholesaleFormValue | null>(null)
	const [wizardOpen, setWizardOpen] = useState(false)
	
	const [selectedLot, setSelectedLot] = useState<string>('')
	const [tiers, setTiers] = useState<WholesalePriceTier[] | null>(null)
	const [tierForm, setTierForm] = useState({ min_quantity: '', max_quantity: '', price_per_unit: '' })
	const [savingTier, setSavingTier] = useState(false)

	const loadLots = useCallback(() => {
		fetch('/api/admin/products?wholesale=true')
			.then((res) => res.json())
			.then((json) => {
				const list = json.products ?? []
				setLots(list)
				if (list.length > 0) {
					setSelectedLot((prev) => {
						const exists = list.some((l: any) => l.id === prev)
						return exists ? prev : list[0].id
					})
				} else {
					setSelectedLot('')
				}
			})
			.catch(() => setLots([]))
	}, [])

	useEffect(() => {
		loadLots()
		
		fetch('/api/admin/categories')
			.then((res) => res.json())
			.then((json) => setCategories(json.categories ?? []))
			.catch(() => setCategories([]))
	}, [loadLots])

	const loadTiers = useCallback(() => {
		if (!selectedLot) {
			setTiers([])
			return
		}
		setTiers(null)
		fetch(`/api/admin/wholesale-tiers?product_id=${selectedLot}`)
			.then((res) => res.json())
			.then((json) => setTiers(json.tiers ?? []))
			.catch(() => setTiers([]))
	}, [selectedLot])

	useEffect(loadTiers, [loadTiers])

	const openEdit = async (id: string) => {
		try {
			const res = await fetch(`/api/admin/products/${id}`)
			const json = await res.json()
			if (res.ok) {
				setEditing(wholesaleToForm(json.product))
			} else {
				throw new Error(json.error)
			}
		} catch (err) {
			toast({ title: 'Cannot load lot', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		}
	}

	const removeLot = async (lot: any) => {
		const ok = await confirm({
			title: 'Delete wholesale lot?',
			description: `"${lot.name}" and all of its tiers, variants, images, and specifications will be permanently removed.`,
			confirmLabel: 'Delete',
			destructive: true,
		})
		if (!ok) return
		try {
			const res = await fetch(`/api/admin/products/${lot.id}`, { method: 'DELETE' })
			if (res.ok) {
				toast({ title: 'Wholesale lot deleted', variant: 'success' })
				loadLots()
				if (selectedLot === lot.id) {
					setSelectedLot('')
				}
			} else {
				const json = await res.json()
				throw new Error(json.error ?? 'Delete failed')
			}
		} catch (err) {
			toast({ title: 'Delete failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		}
	}

	const addTier = async () => {
		setSavingTier(true)
		try {
			const res = await fetch('/api/admin/wholesale-tiers', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					product_id: selectedLot,
					min_quantity: Number(tierForm.min_quantity),
					max_quantity: tierForm.max_quantity === '' ? null : Number(tierForm.max_quantity),
					price_per_unit: Number(tierForm.price_per_unit),
				}),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Tier added', variant: 'success' })
			setTierForm({ min_quantity: '', max_quantity: '', price_per_unit: '' })
			loadTiers()
		} catch (err) {
			toast({ title: 'Cannot add tier', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSavingTier(false)
		}
	}

	const removeTier = async (tier: WholesalePriceTier) => {
		const ok = await confirm({
			title: 'Remove pricing tier?',
			description: `The ${tier.min_quantity}${tier.max_quantity ? `–${tier.max_quantity}` : '+'} bracket will be removed.`,
			confirmLabel: 'Remove',
			destructive: true,
		})
		if (!ok) return
		await fetch(`/api/admin/wholesale-tiers/${tier.id}`, { method: 'DELETE' })
		loadTiers()
	}

	const filteredLots = (lots ?? []).filter(
		(l) =>
			!search.trim() ||
			l.name.toLowerCase().includes(search.toLowerCase()) ||
			(l.sku ?? '').toLowerCase().includes(search.toLowerCase()) ||
			(l.brand ?? '').toLowerCase().includes(search.toLowerCase())
	)

	const writable = can('wholesale:write')
	const label = 'text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block'

	return (
		<div className="space-y-12">
			{/* Page Header */}
			<PageTitle 
				title="Wholesale Panel" 
				subtitle="Manage bulk/lot inventory listings and quantity-based pricing tiers"
				actions={
					writable && (
						<button onClick={() => setWizardOpen(true)} className={adminButton}>
							<Plus className="w-3.5 h-3.5" />
							Add Wholesale Lot
						</button>
					)
				}
			/>

			{/* Wholesale Lots Catalog Section */}
			<div className="space-y-6">
				<div className="flex flex-wrap items-center justify-between gap-4">
					<h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground">Wholesale Lot Listings</h2>
					<div className="relative w-full sm:max-w-xs">
						<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
						<input
							placeholder="Search lots by name, SKU..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className={`${adminInput} pl-10 py-2`}
						/>
					</div>
				</div>

				{lots === null ? (
					<TableShimmer />
				) : filteredLots.length === 0 ? (
					<EmptyState message="No wholesale lots found." />
				) : (
					<div className="border border-border rounded-3xl overflow-hidden overflow-x-auto bg-card">
						<table className="w-full text-sm min-w-[760px]">
							<thead>
								<tr className="bg-secondary text-left">
									<th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">Lot Name</th>
									<th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">SKU</th>
									<th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">Category</th>
									<th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">Lot Qty</th>
									<th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">Base Price</th>
									<th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">Status</th>
									<th className="w-40" />
								</tr>
							</thead>
							<tbody>
								{filteredLots.map((lot) => {
									const image = (lot.product_images ?? []).find((i: any) => i.is_primary) ?? lot.product_images?.[0]
									return (
										<tr key={lot.id} className="border-t border-border hover:bg-muted/40 transition-colors">
											<td className="px-5 py-3.5">
												<div className="flex items-center gap-3">
													<div className="w-10 h-10 rounded-xl bg-muted overflow-hidden shrink-0 border border-border">
														{image && <img src={image.image_url} alt="" className="w-full h-full object-cover" />}
													</div>
													<div className="min-w-0">
														<p className="font-medium text-card-foreground truncate max-w-[220px]">{lot.name}</p>
														<p className="text-[11px] text-muted-foreground">{lot.brand ?? '—'}</p>
													</div>
												</div>
											</td>
											<td className="px-5 py-3.5 text-foreground/75 font-mono text-xs">{lot.sku ?? '—'}</td>
											<td className="px-5 py-3.5 text-foreground/75">{lot.categories?.name ?? '—'}</td>
											<td className="px-5 py-3.5 font-semibold text-card-foreground">
												{lot.lot_quantity ?? '—'} devices
											</td>
											<td className="px-5 py-3.5 font-semibold text-card-foreground">
												${Number(lot.base_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
											</td>
											<td className="px-5 py-3.5">
												<span
													className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.1em] ${
														lot.is_active ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground/60'
													}`}
												>
													{lot.is_active ? 'Active' : 'Inactive'}
												</span>
											</td>
											<td className="px-5 py-3.5">
												<div className="flex items-center gap-1.5 justify-end">
													<button
														onClick={() => {
															setSelectedLot(lot.id)
															const element = document.getElementById('pricing-tiers-section')
															if (element) element.scrollIntoView({ behavior: 'smooth' })
														}}
														className={`${adminButtonGhost} !px-3 !py-1.5 !text-[9px]`}
														title="Manage Pricing Tiers"
													>
														<Layers className="w-3 h-3" />
														Tiers
													</button>
													{writable && (
														<>
															<button
																onClick={() => openEdit(lot.id)}
																className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-all cursor-pointer"
																aria-label="Edit"
															>
																<Pencil className="w-4 h-4" />
															</button>
															<button
																onClick={() => removeLot(lot)}
																className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
																aria-label="Delete"
															>
																<Trash2 className="w-4 h-4" />
															</button>
														</>
													)}
												</div>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>

			{/* Pricing Tiers Section */}
			<div id="pricing-tiers-section" className="border-t border-border pt-12">
				<h2 className="text-sm font-bold uppercase tracking-[0.18em] text-foreground mb-6">Quantity-based Pricing Tiers</h2>
				
				{lots === null ? (
					<TableShimmer />
				) : lots.length === 0 ? (
					<EmptyState message="No wholesale lots listed. Add a wholesale lot above to configure pricing tiers." />
				) : (
					<div className="space-y-8 max-w-3xl">
						<div>
							<label className={label}>Wholesale Lot Selection</label>
							<select value={selectedLot} onChange={(e) => setSelectedLot(e.target.value)} className={`${adminInput} cursor-pointer`}>
								{lots.map((lot) => (
									<option key={lot.id} value={lot.id}>{lot.name}</option>
								))}
							</select>
						</div>

						{writable && selectedLot && (
							<Panel title="Add Pricing Bracket">
								<div className="grid sm:grid-cols-4 gap-3 items-end">
									<div>
										<label className={label}>Min Quantity</label>
										<input type="number" min={1} value={tierForm.min_quantity} onChange={(e) => setTierForm({ ...tierForm, min_quantity: e.target.value })} className={adminInput} placeholder="10" />
									</div>
									<div>
										<label className={label}>Max Quantity (optional)</label>
										<input type="number" value={tierForm.max_quantity} onChange={(e) => setTierForm({ ...tierForm, max_quantity: e.target.value })} className={adminInput} placeholder="49" />
									</div>
									<div>
										<label className={label}>Price Per Unit</label>
										<input type="number" step="0.01" value={tierForm.price_per_unit} onChange={(e) => setTierForm({ ...tierForm, price_per_unit: e.target.value })} className={adminInput} placeholder="299.00" />
									</div>
									<button onClick={addTier} disabled={savingTier || !tierForm.min_quantity || !tierForm.price_per_unit} className={`${adminButton} justify-center`}>
										{savingTier ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
										Add Bracket
									</button>
								</div>
								<p className="text-[11px] text-muted-foreground mt-3">
									Overlapping quantity bounds are rejected automatically.
								</p>
							</Panel>
						)}

						{tiers === null ? (
							<TableShimmer rows={3} />
						) : tiers.length === 0 ? (
							<EmptyState message="No pricing tiers for this lot yet." />
						) : (
							<div className="border border-border rounded-3xl overflow-hidden bg-card">
								<table className="w-full text-sm">
									<thead>
										<tr className="bg-secondary text-left">
											<th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">Quantity Range</th>
											<th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">Price Per Unit</th>
											<th className="w-16" />
										</tr>
									</thead>
									<tbody>
										{tiers.map((tier) => (
											<tr key={tier.id} className="border-t border-border">
												<td className="px-5 py-3.5 text-foreground/85 font-medium">
													{tier.min_quantity}{tier.max_quantity == null ? '+' : ` – ${tier.max_quantity}`} units
												</td>
												<td className="px-5 py-3.5 font-semibold text-card-foreground">
													${Number(tier.price_per_unit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
												</td>
												<td className="px-5 py-3.5">
													{writable && (
														<button
															onClick={() => removeTier(tier)}
															className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
															aria-label="Remove tier"
														>
															<Trash2 className="w-4 h-4" />
														</button>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</div>
				)}
			</div>

			{/* Create wizard */}
			<WholesaleLotWizard
				open={wizardOpen}
				categories={categories}
				onClose={() => setWizardOpen(false)}
				onSaved={loadLots}
			/>

			{/* Edit modal */}
			{editing && (
				<WholesaleFormModal
					open
					initial={editing}
					categories={categories}
					onClose={() => setEditing(null)}
					onSaved={loadLots}
				/>
			)}
		</div>
	)
}
