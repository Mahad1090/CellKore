'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { PageTitle, EmptyState, adminButton, adminInput, Panel } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import type { WholesalePriceTier } from '@/lib/types'

export default function AdminWholesalePage() {
	const { toast, confirm } = useToast()
	const { can } = useAdmin()
	const [lots, setLots] = useState<any[] | null>(null)
	const [selectedLot, setSelectedLot] = useState<string>('')
	const [tiers, setTiers] = useState<WholesalePriceTier[] | null>(null)
	const [form, setForm] = useState({ min_quantity: '', max_quantity: '', price_per_unit: '' })
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		fetch('/api/admin/products?wholesale=true')
			.then((res) => res.json())
			.then((json) => {
				const list = json.products ?? []
				setLots(list)
				if (list.length > 0) setSelectedLot((prev) => prev || list[0].id)
			})
			.catch(() => setLots([]))
	}, [])

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

	const addTier = async () => {
		setSaving(true)
		try {
			const res = await fetch('/api/admin/wholesale-tiers', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					product_id: selectedLot,
					min_quantity: Number(form.min_quantity),
					max_quantity: form.max_quantity === '' ? null : Number(form.max_quantity),
					price_per_unit: Number(form.price_per_unit),
				}),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Tier added', variant: 'success' })
			setForm({ min_quantity: '', max_quantity: '', price_per_unit: '' })
			loadTiers()
		} catch (err) {
			toast({ title: 'Cannot add tier', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSaving(false)
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

	const writable = can('wholesale:write')
	const label = 'text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block'

	return (
		<div>
			<PageTitle title="Wholesale Pricing Tiers" subtitle="Quantity-based price brackets per lot" />

			{lots === null ? (
				<TableShimmer />
			) : lots.length === 0 ? (
				<EmptyState message="No wholesale lots yet — mark a product as a wholesale lot in the Products panel first." />
			) : (
				<div className="space-y-8 max-w-3xl">
					<div>
						<label className={label}>Wholesale Lot</label>
						<select value={selectedLot} onChange={(e) => setSelectedLot(e.target.value)} className={`${adminInput} cursor-pointer`}>
							{lots.map((lot) => (
								<option key={lot.id} value={lot.id}>{lot.name}</option>
							))}
						</select>
					</div>

					{writable && (
						<Panel title="Add Pricing Bracket">
							<div className="grid sm:grid-cols-4 gap-3 items-end">
								<div>
									<label className={label}>Min Quantity</label>
									<input type="number" min={1} value={form.min_quantity} onChange={(e) => setForm({ ...form, min_quantity: e.target.value })} className={adminInput} placeholder="10" />
								</div>
								<div>
									<label className={label}>Max Quantity (optional)</label>
									<input type="number" value={form.max_quantity} onChange={(e) => setForm({ ...form, max_quantity: e.target.value })} className={adminInput} placeholder="49" />
								</div>
								<div>
									<label className={label}>Price Per Unit</label>
									<input type="number" step="0.01" value={form.price_per_unit} onChange={(e) => setForm({ ...form, price_per_unit: e.target.value })} className={adminInput} placeholder="299.00" />
								</div>
								<button onClick={addTier} disabled={saving || !form.min_quantity || !form.price_per_unit} className={`${adminButton} justify-center`}>
									{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
									Add
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
	)
}
