'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Upload, Loader2, Star, ChevronLeft, ChevronRight, Check, ImageOff } from 'lucide-react'
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

const STEP_LABELS = [
	'Product Type',
	'Lot Title',
	'Pricing',
	'Lots & Quantity',
	'Item Composition',
	'Photos',
	'Review & SKU',
]
const LAST_STEP = STEP_LABELS.length

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
	const [activeTab, setActiveTab] = useState<'general' | 'pricing' | 'composition' | 'photos'>('general')
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
		const type = productTypes.find((t) => t.id === id)
		if (type?.category_id) setCategoryId(type.category_id)
	}

	const targetQty = Number(quantityPerLot) || 0
	const itemsTotal = items.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0)
	const lotsCount = Math.max(1, Math.floor(Number(numberOfLots) || 0))
	const currency = 'USD'

	const setItem = (index: number, patch: Partial<ItemRow>) => {
		setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
	}

	const setItemQuantity = (index: number, rawValue: number) => {
		const otherRowsTotal = items.reduce((sum, row, i) => (i === index ? sum : sum + (Number(row.quantity) || 0)), 0)
		const remaining = Math.max(0, targetQty - otherRowsTotal)
		const clamped = Math.max(0, Math.min(Math.floor(rawValue) || 0, targetQty > 0 ? remaining : rawValue))
		setItem(index, { quantity: clamped })
	}

	const handlePurchasePriceChange = (value: string) => {
		setPurchasePrice(value)
		const purchase = Number(value)
		if (!value.trim() || Number.isNaN(purchase) || purchase <= 0) return
		if (profitPercent.trim() && !Number.isNaN(Number(profitPercent))) {
			setBasePrice((purchase * (1 + Number(profitPercent) / 100)).toFixed(2))
		} else if (basePrice.trim() && !Number.isNaN(Number(basePrice))) {
			setProfitPercent((((Number(basePrice) - purchase) / purchase) * 100).toFixed(1))
		}
	}

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
			toast({ title: 'Images uploaded', variant: 'success' })
		} catch (err) {
			toast({ title: 'Upload failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setUploading(false)
		}
	}

	const handleRowImageUpload = async (index: number, file: File | undefined) => {
		if (!file) return
		setUploadingRow(index)
		try {
			const path = productImagePath(name || 'wholesale-lot', 'new', file.name, items[index]?.model_name || undefined)
			const url = await uploadViaAdminApi(path, file)
			setItem(index, { image_url: url })
		} catch (err) {
			toast({ title: 'Upload failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setUploadingRow(null)
		}
	}

	const previewSku = (index: number) =>
		['CK', `LOT-${compact(name, 10) || 'LOT'}`, dateStamp(), skuSeed, pad(index + 1, 2)].join('-')

	const submit = async () => {
		if (!name.trim()) {
			toast({ title: 'Missing Title', description: 'Please enter a title for the wholesale lot.', variant: 'error' })
			return
		}
		if (!basePrice.trim() || Number.isNaN(Number(basePrice)) || Number(basePrice) <= 0) {
			toast({ title: 'Invalid Pricing', description: 'Please enter a valid numeric selling base price.', variant: 'error' })
			return
		}
		if (!numberOfLots.trim() || Number(numberOfLots) < 1 || !quantityPerLot.trim() || Number(quantityPerLot) < 1) {
			toast({ title: 'Invalid Quantities', description: 'Lots quantity and units count must be 1 or greater.', variant: 'error' })
			return
		}
		if (items.length === 0 || !items.every((row) => row.model_name.trim() && row.quantity > 0 && row.image_url.trim())) {
			toast({ title: 'Incomplete Composition', description: 'All rows in composition table require a phone name, quantity, and a row photo.', variant: 'error' })
			return
		}
		if (itemsTotal !== targetQty) {
			toast({ title: 'Composition Mismatch', description: `Total items quantity (${itemsTotal}) must match the lot quantity (${targetQty}).`, variant: 'error' })
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
	const tableInput = 'w-full text-xs bg-white border border-[#E9ECEA] rounded-lg px-2.5 py-1.5 focus:border-[#599161] focus:ring-1 focus:ring-[#599161]/25 outline-none transition-all placeholder:text-muted-foreground/45'

	return (
		<Modal open={open} onClose={onClose} title="Create Wholesale Lot" wide>
			<div className="flex flex-col min-h-[420px] justify-between">
				<div>
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
							Item Composition
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
					</div>

					<div className="min-h-[280px]">
						{/* General tab */}
						{activeTab === 'general' && (
							<div className="space-y-6">
								<div className="grid sm:grid-cols-2 gap-4">
									<div>
										<label className={label}>Category</label>
										<select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={`${adminInput} cursor-pointer`}>
											<option value="">No category</option>
											{categories.map((c) => (
												<option key={c.id} value={c.id}>{c.name}</option>
											))}
										</select>
									</div>
									<div>
										<label className={label}>Product Type</label>
										<select value={productTypeId} onChange={(e) => handleProductTypeChange(e.target.value)} className={`${adminInput} cursor-pointer`}>
											<option value="">No product type</option>
											{productTypes.map((t) => (
												<option key={t.id} value={t.id}>{t.name}</option>
											))}
										</select>
									</div>
								</div>

								<div>
									<label className={label}>Lot Title</label>
									<input value={name} onChange={(e) => setName(e.target.value)} className={adminInput} placeholder="iPhone 12 Mixed Grade Lot" />
								</div>
							</div>
						)}

						{/* Pricing & Lots tab */}
						{activeTab === 'pricing' && (
							<div className="space-y-6">
								<div className="grid sm:grid-cols-3 gap-4">
									<div>
										<label className={label}>Purchase Price (Cost, <strong className="text-foreground">{currency}</strong>)</label>
										<input
											type="number"
											step="0.01"
											value={purchasePrice}
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
											value={basePrice}
											onChange={(e) => handleBasePriceChange(e.target.value)}
											className={adminInput}
											placeholder="999.00"
										/>
									</div>
								</div>

								<div className="grid sm:grid-cols-2 gap-4">
									<div>
										<label className={label}>Number of Lots</label>
										<input
											type="number"
											min={1}
											step={1}
											value={numberOfLots}
											onChange={(e) => setNumberOfLots(e.target.value)}
											className={adminInput}
											placeholder="1"
										/>
										<p className="text-[10px] text-muted-foreground mt-1.5 leading-normal">
											Creates this many separate, identical listings.
										</p>
									</div>
									<div>
										<label className={label}>Quantity per Lot</label>
										<input
											type="number"
											min={1}
											step={1}
											value={quantityPerLot}
											onChange={(e) => setQuantityPerLot(e.target.value)}
											className={adminInput}
											placeholder="50"
										/>
										<p className="text-[10px] text-muted-foreground mt-1.5 leading-normal">
											Every lot created will contain this many units.
										</p>
									</div>
								</div>
							</div>
						)}

						{/* Item composition tab */}
						{activeTab === 'composition' && (
							<div className="space-y-5">
								<div className="flex items-center justify-between">
									<div>
										<h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Composition Split</h3>
										<p className="text-[10px] text-muted-foreground mt-0.5">Specify model variants and quantities comprising this wholesale lot</p>
									</div>
									<button
										type="button"
										onClick={() => setItems((prev) => [...prev, { ...EMPTY_ITEM }])}
										className={`${adminButtonGhost} px-3.5 py-1.5`}
									>
										<Plus className="w-3 h-3 text-[#599161]" />
										Add Row
									</button>
								</div>

								<div className="border border-[#E9ECEA] rounded-xl overflow-hidden bg-white shadow-3xs overflow-x-auto">
									<table className="w-full text-sm min-w-[920px]">
										<thead>
											<tr className="bg-[#F7F7F5] border-b border-[#E9ECEA]/80 text-left">
												<th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Photo</th>
												<th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Phone Name</th>
												<th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Capacity</th>
												<th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">RAM</th>
												<th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Color Hex & Label</th>
												<th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Qty</th>
												<th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Condition</th>
												<th className="px-4 py-3 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Carrier Lock</th>
												<th className="w-12" />
											</tr>
										</thead>
										<tbody>
											{items.map((row, index) => (
												<tr key={index} className="border-t border-[#E9ECEA]/60 hover:bg-[#F7F7F5]/30 transition-colors">
													<td className="px-3 py-2.5">
														<label className="relative flex items-center justify-center w-11 h-11 rounded-lg overflow-hidden bg-[#F7F7F5] border border-[#E9ECEA] hover:border-[#599161]/60 hover:shadow-3xs cursor-pointer shrink-0 transition-all group">
															{uploadingRow === index ? (
																<Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
															) : row.image_url ? (
																<img src={row.image_url} alt="" className="w-full h-full object-cover" />
															) : (
																<ImageOff className="w-4 h-4 text-muted-foreground/60" />
															)}
															<span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
																<Upload className="w-3.5 h-3.5 text-white" />
															</span>
															<input
																type="file"
																accept="image/*"
																className="hidden"
																onChange={(e) => { handleRowImageUpload(index, e.target.files?.[0]); e.target.value = '' }}
															/>
														</label>
													</td>
													<td className="px-3 py-2.5">
														<input value={row.model_name} onChange={(e) => setItem(index, { model_name: e.target.value })} className={tableInput} placeholder="iPhone 12" />
													</td>
													<td className="px-3 py-2.5">
														<input value={row.storage} onChange={(e) => setItem(index, { storage: e.target.value })} className={tableInput} placeholder="128GB" />
													</td>
													<td className="px-3 py-2.5">
														<input value={row.ram} onChange={(e) => setItem(index, { ram: e.target.value })} className={tableInput} placeholder="4GB" />
													</td>
													<td className="px-3 py-2.5">
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
													<td className="px-3 py-2.5">
														<input
															type="number"
															min={0}
															max={targetQty || undefined}
															value={row.quantity}
															onChange={(e) => setItemQuantity(index, Number(e.target.value))}
															className={`${tableInput} w-16`}
														/>
													</td>
													<td className="px-3 py-2.5">
														<select value={row.condition} onChange={(e) => setItem(index, { condition: e.target.value as ProductCondition })} className={`${tableInput} cursor-pointer`}>
															<option value="new">New</option>
															<option value="used">Used</option>
															<option value="refurbished">Refurbished</option>
														</select>
													</td>
													<td className="px-3 py-2.5">
														<select value={row.carrier_lock} onChange={(e) => setItem(index, { carrier_lock: e.target.value as CarrierLockStatus })} className={`${tableInput} cursor-pointer`}>
															<option value="locked">Locked</option>
															<option value="unlocked">Unlocked</option>
														</select>
													</td>
													<td className="px-3 py-2.5 text-center">
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

								{/* allocation progress bar */}
								{(() => {
									const progressPercent = targetQty > 0 ? Math.min(100, (itemsTotal / targetQty) * 100) : 0
									const progressColor = itemsTotal === targetQty ? 'bg-[#599161]' : 'bg-amber-500'
									const textColor = itemsTotal === targetQty ? 'text-[#599161]' : 'text-amber-600'
									return (
										<div className="p-4 rounded-xl bg-[#F7F7F5] border border-[#E9ECEA]/80 space-y-2">
											<div className="flex justify-between items-center text-[11px]">
												<span className="font-semibold text-foreground/80">Allocation Progress</span>
												<span className={`font-bold ${textColor}`}>
													{itemsTotal} of {targetQty} Units Allocated ({Math.round(progressPercent)}%)
												</span>
											</div>
											<div className="w-full bg-[#E9ECEA] h-2 rounded-full overflow-hidden">
												<div 
													className={`h-full transition-all duration-300 ${progressColor}`}
													style={{ width: `${progressPercent}%` }}
												/>
											</div>
											<p className="text-[10px] text-muted-foreground leading-normal">
												Note: Every composition item row requires a primary photo upload before submission.
											</p>
										</div>
									)
								})()}
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

								<div className="grid sm:grid-cols-2 gap-6 pt-4 border-t border-border/60">
									<div className="border border-border rounded-2xl p-5 space-y-2 bg-[#EEF7F0]/30 text-xs text-foreground/80">
										<p><span className="font-semibold text-foreground">Title:</span> {name || 'Not set'}</p>
										<p>
											<span className="font-semibold text-foreground">Pricing:</span>{' '}
											{purchasePrice ? `${currency} ${Number(purchasePrice).toFixed(2)} cost` : 'No cost entered'} → {currency} {Number(basePrice || 0).toFixed(2)} selling
											{profitPercent && ` (${profitPercent}% margin)`}
										</p>
										<p><span className="font-semibold text-foreground">Lots:</span> {lotsCount} × {targetQty} units</p>
										<p><span className="font-semibold text-foreground">Item rows:</span> {items.length}</p>
										<p><span className="font-semibold text-foreground">Photos:</span> {images.length}</p>
									</div>
									<div>
										<label className={label}>Auto-generated SKUs</label>
										<div className="space-y-1.5 max-h-[140px] overflow-y-auto no-scrollbar pr-1">
											{Array.from({ length: lotsCount }).map((_, i) => (
												<p key={i} className="font-mono text-xs text-foreground/80 bg-muted px-2 py-1 rounded-md">{previewSku(i)}</p>
											))}
										</div>
									</div>
								</div>
							</div>
						)}
					</div>
				</div>

				<div className="flex justify-end gap-3 pt-6 border-t border-border">
					<button type="button" onClick={onClose} className={adminButtonGhost}>Cancel</button>
					<button type="button" onClick={submit} disabled={saving} className={adminButton}>
						{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
						{saving ? 'Creating...' : `Create ${lotsCount} Lot${lotsCount > 1 ? 's' : ''}`}
					</button>
				</div>
			</div>
		</Modal>
	)
}
