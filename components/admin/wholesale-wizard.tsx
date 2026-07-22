'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Upload, Loader2, Star, ChevronLeft, ChevronRight, Check, ImageOff, Eye } from 'lucide-react'
import { adminInput, adminButton, adminButtonGhost, Modal } from '@/components/admin/ui'
import { useToast } from '@/components/ui/toast'
import { productImagePath, uploadViaAdminApi } from '@/lib/storage'
import type { Category, ProductType, ProductCondition, CarrierLockStatus } from '@/lib/types'

interface ItemRow {
	model_name: string
	storage: string
	ram: string
	color: string
	swatch_hex: string
	quantity: number
	condition: ProductCondition
	carrier_lock: CarrierLockStatus
	image_url: string
}

interface ImageRow {
	image_url: string
	sort_order: number
	is_primary: boolean
}

const EMPTY_ITEM: ItemRow = {
	model_name: '',
	storage: '',
	ram: '',
	color: '',
	swatch_hex: '#cccccc',
	quantity: 0,
	condition: 'new',
	carrier_lock: 'unlocked',
	image_url: '',
}

type Tab = 'general' | 'pricing' | 'composition' | 'photos' | 'review'
const TABS: Tab[] = ['general', 'pricing', 'composition', 'photos', 'review']

function compact(value: string, length: number): string {
	return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, length)
}

function pad(value: number, length: number): string {
	return String(value).padStart(length, '0')
}

function dateStamp(): string {
	const now = new Date()
	return `${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1, 2)}${pad(now.getDate(), 2)}`
}

export function WholesaleLotWizard({
	open,
	categories,
	onClose,
	onSaved,
}: {
	open: boolean
	categories: Category[]
	onClose: () => void
	onSaved: () => void
}) {
	const { toast } = useToast()
	const [activeTab, setActiveTab] = useState<Tab>('general')
	const [productTypes, setProductTypes] = useState<ProductType[]>([])

	const [categoryId, setCategoryId] = useState('')
	const [productTypeId, setProductTypeId] = useState('')
	const [name, setName] = useState('')
	const [purchasePrice, setPurchasePrice] = useState('')
	const [profitPercent, setProfitPercent] = useState('')
	const [basePrice, setBasePrice] = useState('')
	const [numberOfLots, setNumberOfLots] = useState('1')
	const [quantityPerLot, setQuantityPerLot] = useState('')
	const [items, setItems] = useState<ItemRow[]>([{ ...EMPTY_ITEM }])
	const [images, setImages] = useState<ImageRow[]>([])
	const [uploading, setUploading] = useState(false)
	const [uploadingRow, setUploadingRow] = useState<number | null>(null)
	const [saving, setSaving] = useState(false)

	const skuSeed = useMemo(() => Math.random().toString(36).slice(2, 6).toUpperCase(), [open])

	useEffect(() => {
		if (!open) return
		fetch('/api/admin/product-types')
			.then((res) => res.json())
			.then((json) => setProductTypes(json.productTypes ?? []))
			.catch(() => setProductTypes([]))
	}, [open])

	useEffect(() => {
		if (open) {
			setActiveTab('general')
			setCategoryId('')
			setProductTypeId('')
			setName('')
			setPurchasePrice('')
			setProfitPercent('')
			setBasePrice('')
			setNumberOfLots('1')
			setQuantityPerLot('')
			setItems([{ ...EMPTY_ITEM }])
			setImages([])
		}
	}, [open])

	const handleProductTypeChange = (id: string) => {
		setProductTypeId(id)
		const typeObj = productTypes.find((pt) => pt.id === id)
		if (typeObj?.category_id) {
			setCategoryId(typeObj.category_id)
		}
	}

	const setItem = (index: number, next: Partial<ItemRow>) => {
		setItems((prev) => {
			const clone = [...prev]
			clone[index] = { ...clone[index], ...next }
			return clone
		})
	}

	const setItemQuantity = (index: number, qty: number) => {
		const targetQty = Number(quantityPerLot) || 0
		const currentSumWithoutThis = items.reduce((sum, item, idx) => (idx === index ? sum : sum + (item.quantity || 0)), 0)
		const maxAllowed = Math.max(0, targetQty - currentSumWithoutThis)
		const safeQty = Math.min(Math.max(0, qty), maxAllowed)
		setItem(index, { quantity: safeQty })
	}

	const itemsTotal = useMemo(() => items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0), [items])

	const handleProfitPercentChange = (value: string) => {
		setProfitPercent(value)
		const percent = Number(value)
		const purchase = Number(purchasePrice)
		if (value.trim() && !Number.isNaN(percent) && purchase > 0) {
			setBasePrice((purchase * (1 + percent / 100)).toFixed(2))
		}
	}

	const handleBasePriceChange = (value: string) => {
		setBasePrice(value)
		const base = Number(value)
		const purchase = Number(purchasePrice)
		if (value.trim() && !Number.isNaN(base) && purchase > 0) {
			setProfitPercent((((base - purchase) / purchase) * 100).toFixed(1))
		}
	}

	const handleUpload = async (files: FileList | null) => {
		if (!files || files.length === 0) return
		setUploading(true)
		try {
			const next = [...images]
			for (const file of Array.from(files)) {
				const path = productImagePath(name || 'wholesale-lot', 'new', file.name)
				const url = await uploadViaAdminApi(path, file)
				next.push({ image_url: url, sort_order: next.length, is_primary: next.length === 0 })
			}
			setImages(next)
		} catch (err) {
			toast({ title: 'Upload failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setUploading(false)
		}
	}

	const handleItemRowPhotoUpload = async (index: number, file: File) => {
		setUploadingRow(index)
		try {
			const path = productImagePath(name || 'wholesale-item', 'new', file.name)
			const url = await uploadViaAdminApi(path, file)
			setItem(index, { image_url: url })
			toast({ title: 'Item photo uploaded', variant: 'success' })
		} catch (err) {
			toast({ title: 'Photo upload failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setUploadingRow(null)
		}
	}

	const tabIndex = TABS.indexOf(activeTab)
	const nextTab = () => { if (tabIndex < TABS.length - 1) setActiveTab(TABS[tabIndex + 1]) }
	const prevTab = () => { if (tabIndex > 0) setActiveTab(TABS[tabIndex - 1]) }

	const targetQty = Number(quantityPerLot) || 0
	const lotsCount = Number(numberOfLots) || 1

	const categoryName = (id: string) => categories.find((c) => c.id === id)?.name ?? '—'
	const productTypeName = (id: string) => productTypes.find((pt) => pt.id === id)?.name ?? '—'

	const save = async () => {
		if (!name.trim()) { toast({ title: 'Title required', variant: 'error' }); setActiveTab('general'); return }
		if (!basePrice || Number(basePrice) <= 0) { toast({ title: 'Base selling price required', variant: 'error' }); setActiveTab('pricing'); return }
		if (!targetQty || targetQty <= 0) { toast({ title: 'Quantity per lot required', variant: 'error' }); setActiveTab('pricing'); return }
		if (itemsTotal !== targetQty) {
			toast({ title: 'Composition Mismatch', description: `Items total (${itemsTotal}) must equal lot quantity (${targetQty}).`, variant: 'error' })
			setActiveTab('composition')
			return
		}
		if (items.some((r) => !r.model_name.trim() || r.quantity <= 0)) {
			toast({ title: 'Item details incomplete', description: 'Every row needs a phone name and quantity.', variant: 'error' })
			setActiveTab('composition')
			return
		}
		if (items.some((r) => !r.image_url.trim())) {
			toast({ title: 'Item photo missing', description: 'Every item row requires a photo.', variant: 'error' })
			setActiveTab('composition')
			return
		}

		setSaving(true)
		try {
			const res = await fetch('/api/admin/wholesale/bulk', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					marketplaces: ['US', 'CA'],
					category_id: categoryId || null,
					product_type_id: productTypeId || null,
					name: name.trim(),
					purchase_price: purchasePrice.trim() ? Number(purchasePrice) : null,
					base_price: Number(basePrice),
					number_of_lots: lotsCount,
					quantity_per_lot: targetQty,
					items: items.map((row) => ({
						model_name: row.model_name.trim(),
						storage: row.storage.trim() || null,
						ram: row.ram.trim() || null,
						color: row.color.trim() || null,
						swatch_hex: row.color.trim() ? row.swatch_hex || null : null,
						quantity: Math.max(0, Math.floor(Number(row.quantity) || 0)),
						condition: row.condition,
						carrier_lock: row.carrier_lock,
						image_url: row.image_url.trim() || null,
					})),
					images: images.filter((img) => img.image_url.trim()).map((img, index) => ({ ...img, sort_order: index })),
				}),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error ?? 'Save failed')
			toast({ title: `${lotsCount} wholesale lot${lotsCount > 1 ? 's' : ''} created`, variant: 'success' })
			onSaved()
			onClose()
		} catch (err) {
			toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSaving(false)
		}
	}

	const label = 'text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block'
	const tableInput = 'w-full text-xs bg-[#F7F7F5] border border-[#E9ECEA] rounded-lg px-2.5 py-1.5 focus:border-[#599161] focus:ring-1 focus:ring-[#599161]/25 outline-none transition-all placeholder:text-muted-foreground/45'

	return (
		<Modal open={open} onClose={onClose} title="Create Wholesale Lot" wide>
			<div className="space-y-6">
				{/* Top Action Bar */}
				<div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border">
					<div>
						{tabIndex > 0 && (
							<button type="button" onClick={prevTab} className={adminButtonGhost}>
								<ChevronLeft className="w-4 h-4" /> Back
							</button>
						)}
					</div>
					<div className="flex items-center gap-2">
						{tabIndex < TABS.length - 1 && (
							<button
								type="button"
								onClick={nextTab}
								className="flex items-center gap-1.5 bg-[#EEF7F0] text-[#599161] hover:bg-[#599161] hover:text-white text-xs font-bold px-4 py-2 rounded-full transition-all cursor-pointer border border-[#C8E6CE] shadow-3xs"
							>
								Next Step <ChevronRight className="w-4 h-4" />
							</button>
						)}
						<button type="button" onClick={save} disabled={saving} className={adminButton}>
							{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
							{saving ? 'Creating...' : 'Create Wholesale Lot'}
						</button>
					</div>
				</div>

				{/* Tab switcher */}
				<div className="flex bg-[#F7F7F5] border border-[#E9ECEA]/80 p-1.5 rounded-2xl gap-1 mb-6 text-xs font-semibold text-muted-foreground w-full">
					<button
						type="button"
						onClick={() => setActiveTab('general')}
						className={`flex-1 py-2.5 rounded-xl cursor-pointer transition-all text-center ${
							activeTab === 'general' ? 'bg-white text-[#599161] font-extrabold shadow-3xs' : 'hover:text-foreground'
						}`}
					>
						General Info
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('pricing')}
						className={`flex-1 py-2.5 rounded-xl cursor-pointer transition-all text-center ${
							activeTab === 'pricing' ? 'bg-white text-[#599161] font-extrabold shadow-3xs' : 'hover:text-foreground'
						}`}
					>
						Pricing & Lots
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('composition')}
						className={`flex-1 py-2.5 rounded-xl cursor-pointer transition-all text-center ${
							activeTab === 'composition' ? 'bg-white text-[#599161] font-extrabold shadow-3xs' : 'hover:text-foreground'
						}`}
					>
						Composition
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('photos')}
						className={`flex-1 py-2.5 rounded-xl cursor-pointer transition-all text-center ${
							activeTab === 'photos' ? 'bg-white text-[#599161] font-extrabold shadow-3xs' : 'hover:text-foreground'
						}`}
					>
						Photos & SKU
					</button>
					<button
						type="button"
						onClick={() => setActiveTab('review')}
						className={`flex-1 py-2.5 rounded-xl cursor-pointer transition-all text-center ${
							activeTab === 'review' ? 'bg-white text-[#599161] font-extrabold shadow-3xs' : 'hover:text-foreground'
						}`}
					>
						Review
					</button>
				</div>

				<div className="min-h-[280px]">
					{/* General tab */}
					{activeTab === 'general' && (
						<div className="space-y-6">
							<div className="grid sm:grid-cols-2 gap-4">
								<div>
									<label className={label}>Product Type</label>
									<select
										value={productTypeId}
										onChange={(e) => handleProductTypeChange(e.target.value)}
										className={`${adminInput} cursor-pointer`}
									>
										<option value="">Select product type</option>
										{productTypes.map((pt) => (
											<option key={pt.id} value={pt.id}>{pt.name}</option>
										))}
									</select>
								</div>
								<div>
									<label className={label}>Category</label>
									<select
										value={categoryId}
										onChange={(e) => setCategoryId(e.target.value)}
										className={`${adminInput} cursor-pointer`}
									>
										<option value="">Select category</option>
										{categories.map((c) => (
											<option key={c.id} value={c.id}>{c.name}</option>
										))}
									</select>
								</div>
							</div>
							<div>
								<label className={label}>Lot Title</label>
								<input
									value={name}
									onChange={(e) => setName(e.target.value)}
									className={adminInput}
									placeholder="e.g. Mixed iPhone 12/13/14 Unlocked Bundle (10 Units)"
								/>
							</div>
						</div>
					)}

					{/* Pricing tab */}
					{activeTab === 'pricing' && (
						<div className="space-y-6">
							<div className="grid sm:grid-cols-3 gap-4">
								<div>
									<label className={label}>Purchase Cost / Unit ($)</label>
									<input
										type="number"
										step="0.01"
										value={purchasePrice}
										onChange={(e) => {
											setPurchasePrice(e.target.value)
											const purchase = Number(e.target.value)
											const percent = Number(profitPercent)
											if (e.target.value.trim() && !Number.isNaN(percent) && purchase > 0) {
												setBasePrice((purchase * (1 + percent / 100)).toFixed(2))
											}
										}}
										className={adminInput}
										placeholder="e.g. 150.00"
									/>
								</div>
								<div>
									<label className={label}>Target Profit Margin (%)</label>
									<input
										type="number"
										step="0.1"
										value={profitPercent}
										onChange={(e) => handleProfitPercentChange(e.target.value)}
										className={adminInput}
										placeholder="e.g. 20"
									/>
								</div>
								<div>
									<label className={label}>Base Selling Price / Unit ($) *</label>
									<input
										type="number"
										step="0.01"
										value={basePrice}
										onChange={(e) => handleBasePriceChange(e.target.value)}
										className={adminInput}
										placeholder="e.g. 180.00"
									/>
								</div>
							</div>
							<div className="grid sm:grid-cols-2 gap-4 pt-4 border-t border-border">
								<div>
									<label className={label}>Number of Lots to Create</label>
									<input
										type="number"
										min={1}
										value={numberOfLots}
										onChange={(e) => setNumberOfLots(e.target.value)}
										className={adminInput}
									/>
								</div>
								<div>
									<label className={label}>Total Units per Lot *</label>
									<input
										type="number"
										min={1}
										value={quantityPerLot}
										onChange={(e) => setQuantityPerLot(e.target.value)}
										className={adminInput}
										placeholder="e.g. 10"
									/>
								</div>
							</div>
						</div>
					)}

					{/* Composition tab */}
					{activeTab === 'composition' && (
						<div className="space-y-4">
							<div className="flex items-center justify-between">
								<label className={label}>Composition Item Breakdown</label>
								<button
									type="button"
									onClick={() => setItems((prev) => [...prev, { ...EMPTY_ITEM }])}
									className={`${adminButtonGhost} px-3.5 py-1.5`}
								>
									<Plus className="w-3 h-3" /> Add Item Row
								</button>
							</div>
							<div className="border border-border rounded-2xl overflow-hidden overflow-x-auto">
								<table className="w-full text-xs min-w-[760px]">
									<thead>
										<tr className="bg-secondary text-left">
											<th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Photo</th>
											<th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Phone Model</th>
											<th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Storage</th>
											<th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">RAM</th>
											<th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Color</th>
											<th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Qty</th>
											<th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Condition</th>
											<th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Carrier</th>
											<th className="w-10" />
										</tr>
									</thead>
									<tbody>
										{items.map((row, index) => (
											<tr key={index} className="border-t border-border">
												<td className="px-3 py-2">
													<label className="relative w-9 h-9 rounded-xl border border-border bg-muted/40 hover:border-[#599161] transition-all flex items-center justify-center cursor-pointer shrink-0 overflow-hidden group">
														{row.image_url ? (
															<img src={row.image_url} alt="" className="w-full h-full object-cover" />
														) : uploadingRow === index ? (
															<Loader2 className="w-4 h-4 animate-spin text-[#599161]" />
														) : (
															<Upload className="w-3.5 h-3.5 text-muted-foreground group-hover:text-[#599161]" />
														)}
														<input
															type="file"
															accept="image/*"
															className="hidden"
															onChange={(e) => {
																if (e.target.files?.[0]) handleItemRowPhotoUpload(index, e.target.files[0])
																e.target.value = ''
															}}
														/>
													</label>
												</td>
												<td className="px-3 py-2">
													<input value={row.model_name} onChange={(e) => setItem(index, { model_name: e.target.value })} className={tableInput} placeholder="iPhone 12" />
												</td>
												<td className="px-3 py-2">
													<input value={row.storage} onChange={(e) => setItem(index, { storage: e.target.value })} className={tableInput} placeholder="128GB" />
												</td>
												<td className="px-3 py-2">
													<input value={row.ram} onChange={(e) => setItem(index, { ram: e.target.value })} className={tableInput} placeholder="4GB" />
												</td>
												<td className="px-3 py-2">
													<div className="flex items-center gap-1.5">
														<div className="relative w-7 h-7 rounded-full border border-[#E9ECEA] shadow-3xs shrink-0 overflow-hidden cursor-pointer" style={{ backgroundColor: row.swatch_hex || '#cccccc' }}>
															<input
																type="color"
																value={row.swatch_hex || '#cccccc'}
																onChange={(e) => setItem(index, { swatch_hex: e.target.value })}
																className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
																title="Swatch color"
															/>
														</div>
														<input value={row.color} onChange={(e) => setItem(index, { color: e.target.value })} className={tableInput} placeholder="Black" />
													</div>
												</td>
												<td className="px-3 py-2">
													<input
														type="number"
														min={0}
														max={targetQty || undefined}
														value={row.quantity}
														onChange={(e) => setItemQuantity(index, Number(e.target.value))}
														className={`${tableInput} w-16`}
													/>
												</td>
												<td className="px-3 py-2">
													<select value={row.condition} onChange={(e) => setItem(index, { condition: e.target.value as ProductCondition })} className={`${tableInput} cursor-pointer`}>
														<option value="new">New</option>
														<option value="used">Used</option>
														<option value="refurbished">Refurbished</option>
													</select>
												</td>
												<td className="px-3 py-2">
													<select value={row.carrier_lock} onChange={(e) => setItem(index, { carrier_lock: e.target.value as CarrierLockStatus })} className={`${tableInput} cursor-pointer`}>
														<option value="locked">Locked</option>
														<option value="unlocked">Unlocked</option>
													</select>
												</td>
												<td className="px-3 py-2 text-center">
													<button
														type="button"
														onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
														disabled={items.length === 1}
														className="p-1.5 rounded-full text-muted-foreground/60 hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer disabled:opacity-30"
														aria-label="Remove row"
													>
														<Trash2 className="w-3.5 h-3.5" />
													</button>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					)}

					{/* Photos & SKU tab */}
					{activeTab === 'photos' && (
						<div className="space-y-6">
							<div className="space-y-4">
								<div className="flex items-center justify-between">
									<label className={label}>Lot Photos</label>
									<label className={`${adminButtonGhost} px-3.5 py-2 cursor-pointer`}>
										{uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-[#599161]" />}
										Upload
										<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleUpload(e.target.files); e.target.value = '' }} />
									</label>
								</div>
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
									{images.map((image, index) => (
										<div key={index} className="relative group rounded-2xl overflow-hidden border border-border bg-muted aspect-square flex items-center justify-center">
											{image.image_url && <img src={image.image_url} alt="" className="w-full h-full object-cover" />}
											<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
												<button
													type="button"
													onClick={() => setImages((prev) => prev.map((img, i) => ({ ...img, is_primary: i === index })))}
													className={`p-2 rounded-full cursor-pointer transition-all ${
														image.is_primary ? 'bg-[#599161] text-white' : 'bg-white hover:bg-[#599161] hover:text-white text-foreground'
													}`}
													title="Set as primary"
												>
													<Star className="w-4 h-4 fill-current" />
												</button>
												<button
													type="button"
													onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
													className="p-2 rounded-full bg-white hover:bg-destructive hover:text-white text-destructive cursor-pointer transition-all"
													title="Remove image"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										</div>
									))}
									{images.length === 0 && <p className="text-xs text-muted-foreground py-2 pl-1">No photos uploaded yet.</p>}
								</div>
							</div>
						</div>
					)}

					{/* Review & Summary Tab */}
					{activeTab === 'review' && (
						<div className="space-y-6 animate-in fade-in-50 duration-200">
							{/* Centered Header Banner */}
							<div className="text-center py-4 px-6 bg-gradient-to-b from-[#F4F9F5] to-transparent rounded-2xl border border-[#E0EFE3]">
								<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF7F0] border border-[#C8E6CE] text-[#599161] text-[11px] font-bold uppercase tracking-wider mb-2">
									<Eye className="w-3.5 h-3.5" /> Wholesale Lot Review
								</div>
								<h3 className="text-base font-extrabold text-foreground tracking-tight">{name || 'Untitled Wholesale Lot'}</h3>
								<p className="text-xs text-muted-foreground mt-0.5">Please review your lot configuration before submission.</p>
							</div>

							{/* Summary Stat Cards */}
							<div className="grid sm:grid-cols-3 gap-3.5">
								<div className="bg-white p-4 rounded-2xl border border-border/80 shadow-3xs text-center flex flex-col items-center justify-center space-y-1">
									<span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category & Type</span>
									<span className="font-bold text-foreground text-xs">{categoryName(categoryId)}</span>
									<span className="text-[11px] text-muted-foreground">{productTypeName(productTypeId)}</span>
								</div>

								<div className="bg-white p-4 rounded-2xl border border-border/80 shadow-3xs text-center flex flex-col items-center justify-center space-y-1">
									<span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Selling Price / Unit</span>
									<span className="font-black text-[#599161] text-lg">${Number(basePrice || 0).toFixed(2)}</span>
									{purchasePrice && (
										<span className="text-[11px] text-muted-foreground">Cost: ${Number(purchasePrice).toFixed(2)} ({profitPercent}% profit)</span>
									)}
								</div>

								<div className="bg-white p-4 rounded-2xl border border-border/80 shadow-3xs text-center flex flex-col items-center justify-center space-y-1">
									<span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Volume & Lots</span>
									<span className="font-bold text-foreground text-xs">{quantityPerLot || '0'} Units per Lot</span>
									<span className="text-[11px] text-muted-foreground font-medium">{numberOfLots} Lot{lotsCount > 1 ? 's' : ''} to create ({itemsTotal} total units allocated)</span>
								</div>
							</div>

							{/* Item Composition Table Summary */}
							<div className="bg-white rounded-2xl border border-border/80 p-5 space-y-3 shadow-3xs">
								<h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-center">Composition Item Breakdown ({items.length} rows, {itemsTotal} units)</h4>
								<div className="border border-border/60 rounded-xl overflow-hidden text-xs">
									<table className="w-full text-center">
										<thead className="bg-secondary text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
											<tr>
												<th className="py-2.5 px-3 text-left">Phone Model</th>
												<th className="py-2.5 px-3">Storage / RAM</th>
												<th className="py-2.5 px-3">Color</th>
												<th className="py-2.5 px-3">Qty</th>
												<th className="py-2.5 px-3">Condition</th>
												<th className="py-2.5 px-3">Carrier</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-border/60">
											{items.map((it, idx) => (
												<tr key={idx} className="hover:bg-muted/20">
													<td className="py-2.5 px-3 text-left flex items-center gap-2 font-medium text-foreground">
														{it.image_url && <img src={it.image_url} alt="" className="w-6 h-6 rounded-lg object-cover border border-border shrink-0" />}
														{it.model_name || '—'}
													</td>
													<td className="py-2.5 px-3 text-muted-foreground">{it.storage || '—'} {it.ram ? `· ${it.ram}` : ''}</td>
													<td className="py-2.5 px-3">
														<span className="inline-flex items-center gap-1.5">
															{it.swatch_hex && <span className="w-3 h-3 rounded-full border border-border shrink-0 shadow-3xs" style={{ backgroundColor: it.swatch_hex }} />}
															{it.color || '—'}
														</span>
													</td>
													<td className="py-2.5 px-3 font-bold text-foreground">{it.quantity}</td>
													<td className="py-2.5 px-3 capitalize font-medium">{it.condition}</td>
													<td className="py-2.5 px-3 capitalize text-muted-foreground">{it.carrier_lock}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							</div>

							{/* Photo previews if present */}
							{images.length > 0 && (
								<div className="bg-white rounded-2xl border border-border/80 p-5 space-y-3 shadow-3xs">
									<h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-center">Lot Photos ({images.length})</h4>
									<div className="flex flex-wrap justify-center gap-3">
										{images.map((img, i) => (
											<div key={i} className="w-16 h-16 rounded-2xl border border-border/80 overflow-hidden bg-muted relative group shadow-3xs">
												<img src={img.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
												{img.is_primary && (
													<span className="absolute bottom-1 right-1 bg-[#599161] text-white p-0.5 rounded-full text-[9px] shadow-3xs" title="Primary Photo">★</span>
												)}
											</div>
										))}
									</div>
								</div>
							)}
						</div>
					)}
				</div>

				{/* Bottom Action Bar */}
				<div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border">
					<div>
						{tabIndex > 0 && (
							<button type="button" onClick={prevTab} className={adminButtonGhost}>
								<ChevronLeft className="w-4 h-4" /> Back
							</button>
						)}
					</div>
					<div className="flex items-center gap-2">
						{tabIndex < TABS.length - 1 && (
							<button
								type="button"
								onClick={nextTab}
								className="flex items-center gap-1.5 bg-[#EEF7F0] text-[#599161] hover:bg-[#599161] hover:text-white text-xs font-bold px-4 py-2 rounded-full transition-all cursor-pointer border border-[#C8E6CE] shadow-3xs"
							>
								Next Step <ChevronRight className="w-4 h-4" />
							</button>
						)}
						<button type="button" onClick={save} disabled={saving} className={adminButton}>
							{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
							{saving ? 'Creating...' : 'Create Wholesale Lot'}
						</button>
					</div>
				</div>
			</div>
		</Modal>
	)
}
