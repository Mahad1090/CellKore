'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Upload, Loader2, Star, ChevronLeft, ChevronRight, Check } from 'lucide-react'
import { adminInput, adminButton, adminButtonGhost, Modal } from '@/components/admin/ui'
import { useToast } from '@/components/ui/toast'
import { productImagePath, uploadViaAdminApi } from '@/lib/storage'
import type { Category, ProductType, MarketplaceType, ProductCondition, CarrierLockStatus } from '@/lib/types'

interface ItemRow {
	model_name: string
	storage: string
	ram: string
	color: string
	quantity: number
	condition: ProductCondition
	carrier_lock: CarrierLockStatus
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
	quantity: 0,
	condition: 'new',
	carrier_lock: 'unlocked',
}

const STEP_LABELS = [
	'Marketplace',
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
	const [step, setStep] = useState(1)
	const [productTypes, setProductTypes] = useState<ProductType[]>([])

	const [marketplace, setMarketplace] = useState<MarketplaceType>('US')
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
		if (!open) {
			setStep(1)
			setMarketplace('US')
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

	const itemsTotal = items.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0)
	const targetQty = Number(quantityPerLot) || 0
	const lotsCount = Math.max(1, Math.floor(Number(numberOfLots) || 0))
	const currency = marketplace === 'CA' ? 'CAD' : 'USD'

	const setItem = (index: number, patch: Partial<ItemRow>) => {
		setItems((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)))
	}

	// Purchase Price / Profit % / Base Price (selling price) are a three-way calculator:
	// editing any one of the first two recomputes Base Price; editing Base Price recomputes Profit %.
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

	const canProceed = (): boolean => {
		switch (step) {
			case 3:
				return name.trim().length > 0
			case 4:
				return basePrice.trim().length > 0 && !Number.isNaN(Number(basePrice)) && Number(basePrice) > 0
			case 5:
				return (
					Number.isInteger(Number(numberOfLots)) &&
					Number(numberOfLots) >= 1 &&
					Number.isInteger(Number(quantityPerLot)) &&
					Number(quantityPerLot) >= 1
				)
			case 6:
				return (
					items.length > 0 &&
					items.every((row) => row.model_name.trim() && row.quantity > 0) &&
					itemsTotal === targetQty
				)
			default:
				return true
		}
	}

	const next = () => {
		if (!canProceed()) {
			toast({ title: 'Complete this step first', variant: 'error' })
			return
		}
		setStep((s) => Math.min(LAST_STEP, s + 1))
	}
	const back = () => setStep((s) => Math.max(1, s - 1))

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

	const previewSku = (index: number) =>
		['CK', `LOT-${compact(name, 10) || 'LOT'}`, dateStamp(), skuSeed, pad(index + 1, 2)].join('-')

	const submit = async () => {
		setSaving(true)
		try {
			const res = await fetch('/api/admin/wholesale/bulk', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					marketplaces: [marketplace],
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
						quantity: Math.max(0, Math.floor(Number(row.quantity) || 0)),
						condition: row.condition,
						carrier_lock: row.carrier_lock,
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

	return (
		<Modal open={open} onClose={onClose} title="Create Wholesale Lot" wide>
			<div className="space-y-7">
				{/* Step indicator */}
				<div className="flex flex-wrap items-center gap-2">
					{STEP_LABELS.map((stepLabel, i) => {
						const n = i + 1
						const active = n === step
						const done = n < step
						return (
							<div
								key={stepLabel}
								className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-[0.1em] ${
									active
										? 'bg-primary text-primary-foreground'
										: done
										? 'bg-primary/10 text-primary'
										: 'bg-secondary text-foreground/50'
								}`}
							>
								{done ? <Check className="w-3 h-3" /> : <span>{n}</span>}
								{stepLabel}
							</div>
						)
					})}
				</div>

				{/* Step 1: Marketplace */}
				{step === 1 && (
					<div>
						<label className={label}>Marketplace</label>
						<div className="flex gap-4">
							{(['US', 'CA'] as MarketplaceType[]).map((market) => (
								<label
									key={market}
									className={`flex items-center gap-2.5 px-4 py-2.5 border rounded-full cursor-pointer transition-colors ${
										marketplace === market ? 'border-primary bg-primary/5' : 'border-border hover:border-primary'
									}`}
								>
									<input
										type="radio"
										name="wizard-marketplace"
										checked={marketplace === market}
										onChange={() => setMarketplace(market)}
										className="w-3.5 h-3.5 accent-[var(--primary)] cursor-pointer"
									/>
									<span className="text-xs font-semibold text-foreground">
										{market === 'US' ? 'US Marketplace' : 'Canada Marketplace'}
									</span>
								</label>
							))}
						</div>
					</div>
				)}

				{/* Step 2: Product Type */}
				{step === 2 && (
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
				)}

				{/* Step 3: Title */}
				{step === 3 && (
					<div>
						<label className={label}>Lot Title</label>
						<input value={name} onChange={(e) => setName(e.target.value)} className={adminInput} placeholder="iPhone 12 Mixed Grade Lot" />
					</div>
				)}

				{/* Step 4: Pricing */}
				{step === 4 && (
					<div className="grid sm:grid-cols-2 gap-4">
						<p className="sm:col-span-2 text-[11px] text-muted-foreground">
							Pricing below is entered in <strong className="text-foreground">{currency}</strong>, based on the marketplace selected in step 1.
						</p>
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
				)}

				{/* Step 5: Number of lots + quantity per lot */}
				{step === 5 && (
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
				)}

				{/* Step 6: Item composition table */}
				{step === 6 && (
					<div>
						<div className="flex items-center justify-between mb-3">
							<label className={label}>Item Composition</label>
							<button
								type="button"
								onClick={() => setItems((prev) => [...prev, { ...EMPTY_ITEM }])}
								className={`${adminButtonGhost} px-3.5 py-1.5`}
							>
								<Plus className="w-3 h-3" />
								Add Row
							</button>
						</div>
						<div className="border border-border rounded-2xl overflow-hidden overflow-x-auto">
							<table className="w-full text-sm min-w-[840px]">
								<thead>
									<tr className="bg-secondary text-left">
										<th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-foreground/70">Phone Name</th>
										<th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-foreground/70">Capacity</th>
										<th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-foreground/70">RAM</th>
										<th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-foreground/70">Color</th>
										<th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-foreground/70">Qty</th>
										<th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-foreground/70">Condition</th>
										<th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.1em] text-foreground/70">Carrier Lock</th>
										<th className="w-12" />
									</tr>
								</thead>
								<tbody>
									{items.map((row, index) => (
										<tr key={index} className="border-t border-border">
											<td className="px-2 py-2">
												<input value={row.model_name} onChange={(e) => setItem(index, { model_name: e.target.value })} className={adminInput} placeholder="iPhone 12" />
											</td>
											<td className="px-2 py-2">
												<input value={row.storage} onChange={(e) => setItem(index, { storage: e.target.value })} className={adminInput} placeholder="128GB" />
											</td>
											<td className="px-2 py-2">
												<input value={row.ram} onChange={(e) => setItem(index, { ram: e.target.value })} className={adminInput} placeholder="4GB" />
											</td>
											<td className="px-2 py-2">
												<input value={row.color} onChange={(e) => setItem(index, { color: e.target.value })} className={adminInput} placeholder="Black" />
											</td>
											<td className="px-2 py-2">
												<input
													type="number"
													min={0}
													value={row.quantity}
													onChange={(e) => setItem(index, { quantity: Number(e.target.value) })}
													className={`${adminInput} w-20`}
												/>
											</td>
											<td className="px-2 py-2">
												<select value={row.condition} onChange={(e) => setItem(index, { condition: e.target.value as ProductCondition })} className={`${adminInput} cursor-pointer`}>
													<option value="new">New</option>
													<option value="used">Used</option>
													<option value="refurbished">Refurbished</option>
												</select>
											</td>
											<td className="px-2 py-2">
												<select value={row.carrier_lock} onChange={(e) => setItem(index, { carrier_lock: e.target.value as CarrierLockStatus })} className={`${adminInput} cursor-pointer`}>
													<option value="locked">Locked</option>
													<option value="unlocked">Unlocked</option>
												</select>
											</td>
											<td className="px-2 py-2">
												<button
													type="button"
													onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
													disabled={items.length === 1}
													className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer disabled:opacity-30"
													aria-label="Remove row"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
						<p className={`text-xs font-semibold mt-3 ${itemsTotal === targetQty ? 'text-primary' : 'text-destructive'}`}>
							{itemsTotal} / {targetQty || 0} units assigned
						</p>
					</div>
				)}

				{/* Step 7: Photos */}
				{step === 7 && (
					<div>
						<div className="flex flex-wrap items-center justify-between gap-3 mb-3">
							<label className={label}>Photos</label>
							<label className={`${adminButtonGhost} px-3.5 py-2 cursor-pointer`}>
								{uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
								Upload
								<input type="file" accept="image/*" multiple className="hidden" onChange={(e) => { handleUpload(e.target.files); e.target.value = '' }} />
							</label>
						</div>
						<div className="space-y-2.5">
							{images.map((image, index) => (
								<div key={index} className="flex items-center gap-2.5">
									<div className="w-12 h-12 rounded-xl overflow-hidden bg-muted shrink-0 border border-border">
										{image.image_url && <img src={image.image_url} alt="" className="w-full h-full object-cover" />}
									</div>
									<input
										value={image.image_url}
										readOnly
										className={`${adminInput} flex-1`}
									/>
									<button
										type="button"
										onClick={() => setImages((prev) => prev.map((img, i) => ({ ...img, is_primary: i === index })))}
										className={`p-2.5 rounded-full transition-all cursor-pointer ${
											image.is_primary ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:text-primary hover:bg-muted'
										}`}
										title="Set as primary"
									>
										<Star className={`w-4 h-4 ${image.is_primary ? 'fill-current' : ''}`} />
									</button>
									<button
										type="button"
										onClick={() => setImages((prev) => prev.filter((_, i) => i !== index))}
										className="p-2.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
										aria-label="Remove image"
									>
										<Trash2 className="w-4 h-4" />
									</button>
								</div>
							))}
							{images.length === 0 && <p className="text-xs text-muted-foreground">No photos uploaded yet.</p>}
						</div>
					</div>
				)}

				{/* Step 8: Review & SKU */}
				{step === 8 && (
					<div className="space-y-5">
						<div className="border border-border rounded-2xl p-5 space-y-2 bg-secondary/10 text-xs text-foreground/80">
							<p><span className="font-semibold text-foreground">Marketplace:</span> {marketplace}</p>
							<p><span className="font-semibold text-foreground">Title:</span> {name}</p>
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
							<div className="space-y-1.5">
								{Array.from({ length: lotsCount }).map((_, i) => (
									<p key={i} className="font-mono text-xs text-foreground/80">{previewSku(i)}</p>
								))}
							</div>
						</div>
					</div>
				)}

				{/* Navigation */}
				<div className="flex justify-between gap-3 pt-4 border-t border-border">
					<button type="button" onClick={step === 1 ? onClose : back} className={adminButtonGhost}>
						{step === 1 ? 'Cancel' : (
							<>
								<ChevronLeft className="w-3.5 h-3.5" />
								Back
							</>
						)}
					</button>
					{step < LAST_STEP ? (
						<button type="button" onClick={next} className={adminButton}>
							Next
							<ChevronRight className="w-3.5 h-3.5" />
						</button>
					) : (
						<button type="button" onClick={submit} disabled={saving} className={adminButton}>
							{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
							{saving ? 'Creating...' : `Create ${lotsCount} Lot${lotsCount > 1 ? 's' : ''}`}
						</button>
					)}
				</div>
			</div>
		</Modal>
	)
}
