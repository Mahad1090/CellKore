'use client'

import { useEffect, useState } from 'react'
import { Plus, Trash2, Wand2, Upload, Loader2, Star, ChevronRight, ChevronLeft, Eye, Sparkles } from 'lucide-react'
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

type Tab = 'general' | 'pricing' | 'specs' | 'media' | 'review'

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
  discount_percent: string
  is_on_sale: boolean
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
  discount_percent: '',
  is_on_sale: false,
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
    discount_percent: product.discount_percent ? String(product.discount_percent) : '',
    is_on_sale: product.is_on_sale ?? false,
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
    discount_percent: Number(form.discount_percent) || 0,
    is_on_sale: form.is_on_sale,
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

function hasAnyMobileSpecs(specs: MobileSpecifications | undefined): boolean {
	if (!specs) return false
	if (specs.custom && specs.custom.length > 0) return true
	for (const [key, val] of Object.entries(specs)) {
		if (key === 'custom') continue
		if (val && typeof val === 'object' && !Array.isArray(val)) {
			if (Object.values(val).some((v) => (v ?? '').toString().trim() !== '')) {
				return true
			}
		}
	}
	return false
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
  const [activeTab, setActiveTab] = useState<Tab>('general')
  const [salePriceInput, setSalePriceInput] = useState('')

  useEffect(() => {
    if (open) {
      setActiveTab('general')
    }
  }, [open])

  useEffect(() => {
    setForm(initial)
    const purchase = Number(initial.purchase_price)
    const base = Number(initial.base_price)
    if (initial.purchase_price.trim() && purchase > 0 && initial.base_price.trim() && !Number.isNaN(base)) {
      setProfitPercent((((base - purchase) / purchase) * 100).toFixed(1))
    } else {
      setProfitPercent('')
    }

    if (initial.is_on_sale && initial.discount_percent && initial.base_price && !Number.isNaN(base) && !Number.isNaN(Number(initial.discount_percent))) {
      const pct = Number(initial.discount_percent)
      setSalePriceInput((base * (1 - pct / 100)).toFixed(2))
    } else {
      setSalePriceInput('')
    }
  }, [initial])

  const set = <K extends keyof ProductFormValue>(field: K, value: ProductFormValue[K]) =>
    setForm((f) => ({ ...f, [field]: value }))

  const updateSalePriceFromBase = (newBasePrice: string, currentPct: string) => {
    const base = Number(newBasePrice)
    const pct = Number(currentPct)
    if (newBasePrice.trim() && !Number.isNaN(base) && base > 0 && currentPct.trim() && !Number.isNaN(pct) && pct >= 0 && pct <= 100) {
      setSalePriceInput((Math.round(base * (1 - pct / 100) * 100) / 100).toFixed(2))
    }
  }

  const handleDiscountPercentChange = (val: string) => {
    set('discount_percent', val)
    const base = Number(form.base_price)
    const pct = Number(val)
    if (val.trim() && !Number.isNaN(base) && base > 0 && !Number.isNaN(pct) && pct >= 0 && pct <= 100) {
      const discounted = Math.round(base * (1 - pct / 100) * 100) / 100
      setSalePriceInput(discounted.toFixed(2))
    } else if (!val.trim()) {
      setSalePriceInput('')
    }
  }

  const handleSalePriceChange = (val: string) => {
    setSalePriceInput(val)
    const base = Number(form.base_price)
    const sale = Number(val)
    if (val.trim() && !Number.isNaN(base) && base > 0 && !Number.isNaN(sale) && sale >= 0 && sale <= base) {
      const pct = Math.round(((base - sale) / base) * 100)
      set('discount_percent', String(pct))
    } else if (!val.trim()) {
      set('discount_percent', '')
    }
  }

  // Purchase Price / Profit % / Base Price (selling price) are a three-way calculator:
  // editing any one of the first two recomputes Base Price; editing Base Price recomputes Profit %.
  const handlePurchasePriceChange = (value: string) => {
    set('purchase_price', value)
    const purchase = Number(value)
    if (!value.trim() || Number.isNaN(purchase) || purchase <= 0) return
    if (profitPercent.trim() && !Number.isNaN(Number(profitPercent))) {
      const newBase = (purchase * (1 + Number(profitPercent) / 100)).toFixed(2)
      set('base_price', newBase)
      if (form.is_on_sale && form.discount_percent) updateSalePriceFromBase(newBase, form.discount_percent)
    } else if (form.base_price.trim() && !Number.isNaN(Number(form.base_price))) {
      setProfitPercent((((Number(form.base_price) - purchase) / purchase) * 100).toFixed(1))
    }
  }

  const handleProfitPercentChange = (value: string) => {
    setProfitPercent(value)
    const percent = Number(value)
    const purchase = Number(form.purchase_price)
    if (value.trim() && !Number.isNaN(percent) && purchase > 0) {
      const newBase = (purchase * (1 + percent / 100)).toFixed(2)
      set('base_price', newBase)
      if (form.is_on_sale && form.discount_percent) updateSalePriceFromBase(newBase, form.discount_percent)
    }
  }

  const handleBasePriceChange = (value: string) => {
    set('base_price', value)
    const base = Number(value)
    const purchase = Number(form.purchase_price)
    if (value.trim() && !Number.isNaN(base) && purchase > 0) {
      setProfitPercent((((base - purchase) / purchase) * 100).toFixed(1))
    }
    if (form.is_on_sale && form.discount_percent) {
      updateSalePriceFromBase(value, form.discount_percent)
    }
  }

  const save = async () => {
    if (!form.name.trim() || !form.base_price || Number.isNaN(Number(form.base_price))) {
      toast({ title: 'Missing fields', description: 'Product name and a numeric base price are required.', variant: 'error' })
      return
    }
    if (form.is_on_sale) {
      const pct = Number(form.discount_percent)
      if (form.discount_percent.trim() === '' || Number.isNaN(pct) || pct <= 0 || pct > 100) {
        toast({ title: 'Invalid discount', description: 'Enter a discount percent between 1 and 100 to put this item on sale.', variant: 'error' })
        setActiveTab('pricing')
        return
      }
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
  const currency = form.marketplaces.includes('CA') ? 'CAD' : 'USD'
  const selectedProductType = productTypes.find((t) => t.id === form.product_type_id)
  const showMobileSpecs = !form.product_type_id || selectedProductType?.is_phone_type

  const handleProductTypeChange = (typeId: string) => {
    set('product_type_id', typeId)
    const matched = productTypes.find((t) => t.id === typeId)
    if (matched?.category_id) set('category_id', matched.category_id)
  }

  const templatesForType = specTemplates.filter((t) => t.product_type_id === form.product_type_id && t.is_active)

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

  const sortedPresets = [...mobileSpecPresets]
    .filter((p) => p.is_active)
    .sort((a, b) => {
      const matches = (p: MobileSpecPreset) =>
        p.brand && form.brand && p.brand.toLowerCase().includes(form.brand.trim().toLowerCase()) ? 0 : 1
      return matches(a) - matches(b)
    })

	const loadPreset = () => {
		const preset = mobileSpecPresets.find((p) => p.id === selectedPresetId)
		if (preset)
      { 
        // set('mobile_specifications', preset.mobile_specifications)
        const existingCustom = form.mobile_specifications?.custom ?? []
			  const presetCustom = preset.mobile_specifications?.custom ?? []
			  const mergedCustom = existingCustom.length > 0 ? existingCustom : presetCustom
			  set('mobile_specifications', {
				    ...preset.mobile_specifications,
				    custom: mergedCustom,
			  })
      }

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

  const TABS: Tab[] = ['general', 'pricing', 'specs', 'media', 'review']
  const tabIndex = TABS.indexOf(activeTab)

  const nextTab = () => {
    if (tabIndex < TABS.length - 1) setActiveTab(TABS[tabIndex + 1])
  }

  const prevTab = () => {
    if (tabIndex > 0) setActiveTab(TABS[tabIndex - 1])
  }

  const renderActionButtons = (borderClass: string) => (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${borderClass}`}>
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
          {saving ? 'Saving...' : 'Save Product'}
        </button>
      </div>
    </div>
  )

  const categoryName = categories.find((c) => c.id === form.category_id)?.name ?? '—'
  const productTypeName = productTypes.find((pt) => pt.id === form.product_type_id)?.name ?? '—'
  const totalStockQty = form.variants.reduce((sum, v) => sum + (Number(v.stock_quantity) || 0), 0)

  return (
    <Modal open={open} onClose={onClose} title={form.id ? 'Edit Product' : 'Create Product'} wide>
      <div className="space-y-6">
        {/* Top Action Bar (Cancel, Back, Next Step, Save Product) */}
        {renderActionButtons('pb-4 border-b border-border')}

        {/* Tab Navigation */}
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
            Pricing & Inventory
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('specs')}
            className={`flex-1 py-2.5 rounded-xl cursor-pointer transition-all text-center ${
              activeTab === 'specs' ? 'bg-white text-[#599161] font-extrabold shadow-3xs' : 'hover:text-foreground'
            }`}
          >
            Specifications
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('media')}
            className={`flex-1 py-2.5 rounded-xl cursor-pointer transition-all text-center ${
              activeTab === 'media' ? 'bg-white text-[#599161] font-extrabold shadow-3xs' : 'hover:text-foreground'
            }`}
          >
            Media & Images
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

        <div className="min-h-[350px]">
          {/* GENERAL TAB */}
          {activeTab === 'general' && (
            <div className="space-y-6">
              {/* Marketplace */}
              <div>
                <label className={label}>Marketplace</label>
                <div className="flex gap-4">
                  {(['US', 'CA'] as MarketplaceType[]).map((market) => (
                    <label
                      key={market}
                      className={`flex items-center gap-2.5 px-4 py-2.5 border rounded-full cursor-pointer transition-colors ${
                        form.marketplaces[0] === market ? 'border-[#599161] bg-[#599161]/5' : 'border-border hover:border-[#599161]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="marketplace"
                        checked={form.marketplaces[0] === market}
                        onChange={() => set('marketplaces', [market])}
                        className="w-3.5 h-3.5 accent-[#599161] cursor-pointer"
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

              {/* Category + Product Type */}
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
                      <Wand2 className="w-3.5 h-3.5 text-[#599161]" />
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
                <div className="flex items-center gap-6 sm:col-span-2">
                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input type="checkbox" checked={form.is_active} onChange={(e) => set('is_active', e.target.checked)} className="w-4 h-4 accent-[#599161] cursor-pointer" />
                    <span className="text-xs font-semibold text-foreground">Active listing</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* PRICING & INVENTORY TAB */}
          {activeTab === 'pricing' && (
            <div className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
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
              </div>

              <div className="sm:col-span-2">
                <label className={label}>Description</label>
                <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={3} className={`${adminInput} resize-none`} placeholder="Detailed description of the product..." />
              </div>

              {/* Sale / Discount */}
              <div className="p-4 rounded-2xl border border-[#E9ECEA] bg-[#F7F7F5] space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className={label}>Put this item on sale</label>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      Shows a strikethrough "before" price and the discounted price to customers.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={form.is_on_sale}
                    onClick={() => {
                      const next = !form.is_on_sale
                      set('is_on_sale', next)
                      if (next && form.discount_percent && form.base_price) {
                        updateSalePriceFromBase(form.base_price, form.discount_percent)
                      }
                    }}
                    className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer shrink-0 ${
                      form.is_on_sale ? 'bg-[#599161]' : 'bg-[#D8DCD9]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow-3xs transition-transform ${
                        form.is_on_sale ? 'translate-x-5' : ''
                      }`}
                    />
                  </button>
                </div>

                {form.is_on_sale && (
                  <div className="grid sm:grid-cols-3 gap-4 items-end pt-2 border-t border-border/40">
                    <div>
                      <label className={label}>Sale Price (<strong className="text-foreground">{currency}</strong>)</label>
                      <input
                        type="number"
                        step="0.01"
                        min={0}
                        value={salePriceInput}
                        onChange={(e) => handleSalePriceChange(e.target.value)}
                        className={adminInput}
                        placeholder="e.g. 960.00"
                      />
                    </div>
                    <div>
                      <label className={label}>Discount (% off)</label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step="1"
                        value={form.discount_percent}
                        onChange={(e) => handleDiscountPercentChange(e.target.value)}
                        className={adminInput}
                        placeholder="e.g. 20"
                      />
                    </div>
                    {(() => {
                      const base = Number(form.base_price)
                      const pct = Number(form.discount_percent)
                      const sale = Number(salePriceInput)
                      const valid = form.base_price.trim() && !Number.isNaN(base) && base > 0 && ((!Number.isNaN(pct) && pct > 0) || (!Number.isNaN(sale) && sale > 0))
                      const discounted = valid ? (sale > 0 && !Number.isNaN(sale) ? sale : base * (1 - pct / 100)) : null
                      const displayPct = pct > 0 ? pct : (valid && sale > 0 && base > 0 ? Math.round(((base - sale) / base) * 100) : 0)

                      return (
                        <div className="flex flex-wrap items-baseline gap-2 px-1 pb-1.5 sm:col-span-1">
                          {discounted !== null && discounted < base ? (
                            <>
                              <span className="text-lg font-black text-[#599161]">
                                {currency} {discounted.toFixed(2)}
                              </span>
                              <span className="text-xs text-muted-foreground line-through">
                                {currency} {base.toFixed(2)}
                              </span>
                              {displayPct > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-[#EEF7F0] border border-[#C8E6CE] text-[#599161] font-bold text-[10px]">
                                  {displayPct}% OFF
                                </span>
                              )}
                            </>
                          ) : (
                            <span className="text-xs text-muted-foreground">Enter sale price or % to preview.</span>
                          )}
                        </div>
                      )
                    })()}
                  </div>
                )}
              </div>

              {/* Variants grid */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-3">
                  <label className={label}>Variants — Stock & Price Adjustments</label>
                  <button
                    type="button"
                    onClick={() => set('variants', [...form.variants, { color: '', swatch_hex: '#cccccc', storage: '', ram: '', stock_quantity: 0, price_adjustment: 0 }])}
                    className={`${adminButtonGhost} px-3.5 py-1.5`}
                  >
                    <Plus className="w-3 h-3 text-[#599161]" />
                    Add Variant
                  </button>
                </div>
                {form.variants.length > 0 ? (
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
                                <div
                                  className="relative w-7 h-7 rounded-full border border-[#E9ECEA] shadow-3xs shrink-0 overflow-hidden cursor-pointer"
                                  style={{ backgroundColor: variant.swatch_hex || '#cccccc' }}
                                >
                                  <input
                                    type="color"
                                    value={variant.swatch_hex || '#cccccc'}
                                    onChange={(e) => {
                                      const next = [...form.variants]
                                      next[index] = { ...variant, swatch_hex: e.target.value }
                                      set('variants', next)
                                    }}
                                    className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                                    title="Swatch color"
                                  />
                                </div>
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
                            <td className="px-3 py-2 text-center">
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
                ) : (
                  <p className="text-xs text-muted-foreground py-2 pl-1">No variants added yet.</p>
                )}
              </div>
            </div>
          )}

          {/* SPECIFICATIONS TAB */}
          {activeTab === 'specs' && (
            <div className="space-y-6">
              {/* Mobile specifications editor — only for phone-type products */}
              {showMobileSpecs && (
                <div>
                  {!hasAnyMobileSpecs(form.mobile_specifications) ? (
                    /* Initial Preset Starter Card */
                    <div className="p-8 rounded-2xl border border-dashed border-[#C8E6CE] bg-[#F4F9F5]/70 text-center space-y-5">
                      <div className="max-w-md mx-auto space-y-1.5">
                        <div className="w-10 h-10 rounded-full bg-[#EEF7F0] border border-[#C8E6CE] text-[#599161] flex items-center justify-center mx-auto mb-3 shadow-3xs">
                          <Sparkles className="w-5 h-5" />
                        </div>
                        <h3 className="text-sm font-bold text-foreground">Mobile Specifications</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          Select a pre-configured spec preset to auto-fill technical details and add custom specs.
                        </p>
                      </div>

                      <div className="flex items-center justify-center pt-2 max-w-md mx-auto">
                        {/* Preset Loader */}
                        <div className="flex items-center gap-2 w-full sm:w-auto bg-white p-1.5 rounded-xl border border-[#C8E6CE] shadow-3xs">
                          <select
                            value={selectedPresetId}
                            onChange={(e) => setSelectedPresetId(e.target.value)}
                            className="text-xs font-semibold text-foreground/80 bg-transparent px-2.5 py-1.5 focus:outline-none cursor-pointer w-full sm:w-auto"
                          >
                            <option value="">Select a Preset to Load...</option>
                            {sortedPresets.map((p) => (
                              <option key={p.id} value={p.id}>{p.name}{p.brand ? ` (${p.brand})` : ''}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={loadPreset}
                            disabled={!selectedPresetId}
                            className={`${adminButton} text-xs px-3.5 py-2 shrink-0 disabled:opacity-50 disabled:cursor-not-allowed`}
                          >
                            Load Preset
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Full Spec Editor */
                    <div>
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
                        Loading a preset replaces the fields below with its saved values.
                      </p>

                      <MobileSpecsForm
                        value={form.mobile_specifications}
                        brand={form.brand}
                        onChange={(next) => set('mobile_specifications', next)}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Spec Template editor — only for non-phone-type products */}
              {!showMobileSpecs && (
                <div>
                  {templatesForType.length > 0 ? (
                    <div>
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
                  ) : (
                    <p className="text-xs text-muted-foreground py-4">No specification templates match this product type.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* MEDIA & IMAGES TAB */}
          {activeTab === 'media' && (
            <div className="space-y-6">
              <div>
                <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                  <label className={label}>Images</label>
                  <div className="flex flex-wrap items-center gap-2">
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
                    <label className={`${adminButtonGhost} px-3.5 py-2 cursor-pointer whitespace-nowrap shrink-0`}>
                      {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5 text-[#599161]" />}
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
                      className={`${adminButtonGhost} px-3.5 py-1.5 whitespace-nowrap shrink-0`}
                    >
                      <Plus className="w-3 h-3 text-[#599161]" />
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
                                  image.is_primary ? 'text-[#599161] bg-[#599161]/10' : 'text-muted-foreground hover:text-[#599161] hover:bg-muted'
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
            </div>
          )}

          {/* REVIEW TAB */}
          {activeTab === 'review' && (
            <div className="space-y-6 animate-in fade-in-50 duration-200">
              {/* Header Banner */}
              <div className="text-center py-4 px-6 bg-gradient-to-b from-[#F4F9F5] to-transparent rounded-2xl border border-[#E0EFE3]">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EEF7F0] border border-[#C8E6CE] text-[#599161] text-[11px] font-bold uppercase tracking-wider mb-2">
                  <Eye className="w-3.5 h-3.5" /> Product Review
                </div>
                <h3 className="text-base font-extrabold text-foreground tracking-tight">{form.name || 'Untitled Product'}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Please review the product configuration before saving.</p>
              </div>

              {/* Summary Stat Cards */}
              <div className="grid sm:grid-cols-3 gap-3.5">
                <div className="bg-white p-4 rounded-2xl border border-border/80 shadow-3xs text-center flex flex-col items-center justify-center space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Category & Type</span>
                  <span className="font-bold text-foreground text-xs">{categoryName}</span>
                  <span className="text-[11px] text-muted-foreground">{productTypeName}</span>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-border/80 shadow-3xs text-center flex flex-col items-center justify-center space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Selling Price</span>
                  {form.is_on_sale && Number(form.discount_percent) > 0 ? (
                    <>
                      <span className="font-black text-[#599161] text-lg">
                        ${(Number(form.base_price || 0) * (1 - Number(form.discount_percent) / 100)).toFixed(2)}{' '}
                        <span className="text-xs font-semibold text-muted-foreground">{currency}</span>
                      </span>
                      <span className="text-[11px] text-muted-foreground line-through">${form.base_price || '0.00'}</span>
                      <span className="px-2 py-0.5 rounded-full bg-[#EEF7F0] border border-[#C8E6CE] text-[#599161] font-bold text-[10px]">
                        {form.discount_percent}% OFF
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="font-black text-[#599161] text-lg">${form.base_price || '0.00'} <span className="text-xs font-semibold text-muted-foreground">{currency}</span></span>
                      {form.purchase_price && (
                        <span className="text-[11px] text-muted-foreground">Cost: ${form.purchase_price} ({profitPercent}% margin)</span>
                      )}
                    </>
                  )}
                </div>

                <div className="bg-white p-4 rounded-2xl border border-border/80 shadow-3xs text-center flex flex-col items-center justify-center space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Inventory & Status</span>
                  <span className="font-bold text-foreground text-xs">{totalStockQty} Units in Stock</span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 capitalize">
                    ● {form.condition} condition · {form.is_active ? 'Active' : 'Draft'}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="bg-white rounded-2xl border border-border/80 p-5 space-y-4 shadow-3xs">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-center pb-2 border-b border-border/60">Product Details</h4>
                <div className="grid sm:grid-cols-2 gap-4 text-xs">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-muted-foreground font-medium">Brand</span>
                    <span className="font-bold text-foreground">{form.brand || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-muted-foreground font-medium">SKU</span>
                    <span className="font-mono font-bold text-foreground">{form.sku || 'Auto-generated'}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-muted-foreground font-medium">Marketplaces</span>
                    <div className="flex gap-1">
                      {form.marketplaces.map((m) => (
                        <span key={m} className="px-2 py-0.5 rounded-md bg-[#EEF7F0] border border-[#C8E6CE] text-[#599161] font-bold text-[10px]">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-between items-center p-3 rounded-xl bg-muted/30 border border-border/50">
                    <span className="text-muted-foreground font-medium">Variants Count</span>
                    <span className="font-bold text-foreground">{form.variants.length} variant{form.variants.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>

              {/* Variants breakdown table if present */}
              {form.variants.length > 0 && (
                <div className="bg-white rounded-2xl border border-border/80 p-5 space-y-3 shadow-3xs">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-center">Variants Summary</h4>
                  <div className="border border-border/60 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-center">
                      <thead className="bg-secondary text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                        <tr>
                          <th className="py-2 px-3 text-left">Color</th>
                          <th className="py-2 px-3">Storage</th>
                          <th className="py-2 px-3">RAM</th>
                          <th className="py-2 px-3">Stock</th>
                          <th className="py-2 px-3">Adjustment</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {form.variants.map((v, i) => (
                          <tr key={i} className="hover:bg-muted/20">
                            <td className="py-2 px-3 text-left flex items-center gap-2">
                              {v.swatch_hex && (
                                <span className="w-3.5 h-3.5 rounded-full border border-border shrink-0 shadow-3xs" style={{ backgroundColor: v.swatch_hex }} />
                              )}
                              <span className="font-medium">{v.color || 'Default'}</span>
                            </td>
                            <td className="py-2 px-3 text-muted-foreground">{v.storage || '—'}</td>
                            <td className="py-2 px-3 text-muted-foreground">{v.ram || '—'}</td>
                            <td className="py-2 px-3 font-bold text-foreground">{v.stock_quantity}</td>
                            <td className="py-2 px-3 font-medium text-[#599161]">{v.price_adjustment ? `+${currency} ${v.price_adjustment}` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Image preview grid */}
              {form.images.length > 0 && (
                <div className="bg-white rounded-2xl border border-border/80 p-5 space-y-3 shadow-3xs">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider text-center">Media & Photos ({form.images.length})</h4>
                  <div className="flex flex-wrap justify-center gap-3">
                    {form.images.map((img, i) => (
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
        {renderActionButtons('pt-4 border-t border-border mt-6')}
      </div>
    </Modal>
  )
}
