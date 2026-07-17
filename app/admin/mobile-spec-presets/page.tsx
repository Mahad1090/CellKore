'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { PageTitle, EmptyState, Modal, adminButton, adminButtonGhost, adminInput } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import { MobileSpecsForm } from '@/components/admin/mobile-specs-form'
import type { MobileSpecifications } from '@/lib/mobile-specs'
import type { MobileSpecPreset } from '@/lib/types'

interface PresetForm {
	id?: string
	name: string
	brand: string
	is_active: boolean
	sort_order: number
	mobile_specifications: MobileSpecifications
}

const EMPTY: PresetForm = { name: '', brand: '', is_active: true, sort_order: 0, mobile_specifications: {} }

export default function AdminMobileSpecPresetsPage() {
	const { toast, confirm } = useToast()
	const { can } = useAdmin()
	const [presets, setPresets] = useState<MobileSpecPreset[] | null>(null)
	const [editing, setEditing] = useState<PresetForm | null>(null)
	const [saving, setSaving] = useState(false)

	const load = useCallback(() => {
		fetch('/api/admin/mobile-spec-presets')
			.then((res) => res.json())
			.then((json) => setPresets(json.mobileSpecPresets ?? []))
			.catch(() => setPresets([]))
	}, [])

	useEffect(load, [load])

	const save = async () => {
		if (!editing) return
		if (!editing.name.trim()) {
			toast({ title: 'Name is required', variant: 'error' })
			return
		}
		setSaving(true)
		try {
			const res = await fetch(editing.id ? `/api/admin/mobile-spec-presets/${editing.id}` : '/api/admin/mobile-spec-presets', {
				method: editing.id ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(editing),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: editing.id ? 'Preset updated' : 'Preset created', variant: 'success' })
			setEditing(null)
			load()
		} catch (err) {
			toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSaving(false)
		}
	}

	const remove = async (preset: MobileSpecPreset) => {
		const ok = await confirm({
			title: 'Delete preset?',
			description: `"${preset.name}" will be removed permanently.`,
			confirmLabel: 'Delete',
			destructive: true,
		})
		if (!ok) return
		const res = await fetch(`/api/admin/mobile-spec-presets/${preset.id}`, { method: 'DELETE' })
		if (res.ok) {
			toast({ title: 'Preset deleted', variant: 'success' })
			load()
		} else {
			const json = await res.json()
			toast({ title: 'Delete failed', description: json.error, variant: 'error' })
		}
	}

	const writable = can('categories:write')
	const label = 'text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block'

	return (
		<div>
			<PageTitle
				title="Mobile Spec Presets"
				subtitle="Reusable spec value snapshots for phone models (e.g. iPhone 15 Pro)"
				actions={
					writable && (
						<button onClick={() => setEditing(EMPTY)} className={adminButton}>
							<Plus className="w-3.5 h-3.5" />
							Add Preset
						</button>
					)
				}
			/>

			{presets === null ? (
				<TableShimmer />
			) : presets.length === 0 ? (
				<EmptyState message="No mobile spec presets yet." />
			) : (
				<div className="border border-border rounded-3xl overflow-hidden bg-card overflow-x-auto">
					<table className="w-full text-sm min-w-[520px]">
						<thead>
							<tr className="bg-secondary text-left">
								{['Name', 'Brand', 'Sort Order', 'Status', ''].map((h) => (
									<th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">{h}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{presets.map((preset) => (
								<tr key={preset.id} className="border-t border-border hover:bg-muted/40 transition-colors">
									<td className="px-5 py-3.5 font-medium text-card-foreground">{preset.name}</td>
									<td className="px-5 py-3.5 text-foreground/75">{preset.brand ?? '—'}</td>
									<td className="px-5 py-3.5 text-foreground/75">{preset.sort_order}</td>
									<td className="px-5 py-3.5">
										<span
											className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.1em] ${
												preset.is_active ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground/60'
											}`}
										>
											{preset.is_active ? 'Active' : 'Hidden'}
										</span>
									</td>
									<td className="px-5 py-3.5">
										{writable && (
											<div className="flex items-center gap-1.5 justify-end">
												<button
													onClick={() =>
														setEditing({
															id: preset.id,
															name: preset.name,
															brand: preset.brand ?? '',
															is_active: preset.is_active,
															sort_order: preset.sort_order,
															mobile_specifications: preset.mobile_specifications ?? {},
														})
													}
													className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-all cursor-pointer"
													aria-label="Edit"
												>
													<Pencil className="w-4 h-4" />
												</button>
												<button
													onClick={() => remove(preset)}
													className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
													aria-label="Delete"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{editing && (
				<Modal open onClose={() => setEditing(null)} title={editing.id ? 'Edit Preset' : 'Create Preset'} wide>
					<div className="space-y-6">
						<div className="grid sm:grid-cols-2 gap-4">
							<div>
								<label className={label}>Name</label>
								<input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={adminInput} placeholder="iPhone 15 Pro" />
							</div>
							<div>
								<label className={label}>Brand</label>
								<input value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} className={adminInput} placeholder="Apple" />
							</div>
							<div>
								<label className={label}>Sort Order</label>
								<input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} className={adminInput} />
							</div>
							<label className="flex items-center gap-2.5 cursor-pointer mt-6">
								<input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="w-4 h-4 accent-[var(--primary)] cursor-pointer" />
								<span className="text-xs font-semibold text-foreground">Active</span>
							</label>
						</div>

						<div>
							<label className={label}>Spec Values</label>
							<MobileSpecsForm
								value={editing.mobile_specifications}
								brand={editing.brand}
								onChange={(next) => setEditing({ ...editing, mobile_specifications: next })}
							/>
						</div>

						<div className="flex justify-end gap-3 pt-4 border-t border-border">
							<button onClick={() => setEditing(null)} className={adminButtonGhost}>Cancel</button>
							<button onClick={save} disabled={saving} className={adminButton}>
								{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
								Save Preset
							</button>
						</div>
					</div>
				</Modal>
			)}
		</div>
	)
}
