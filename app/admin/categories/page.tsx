'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Plus, Pencil, Trash2, Upload, Loader2, GripVertical } from 'lucide-react'
import { PageTitle, EmptyState, Modal, adminButton, adminButtonGhost, adminInput } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import { categoryImagePath, uploadViaAdminApi } from '@/lib/storage'
import type { Category } from '@/lib/types'

interface CategoryForm {
	id?: string
	name: string
	slug: string
	image_url: string
	is_active: boolean
	sort_order: number
}

const EMPTY: CategoryForm = { name: '', slug: '', image_url: '', is_active: true, sort_order: 0 }

const DEFAULT_CATEGORY_COVERS: Record<string, string> = {
	iphones: '/iphone_category.webp',
	iphone: '/iphone_category.webp',
	samsungs: '/samsung_category.webp',
	samsung: '/samsung_category.webp',
	ipads: '/ipad_category.webp',
	ipad: '/ipad_category.webp',
	tablets: '/tablets_category.webp',
	tablet: '/tablets_category.webp',
	watches: '/watches_category.webp',
	watch: '/watches_category.webp',
	laptops: '/laptop_category.webp',
	laptop: '/laptop_category.webp',
	'spare-parts': '/spare_parts_category.png?v=2',
	spare_parts: '/spare_parts_category.png?v=2',
	accessories: '/accessories_category.png?v=1',
}

export default function AdminCategoriesPage() {
	const { toast, confirm } = useToast()
	const { can } = useAdmin()
	const [categories, setCategories] = useState<Category[] | null>(null)
	const [editing, setEditing] = useState<CategoryForm | null>(null)
	const [saving, setSaving] = useState(false)
	const [uploading, setUploading] = useState(false)
	const dragIndex = useRef<number | null>(null)

	const load = useCallback(() => {
		fetch('/api/admin/categories')
			.then((res) => res.json())
			.then((json) => setCategories(json.categories ?? []))
			.catch(() => setCategories([]))
	}, [])

	useEffect(load, [load])

	// ── Drag reorder ────────────────────────────────────────────────────────
	const onDragStart = (e: React.DragEvent, index: number) => {
		dragIndex.current = index
		e.dataTransfer.effectAllowed = 'move'
	}

	const onDrop = async (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault()
		if (dragIndex.current === null || dragIndex.current === dropIndex || !categories) return
		const reordered = [...categories]
		const [moved] = reordered.splice(dragIndex.current, 1)
		reordered.splice(dropIndex, 0, moved)
		setCategories(reordered)
		dragIndex.current = null
		await Promise.all(
			reordered.map((c, i) =>
				fetch(`/api/admin/categories/${c.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ sort_order: i }),
				})
			)
		).catch(() => toast({ title: 'Failed to save order', variant: 'error' }))
	}

	const save = async () => {
		if (!editing) return
		if (!editing.name.trim() || !editing.slug.trim()) {
			toast({ title: 'Name and slug are required', variant: 'error' })
			return
		}
		setSaving(true)
		try {
			const res = await fetch(editing.id ? `/api/admin/categories/${editing.id}` : '/api/admin/categories', {
				method: editing.id ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(editing),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: editing.id ? 'Category updated' : 'Category created', variant: 'success' })
			setEditing(null)
			load()
		} catch (err) {
			toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSaving(false)
		}
	}

	const remove = async (category: Category) => {
		const ok = await confirm({
			title: 'Delete category?',
			description: `"${category.name}" will be removed. Deletion is blocked while products are still assigned to it.`,
			confirmLabel: 'Delete',
			destructive: true,
		})
		if (!ok) return
		const res = await fetch(`/api/admin/categories/${category.id}`, { method: 'DELETE' })
		const json = await res.json()
		if (res.ok) {
			toast({ title: 'Category deleted', variant: 'success' })
			load()
		} else {
			toast({ title: 'Cannot delete', description: json.error, variant: 'error' })
		}
	}

	const handleUpload = async (files: FileList | null) => {
		if (!files?.[0] || !editing) return
		if (!editing.slug.trim()) {
			toast({ title: 'Set the slug first', description: 'The slug names the image folder.', variant: 'info' })
			return
		}
		setUploading(true)
		try {
			const url = await uploadViaAdminApi(categoryImagePath(editing.slug, files[0].name), files[0])
			setEditing({ ...editing, image_url: url })
			toast({ title: 'Image uploaded', variant: 'success' })
		} catch (err) {
			toast({ title: 'Upload failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setUploading(false)
		}
	}

	const writable = can('categories:write')
	const label = 'text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block'

	return (
		<div>
			<PageTitle
				title="Categories"
				subtitle="Navigation categories shown on the storefront"
				actions={
					writable && (
						<button onClick={() => setEditing({ ...EMPTY, sort_order: categories?.length ?? 0 })} className={adminButton}>
							<Plus className="w-3.5 h-3.5" />
							Add Category
						</button>
					)
				}
			/>

			{categories === null ? (
				<TableShimmer />
			) : categories.length === 0 ? (
				<EmptyState message="No categories yet." />
			) : (
				<div className="border border-border rounded-3xl overflow-hidden bg-card overflow-x-auto">
					<table className="w-full text-sm min-w-[560px]">
						<thead>
							<tr className="bg-secondary text-left">
								<th className="w-8 px-3 py-3.5" />
								{['Category', 'Slug', 'Status', ''].map((h) => (
									<th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">{h}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{categories.map((category, index) => {
								const coverImage = category.image_url || DEFAULT_CATEGORY_COVERS[category.slug] || ''
								return (
								<tr
									key={category.id}
									draggable={writable}
									onDragStart={(e) => onDragStart(e, index)}
									onDragOver={(e) => e.preventDefault()}
									onDrop={(e) => onDrop(e, index)}
									className="border-t border-border hover:bg-muted/40 transition-colors"
								>
									<td className="pl-3 pr-1 py-3.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing">
										{writable && <GripVertical className="w-4 h-4" />}
									</td>
									<td className="px-5 py-3.5">
										<div className="flex items-center gap-3">
											<div className="w-10 h-10 rounded-xl bg-muted overflow-hidden shrink-0">
												{coverImage && <img src={coverImage} alt="" className="w-full h-full object-cover" />}
											</div>
											<span className="font-medium text-card-foreground">{category.name}</span>
										</div>
									</td>
									<td className="px-5 py-3.5 text-foreground/75 font-mono text-xs">{category.slug}</td>
									<td className="px-5 py-3.5">
										<span
											className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.1em] ${
												category.is_active ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground/60'
											}`}
										>
											{category.is_active ? 'Active' : 'Hidden'}
										</span>
									</td>
									<td className="px-5 py-3.5">
										{writable && (
											<div className="flex items-center gap-1.5 justify-end">
												<button
													onClick={() =>
														setEditing({
															id: category.id,
															name: category.name,
															slug: category.slug,
															image_url: category.image_url ?? '',
															is_active: category.is_active,
															sort_order: category.sort_order,
														})
													}
													className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-all cursor-pointer"
													aria-label="Edit"
												>
													<Pencil className="w-4 h-4" />
												</button>
												<button
													onClick={() => remove(category)}
													className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
													aria-label="Delete"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										)}
									</td>
								</tr>
							)})}
						</tbody>
					</table>
				</div>
			)}

			{editing && (
				<Modal open onClose={() => setEditing(null)} title={editing.id ? 'Edit Category' : 'Create Category'}>
					<div className="space-y-4">
						<div>
							<label className={label}>Name</label>
							<input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={adminInput} placeholder="iPhones" />
						</div>
						<div>
							<label className={label}>Slug</label>
							<input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/\s+/g, '-') })} className={adminInput} placeholder="iphones" />
						</div>
						<div>
							<label className={label}>Category Image</label>
							<div className="flex items-center gap-3">
								<div className="w-14 h-14 rounded-xl bg-muted overflow-hidden border border-border shrink-0">
									{editing.image_url && <img src={editing.image_url} alt="" className="w-full h-full object-cover" />}
								</div>
								<input value={editing.image_url} onChange={(e) => setEditing({ ...editing, image_url: e.target.value })} className={adminInput} placeholder="Image URL or upload →" />
								<label className={`${adminButtonGhost} px-3.5 shrink-0 cursor-pointer`}>
									{uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
									<input type="file" accept="image/*" className="hidden" onChange={(e) => { handleUpload(e.target.files); e.target.value = '' }} />
								</label>
							</div>
						</div>
						<label className="flex items-center gap-2.5 cursor-pointer mt-1">
							<input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="w-4 h-4 accent-[var(--primary)] cursor-pointer" />
							<span className="text-xs font-semibold text-foreground">Active</span>
						</label>
						<div className="flex justify-end gap-3 pt-4 border-t border-border">
							<button onClick={() => setEditing(null)} className={adminButtonGhost}>Cancel</button>
							<button onClick={save} disabled={saving} className={adminButton}>
								{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
								Save Category
							</button>
						</div>
					</div>
				</Modal>
			)}
		</div>
	)
}
