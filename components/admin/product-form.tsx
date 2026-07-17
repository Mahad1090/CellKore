'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Wand2, Upload, Loader2, Star } from 'lucide-react'
import { adminInput, adminButton, adminButtonGhost, Modal } from '@/components/admin/ui'
import { useToast } from '@/components/ui/toast'
import { productImagePath, uploadViaAdminApi } from '@/lib/storage'
import { MobileSpecsForm } from '@/components/admin/mobile-specs-form'
import { SpecTemplateSection } from '@/components/admin/spec-template-section'
import { getCategoryValues, type MobileSpecifications } from '@/lib/mobile-specs'
import type {
	Category,
	MarketplaceType,
	MobileSpecPreset,
	ProductCondition,
	ProductType,
	SpecTemplate,
	TemplateSpecEntry,
} from '@/lib/types'

interface VariantRow {
	id?: string
	color: string
	swatch_hex: string
	storage: string
	ram: string
	stock_quantity: number
	price_adjustment: number
}

interface ImageRow {
	image_url: string
	sort_order: number
	is_primary: boolean
	variant_color: string
}

export interface ProductFormValue {
	id?: string
	name: string
	sku: string
	brand: string
	category_id: string
	product_type_id: string
	condition: ProductCondition
	base_price: string
	purchase_price: string
	description: string
	is_wholesale: boolean
	is_active: boolean
	mobile_specifications: MobileSpecifications
	spec_template_id: string
	template_name: string
	template_spec_entries: TemplateSpecEntry[]
	template_custom_specs: { label: string; value: string }[]
	variants: VariantRow[]
	marketplaces: MarketplaceType[]
	images: ImageRow[]
	wholesale_colors: string
}

export const EMPTY_PRODUCT: ProductFormValue = {
	name: '',
	sku: '',
	brand: '',
	category_id: '',
	product_type_id: '',
	condition: 'new',
	base_price: '',
	purchase_price: '',
	description: '',
	is_wholesale: false,
	is_active: true,
	mobile_specifications: {},
	spec_template_id: '',
	template_name: '',
	template_spec_entries: [],
	template_custom_specs: [],
	variants: [],
	marketplaces: ['US'],
	images: [],
	wholesale_colors: '',
}

export function productToForm(product: any): ProductFormValue {
	return {
		id: product.id,
		name: product.name ?? '',
		sku: product.sku ?? '',
		brand: product.brand ?? '',
		category_id: product.category_id ?? '',
		product_type_id: product.product_type_id ?? '',
		condition: product.condition ?? 'new',
		base_price: String(product.base_price ?? ''),
		purchase_price: product.purchase_price != null ? String(product.purchase_price) : '',
		description: product.description ?? '',
		is_wholesale: product.is_wholesale ?? false,
		is_active: product.is_active ?? true,
		mobile_specifications: product.mobile_specifications ?? {},
		spec_template_id: product.spec_template_id ?? '',
		template_name: product.template_specifications?.templateName ?? '',
		template_spec_entries: product.template_specifications?.entries ?? [],
		template_custom_specs: product.template_specifications?.custom ?? [],
		variants: (product.product_variants ?? []).map((v: any) => ({
			id: v.id,
			color: v.color ?? '',
			swatch_hex: v.swatch_hex ?? '',
			storage: v.storage ?? '',
			ram: v.ram ?? '',
			stock_quantity: v.stock_quantity ?? 0,
			price_adjustment: Number(v.price_adjustment ?? 0),
		})),
		marketplaces: (product.product_marketplaces ?? []).map((m: any) => m.marketplace),
		images: (product.product_images ?? [])
			.sort((a: any, b: any) => a.sort_order - b.sort_order)
			.map((img: any) => ({
				image_url: img.image_url,
				sort_order: img.sort_order,
				is_primary: img.is_primary,
				variant_color: img.variant_color ?? '',
			})),
		wholesale_colors: (product.wholesale_variant_colors ?? []).map((c: any) => c.color).join(', '),
	}
}

export function formToPayload(form: ProductFormValue) {
	return {
		name: form.name.trim(),
		sku: form.sku.trim() || null,
		brand: form.brand.trim() || null,
		category_id: form.category_id || null,
		product_type_id: form.product_type_id || null,
		spec_template_id: form.spec_template_id || null,
		condition: form.condition,
		base_price: Number(form.base_price),
		purchase_price: form.purchase_price.trim() ? Number(form.purchase_price) : null,
		description: form.description.trim() || null,
		is_wholesale: form.is_wholesale,
		is_active: form.is_active,
		mobile_specifications: {
			...form.mobile_specifications,
			custom: (form.mobile_specifications.custom ?? []).filter((c) => c.key.trim() && c.value.trim()),
		},
		template_specifications: {
			templateName: form.template_name || undefined,
			entries: form.template_spec_entries.filter((e) => e.value.trim()),
			custom: form.template_custom_specs.filter((c) => c.label.trim() && c.value.trim()),
		},
		variants: form.variants
			.filter((v) => v.color.trim() || v.stock_quantity > 0)
			.map((v) => ({
				id: v.id,
				color: v.color.trim() || null,
				swatch_hex: v.swatch_hex.trim() || null,
				storage: v.storage.trim() || null,
				ram: v.ram.trim() || null,
				stock_quantity: Math.max(0, Math.floor(Number(v.stock_quantity) || 0)),
				price_adjustment: Number(v.price_adjustment) || 0,
			})),
		marketplaces: form.marketplaces,
		images: form.images
			.filter((img) => img.image_url.trim())
			.map((img, index) => ({ ...img, sort_order: index, variant_color: img.variant_color.trim() || null })),
		wholesale_colors: form.is_wholesale
			? form.wholesale_colors.split(',').map((c) => c.trim()).filter(Boolean)
			: [],
	}
}

/**
 * Auto-SKU: parses brand, name, first variant color, and storage capacity into
 * a standardized SKU, e.g. CK-IPH15-BL-128.
 */
function generateSku(form: ProductFormValue): string {
	const compact = (value: string, length: number) =>
		value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, length)

	const brandPart = compact(form.brand, 3)
	const namePart = compact(
		form.name.replace(new RegExp(form.brand, 'ig'), ''),
		5
	)
	const color = form.variants.find((v) => v.color.trim())?.color ?? ''
	const colorPart = compact(color, 2)
	const storage =
		form.variants.find((v) => v.storage.trim())?.storage ??
		getCategoryValues(form.mobile_specifications, 'memory').internalStorage ??
		''
	const storagePart = storage.replace(/[^0-9]/g, '')

	return ['CK', `${brandPart}${namePart}` || 'ITEM', colorPart, storagePart]
		.filter(Boolean)
		.join('-')
}

export function ProductFormModal({
	open,
	initial,
	categories,
	productTypes,
	specTemplates,
	mobileSpecPresets,
	onPresetCreated,
	onClose,
	onSaved,
}: {
	open: boolean
	initial: ProductFormValue
	categories: Category[]
	productTypes: ProductType[]
	specTemplates: SpecTemplate[]
	mobileSpecPresets: MobileSpecPreset[]
	onPresetCreated: (preset: MobileSpecPreset) => void
	onClose: () => void
	onSaved: () => void
}) {
	const { toast } = useToast()
	const [form, setForm] = useState<ProductFormValue>(initial)
	const [saving, setSaving] = useState(false)
	const [uploading, setUploading] = useState(false)
	const [uploadVariantColor, setUploadVariantColor] = useState('')
	const [profitPercent, setProfitPercent] = useState('')
	const [selectedPresetId, setSelectedPresetId] = useState('')
	const [presetNameInput, setPresetNameInput] = useState<string | null>(null)
	const [savingPreset, setSavingPreset] = useState(false)

	useEffect(() => {
		setForm(initial)
		const purchase = Number(initial.purchase_price)
		const base = Number(initial.base_price)
		if (initial.purchase_price.trim() && purchase > 0 && initial.base_price.trim() && !Number.isNaN(base)) {
			setProfitPercent((((base - purchase) / purchase) * 100).toFixed(1))
		} else {
			setProfitPercent('')
		}
	}, [initial])

	const set = <K extends keyof ProductFormValue>(field: K, value: ProductFormValue[K]) =>
		setForm((f) => ({ ...f, [field]: value }))

	// Purchase Price / Profit % / Base Price (selling price) are a three-way calculator:
	// editing any one of the first two recomputes Base Price; editing Base Price recomputes Profit %.
	const handlePurchasePriceChange = (value: string) => {
		set('purchase_price', value)
		const purchase = Number(value)
		if (!value.trim() || Number.isNaN(purchase) || purchase <= 0) return
		if (profitPercent.trim() && !Number.isNaN(Number(profitPercent))) {
			set('base_price', (purchase * (1 + Number(profitPercent) / 100)).toFixed(2))
		} else if (form.base_price.trim() && !Number.isNaN(Number(form.base_price))) {
			setProfitPercent((((Number(form.base_price) - purchase) / purchase) * 100).toFixed(1))
		}
	}

	const handleProfitPercentChange = (value: string) => {
		setProfitPercent(value)
		const percent = Number(value)
		const purchase = Number(form.purchase_price)
		if (value.trim() && !Number.isNaN(percent) && purchase > 0) {
			set('base_price', (purchase * (1 + percent / 100)).toFixed(2))
		}
	}

	const handleBasePriceChange = (value: string) => {
		set('base_price', value)
		const base = Number(value)
		const purchase = Number(form.purchase_price)
		if (value.trim() && !Number.isNaN(base) && purchase > 0) {
			setProfitPercent((((base - purchase) / purchase) * 100).toFixed(1))
		}
	}

	const save = async () => {
		if (!form.name.trim() || !form.base_price || Number.isNaN(Number(form.base_price))) {
			toast({ title: 'Missing fields', description: 'Product name and a numeric base price are required.', variant: 'error' })
			return
		}
		setSaving(true)
		try {
			const payload = formToPayload(form)
			const res = await fetch(form.id ? `/api/admin/products/${form.id}` : '/api/admin/products', {
				method: form.id ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error ?? 'Save failed')
			toast({ title: form.id ? 'Product updated' : 'Product created', variant: 'success' })
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
			toast({ title: 'Name the product first', description: 'The product name is used for its storage folder.', variant: 'info' })
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
				next.push({ image_url: url, sort_order: next.length, is_primary: next.length === 0, variant_color: uploadVariantColor })
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
	// Canada marketplace prices in CAD; otherwise (US only, or no marketplace picked yet) prices are USD.
	const currency = form.marketplaces.includes('CA') ? 'CAD' : 'USD'
	// Unset product type (including all pre-existing products) defaults to showing Mobile
	// Specifications, matching behavior before Product Types existed; an explicit non-phone
	// type (Charger, Phone Case, ...) hides it.
	const selectedProductType = productTypes.find((t) => t.id === form.product_type_id)
	const showMobileSpecs = !form.product_type_id || selectedProductType?.is_phone_type

	const handleProductTypeChange = (typeId: string) => {
		set('product_type_id', typeId)
		const matched = productTypes.find((t) => t.id === typeId)
		if (matched?.category_id) set('category_id', matched.category_id)
	}

	// Spec Templates only apply where Mobile Specifications doesn't (non-phone product types) —
	// the two are mutually exclusive per product.
	const templatesForType = specTemplates.filter((t) => t.product_type_id === form.product_type_id && t.is_active)

	// Picking a template just selects it; the admin then explicitly chooses whether to import its
	// default values or start blank (importTemplateFields), so switching templates never silently
	// discards or auto-fills values.
	const handleSpecTemplateChange = (templateId: string) => {
		const matched = templatesForType.find((t) => t.id === templateId)
		set('spec_template_id', templateId)
		set('template_name', matched?.name ?? '')
	}

	const importTemplateFields = (withValues: boolean) => {
		const matched = templatesForType.find((t) => t.id === form.spec_template_id)
		set(
			'template_spec_entries',
			(matched?.spec_template_fields ?? [])
				.slice()
				.sort((a, b) => a.sort_order - b.sort_order)
				.map((field) => ({
					key: field.key,
					label: field.label,
					value: withValues ? field.default_value ?? '' : '',
					type: field.field_type,
					unit: field.unit,
					options: field.options,
				}))
		)
	}

	// Presets matching the current Brand (substring, case-insensitive) sort first, same idea as
	// getBrandFeatureCategories — a preset's values are copied in directly, replacing whatever's there.
	const sortedPresets = [...mobileSpecPresets]
		.filter((p) => p.is_active)
		.sort((a, b) => {
			const matches = (p: MobileSpecPreset) =>
				p.brand && form.brand && p.brand.toLowerCase().includes(form.brand.trim().toLowerCase()) ? 0 : 1
			return matches(a) - matches(b)
		})

	const loadPreset = () => {
		const preset = mobileSpecPresets.find((p) => p.id === selectedPresetId)
		if (preset) set('mobile_specifications', preset.mobile_specifications)
	}

	const saveAsPreset = async () => {
		if (!presetNameInput?.trim()) return
		setSavingPreset(true)
		try {
			const res = await fetch('/api/admin/mobile-spec-presets', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: presetNameInput.trim(),
					brand: form.brand,
					mobile_specifications: form.mobile_specifications,
				}),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			onPresetCreated(json.mobileSpecPreset)
			toast({ title: 'Preset saved', variant: 'success' })
			setPresetNameInput(null)
		} catch (err) {
			toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSavingPreset(false)
		}
	}

	return (
		<Modal open={open} onClose={onClose} title={form.id ? 'Edit Product' : 'Create Product'} wide>
			<div className="space-y-8">
				{/* Marketplace — first, since it determines the pricing currency below. A listing is
				    always exactly one marketplace, never both, so this is single-select. */}
				<div>
					<label className={label}>Marketplace</label>
					<div className="flex gap-4">
						{(['US', 'CA'] as MarketplaceType[]).map((market) => (
							<label
								key={market}
								className={`flex items-center gap-2.5 px-4 py-2.5 border rounded-full cursor-pointer transition-colors ${
									form.marketplaces[0] === market ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
								}`}
							>
								<input
									type="radio"
									name="marketplace"
									checked={form.marketplaces[0] === market}
									onChange={() => set('marketplaces', [market])}
									className="w-3.5 h-3.5 accent-[var(--primary)] cursor-pointer"
								/>
								<span className="text-xs font-semibold text-foreground">
									{market === 'US' ? 'US Marketplace' : 'Canada Marketplace'}
								</span>
							</label>
						))}
					</div>
					<p className="text-xs text-muted-foreground mt-2.5">
						Pricing below is entered in <strong className="text-foreground">{currency}</strong>.
					</p>
				</div>

				{/* Category + Product Type — Category first (the main classification), Product Type
				    to its right (a finer-grained sub-type that auto-fills Category as a convenience). */}
				<div className="grid sm:grid-cols-2 gap-4">
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
						<label className={label}>Product Type</label>
						<select
							value={form.product_type_id}
							onChange={(e) => handleProductTypeChange(e.target.value)}
							className={`${adminInput} cursor-pointer`}
						>
							<option value="">No product type</option>
							{productTypes.map((t) => (
								<option key={t.id} value={t.id}>{t.name}</option>
							))}
						</select>
					</div>
				</div>

				{/* Core fields */}
				<div className="grid sm:grid-cols-2 gap-4">
					<div className="sm:col-span-2">
						<label className={label}>Name</label>
						<input value={form.name} onChange={(e) => set('name', e.target.value)} className={adminInput} placeholder="iPhone 15 Pro Max" />
					</div>
					<div>
						<label className={label}>SKU</label>
						<div className="flex gap-2">
							<input value={form.sku} onChange={(e) => set('sku', e.target.value)} className={adminInput} placeholder="CK-IPH15-BL-128" />
							<button
								type="button"
								onClick={() => set('sku', generateSku(form))}
								className={`${adminButtonGhost} shrink-0 px-3.5`}
								title="Auto-generate SKU from brand, name, color and storage"
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
						<label className={label}>Condition</label>
						<select value={form.condition} onChange={(e) => set('condition', e.target.value as ProductCondition)} className={`${adminInput} cursor-pointer`}>
							<option value="new">New</option>
							<option value="used">Used</option>
							<option value="refurbished">Refurbished</option>
						</select>
					</div>
					<div>
						<label className={label}>Purchase Price (Cost, <strong className="text-foreground">{currency}</strong>)</label>
						<input
							type="number"
							step="0.01"
							value={form.purchase_price}
							onChange={(e) => handlePurchasePriceChange(e.target.value)}
							className={adminInput}
							placeholder="600.00"
						/>
					</div>
					<div>
						<label className={label}>Profit %</label>
						<input
							type="number"
							step="0.1"
							value={profitPercent}
							onChange={(e) => handleProfitPercentChange(e.target.value)}
							className={adminInput}
							placeholder="20"
						/>
					</div>
					<div>
						<label className={label}>Base Price (Selling Price, <strong className="text-foreground">{currency}</strong>)</label>
						<input
							type="number"
							step="0.01"
							value={form.base_price}
							onChange={(e) => handleBasePriceChange(e.target.value)}
							className={adminInput}
							placeholder="999.00"
						/>
					</div>
					<div className="sm:col-span-2">
						<label className={label}>Description</label>
						<textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className={`${adminInput} resize-none`} />
					</div>
					<div className="flex items-center gap-6 sm:col-span-2">
						<label className="flex items-center gap-2.5 cursor-pointer">
							<input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="w-4 h-4 accent-[var(--primary)] cursor-pointer" />
							<span className="text-xs font-semibold text-foreground">Active listing</span>
						</label>
					</div>
				</div>

				{/* Mobile specifications editor — only for phone-type products */}
				{showMobileSpecs && (
					<div>
						<label className={`${label} mb-3`}>Mobile Specifications</label>

						<div className="flex flex-wrap items-center gap-2.5 mb-4">
							<select
								value={selectedPresetId}
								onChange={(e) => setSelectedPresetId(e.target.value)}
								className={`${adminInput} w-auto min-w-[220px] cursor-pointer`}
							>
								<option value="">Load a preset...</option>
								{sortedPresets.map((p) => (
									<option key={p.id} value={p.id}>{p.name}{p.brand ? ` (${p.brand})` : ''}</option>
								))}
							</select>
							<button
								type="button"
								onClick={loadPreset}
								disabled={!selectedPresetId}
								className={`${adminButtonGhost} px-3.5 py-2 disabled:opacity-50 disabled:cursor-not-allowed`}
							>
								Load Preset
							</button>

							{presetNameInput === null ? (
								<button type="button" onClick={() => setPresetNameInput('')} className={`${adminButtonGhost} px-3.5 py-2`}>
									Save as Preset
								</button>
							) : (
								<div className="flex items-center gap-2">
									<input
										autoFocus
										value={presetNameInput}
										onChange={(e) => setPresetNameInput(e.target.value)}
										placeholder="Preset name, e.g. iPhone 15 Pro"
										className={`${adminInput} w-auto min-w-[200px]`}
									/>
									<button type="button" onClick={saveAsPreset} disabled={savingPreset} className={`${adminButtonGhost} px-3.5 py-2`}>
										{savingPreset && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
										Save
									</button>
									<button type="button" onClick={() => setPresetNameInput(null)} className={`${adminButtonGhost} px-3.5 py-2`}>
										Cancel
									</button>
								</div>
							)}
						</div>
						<p className="text-xs text-muted-foreground -mt-2 mb-4">
							Loading a preset replaces the fields below with its saved values — still fully editable per-product afterward.
						</p>

						<MobileSpecsForm
							value={form.mobile_specifications}
							brand={form.brand}
							onChange={(next) => set('mobile_specifications', next)}
						/>
					</div>
				)}

				{/* Spec Template editor — only for non-phone-type products that have at least one template */}
				{!showMobileSpecs && templatesForType.length > 0 && (
					<div>
						<label className={`${label} mb-3`}>Specifications</label>
						<SpecTemplateSection
							templates={templatesForType}
							selectedTemplateId={form.spec_template_id}
							onSelectTemplate={handleSpecTemplateChange}
							onImport={importTemplateFields}
							entries={form.template_spec_entries}
							onEntriesChange={(next) => set('template_spec_entries', next)}
							custom={form.template_custom_specs}
							onCustomChange={(next) => set('template_custom_specs', next)}
						/>
					</div>
				)}

				{/* Variants grid */}
				<div>
					<div className="flex items-center justify-between mb-3">
						<label className={label}>Variants — Stock & Price Adjustments</label>
						<button
							type="button"
							onClick={() => set('variants', [...form.variants, { color: '', swatch_hex: '#cccccc', storage: '', ram: '', stock_quantity: 0, price_adjustment: 0 }])}
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
										<th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">RAM</th>
										<th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Storage</th>
										<th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Stock Qty</th>
										<th className="px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Price Adj. (± <strong className="text-foreground">{currency}</strong>)</th>
										<th className="w-12" />
									</tr>
								</thead>
								<tbody>
									{form.variants.map((variant, index) => (
										<tr key={index} className="border-t border-border">
											<td className="px-3 py-2">
												<div className="flex items-center gap-2">
													<input
														type="color"
														value={variant.swatch_hex || '#cccccc'}
														onChange={(e) => {
															const next = [...form.variants]
															next[index] = { ...variant, swatch_hex: e.target.value }
															set('variants', next)
														}}
														className="w-8 h-8 rounded-full border border-border cursor-pointer shrink-0 p-0 bg-transparent"
														title="Swatch color"
													/>
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
												</div>
											</td>
											<td className="px-3 py-2">
												<input
													value={variant.ram}
													onChange={(e) => {
														const next = [...form.variants]
														next[index] = { ...variant, ram: e.target.value }
														set('variants', next)
													}}
													className={adminInput}
													placeholder="8GB"
												/>
											</td>
											<td className="px-3 py-2">
												<input
													value={variant.storage}
													onChange={(e) => {
														const next = [...form.variants]
														next[index] = { ...variant, storage: e.target.value }
														set('variants', next)
													}}
													className={adminInput}
													placeholder="128GB"
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



				{/* Image manager — grouped by variant color, uploads/new rows tag to the selected color */}
				<div>
					<div className="flex flex-wrap items-center justify-between gap-3 mb-3">
						<label className={label}>Images</label>
						<div className="flex items-center gap-2">
							<select
								value={uploadVariantColor}
								onChange={(e) => setUploadVariantColor(e.target.value)}
								className={`${adminInput} w-52 cursor-pointer`}
							>
								<option value="">Shared (all colors)</option>
								{form.variants
									.map((v) => v.color.trim())
									.filter(Boolean)
									.map((color) => (
										<option key={color} value={color}>{color}</option>
									))}
							</select>
							<label className={`${adminButtonGhost} px-3.5 py-2 cursor-pointer`}>
								{uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
								Upload
								<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleUpload(e.target.files); e.target.value = '' }} />
							</label>
							<button
								type="button"
								onClick={() =>
									set('images', [
										...form.images,
										{ image_url: '', sort_order: form.images.length, is_primary: form.images.length === 0, variant_color: uploadVariantColor },
									])
								}
								className={`${adminButtonGhost} px-3.5 py-1.5`}
							>
								<Plus className="w-3 h-3" />
								Add Image URL
							</button>
						</div>
					</div>
					<div className="space-y-5">
						{[
							{ color: '', label: 'Shared (all colors)' },
							...form.variants
								.map((v) => v.color.trim())
								.filter(Boolean)
								.filter((color, i, arr) => arr.indexOf(color) === i)
								.map((color) => ({ color, label: color })),
						].map((group) => {
							const rows = form.images
								.map((image, index) => ({ image, index }))
								.filter(({ image }) => image.variant_color.trim() === group.color)
							if (group.color && rows.length === 0) return null
							return (
								<div key={group.color || '__shared__'}>
									<p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-2">{group.label}</p>
									<div className="space-y-2.5">
										{rows.map(({ image, index }, groupPos) => (
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
													title="Set as primary/thumbnail image"
												>
													<Star className={`w-4 h-4 ${image.is_primary ? 'fill-current' : ''}`} />
												</button>
												<div className="flex flex-col">
													<button
														type="button"
														disabled={groupPos === 0}
														onClick={() => {
															const prevIndex = rows[groupPos - 1].index
															const next = [...form.images]
															;[next[prevIndex], next[index]] = [next[index], next[prevIndex]]
															set('images', next)
														}}
														className="text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer text-xs leading-none py-0.5"
														aria-label="Move up"
													>
														▲
													</button>
													<button
														type="button"
														disabled={groupPos === rows.length - 1}
														onClick={() => {
															const nextIndex = rows[groupPos + 1].index
															const next = [...form.images]
															;[next[nextIndex], next[index]] = [next[index], next[nextIndex]]
															set('images', next)
														}}
														className="text-muted-foreground hover:text-foreground disabled:opacity-30 cursor-pointer text-xs leading-none py-0.5"
														aria-label="Move down"
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
										{rows.length === 0 && (
											<p className="text-xs text-muted-foreground">No images yet.</p>
										)}
									</div>
								</div>
							)
						})}
					</div>
				</div>

				{/* Actions */}
				<div className="flex justify-end gap-3 pt-4 border-t border-border">
					<button type="button" onClick={onClose} className={adminButtonGhost}>Cancel</button>
					<button type="button" onClick={save} disabled={saving} className={adminButton}>
						{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
						{saving ? 'Saving...' : 'Save Product'}
					</button>
				</div>
			</div>
		</Modal>
	)
}
