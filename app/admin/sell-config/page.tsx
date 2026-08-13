'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Upload, Loader2, GripVertical, Smartphone } from 'lucide-react'
import { PageTitle, Panel, EmptyState, Modal, StatusBadge, adminButton, adminButtonGhost, adminInput } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import { sellDeviceModelImagePath, uploadViaAdminApi } from '@/lib/storage'
import type { SellDeviceModel, SellDeviceTypeId, SellProblemOption } from '@/lib/types'

const DEVICE_TYPE_TABS: { id: SellDeviceTypeId; label: string }[] = [
	{ id: 'iphone', label: 'iPhone' },
	{ id: 'galaxy', label: 'Galaxy' },
	{ id: 'ipad', label: 'iPad' },
	{ id: 'laptop', label: 'Laptop' },
	{ id: 'tablet', label: 'Tablet' },
	{ id: 'other', label: 'Other' },
]

const SEVERITIES = ['excellent', 'good', 'fair', 'poor'] as const

interface ModelForm {
	id?: string
	device_type: SellDeviceTypeId
	label: string
	image_url: string
	storage_options: string
	is_active: boolean
	sort_order: number
}

interface ProblemForm {
	id?: string
	title: string
	description: string
	severity: (typeof SEVERITIES)[number]
	is_active: boolean
	sort_order: number
}

const EMPTY_MODEL = (deviceType: SellDeviceTypeId, order: number): ModelForm => ({
	device_type: deviceType,
	label: '',
	image_url: '',
	storage_options: '64 GB, 128 GB, 256 GB, 512 GB, 1 TB',
	is_active: true,
	sort_order: order,
})

const EMPTY_PROBLEM: ProblemForm = { title: '', description: '', severity: 'fair', is_active: true, sort_order: 0 }

const label = 'text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block'

export default function AdminSellConfigPage() {
	const { toast, confirm } = useToast()
	const { can } = useAdmin()
	const writable = can('sell-config:write')

	const [activeType, setActiveType] = useState<SellDeviceTypeId>('iphone')
	const [models, setModels] = useState<SellDeviceModel[] | null>(null)
	const [editingModel, setEditingModel] = useState<ModelForm | null>(null)
	const [savingModel, setSavingModel] = useState(false)
	const [uploading, setUploading] = useState(false)
	const modelDragIndex = useRef<number | null>(null)

	const [problems, setProblems] = useState<SellProblemOption[] | null>(null)
	const [editingProblem, setEditingProblem] = useState<ProblemForm | null>(null)
	const [savingProblem, setSavingProblem] = useState(false)
	const problemDragIndex = useRef<number | null>(null)

	const loadModels = useCallback(() => {
		fetch('/api/admin/sell-config/models')
			.then((res) => res.json())
			.then((json) => setModels(json.models ?? []))
			.catch(() => setModels([]))
	}, [])

	const loadProblems = useCallback(() => {
		fetch('/api/admin/sell-config/problems')
			.then((res) => res.json())
			.then((json) => setProblems(json.problems ?? []))
			.catch(() => setProblems([]))
	}, [])

	useEffect(loadModels, [loadModels])
	useEffect(loadProblems, [loadProblems])

	const visibleModels = (models ?? []).filter((m) => m.device_type === activeType)

	// ── Models: drag reorder (within the active device type only) ─────────────
	const onModelDragStart = (e: React.DragEvent, index: number) => {
		modelDragIndex.current = index
		e.dataTransfer.effectAllowed = 'move'
	}
	const onModelDrop = async (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault()
		if (modelDragIndex.current === null || modelDragIndex.current === dropIndex || !models) return
		const reordered = [...visibleModels]
		const [moved] = reordered.splice(modelDragIndex.current, 1)
		reordered.splice(dropIndex, 0, moved)
		const otherTypes = models.filter((m) => m.device_type !== activeType)
		setModels([...otherTypes, ...reordered])
		modelDragIndex.current = null
		await Promise.all(
			reordered.map((m, i) =>
				fetch(`/api/admin/sell-config/models/${m.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ sort_order: i }),
				})
			)
		).catch(() => toast({ title: 'Failed to save order', variant: 'error' }))
	}

	const saveModel = async () => {
		if (!editingModel) return
		if (!editingModel.label.trim()) {
			toast({ title: 'Model name is required', variant: 'error' })
			return
		}
		setSavingModel(true)
		try {
			const payload = {
				...editingModel,
				storage_options: editingModel.storage_options
					.split(',')
					.map((s) => s.trim())
					.filter(Boolean),
			}
			const res = await fetch(editingModel.id ? `/api/admin/sell-config/models/${editingModel.id}` : '/api/admin/sell-config/models', {
				method: editingModel.id ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: editingModel.id ? 'Model updated' : 'Model added', variant: 'success' })
			setEditingModel(null)
			loadModels()
		} catch (err) {
			toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSavingModel(false)
		}
	}

	const removeModel = async (model: SellDeviceModel) => {
		const ok = await confirm({
			title: 'Delete model?',
			description: `"${model.label}" will no longer appear as a sell option.`,
			confirmLabel: 'Delete',
			destructive: true,
		})
		if (!ok) return
		const res = await fetch(`/api/admin/sell-config/models/${model.id}`, { method: 'DELETE' })
		if (res.ok) {
			toast({ title: 'Model deleted', variant: 'success' })
			loadModels()
		} else {
			const json = await res.json()
			toast({ title: 'Delete failed', description: json.error, variant: 'error' })
		}
	}

	const handleModelUpload = async (files: FileList | null) => {
		if (!files?.[0] || !editingModel) return
		if (!editingModel.label.trim()) {
			toast({ title: 'Name the model first', description: 'The name is used to build the image path.', variant: 'info' })
			return
		}
		setUploading(true)
		try {
			const url = await uploadViaAdminApi(
				sellDeviceModelImagePath(editingModel.device_type, editingModel.label, files[0].name),
				files[0]
			)
			setEditingModel({ ...editingModel, image_url: url })
			toast({ title: 'Image uploaded', variant: 'success' })
		} catch (err) {
			toast({ title: 'Upload failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setUploading(false)
		}
	}

	// ── Problems ────────────────────────────────────────────────────────────
	const onProblemDragStart = (e: React.DragEvent, index: number) => {
		problemDragIndex.current = index
		e.dataTransfer.effectAllowed = 'move'
	}
	const onProblemDrop = async (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault()
		if (problemDragIndex.current === null || problemDragIndex.current === dropIndex || !problems) return
		const reordered = [...problems]
		const [moved] = reordered.splice(problemDragIndex.current, 1)
		reordered.splice(dropIndex, 0, moved)
		setProblems(reordered)
		problemDragIndex.current = null
		await Promise.all(
			reordered.map((p, i) =>
				fetch(`/api/admin/sell-config/problems/${p.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ sort_order: i }),
				})
			)
		).catch(() => toast({ title: 'Failed to save order', variant: 'error' }))
	}

	const saveProblem = async () => {
		if (!editingProblem) return
		if (!editingProblem.title.trim()) {
			toast({ title: 'Title is required', variant: 'error' })
			return
		}
		setSavingProblem(true)
		try {
			const res = await fetch(
				editingProblem.id ? `/api/admin/sell-config/problems/${editingProblem.id}` : '/api/admin/sell-config/problems',
				{
					method: editingProblem.id ? 'PUT' : 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify(editingProblem),
				}
			)
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: editingProblem.id ? 'Problem updated' : 'Problem added', variant: 'success' })
			setEditingProblem(null)
			loadProblems()
		} catch (err) {
			toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSavingProblem(false)
		}
	}

	const removeProblem = async (problem: SellProblemOption) => {
		const ok = await confirm({
			title: 'Delete problem option?',
			description: `"${problem.title}" will no longer be selectable on the Sell Your Device form.`,
			confirmLabel: 'Delete',
			destructive: true,
		})
		if (!ok) return
		const res = await fetch(`/api/admin/sell-config/problems/${problem.id}`, { method: 'DELETE' })
		if (res.ok) {
			toast({ title: 'Problem deleted', variant: 'success' })
			loadProblems()
		} else {
			const json = await res.json()
			toast({ title: 'Delete failed', description: json.error, variant: 'error' })
		}
	}

	return (
		<div className="space-y-8">
			<PageTitle
				title="Sell Device Options"
				subtitle="Models, storage capacities, and device-condition problems shown on the public Sell Your Device form"
			/>

			{/* ── Device Models ────────────────────────────────────────────────── */}
			<Panel title="Device Models">
				<div className="flex flex-wrap gap-2 mb-6">
					{DEVICE_TYPE_TABS.map((t) => (
						<button
							key={t.id}
							onClick={() => setActiveType(t.id)}
							className={`px-4 py-2 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all cursor-pointer ${
								activeType === t.id
									? 'bg-primary text-primary-foreground border-primary'
									: 'border-border bg-background text-foreground/75 hover:border-primary hover:text-primary'
							}`}
						>
							{t.label}
						</button>
					))}
					{writable && (
						<button
							onClick={() => setEditingModel(EMPTY_MODEL(activeType, visibleModels.length))}
							className={`${adminButton} ml-auto`}
						>
							<Plus className="w-3.5 h-3.5" />
							Add Model
						</button>
					)}
				</div>

				{activeType === 'other' && (
					<p className="text-xs text-muted-foreground mb-4">
						"Other" is the free-text fallback — customers type their own brand/model instead of picking from a list, so models added here won't be shown. Storage choices for those custom entries use a fixed default list.
					</p>
				)}

				{models === null ? (
					<TableShimmer />
				) : visibleModels.length === 0 ? (
					<EmptyState message={`No ${DEVICE_TYPE_TABS.find((t) => t.id === activeType)?.label} models yet.`} />
				) : (
					<div className="border border-border rounded-2xl overflow-hidden overflow-x-auto">
						<table className="w-full text-sm min-w-[640px]">
							<thead>
								<tr className="bg-secondary text-left">
									<th className="w-8 px-3 py-3.5" />
									{['Model', 'Storage Options', 'Status', ''].map((h) => (
										<th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">
											{h}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{visibleModels.map((model, index) => (
									<tr
										key={model.id}
										draggable={writable}
										onDragStart={(e) => onModelDragStart(e, index)}
										onDragOver={(e) => e.preventDefault()}
										onDrop={(e) => onModelDrop(e, index)}
										className="border-t border-border hover:bg-muted/40 transition-colors"
									>
										<td className="pl-3 pr-1 py-3.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing">
											{writable && <GripVertical className="w-4 h-4" />}
										</td>
										<td className="px-5 py-3.5">
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded-xl bg-muted overflow-hidden shrink-0 flex items-center justify-center">
													{model.image_url ? (
														<img src={model.image_url} alt="" className="w-full h-full object-cover" />
													) : (
														<Smartphone className="w-4 h-4 text-muted-foreground/40" />
													)}
												</div>
												<span className="font-medium text-card-foreground">{model.label}</span>
											</div>
										</td>
										<td className="px-5 py-3.5 text-foreground/75 text-xs">
											{model.storage_options.length > 0 ? model.storage_options.join(', ') : '—'}
										</td>
										<td className="px-5 py-3.5">
											<span
												className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.1em] ${
													model.is_active ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground/60'
												}`}
											>
												{model.is_active ? 'Active' : 'Hidden'}
											</span>
										</td>
										<td className="px-5 py-3.5">
											{writable && (
												<div className="flex items-center gap-1.5 justify-end">
													<button
														onClick={() =>
															setEditingModel({
																id: model.id,
																device_type: model.device_type,
																label: model.label,
																image_url: model.image_url ?? '',
																storage_options: model.storage_options.join(', '),
																is_active: model.is_active,
																sort_order: model.sort_order,
															})
														}
														className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-all cursor-pointer"
														aria-label="Edit"
													>
														<Pencil className="w-4 h-4" />
													</button>
													<button
														onClick={() => removeModel(model)}
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
			</Panel>

			{/* ── Problem Options ─────────────────────────────────────────────── */}
			<Panel
				title="Device Problem Options"
			>
				<div className="flex items-center justify-between mb-6 -mt-2">
					<p className="text-xs text-muted-foreground max-w-xl">
						Shown on the "Are there any problems with your device?" step. The severity you assign drives the derived
						condition (Excellent / Good / Fair / Poor) used internally. "None" is always shown first and isn't editable.
					</p>
					{writable && (
						<button onClick={() => setEditingProblem({ ...EMPTY_PROBLEM, sort_order: problems?.length ?? 0 })} className={adminButton}>
							<Plus className="w-3.5 h-3.5" />
							Add Problem
						</button>
					)}
				</div>

				{problems === null ? (
					<TableShimmer />
				) : problems.length === 0 ? (
					<EmptyState message="No problem options yet." />
				) : (
					<div className="border border-border rounded-2xl overflow-hidden overflow-x-auto">
						<table className="w-full text-sm min-w-[640px]">
							<thead>
								<tr className="bg-secondary text-left">
									<th className="w-8 px-3 py-3.5" />
									{['Title', 'Description', 'Severity', 'Status', ''].map((h) => (
										<th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">
											{h}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{problems.map((problem, index) => (
									<tr
										key={problem.id}
										draggable={writable}
										onDragStart={(e) => onProblemDragStart(e, index)}
										onDragOver={(e) => e.preventDefault()}
										onDrop={(e) => onProblemDrop(e, index)}
										className="border-t border-border hover:bg-muted/40 transition-colors"
									>
										<td className="pl-3 pr-1 py-3.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing">
											{writable && <GripVertical className="w-4 h-4" />}
										</td>
										<td className="px-5 py-3.5 font-medium text-card-foreground">{problem.title}</td>
										<td className="px-5 py-3.5 text-foreground/70 text-xs max-w-xs truncate">{problem.description || '—'}</td>
										<td className="px-5 py-3.5">
											<StatusBadge value={problem.severity} />
										</td>
										<td className="px-5 py-3.5">
											<span
												className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.1em] ${
													problem.is_active ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground/60'
												}`}
											>
												{problem.is_active ? 'Active' : 'Hidden'}
											</span>
										</td>
										<td className="px-5 py-3.5">
											{writable && (
												<div className="flex items-center gap-1.5 justify-end">
													<button
														onClick={() =>
															setEditingProblem({
																id: problem.id,
																title: problem.title,
																description: problem.description ?? '',
																severity: problem.severity,
																is_active: problem.is_active,
																sort_order: problem.sort_order,
															})
														}
														className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-all cursor-pointer"
														aria-label="Edit"
													>
														<Pencil className="w-4 h-4" />
													</button>
													<button
														onClick={() => removeProblem(problem)}
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
			</Panel>

			{/* ── Model Modal ─────────────────────────────────────────────────── */}
			{editingModel && (
				<Modal open onClose={() => setEditingModel(null)} title={editingModel.id ? 'Edit Model' : 'Add Model'}>
					<div className="space-y-4">
						<div>
							<label className={label}>Device Type</label>
							<select
								value={editingModel.device_type}
								onChange={(e) => setEditingModel({ ...editingModel, device_type: e.target.value as SellDeviceTypeId })}
								className={adminInput}
							>
								{DEVICE_TYPE_TABS.map((t) => (
									<option key={t.id} value={t.id}>{t.label}</option>
								))}
							</select>
						</div>
						<div>
							<label className={label}>Model Name</label>
							<input
								value={editingModel.label}
								onChange={(e) => setEditingModel({ ...editingModel, label: e.target.value })}
								className={adminInput}
								placeholder="iPhone 17 Pro Max"
							/>
						</div>
						<div>
							<label className={label}>Model Image</label>
							<div className="flex items-center gap-3">
								<div className="w-14 h-14 rounded-xl bg-muted overflow-hidden border border-border shrink-0">
									{editingModel.image_url && <img src={editingModel.image_url} alt="" className="w-full h-full object-cover" />}
								</div>
								<input
									value={editingModel.image_url}
									onChange={(e) => setEditingModel({ ...editingModel, image_url: e.target.value })}
									className={adminInput}
									placeholder="Image URL or upload →"
								/>
								<label className={`${adminButtonGhost} px-3.5 shrink-0 cursor-pointer`}>
									{uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
									<input type="file" accept="image/*" className="hidden" onChange={(e) => { handleModelUpload(e.target.files); e.target.value = '' }} />
								</label>
							</div>
						</div>
						<div>
							<label className={label}>Storage Options</label>
							<input
								value={editingModel.storage_options}
								onChange={(e) => setEditingModel({ ...editingModel, storage_options: e.target.value })}
								className={adminInput}
								placeholder="64 GB, 128 GB, 256 GB, 512 GB, 1 TB"
							/>
							<p className="text-[10px] text-muted-foreground mt-1.5">Comma-separated, shown in this order.</p>
						</div>
						<label className="flex items-center gap-2.5 cursor-pointer mt-1">
							<input
								type="checkbox"
								checked={editingModel.is_active}
								onChange={(e) => setEditingModel({ ...editingModel, is_active: e.target.checked })}
								className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
							/>
							<span className="text-xs font-semibold text-foreground">Active</span>
						</label>
						<div className="flex justify-end gap-3 pt-4 border-t border-border">
							<button onClick={() => setEditingModel(null)} className={adminButtonGhost}>Cancel</button>
							<button onClick={saveModel} disabled={savingModel} className={adminButton}>
								{savingModel && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
								Save Model
							</button>
						</div>
					</div>
				</Modal>
			)}

			{/* ── Problem Modal ───────────────────────────────────────────────── */}
			{editingProblem && (
				<Modal open onClose={() => setEditingProblem(null)} title={editingProblem.id ? 'Edit Problem' : 'Add Problem'}>
					<div className="space-y-4">
						<div>
							<label className={label}>Title</label>
							<input
								value={editingProblem.title}
								onChange={(e) => setEditingProblem({ ...editingProblem, title: e.target.value })}
								className={adminInput}
								placeholder="Damaged Screen or Backplate"
							/>
						</div>
						<div>
							<label className={label}>Description</label>
							<input
								value={editingProblem.description}
								onChange={(e) => setEditingProblem({ ...editingProblem, description: e.target.value })}
								className={adminInput}
								placeholder="Cracked, scratched, or broken glass"
							/>
						</div>
						<div>
							<label className={label}>Severity</label>
							<select
								value={editingProblem.severity}
								onChange={(e) => setEditingProblem({ ...editingProblem, severity: e.target.value as ProblemForm['severity'] })}
								className={adminInput}
							>
								{SEVERITIES.map((s) => (
									<option key={s} value={s}>{s[0].toUpperCase() + s.slice(1)}</option>
								))}
							</select>
							<p className="text-[10px] text-muted-foreground mt-1.5">
								When a customer selects multiple problems, the worst severity wins and sets the device's condition.
							</p>
						</div>
						<label className="flex items-center gap-2.5 cursor-pointer mt-1">
							<input
								type="checkbox"
								checked={editingProblem.is_active}
								onChange={(e) => setEditingProblem({ ...editingProblem, is_active: e.target.checked })}
								className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
							/>
							<span className="text-xs font-semibold text-foreground">Active</span>
						</label>
						<div className="flex justify-end gap-3 pt-4 border-t border-border">
							<button onClick={() => setEditingProblem(null)} className={adminButtonGhost}>Cancel</button>
							<button onClick={saveProblem} disabled={savingProblem} className={adminButton}>
								{savingProblem && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
								Save Problem
							</button>
						</div>
					</div>
				</Modal>
			)}
		</div>
	)
}
