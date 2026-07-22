'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { PageTitle, EmptyState, Modal, adminButton, adminButtonGhost, adminInput } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import type { Category, ProductType } from '@/lib/types'

interface ProductTypeForm {
	id?: string
	name: string
	category_id: string
	is_active: boolean
}

const EMPTY: ProductTypeForm = { name: '', category_id: '', is_active: true }

export default function AdminProductTypesPage() {
	const { toast, confirm } = useToast()
	const { can } = useAdmin()
	const [productTypes, setProductTypes] = useState<ProductType[] | null>(null)
	const [categories, setCategories] = useState<Category[]>([])
	const [editing, setEditing] = useState<ProductTypeForm | null>(null)
	const [saving, setSaving] = useState(false)

	const load = useCallback(() => {
		fetch('/api/admin/product-types')
			.then((res) => res.json())
			.then((json) => setProductTypes(json.productTypes ?? []))
			.catch(() => setProductTypes([]))
		fetch('/api/admin/categories')
			.then((res) => res.json())
			.then((json) => setCategories(json.categories ?? []))
			.catch(() => setCategories([]))
	}, [])

	useEffect(load, [load])

	const categoryName = (categoryId: string | null) => categories.find((c) => c.id === categoryId)?.name ?? '—'

	const save = async () => {
		if (!editing) return
		if (!editing.name.trim()) {
			toast({ title: 'Name is required', variant: 'error' })
			return
		}
		setSaving(true)
		try {
			const res = await fetch(editing.id ? `/api/admin/product-types/${editing.id}` : '/api/admin/product-types', {
				method: editing.id ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(editing),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: editing.id ? 'Product type updated' : 'Product type created', variant: 'success' })
			setEditing(null)
			load()
		} catch (err) {
			toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSaving(false)
		}
	}

	const remove = async (productType: ProductType) => {
		const ok = await confirm({
			title: 'Delete product type?',
			description: `"${productType.name}" will be removed. Deletion is blocked while products are still assigned to it.`,
			confirmLabel: 'Delete',
			destructive: true,
		})
		if (!ok) return
		const res = await fetch(`/api/admin/product-types/${productType.id}`, { method: 'DELETE' })
		const json = await res.json()
		if (res.ok) {
			toast({ title: 'Product type deleted', variant: 'success' })
			load()
		} else {
			toast({ title: 'Cannot delete', description: json.error, variant: 'error' })
		}
	}

	const writable = can('categories:write')
	const label = 'text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block'

	return (
		<div>
			<PageTitle
				title="Product Types"
				subtitle="Fine-grained types (Phone, Case, Charger, ...) mapped to a Category"
				actions={
					writable && (
						<button onClick={() => setEditing(EMPTY)} className={adminButton}>
							<Plus className="w-3.5 h-3.5" />
							Add Product Type
						</button>
					)
				}
			/>

			{productTypes === null ? (
				<TableShimmer />
			) : productTypes.length === 0 ? (
				<EmptyState message="No product types yet." />
			) : (
				<div className="border border-border rounded-3xl overflow-hidden bg-card overflow-x-auto">
					<table className="w-full text-sm min-w-[560px]">
						<thead>
							<tr className="bg-secondary text-left">
								{['Name', 'Category', 'Status', ''].map((h) => (
									<th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">{h}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{productTypes.map((productType) => (
								<tr key={productType.id} className="border-t border-border hover:bg-muted/40 transition-colors">
									<td className="px-5 py-3.5 font-medium text-card-foreground">{productType.name}</td>
									<td className="px-5 py-3.5 text-foreground/75">{categoryName(productType.category_id)}</td>

									<td className="px-5 py-3.5">
										<span
											className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.1em] ${
												productType.is_active ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground/60'
											}`}
										>
											{productType.is_active ? 'Active' : 'Hidden'}
										</span>
									</td>
									<td className="px-5 py-3.5">
										{writable && (
											<div className="flex items-center gap-1.5 justify-end">
												<button
													onClick={() =>
														setEditing({
															id: productType.id,
															name: productType.name,
															category_id: productType.category_id ?? '',
															is_active: productType.is_active,
														})
													}
													className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-all cursor-pointer"
													aria-label="Edit"
												>
													<Pencil className="w-4 h-4" />
												</button>
												<button
													onClick={() => remove(productType)}
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
				<Modal open onClose={() => setEditing(null)} title={editing.id ? 'Edit Product Type' : 'Create Product Type'}>
					<div className="space-y-4">
						<div>
							<label className={label}>Name</label>
							<input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={adminInput} placeholder="Charger" />
						</div>
						<div>
							<label className={label}>Category</label>
							<select
								value={editing.category_id}
								onChange={(e) => setEditing({ ...editing, category_id: e.target.value })}
								className={`${adminInput} cursor-pointer`}
							>
								<option value="">No category</option>
								{categories.map((c) => (
									<option key={c.id} value={c.id}>{c.name}</option>
								))}
							</select>
						</div>
						<label className="flex items-center gap-2.5 cursor-pointer mt-1">
							<input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="w-4 h-4 accent-[var(--primary)] cursor-pointer" />
							<span className="text-xs font-semibold text-foreground">Active</span>
						</label>
						<div className="flex justify-end gap-3 pt-4 border-t border-border">
							<button onClick={() => setEditing(null)} className={adminButtonGhost}>Cancel</button>
							<button onClick={save} disabled={saving} className={adminButton}>
								{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
								Save Product Type
							</button>
						</div>
					</div>
				</Modal>
			)}
		</div>
	)
}
