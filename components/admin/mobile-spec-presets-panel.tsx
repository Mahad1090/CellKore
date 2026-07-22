'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Pencil, Trash2, Loader2, GripVertical, Search } from 'lucide-react'
import { EmptyState, Modal, adminButton, adminButtonGhost, adminInput } from '@/components/admin/ui'
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
	mobile_specifications: MobileSpecifications
}

const EMPTY: PresetForm = { name: '', brand: '', is_active: true, mobile_specifications: {} }

export default function MobileSpecPresetsPanel({ triggerAdd }: { triggerAdd: number }) {
	const { toast, confirm } = useToast()
	const { can } = useAdmin()
	const [presets, setPresets] = useState<MobileSpecPreset[] | null>(null)
	const [editing, setEditing] = useState<PresetForm | null>(null)
	const [saving, setSaving] = useState(false)
	const [search, setSearch] = useState('')
	const [selectedBrandFilter, setSelectedBrandFilter] = useState('')
	const prevTrigger = useRef(0)
	const dragIndex = useRef<number | null>(null)

	const load = useCallback(() => {
		fetch('/api/admin/mobile-spec-presets').then((r) => r.json()).then((j) => setPresets(j.mobileSpecPresets ?? [])).catch(() => setPresets([]))
	}, [])

	useEffect(load, [load])

	useEffect(() => {
		if (triggerAdd !== prevTrigger.current) {
			prevTrigger.current = triggerAdd
			if (triggerAdd > 0) setEditing(EMPTY)
		}
	}, [triggerAdd])

	// ── Drag reorder ─────────────────────────────────────────────────────────
	const onDragStart = (e: React.DragEvent, index: number) => {
		dragIndex.current = index
		e.dataTransfer.effectAllowed = 'move'
	}

	const onDrop = async (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault()
		if (dragIndex.current === null || dragIndex.current === dropIndex || !presets) return
		const reordered = [...presets]
		const [moved] = reordered.splice(dragIndex.current, 1)
		reordered.splice(dropIndex, 0, moved)
		setPresets(reordered)
		dragIndex.current = null
		await Promise.all(
			reordered.map((p, i) =>
				fetch(`/api/admin/mobile-spec-presets/${p.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ sort_order: i }),
				})
			)
		).catch(() => toast({ title: 'Failed to save order', variant: 'error' }))
	}

	const save = async () => {
		if (!editing) return
		if (!editing.name.trim()) { toast({ title: 'Model Name is required', variant: 'error' }); return }
		setSaving(true)
		try {
			const res = await fetch(editing.id ? `/api/admin/mobile-spec-presets/${editing.id}` : '/api/admin/mobile-spec-presets', { method: editing.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(editing) })
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: editing.id ? 'Preset updated' : 'Preset created', variant: 'success' })
			setEditing(null); load()
		} catch (err) {
			toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally { setSaving(false) }
	}

	const remove = async (preset: MobileSpecPreset) => {
		const ok = await confirm({ title: 'Delete preset?', description: `"${preset.name}" will be removed permanently.`, confirmLabel: 'Delete', destructive: true })
		if (!ok) return
		const res = await fetch(`/api/admin/mobile-spec-presets/${preset.id}`, { method: 'DELETE' })
		if (res.ok) { toast({ title: 'Preset deleted', variant: 'success' }); load() }
		else { const json = await res.json(); toast({ title: 'Delete failed', description: json.error, variant: 'error' }) }
	}

	const brands = Array.from(new Set((presets ?? []).map((p) => p.brand).filter(Boolean))) as string[]

	const filteredPresets = (presets ?? []).filter((p) => {
		if (search.trim() && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.brand ?? '').toLowerCase().includes(search.toLowerCase())) return false
		if (selectedBrandFilter && p.brand !== selectedBrandFilter) return false
		return true
	})

	const writable = can('categories:write')
	const label = 'text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block'

	return (
		<div className="space-y-4">
			{/* Filter Bar */}
			<div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#E9ECEA] shadow-3xs">
				<div className="flex flex-wrap items-center gap-2 flex-1">
					<div className="relative flex-1 min-w-[200px] max-w-sm">
						<Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
						<input
							placeholder="Search model presets by name or brand..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E9ECEA] bg-[#F7F7F5] text-xs focus:outline-none focus:border-[#599161] focus:bg-white transition-all font-sans"
						/>
					</div>
					<select
						value={selectedBrandFilter}
						onChange={(e) => setSelectedBrandFilter(e.target.value)}
						className="px-3 py-1.5 rounded-xl border border-[#E9ECEA] bg-[#F7F7F5] text-xs focus:outline-none focus:border-[#599161] bg-white cursor-pointer font-sans font-semibold"
					>
						<option value="">All Brands</option>
						{brands.map((b) => (
							<option key={b} value={b}>{b}</option>
						))}
					</select>
					{(search || selectedBrandFilter) && (
						<button
							type="button"
							onClick={() => { setSearch(''); setSelectedBrandFilter('') }}
							className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 cursor-pointer"
						>
							Clear Filter
						</button>
					)}
				</div>
			</div>

			{presets === null ? <TableShimmer /> : filteredPresets.length === 0 ? <EmptyState message="No model presets match your filter." /> : (
				<div className="border border-border rounded-3xl overflow-hidden bg-card overflow-x-auto">
					<table className="w-full text-sm min-w-[520px]">
						<thead>
							<tr className="bg-secondary text-left">
								<th className="w-8 px-3 py-3.5" />
								{['Model Name', 'Brand', 'Status', ''].map((h) => <th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">{h}</th>)}
							</tr>
						</thead>
						<tbody>
							{filteredPresets.map((preset, index) => (
								<tr
									key={preset.id}
									draggable
									onDragStart={(e) => onDragStart(e, index)}
									onDragOver={(e) => e.preventDefault()}
									onDrop={(e) => onDrop(e, index)}
									className="border-t border-border hover:bg-muted/40 transition-colors"
								>
									<td className="pl-3 pr-1 py-3.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing">
										<GripVertical className="w-4 h-4" />
									</td>
									<td className="px-5 py-3.5 font-medium text-card-foreground">{preset.name}</td>
									<td className="px-5 py-3.5 text-foreground/75 font-semibold">
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F7F7F5] border border-[#E9ECEA]">
											{preset.brand ?? '—'}
										</span>
									</td>
									<td className="px-5 py-3.5">
										<span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.1em] ${preset.is_active ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground/60'}`}>
											{preset.is_active ? 'Active' : 'Hidden'}
										</span>
									</td>
									<td className="px-5 py-3.5">
										{writable && (
											<div className="flex items-center gap-1.5 justify-end">
												<button onClick={() => setEditing({ id: preset.id, name: preset.name, brand: preset.brand ?? '', is_active: preset.is_active, mobile_specifications: preset.mobile_specifications ?? {} })} className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-all cursor-pointer" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
												<button onClick={() => remove(preset)} className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
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
				<Modal open onClose={() => setEditing(null)} title={editing.id ? 'Edit Mobile Preset' : 'Create Mobile Preset'} wide>
					<div className="space-y-6">
						<div className="grid sm:grid-cols-2 gap-4">
							<div><label className={label}>Phone Model Name</label><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={adminInput} placeholder="e.g. iPhone 15 Pro, Galaxy S24 Ultra, Pixel 8 Pro" /></div>
							<div><label className={label}>Brand</label><input value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} className={adminInput} placeholder="e.g. Apple, Samsung, Google" /></div>
							<label className="flex items-center gap-2.5 cursor-pointer col-span-2"><input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="w-4 h-4 accent-[var(--primary)] cursor-pointer" /><span className="text-xs font-semibold text-foreground">Active</span></label>
						</div>
						<div>
							<label className={label}>Technical Specifications</label>
							<MobileSpecsForm value={editing.mobile_specifications} brand={editing.brand} onChange={(next) => setEditing({ ...editing, mobile_specifications: next })} />
						</div>
						<div className="flex justify-end gap-3 pt-4 border-t border-border">
							<button onClick={() => setEditing(null)} className={adminButtonGhost}>Cancel</button>
							<button onClick={save} disabled={saving} className={adminButton}>{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Save Preset</button>
						</div>
					</div>
				</Modal>
			)}
		</div>
	)
}
