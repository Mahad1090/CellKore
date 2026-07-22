'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, Loader2, Pencil, Search, Layers } from 'lucide-react'
import { PageTitle, EmptyState, adminButton, adminButtonGhost, adminInput, Panel, StatusBadge, Modal } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import type { WholesalePriceTier, Category, ProductType } from '@/lib/types'
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
	const [productTypes, setProductTypes] = useState<ProductType[]>([])
	const [search, setSearch] = useState('')
	const [filterCategory, setFilterCategory] = useState('')
	const [filterBrand, setFilterBrand] = useState('')
	const [filterStatus, setFilterStatus] = useState('')
	const [sortBy, setSortBy] = useState('newest')
	const [editing, setEditing] = useState<WholesaleFormValue | null>(null)
	const [wizardOpen, setWizardOpen] = useState(false)
	
	const [selectedLot, setSelectedLot] = useState<string>('')
	const [tiers, setTiers] = useState<WholesalePriceTier[] | null>(null)
	const [tierForm, setTierForm] = useState({ min_quantity: '', max_quantity: '', price_per_unit: '' })
	const [savingTier, setSavingTier] = useState(false)
	const [tiersModalOpen, setTiersModalOpen] = useState(false)

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

		fetch('/api/admin/product-types')
			.then((res) => res.json())
			.then((json) => setProductTypes(json.productTypes ?? []))
			.catch(() => setProductTypes([]))
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

	const filteredLots = (lots ?? [])
		.filter((l) => {
			if (search.trim() && !l.name.toLowerCase().includes(search.toLowerCase()) && !(l.sku ?? '').toLowerCase().includes(search.toLowerCase()) && !(l.brand ?? '').toLowerCase().includes(search.toLowerCase())) return false
			if (filterCategory && (l.categories?.id ?? l.category_id) !== filterCategory) return false
			if (filterBrand && (l.brand ?? '') !== filterBrand) return false
			if (filterStatus === 'active' && !l.is_active) return false
			if (filterStatus === 'inactive' && l.is_active) return false
			return true
		})
		.sort((a, b) => {
			if (sortBy === 'name_asc') return (a.name ?? '').localeCompare(b.name ?? '')
			if (sortBy === 'name_desc') return (b.name ?? '').localeCompare(a.name ?? '')
			if (sortBy === 'price_asc') return Number(a.base_price) - Number(b.base_price)
			if (sortBy === 'price_desc') return Number(b.base_price) - Number(a.base_price)
			if (sortBy === 'qty_desc') return Number(b.lot_quantity ?? 0) - Number(a.lot_quantity ?? 0)
			// newest first (default)
			return new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
		})

	const lotBrands = Array.from(new Set((lots ?? []).map((l) => l.brand).filter(Boolean))) as string[]

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
				{/* Filter Panel */}
				<div className="flex flex-col gap-3 bg-white p-4 rounded-2xl border border-[#E9ECEA] shadow-3xs mb-6">
					<div className="relative w-full">
						<Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
						<input
							placeholder="Search by name, SKU, brand..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E9ECEA] bg-[#F7F7F5] text-xs focus:outline-none focus:border-[#599161] focus:bg-white transition-all font-sans"
						/>
					</div>
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
						<select
							value={filterCategory}
							onChange={(e) => setFilterCategory(e.target.value)}
							className="w-full px-3 py-2 rounded-xl border border-[#E9ECEA] bg-[#F7F7F5] text-xs focus:outline-none focus:border-[#599161] bg-white cursor-pointer font-sans capitalize font-semibold"
						>
							<option value="">All Categories</option>
							{categories.map((c) => (
								<option key={c.id} value={c.id}>{c.name}</option>
							))}
						</select>
						<select
							value={filterStatus}
							onChange={(e) => setFilterStatus(e.target.value)}
							className="w-full px-3 py-2 rounded-xl border border-[#E9ECEA] bg-[#F7F7F5] text-xs focus:outline-none focus:border-[#599161] bg-white cursor-pointer font-sans capitalize font-semibold"
						>
							<option value="">All Statuses</option>
							<option value="active">Active</option>
							<option value="inactive">Inactive</option>
						</select>
						<select
							value={filterBrand}
							onChange={(e) => setFilterBrand(e.target.value)}
							className="w-full px-3 py-2 rounded-xl border border-[#E9ECEA] bg-[#F7F7F5] text-xs focus:outline-none focus:border-[#599161] bg-white cursor-pointer font-sans capitalize font-semibold"
						>
							<option value="">All Brands</option>
							{lotBrands.map((b) => (
								<option key={b} value={b}>{b}</option>
							))}
						</select>
						<select
							value={sortBy}
							onChange={(e) => setSortBy(e.target.value)}
							className="w-full px-3 py-2 rounded-xl border border-[#E9ECEA] bg-[#F7F7F5] text-xs focus:outline-none focus:border-[#599161] bg-white cursor-pointer font-sans capitalize font-semibold"
						>
							<option value="newest">Sort: Newest First</option>
							<option value="name_asc">Sort: Name A→Z</option>
							<option value="name_desc">Sort: Name Z→A</option>
							<option value="price_asc">Sort: Price Low→High</option>
							<option value="price_desc">Sort: Price High→Low</option>
							<option value="qty_desc">Sort: Most Units</option>
						</select>
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
															setTiersModalOpen(true)
														}}
														className={`${adminButtonGhost} !px-3 !py-1.5 !text-[9px]`}
														title="Manage Pricing Tiers"
													>
														<Layers className="w-3 h-3 text-[#599161]" />
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

			{/* Tiers Management Modal */}
			{tiersModalOpen && selectedLot && (
				<Modal 
					open={tiersModalOpen} 
					onClose={() => setTiersModalOpen(false)} 
					title={`Pricing Tiers: ${(lots ?? []).find((l) => l.id === selectedLot)?.name ?? 'Lot'}`} 
					wide
				>
					<div className="grid grid-cols-1 md:grid-cols-2 gap-8 min-h-[300px]">
						{/* Left: Add Tier Form */}
						{writable && (
							<div className="p-5 rounded-2xl bg-white border border-[#E9ECEA] space-y-4 shadow-3xs flex flex-col justify-between">
								<div>
									<h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] pb-2 border-b border-[#E9ECEA] mb-4">
										Add Pricing Bracket
									</h3>
									<div className="space-y-4">
										<div>
											<label className={label}>Min Quantity</label>
											<input 
												type="number" 
												min={1} 
												value={tierForm.min_quantity} 
												onChange={(e) => setTierForm({ ...tierForm, min_quantity: e.target.value })} 
												className={adminInput} 
												placeholder="10" 
											/>
										</div>
										<div>
											<label className={label}>Max Quantity (optional)</label>
											<input 
												type="number" 
												value={tierForm.max_quantity} 
												onChange={(e) => setTierForm({ ...tierForm, max_quantity: e.target.value })} 
												className={adminInput} 
												placeholder="49" 
											/>
										</div>
										<div>
											<label className={label}>Price Per Unit (USD)</label>
											<input 
												type="number" 
												step="0.01" 
												value={tierForm.price_per_unit} 
												onChange={(e) => setTierForm({ ...tierForm, price_per_unit: e.target.value })} 
												className={adminInput} 
												placeholder="299.00" 
											/>
										</div>
									</div>
								</div>
								<div className="pt-4 border-t border-[#E9ECEA]/60">
									<button 
										onClick={addTier} 
										disabled={savingTier || !tierForm.min_quantity || !tierForm.price_per_unit} 
										className={`${adminButton} w-full justify-center`}
									>
										{savingTier ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5 text-white" />}
										Add Bracket
									</button>
									<p className="text-[10px] text-muted-foreground mt-2 text-center">
										Overlapping quantity bounds are rejected automatically.
									</p>
								</div>
							</div>
						)}

						{/* Right: Existing Pricing Tiers List */}
						<div className="space-y-4">
							<h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] pb-2 border-b border-[#E9ECEA]">
								Active Brackets
							</h3>
							{tiers === null ? (
								<TableShimmer rows={3} />
							) : tiers.length === 0 ? (
								<div className="py-12 text-center border border-dashed border-border rounded-2xl flex flex-col items-center justify-center">
									<p className="text-xs text-muted-foreground">No custom tiers configured yet.</p>
								</div>
							) : (
								<div className="border border-border rounded-2xl overflow-hidden bg-card">
									<table className="w-full text-sm">
										<thead>
											<tr className="bg-secondary text-left">
												<th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Quantity Range</th>
												<th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Price Per Unit</th>
												<th className="w-16" />
											</tr>
										</thead>
										<tbody>
											{tiers.map((tier) => (
												<tr key={tier.id} className="border-t border-border">
													<td className="px-4 py-2.5 text-foreground/85 font-semibold text-xs">
														{tier.min_quantity}{tier.max_quantity == null ? '+' : ` – ${tier.max_quantity}`} units
													</td>
													<td className="px-4 py-2.5 font-bold text-card-foreground text-xs">
														${Number(tier.price_per_unit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
													</td>
													<td className="px-4 py-2.5 text-center">
														{writable && (
															<button
																onClick={() => removeTier(tier)}
																className="p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
																aria-label="Remove tier"
															>
																<Trash2 className="w-3.5 h-3.5" />
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
					</div>
				</Modal>
			)}

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
					productTypes={productTypes}
					onClose={() => setEditing(null)}
					onSaved={loadLots}
				/>
			)}
		</div>
	)
}
