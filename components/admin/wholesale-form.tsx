'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Wand2, Upload, Loader2, Star } from 'lucide-react'
import { adminInput, adminButton, adminButtonGhost, Modal } from '@/components/admin/ui'
import { useToast } from '@/components/ui/toast'
import { productImagePath, uploadViaAdminApi } from '@/lib/storage'
import type { Category, MarketplaceType, ProductCondition } from '@/lib/types'

const DEFAULT_SPEC_KEYS = [
	'Display Size',
	'Storage Capacity',
	'Charging Type',
	'Battery Capacity',
	'Front Camera',
	'Back Camera',
]
const CUSTOM_KEY = '__custom__'

interface SpecRow {
	key: string
	customKey: string
	value: string
}

interface VariantRow {
	id?: string
	color: string
	stock_quantity: number
	price_adjustment: number
}

interface ImageRow {
	image_url: string
	sort_order: number
	is_primary: boolean
}

export interface WholesaleFormValue {
	id?: string
	name: string
	sku: string
	brand: string
	category_id: string
	condition: ProductCondition
	base_price: string
	location: string
	description: string
	is_active: boolean
	specs: SpecRow[]
	variants: VariantRow[]
	marketplaces: MarketplaceType[]
	images: ImageRow[]
	wholesale_colors: string
	lot_quantity: string
}

export const EMPTY_WHOLESALE: WholesaleFormValue = {
	name: '',
	sku: '',
	brand: '',
	category_id: '',
	condition: 'new',
	base_price: '',
	location: '',
	description: '',
	is_active: true,
	specs: [],
	variants: [],
	marketplaces: ['US'],
	images: [],
	wholesale_colors: '',
	lot_quantity: '',
}

export function wholesaleToForm(product: any): WholesaleFormValue {
	return {
		id: product.id,
		name: product.name ?? '',
		sku: product.sku ?? '',
		brand: product.brand ?? '',
		category_id: product.category_id ?? '',
		condition: product.condition ?? 'new',
		base_price: String(product.base_price ?? ''),
		location: product.location ?? '',
		description: product.description ?? '',
		is_active: product.is_active ?? true,
		specs: (product.product_specifications ?? []).map((s: any) => ({
			key: DEFAULT_SPEC_KEYS.includes(s.spec_name) ? s.spec_name : CUSTOM_KEY,
			customKey: DEFAULT_SPEC_KEYS.includes(s.spec_name) ? '' : s.spec_name,
			value: s.spec_value,
		})),
		variants: (product.product_variants ?? []).map((v: any) => ({
			id: v.id,
			color: v.color ?? '',
			stock_quantity: v.stock_quantity ?? 0,
			price_adjustment: Number(v.price_adjustment ?? 0),
		})),
		marketplaces: (product.product_marketplaces ?? []).map((m: any) => m.marketplace),
		images: (product.product_images ?? [])
			.sort((a: any, b: any) => a.sort_order - b.sort_order)
			.map((img: any) => ({ image_url: img.image_url, sort_order: img.sort_order, is_primary: img.is_primary })),
		wholesale_colors: (product.wholesale_variant_colors ?? []).map((c: any) => c.color).join(', '),
		lot_quantity: String(product.lot_quantity ?? ''),
	}
}

function specName(row: SpecRow): string {
	return row.key === CUSTOM_KEY ? row.customKey.trim() : row.key
}

export function formToWholesalePayload(form: WholesaleFormValue) {
	return {
		name: form.name.trim(),
		sku: form.sku.trim() || null,
		brand: form.brand.trim() || null,
		category_id: form.category_id || null,
		condition: form.condition,
		base_price: Number(form.base_price),
		location: form.location.trim() || null,
		description: form.description.trim() || null,
		is_wholesale: true,
		is_active: form.is_active,
		lot_quantity: Number(form.lot_quantity),
		specifications: form.specs
			.filter((s) => specName(s) && s.value.trim())
			.map((s) => ({ spec_name: specName(s), spec_value: s.value.trim() })),
		variants: form.variants
			.filter((v) => v.color.trim() || v.stock_quantity > 0)
			.map((v) => ({
				id: v.id,
				color: v.color.trim() || null,
				stock_quantity: Math.max(0, Math.floor(Number(v.stock_quantity) || 0)),
				price_adjustment: Number(v.price_adjustment) || 0,
			})),
		marketplaces: form.marketplaces,
		images: form.images
			.filter((img) => img.image_url.trim())
			.map((img, index) => ({ ...img, sort_order: index })),
		wholesale_colors: form.wholesale_colors.split(',').map((c) => c.trim()).filter(Boolean),
	}
}

function generateSku(form: WholesaleFormValue): string {
	const compact = (value: string, length: number) =>
		value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, length)

	const brandPart = compact(form.brand, 3)
	const namePart = compact(
		form.name.replace(new RegExp(form.brand, 'ig'), ''),
		5
	)
	const color = form.variants.find((v) => v.color.trim())?.color ?? ''
	const colorPart = compact(color, 2)
	const storage = form.specs.find((s) => specName(s) === 'Storage Capacity')?.value ?? ''
	const storagePart = storage.replace(/[^0-9]/g, '')

	return ['CK', `LOT-${brandPart}${namePart}` || 'LOT', colorPart, storagePart]
		.filter(Boolean)
		.join('-')
}

export function WholesaleFormModal({
	open,
	initial,
	categories,
	onClose,
	onSaved,
}: {
	open: boolean
	initial: WholesaleFormValue
	categories: Category[]
	onClose: () => void
	onSaved: () => void
}) {
	const { toast } = useToast()
	const [form, setForm] = useState<WholesaleFormValue>(initial)
	const [saving, setSaving] = useState(false)
	const [uploading, setUploading] = useState(false)
	const [uploadVariantColor, setUploadVariantColor] = useState('')

	useEffect(() => {
		setForm(initial)
	}, [initial])

	const set = <K extends keyof WholesaleFormValue>(field: K, value: WholesaleFormValue[K]) =>
		setForm((f) => ({ ...f, [field]: value }))

	const save = async () => {
		if (!form.name.trim() || !form.base_price || Number.isNaN(Number(form.base_price))) {
			toast({ title: 'Missing fields', description: 'Lot name and a numeric base price are required.', variant: 'error' })
			return
		}

		// Lot Quantity validation
		const qty = Number(form.lot_quantity)
		if (!form.lot_quantity || Number.isNaN(qty) || qty < 1 || !Number.isInteger(qty)) {
			toast({ title: 'Invalid Lot Quantity', description: 'Lot Quantity is required and must be a positive whole number (minimum 1).', variant: 'error' })
			return
		}

		setSaving(true)
		try {
			const payload = formToWholesalePayload(form)
			const res = await fetch(form.id ? `/api/admin/products/${form.id}` : '/api/admin/products', {
				method: form.id ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error ?? 'Save failed')
			toast({ title: form.id ? 'Wholesale lot updated' : 'Wholesale lot created', variant: 'success' })
			onSaved()
			onClose()
		} catch (err) {
			toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSaving(false)
		}
	}

	const handleUpload = async (files: FileList | null) => {
		if (!files || files.length === 0) return
		if (!form.name.trim()) {
			toast({ title: 'Name the lot first', description: 'The lot name is used for its storage folder.', variant: 'info' })
			return
		}
		setUploading(true)
		try {
			const next = [...form.images]
			for (const file of Array.from(files)) {
				const path = productImagePath(
					form.name,
					form.id ?? 'new',
					file.name,
					uploadVariantColor.trim() || undefined
				)
				const url = await uploadViaAdminApi(path, file)
				next.push({ image_url: url, sort_order: next.length, is_primary: next.length === 0 })
			}
			set('images', next)
			toast({ title: 'Images uploaded', variant: 'success' })
		} catch (err) {
			toast({ title: 'Upload failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setUploading(false)
		}
	}

	const label = 'text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block'

	return (
		<Modal open={open} onClose={onClose} title={form.id ? 'Edit Wholesale Lot' : 'Create Wholesale Lot'} wide>
			<div className="space-y-8">
				{/* Core fields */}
				<div className="grid sm:grid-cols-2 gap-4">
					<div className="sm:col-span-2">
						<label className={label}>Lot Name</label>
						<input value={form.name} onChange={(e) => set('name', e.target.value)} className={adminInput} placeholder="iPhone 15 Pro Mixed Grade Lot" />
					</div>
					<div>
						<label className={label}>SKU</label>
						<div className="flex gap-2">
							<input value={form.sku} onChange={(e) => set('sku', e.target.value)} className={adminInput} placeholder="CK-LOT-IPH15-25" />
							<button
								type="button"
								onClick={() => set('sku', generateSku(form))}
								className={`${adminButtonGhost} shrink-0 px-3.5`}
								title="Auto-generate SKU"
							>
								<Wand2 className="w-3.5 h-3.5" />
								Auto
							</button>
						</div>
					</div>
					<div>
						<label className={label}>Brand</label>
						<input value={form.brand} onChange={(e) => set('brand', e.target.value)} className={adminInput} placeholder="Apple" />
					</div>
					<div>
						<label className={label}>Category</label>
						<select value={form.category_id} onChange={(e) => set('category_id', e.target.value)} className={`${adminInput} cursor-pointer`}>
							<option value="">No category</option>
							{categories.map((c) => (
								<option key={c.id} value={c.id}>{c.name}</option>
							))}
						</select>
					</div>
					<div>
						<label className={label}>Condition</label>
						<select value={form.condition} onChange={(e) => set('condition', e.target.value as ProductCondition)} className={`${adminInput} cursor-pointer`}>
							<option value="new">New</option>
							<option value="used">Used</option>
							<option value="refurbished">Refurbished</option>
						</select>
					</div>
					<div>
						<label className={label}>Base Price (USD)</label>
						<input type="number" step="0.01" value={form.base_price} onChange={(e) => set('base_price', e.target.value)} className={adminInput} placeholder="4999.00" />
					</div>
					<div>
						<label className={label}>Location</label>
						<input value={form.location} onChange={(e) => set('location', e.target.value)} className={adminInput} placeholder="Miami, FL" />
					</div>
					<div className="sm:col-span-2">
						<label className={label}>Description</label>
						<textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className={`${adminInput} resize-none`} placeholder="Describe this wholesale lot..." />
					</div>
					<div className="flex items-center gap-6 sm:col-span-2">
						<label className="flex items-center gap-2.5 cursor-pointer">
							<input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="w-4 h-4 accent-[var(--primary)] cursor-pointer" />
							<span className="text-xs font-semibold text-foreground">Active listing</span>
						</label>
					</div>
				</div>

				{/* Marketplaces */}
				<div>
					<label className={label}>Marketplaces</label>
					<div className="flex gap-4">
						{(['US', 'CA'] as MarketplaceType[]).map((market) => (
							<label key={market} className="flex items-center gap-2.5 px-4 py-2.5 border border-border rounded-full cursor-pointer hover:border-primary transition-colors">
								<input
									type="checkbox"
									checked={form.marketplaces.includes(market)}
									onChange={(e) =>
										set(
											'marketplaces',
											e.target.checked
												? [...form.marketplaces, market]
												: form.marketplaces.filter((m) => m !== market)
										)
									}
									className="w-3.5 h-3.5 accent-[var(--primary)] cursor-pointer"
								/>
								<span className="text-xs font-semibold text-foreground">
									{market === 'US' ? 'US Marketplace' : 'Canada Marketplace'}
								</span>
							</label>
						))}
					</div>
				</div>

				{/* Lot Details Panel (Lot Quantity and Lot Colors) */}
				<div className="border border-border rounded-2xl p-5 space-y-5 bg-secondary/10">
					<h4 className="text-[11px] font-bold uppercase tracking-wider text-foreground">Wholesale Lot Details</h4>
					
					<div>
						<label className={label}>Lot Quantity *</label>
						<input
							type="number"
							min={1}
							step={1}
							value={form.lot_quantity}
							onChange={(e) => set('lot_quantity', e.target.value)}
							className={adminInput}
							placeholder="e.g. 25"
						/>
						<p className="text-[10px] text-muted-foreground mt-1.5 leading-normal">
							Enter the total number of devices included in this wholesale lot.
						</p>
					</div>

					<div>
						<label className={label}>Lot Colors (comma-separated)</label>
						<input
							value={form.wholesale_colors}
							onChange={(e) => set('wholesale_colors', e.target.value)}
							className={adminInput}
							placeholder="Black, Silver, Gold"
						/>
					</div>
				</div>

				{/* Variants grid */}
				<div>
					<div className="flex items-center justify-between mb-3">
						<label className={label}>Variants — Stock & Price Adjustments</label>
						<button
							type="button"
							onClick={() => set('variants', [...form.variants, { color: '', stock_quantity: 0, price_adjustment: 0 }])}
							className={`${adminButtonGhost} px-3.5 py-1.5`}
						>
							<Plus className="w-3 h-3" />
							Add Variant
						</button>
					</div>
					{form.variants.length > 0 && (
						<div className="border border-border rounded-2xl overflow-hidden overflow-x-auto">
							<table className="w-full text-sm min-w-[480px]">
								<thead>
									<tr className="bg-secondary text-left">
										<th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Color</th>
										<th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Stock Qty</th>
										<th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Price Adj. (±)</th>
										<th className="w-12" />
									</tr>
								</thead>
								<tbody>
									{form.variants.map((variant, index) => (
										<tr key={index} className="border-t border-border">
											<td className="px-3 py-2">
												<input
													value={variant.color}
													onChange={(e) => {
														const next = [...form.variants]
														next[index] = { ...variant, color: e.target.value }
														set('variants', next)
													}}
													className={adminInput}
													placeholder="Midnight Blue"
												/>
											</td>
											<td className="px-3 py-2">
												<input
													type="number"
													min={0}
													value={variant.stock_quantity}
													onChange={(e) => {
														const next = [...form.variants]
														next[index] = { ...variant, stock_quantity: Number(e.target.value) }
														set('variants', next)
													}}
													className={adminInput}
												/>
											</td>
											<td className="px-3 py-2">
												<input
													type="number"
													step="0.01"
													value={variant.price_adjustment}
													onChange={(e) => {
														const next = [...form.variants]
														next[index] = { ...variant, price_adjustment: Number(e.target.value) }
														set('variants', next)
													}}
													className={adminInput}
												/>
											</td>
											<td className="px-3 py-2">
												<button
													type="button"
													onClick={() => set('variants', form.variants.filter((_, i) => i !== index))}
													className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
													aria-label="Remove variant"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>

				{/* Specifications editor */}
				<div>
					<div className="flex items-center justify-between mb-3">
						<label className={label}>Specifications</label>
						<button
							type="button"
							onClick={() => set('specs', [...form.specs, { key: DEFAULT_SPEC_KEYS[0], customKey: '', value: '' }])}
							className={`${adminButtonGhost} px-3.5 py-1.5`}
						>
							<Plus className="w-3 h-3" />
							Add Spec
						</button>
					</div>
					<div className="space-y-2.5">
						{form.specs.map((spec, index) => (
							<div key={index} className="flex flex-wrap gap-2.5 items-center">
								<select
									value={spec.key}
									onChange={(e) => {
										const next = [...form.specs]
										next[index] = { ...spec, key: e.target.value }
										set('specs', next)
									}}
									className={`${adminInput} w-44 cursor-pointer`}
								>
									{DEFAULT_SPEC_KEYS.map((key) => (
										<option key={key} value={key}>{key}</option>
									))}
									<option value={CUSTOM_KEY}>Custom Spec Key</option>
								</select>
								{spec.key === CUSTOM_KEY && (
									<input
										placeholder="Custom key"
										value={spec.customKey}
										onChange={(e) => {
											const next = [...form.specs]
											next[index] = { ...spec, customKey: e.target.value }
											set('specs', next)
										}}
										className={`${adminInput} w-40`}
									/>
								)}
								<input
									placeholder="Value"
									value={spec.value}
									onChange={(e) => {
										const next = [...form.specs]
										next[index] = { ...spec, value: e.target.value }
										set('specs', next)
									}}
									className={`${adminInput} flex-1 min-w-[140px]`}
								/>
								<button
									type="button"
									onClick={() => set('specs', form.specs.filter((_, i) => i !== index))}
									className="p-2.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
									aria-label="Remove specification"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						))}
					</div>
				</div>

				{/* Image manager */}
				<div>
					<div className="flex flex-wrap items-center justify-between gap-3 mb-3">
						<label className={label}>Images</label>
						<div className="flex items-center gap-2">
							<input
								placeholder="Variant color folder (optional)"
								value={uploadVariantColor}
								onChange={(e) => setUploadVariantColor(e.target.value)}
								className={`${adminInput} w-52`}
							/>
							<label className={`${adminButtonGhost} px-3.5 py-2 cursor-pointer`}>
								{uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
								Upload
								<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleUpload(e.target.files); e.target.value = '' }} />
							</label>
						</div>
					</div>
					<div className="space-y-2.5">
						{form.images.map((image, index) => (
							<div key={index} className="flex items-center gap-2.5">
								<div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0 border border-border">
									{image.image_url && <img src={image.image_url} alt="" className="w-full h-full object-cover" />}
								</div>
								<input
									placeholder="Paste image URL"
									value={image.image_url}
									onChange={(e) => {
										const next = [...form.images]
										next[index] = { ...image, image_url: e.target.value }
										set('images', next)
									}}
									className={`${adminInput} flex-1`}
								/>
								<button
									type="button"
									onClick={() => {
										set('images', form.images.map((img, i) => ({ ...img, is_primary: i === index })))
									}}
									className={`p-2.5 rounded-full transition-all cursor-pointer ${
										image.is_primary ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-muted'
									}`}
									title="Set as primary"
								>
									<Star className={`w-4 h-4 ${image.is_primary ? 'fill-current' : ''}`} />
								</button>
								<div className="flex flex-col">
									<button
										type="button"
										disabled={index === 0}
										onClick={() => {
											const next = [...form.images]
											;[next[index - 1], next[index]] = [next[index], next[index - 1]]
											set('images', next)
										}}
										className="text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer text-xs leading-none py-0.5"
									>
										▲
									</button>
									<button
										type="button"
										disabled={index === form.images.length - 1}
										onClick={() => {
											const next = [...form.images]
											;[next[index + 1], next[index]] = [next[index], next[index + 1]]
											set('images', next)
										}}
										className="text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer text-xs leading-none py-0.5"
									>
										▼
									</button>
								</div>
								<button
									type="button"
									onClick={() => set('images', form.images.filter((_, i) => i !== index))}
									className="p-2.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
									aria-label="Remove image"
								>
									<Trash2 className="w-4 h-4" />
								</button>
							</div>
						))}
						<button
							type="button"
							onClick={() => set('images', [...form.images, { image_url: '', sort_order: form.images.length, is_primary: form.images.length === 0 }])}
							className={`${adminButtonGhost} px-3.5 py-1.5`}
						>
							<Plus className="w-3 h-3" />
							Add Image URL
						</button>
					</div>
				</div>

				{/* Actions */}
				<div className="flex justify-end gap-3 pt-4 border-t border-border">
					<button type="button" onClick={onClose} className={adminButtonGhost}>Cancel</button>
					<button type="button" onClick={save} disabled={saving} className={adminButton}>
						{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
						{saving ? 'Saving...' : 'Save Lot'}
					</button>
				</div>
			</div>
		</Modal>
	)
}
