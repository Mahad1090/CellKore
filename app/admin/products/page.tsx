'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Pencil, Trash2, Search } from 'lucide-react'
import { PageTitle, EmptyState, adminButton, adminInput } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import {
	ProductFormModal,
	EMPTY_PRODUCT,
	productToForm,
	type ProductFormValue,
} from '@/components/admin/product-form'
import type { Category } from '@/lib/types'

export default function AdminProductsPage() {
	return (
		<Suspense fallback={<TableShimmer />}>
			<ProductsContent />
		</Suspense>
	)
}

function ProductsContent() {
	const searchParams = useSearchParams()
	const { toast, confirm } = useToast()
	const { can } = useAdmin()
	const [products, setProducts] = useState<any[] | null>(null)
	const [categories, setCategories] = useState<Category[]>([])
	const [search, setSearch] = useState('')
	const [editing, setEditing] = useState<ProductFormValue | null>(null)

	const load = useCallback(() => {
		fetch('/api/admin/products?wholesale=false')
			.then((res) => res.json())
			.then((json) => setProducts(json.products ?? []))
			.catch(() => setProducts([]))
	}, [])

	useEffect(() => {
		load()
		fetch('/api/admin/categories')
			.then((res) => res.json())
			.then((json) => setCategories(json.categories ?? []))
			.catch(() => setCategories([]))
	}, [load])

	useEffect(() => {
		if (searchParams.get('new') === '1' && can('products:write')) {
			setEditing(EMPTY_PRODUCT)
		}
	}, [searchParams, can])

	const openEdit = async (id: string) => {
		const res = await fetch(`/api/admin/products/${id}`)
		const json = await res.json()
		if (res.ok) setEditing(productToForm(json.product))
	}

	const remove = async (product: any) => {
		const ok = await confirm({
			title: 'Delete product?',
			description: `"${product.name}" and all of its variants, images and specifications will be permanently removed.`,
			confirmLabel: 'Delete',
			destructive: true,
		})
		if (!ok) return
		const res = await fetch(`/api/admin/products/${product.id}`, { method: 'DELETE' })
		if (res.ok) {
			toast({ title: 'Product deleted', variant: 'success' })
			load()
		} else {
			const json = await res.json()
			toast({ title: 'Delete failed', description: json.error, variant: 'error' })
		}
	}

	const filtered = (products ?? []).filter(
		(p) =>
			!search.trim() ||
			p.name.toLowerCase().includes(search.toLowerCase()) ||
			(p.sku ?? '').toLowerCase().includes(search.toLowerCase()) ||
			(p.brand ?? '').toLowerCase().includes(search.toLowerCase())
	)

	const writable = can('products:write')

	return (
		<div>
			<PageTitle
				title="Products"
				subtitle="Catalog listings and wholesale lots"
				actions={
					writable && (
						<button onClick={() => setEditing(EMPTY_PRODUCT)} className={adminButton}>
							<Plus className="w-3.5 h-3.5" />
							Add Product
						</button>
					)
				}
			/>

			<div className="relative mb-6 max-w-sm">
				<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
				<input
					placeholder="Search by name, SKU, brand..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className={`${adminInput} pl-11`}
				/>
			</div>

			{products === null ? (
				<TableShimmer />
			) : filtered.length === 0 ? (
				<EmptyState message="No products found." />
			) : (
				<div className="border border-border rounded-3xl overflow-hidden overflow-x-auto bg-card">
					<table className="w-full text-sm min-w-[760px]">
						<thead>
							<tr className="bg-secondary text-left">
								{['Product', 'SKU', 'Category', 'Price', 'Stock', 'Status', ''].map((h) => (
									<th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">{h}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{filtered.map((product) => {
								const stock = (product.product_variants ?? []).reduce(
									(sum: number, v: any) => sum + v.stock_quantity,
									0
								)
								const image = (product.product_images ?? []).find((i: any) => i.is_primary) ?? product.product_images?.[0]
								return (
									<tr key={product.id} className="border-t border-border hover:bg-muted/40 transition-colors">
										<td className="px-5 py-3.5">
											<div className="flex items-center gap-3">
												<div className="w-10 h-10 rounded-xl bg-muted overflow-hidden shrink-0">
													{image && <img src={image.image_url} alt="" className="w-full h-full object-cover" />}
												</div>
												<div className="min-w-0">
													<p className="font-medium text-card-foreground truncate max-w-[220px]">{product.name}</p>
													<p className="text-[11px] text-muted-foreground">{product.brand ?? '—'}</p>
												</div>
											</div>
										</td>
										<td className="px-5 py-3.5 text-foreground/75 font-mono text-xs">{product.sku ?? '—'}</td>
										<td className="px-5 py-3.5 text-foreground/75">{product.categories?.name ?? '—'}</td>
										<td className="px-5 py-3.5 font-semibold text-card-foreground">
											${Number(product.base_price).toLocaleString(undefined, { minimumFractionDigits: 2 })}
										</td>
										<td className="px-5 py-3.5">
											<span className={stock === 0 && (product.product_variants ?? []).length > 0 ? 'text-destructive font-semibold' : 'text-foreground/75'}>
												{(product.product_variants ?? []).length === 0 ? '—' : stock}
											</span>
										</td>

										<td className="px-5 py-3.5">
											<span
												className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.1em] ${
													product.is_active ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground/60'
												}`}
											>
												{product.is_active ? 'Active' : 'Inactive'}
											</span>
										</td>
										<td className="px-5 py-3.5">
											{writable && (
												<div className="flex items-center gap-1.5 justify-end">
													<button
														onClick={() => openEdit(product.id)}
														className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-all cursor-pointer"
														aria-label="Edit"
													>
														<Pencil className="w-4 h-4" />
													</button>
													<button
														onClick={() => remove(product)}
														className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
														aria-label="Delete"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												</div>
											)}
										</td>
									</tr>
								)
							})}
						</tbody>
					</table>
				</div>
			)}

			{editing && (
				<ProductFormModal
					open
					initial={editing}
					categories={categories}
					onClose={() => setEditing(null)}
					onSaved={load}
				/>
			)}
		</div>
	)
}
