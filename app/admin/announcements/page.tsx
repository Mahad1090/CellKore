'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, GripVertical, Palette, Check, Sparkles } from 'lucide-react'
import { PageTitle, EmptyState, Modal, adminButton, adminButtonGhost, adminInput } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import type { Announcement } from '@/lib/types'
import { ANNOUNCEMENT_THEMES, getAnnouncementTheme, DEFAULT_ANNOUNCEMENT_THEME_ID } from '@/lib/announcement-themes'

interface AnnouncementForm {
	id?: string
	text: string
	sort_order: number
	is_active: boolean
}

const EMPTY: AnnouncementForm = { text: '', sort_order: 0, is_active: true }

export default function AdminAnnouncementsPage() {
	const { toast, confirm } = useToast()
	const { can } = useAdmin()
	const [announcements, setAnnouncements] = useState<Announcement[] | null>(null)
	const [editing, setEditing] = useState<AnnouncementForm | null>(null)
	const [saving, setSaving] = useState(false)
	const dragIndex = useRef<number | null>(null)

	const [activeThemeId, setActiveThemeId] = useState<string>(DEFAULT_ANNOUNCEMENT_THEME_ID)

	useEffect(() => {
		try {
			const saved = localStorage.getItem('cellkore_announcement_theme')
			if (saved) setActiveThemeId(saved)
		} catch {}
	}, [])

	const handleSelectTheme = (themeId: string) => {
		setActiveThemeId(themeId)
		try {
			localStorage.setItem('cellkore_announcement_theme', themeId)
		} catch {}
		toast({ title: 'Announcement theme updated!', description: 'Theme preview has been applied live to your store.', variant: 'success' })
	}

	const load = useCallback(() => {
		fetch('/api/admin/announcements')
			.then((res) => res.json())
			.then((json) => setAnnouncements(json.announcements ?? []))
			.catch(() => setAnnouncements([]))
	}, [])

	useEffect(load, [load])

	// ── Drag reorder ────────────────────────────────────────────────────────
	const onDragStart = (e: React.DragEvent, index: number) => {
		dragIndex.current = index
		e.dataTransfer.effectAllowed = 'move'
	}

	const onDrop = async (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault()
		if (dragIndex.current === null || dragIndex.current === dropIndex || !announcements) return
		const reordered = [...announcements]
		const [moved] = reordered.splice(dragIndex.current, 1)
		reordered.splice(dropIndex, 0, moved)
		setAnnouncements(reordered)
		dragIndex.current = null
		await Promise.all(
			reordered.map((a, i) =>
				fetch(`/api/admin/announcements/${a.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ sort_order: i }),
				})
			)
		).catch(() => toast({ title: 'Failed to save order', variant: 'error' }))
	}

	const save = async () => {
		if (!editing) return
		if (!editing.text.trim()) {
			toast({ title: 'Text is required', variant: 'error' })
			return
		}
		setSaving(true)
		try {
			const res = await fetch(editing.id ? `/api/admin/announcements/${editing.id}` : '/api/admin/announcements', {
				method: editing.id ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(editing),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: editing.id ? 'Announcement updated' : 'Announcement created', variant: 'success' })
			setEditing(null)
			load()
		} catch (err) {
			toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSaving(false)
		}
	}

	const remove = async (announcement: Announcement) => {
		const ok = await confirm({
			title: 'Delete announcement?',
			description: `"${announcement.text}" will be removed from the announcement bar.`,
			confirmLabel: 'Delete',
			destructive: true,
		})
		if (!ok) return
		const res = await fetch(`/api/admin/announcements/${announcement.id}`, { method: 'DELETE' })
		const json = await res.json()
		if (res.ok) {
			toast({ title: 'Announcement deleted', variant: 'success' })
			load()
		} else {
			toast({ title: 'Cannot delete', description: json.error, variant: 'error' })
		}
	}

	const writable = can('cms:write')
	const label = 'text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block'

	return (
		<div>
			<PageTitle
				title="Announcement Bar"
				subtitle="Messages shown in the scrolling bar at the top of the customer-facing site — drag rows to reorder"
				actions={
					writable && (
						<button onClick={() => setEditing({ ...EMPTY, sort_order: announcements?.length ?? 0 })} className={adminButton}>
							<Plus className="w-3.5 h-3.5" />
							Add Announcement
						</button>
					)
				}
			/>

			{/* Theme & Color Combo Switcher */}
			<div className="bg-card border border-border rounded-3xl p-6 mb-8 shadow-3xs">
				<div className="flex items-center justify-between border-b border-border pb-4 mb-5">
					<div>
						<h3 className="text-xs font-extrabold uppercase tracking-wider text-card-foreground flex items-center gap-2">
							<Palette className="w-4 h-4 text-[#599161]" />
							Announcement Bar Theme & Color Presets
						</h3>
						<p className="text-[11px] text-muted-foreground mt-0.5">
							Click any gradient or color combo below to change the announcement bar style live across your store.
						</p>
					</div>
					<span className="text-[10px] font-mono font-bold bg-[#EEF7F0] text-[#599161] px-3 py-1 rounded-full uppercase">
						Active: {getAnnouncementTheme(activeThemeId).name}
					</span>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
					{ANNOUNCEMENT_THEMES.map((t) => {
						const isSelected = t.id === activeThemeId
						return (
							<button
								key={t.id}
								type="button"
								onClick={() => handleSelectTheme(t.id)}
								className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
									isSelected ? 'border-[#599161] ring-2 ring-[#599161]/30 bg-[#EEF7F0]/30' : 'border-border hover:border-foreground/30 bg-muted/20'
								}`}
							>
								<div className="h-6 w-full rounded-lg mb-3 shadow-inner flex items-center justify-end px-2" style={{ background: t.previewCss }}>
									{isSelected && <Check className="w-3.5 h-3.5 text-white drop-shadow" />}
								</div>
								<p className="text-xs font-bold text-card-foreground truncate">{t.name}</p>
								<span className="text-[9px] font-mono text-muted-foreground block mt-0.5">{t.id}</span>
							</button>
						)
					})}
				</div>
			</div>

			{announcements === null ? (
				<TableShimmer />
			) : announcements.length === 0 ? (
				<EmptyState message="No announcements yet." />
			) : (
				<div className="border border-border rounded-3xl overflow-hidden bg-card overflow-x-auto">
					<table className="w-full text-sm min-w-[560px]">
						<thead>
							<tr className="bg-secondary text-left">
								<th className="w-8 px-3 py-3.5" />
								{['Message', 'Status', ''].map((h) => (
									<th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">{h}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{announcements.map((announcement, index) => (
								<tr
									key={announcement.id}
									draggable={writable}
									onDragStart={(e) => onDragStart(e, index)}
									onDragOver={(e) => e.preventDefault()}
									onDrop={(e) => onDrop(e, index)}
									className="border-t border-border hover:bg-muted/40 transition-colors"
								>
									<td className="pl-3 pr-1 py-3.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing">
										{writable && <GripVertical className="w-4 h-4" />}
									</td>
									<td className="px-5 py-3.5 font-medium text-card-foreground">{announcement.text}</td>
									<td className="px-5 py-3.5">
										<span
											className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.1em] ${
												announcement.is_active ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground/60'
											}`}
										>
											{announcement.is_active ? 'Active' : 'Hidden'}
										</span>
									</td>
									<td className="px-5 py-3.5">
										{writable && (
											<div className="flex items-center gap-1.5 justify-end">
												<button
													onClick={() =>
														setEditing({
															id: announcement.id,
															text: announcement.text,
															sort_order: announcement.sort_order,
															is_active: announcement.is_active,
														})
													}
													className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-all cursor-pointer"
													aria-label="Edit"
												>
													<Pencil className="w-4 h-4" />
												</button>
												<button
													onClick={() => remove(announcement)}
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
				<Modal open onClose={() => setEditing(null)} title={editing.id ? 'Edit Announcement' : 'Create Announcement'}>
					<div className="space-y-4">
						<div>
							<label className={label}>Message</label>
							<input
								value={editing.text}
								onChange={(e) => setEditing({ ...editing, text: e.target.value })}
								className={adminInput}
								placeholder="Complimentary Express Delivery on All Orders"
							/>
						</div>
						<label className="flex items-center gap-2.5 cursor-pointer mt-1">
							<input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="w-4 h-4 accent-[var(--primary)] cursor-pointer" />
							<span className="text-xs font-semibold text-foreground">Active</span>
						</label>
						<div className="flex justify-end gap-3 pt-4 border-t border-border">
							<button onClick={() => setEditing(null)} className={adminButtonGhost}>Cancel</button>
							<button onClick={save} disabled={saving} className={adminButton}>
								{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
								Save Announcement
							</button>
						</div>
					</div>
				</Modal>
			)}
		</div>
	)
}
