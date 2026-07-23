'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { 
	Heart, ShoppingCart, ChevronLeft, ChevronRight, Smartphone, Minus, Plus,
	Cpu, Camera, Battery, HardDrive, Wifi, Volume2, ShieldCheck, Compass, Box, Sparkles, HelpCircle,
	Layers, Plug
} from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { DetailShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { Accordion } from '@/components/ui/accordion'
import { fetchProductById } from '@/lib/data'
import { addToLocalCart, getWishlist, toggleWishlist } from '@/lib/cart'
import { categoryHasValues, getCategoriesForBrand, getCategoryValues } from '@/lib/mobile-specs'
import { ProductReviewsSection } from '@/components/product-reviews'
import type { Product } from '@/lib/types'
import { isProductOnSale, getOriginalPrice, getDiscountedPrice } from '@/lib/types'

function getColorHexFallback(colorName: string | null): string {
	if (!colorName) return '#cccccc'
	const name = colorName.toLowerCase().trim()
	
	if (name.includes('gold')) return '#f4e0c8'
	if (name.includes('silver')) return '#e3e4e5'
	if (name.includes('space gray') || name.includes('space grey')) return '#53565a'
	if (name.includes('gray') || name.includes('grey')) return '#8e8e93'
	if (name.includes('black') || name.includes('midnight') || name.includes('graphite') || name.includes('dark')) return '#1a1a1c'
	if (name.includes('white') || name.includes('starlight')) return '#f9f6ef'
	if (name.includes('blue') || name.includes('sierra')) return '#a7c7e7'
	if (name.includes('green') || name.includes('alpine')) return '#5f7c68'
	if (name.includes('red') || name.includes('product')) return '#e11d48'
	if (name.includes('purple') || name.includes('deep')) return '#5a4d6e'
	if (name.includes('yellow')) return '#ffe082'
	if (name.includes('rose')) return '#fadadd'
	if (name.includes('bronze')) return '#cd7f32'
	
	return name
}

const SPEC_SECTION_ICONS: Record<string, React.ComponentType<any>> = {
	general: Smartphone,
	display: Smartphone,
	performance: Cpu,
	memory: HardDrive,
	battery: Battery,
	rearCamera: Camera,
	frontCamera: Camera,
	connectivity: Wifi,
	audio: Volume2,
	sensors: ShieldCheck,
	software: Compass,
	boxContents: Box,
	samsungFeatures: Sparkles,
	appleFeatures: Sparkles,
}

export default function ProductDetailPage() {
	const params = useParams()
	const id = typeof params.id === 'string' ? params.id : ''
	const { toast } = useToast()

	const [product, setProduct] = useState<Product | null | undefined>(undefined)
	const [selectedColor, setSelectedColor] = useState<string | null>(null)
	const [selectedStorage, setSelectedStorage] = useState<string | null>(null)
	const [selectedImage, setSelectedImage] = useState(0)
	const [quantity, setQuantity] = useState(1)
	const [isWishlisted, setIsWishlisted] = useState(false)
	const [openSpecItems, setOpenSpecItems] = useState<string[]>([])

	useEffect(() => {
		if (!id) return
		fetchProductById(id)
			.then((data) => {
				setProduct(data)
				const productVariants = data?.product_variants ?? []
				const initial = productVariants.find((v) => v.stock_quantity > 0) ?? productVariants[0] ?? null
				setSelectedColor(initial?.color ?? null)
				setSelectedStorage(initial?.storage ?? null)
				const categories = getCategoriesForBrand(data?.brand).filter((category) =>
					categoryHasValues(data?.mobile_specifications ?? {}, category)
				)
				setOpenSpecItems([])
			})
			.catch(() => setProduct(null))
		setIsWishlisted(getWishlist().includes(id))
	}, [id])

	const variants = useMemo(() => product?.product_variants ?? [], [product])
	const hasStorageDimension = useMemo(() => variants.some((v) => (v.storage ?? '').trim() !== ''), [variants])
	const selectedVariant = useMemo(() => {
		if (variants.length === 0) return null
		return (
			variants.find(
				(v) =>
					(v.color ?? '') === (selectedColor ?? '') &&
					(!hasStorageDimension || (v.storage ?? '').trim() === (selectedStorage ?? ''))
			) ?? null
		)
	}, [variants, selectedColor, selectedStorage, hasStorageDimension])

	const uniqueColors = useMemo(() => {
		const seen = new Set<string>()
		const list: { color: string | null; swatch_hex?: string | null }[] = []
		for (const v of variants) {
			const key = v.color ?? ''
			if (!seen.has(key)) {
				seen.add(key)
				list.push({ color: v.color, swatch_hex: v.swatch_hex })
			}
		}
		return list
	}, [variants])

	const storageOptions = useMemo(() => {
		if (!hasStorageDimension) return []
		const seen = new Set<string>()
		const list: string[] = []
		for (const v of variants) {
			if ((v.color ?? '') !== (selectedColor ?? '')) continue
			const s = (v.storage ?? '').trim()
			if (s && !seen.has(s)) {
				seen.add(s)
				list.push(s)
			}
		}
		return list
	}, [variants, selectedColor, hasStorageDimension])

	const colorHasStock = (color: string | null) =>
		variants.some((v) => (v.color ?? '') === (color ?? '') && v.stock_quantity > 0)

	const handleSelectColor = (color: string | null) => {
		if (hasStorageDimension) {
			const storagesForColor = variants
				.filter((v) => (v.color ?? '') === (color ?? ''))
				.map((v) => (v.storage ?? '').trim())
				.filter(Boolean)
			if (!storagesForColor.includes(selectedStorage ?? '')) {
				setSelectedStorage(storagesForColor[0] ?? null)
			}
		}
		setSelectedColor(color)
		setQuantity(1)
		setSelectedImage(0)
	}

	const handleSelectStorage = (storage: string) => {
		setSelectedStorage(storage)
		setQuantity(1)
		setSelectedImage(0)
	}

	const allImages = useMemo(
		() => [...(product?.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
		[product]
	)

	const images = useMemo(() => {
		if (!product || variants.length === 0) return allImages
		const colorImages = selectedColor
			? allImages.filter((i) => (i.variant_color ?? '').trim() === selectedColor)
			: []
		if (colorImages.length > 0) return colorImages
		const shared = allImages.filter((i) => !(i.variant_color ?? '').trim())
		return shared.length > 0 ? shared : allImages
	}, [allImages, product, variants, selectedColor])

	const specHighlights = useMemo(() => {
		if (!product) return []
		const specs = product.mobile_specifications ?? {}
		const templateEntries = (product.template_specifications?.entries ?? []).filter((e) => e.value.trim())
		const legacySpecs = product.product_specifications ?? []

		// Helper to find a spec value by key/label case-insensitively
		const findSpecVal = (keys: string[], labels: string[]) => {
			for (const categoryId of Object.keys(specs)) {
				const categoryValues = getCategoryValues(specs, categoryId)
				for (const k of keys) {
					if (categoryValues[k]) return categoryValues[k]
				}
			}
			for (const entry of templateEntries) {
				const normalizedKey = entry.key.toLowerCase()
				const normalizedLabel = entry.label.toLowerCase()
				if (keys.some(k => normalizedKey.includes(k.toLowerCase())) || 
					labels.some(l => normalizedLabel.includes(l.toLowerCase()))) {
					return `${entry.value}${entry.unit ? ` ${entry.unit}` : ''}`
				}
			}
			for (const legacy of legacySpecs) {
				const normalizedName = legacy.spec_name.toLowerCase()
				if (labels.some(l => normalizedName.includes(l.toLowerCase()))) {
					return legacy.spec_value
				}
			}
			return null
		}

		// 1. Display
		const displayVal = findSpecVal(['screenSize', 'displaySize', 'screen_size'], ['screen size', 'display size', 'display']) || '6.7'
		const displayDetail = findSpecVal(['displayType', 'resolution'], ['display type', 'resolution', 'screen protection']) || 'Super Retina XDR OLED'

		// 2. Camera
		const camVal = findSpecVal(['mainCamera', 'rearCamera', 'camera'], ['main camera', 'rear camera', 'camera']) || '48 MP'
		const camDetail = findSpecVal(['telephotoCamera', 'macroCamera', 'opticalZoom', 'videoRecording'], ['camera system', 'optical zoom', 'zoom', 'video recording']) || 'Triple Camera System'

		// 3. Processor
		const chipVal = findSpecVal(['chipset', 'cpu', 'processor'], ['chipset', 'cpu', 'processor', 'chip']) || 'A16 Bionic'
		const chipDetail = findSpecVal(['aiEngine', 'gpu'], ['ai engine', 'neural engine', 'gpu', 'graphics', 'cores']) || '6-Core CPU'

		// 4. Battery
		const battVal = findSpecVal(['batteryCapacity', 'battery', 'capacity'], ['battery capacity', 'battery', 'capacity']) || '4352 mAh'
		const battDetail = findSpecVal(['wiredCharging', 'wirelessCharging'], ['battery type', 'charging speed', 'playback']) || 'Up to 28h Video Playback'

		// 5. Storage
		const storageVal = selectedStorage || findSpecVal(['internalStorage', 'storage'], ['storage', 'internal storage']) || '128 GB'
		const storageDetail = findSpecVal(['storageType'], ['storage type', 'flash memory']) || 'NVMe Storage'

		// 6. RAM
		const ramVal = findSpecVal(['ram', 'memory'], ['ram', 'memory']) || '6 GB'
		const ramDetail = findSpecVal(['ramType'], ['ram type', 'memory speed']) || 'LPDDR5'

		// 7. Charging
		const chargingVal = findSpecVal(['usbType', 'wiredCharging'], ['usb type', 'charging port', 'charging']) || 'USB-C'
		const chargingDetail = findSpecVal(['wiredCharging', 'wirelessCharging'], ['wired charging', 'wireless charging', 'charge detail']) || 'Fast Charging'

		// 8. Network
		const networkVal = findSpecVal(['fiveG', 'connectivity'], ['connectivity', 'network', 'sim type']) ? '5G' : '5G'
		const networkDetail = findSpecVal(['wifi', 'bluetooth'], ['wifi', 'wireless', 'network details']) || 'Ultra Fast Connectivity'

		return [
			{ icon: Smartphone, label: 'Display', value: displayVal.includes('"') || displayVal.toLowerCase().includes('inch') ? displayVal : `${displayVal}"`, detail: displayDetail },
			{ icon: Camera, label: 'Camera', value: camVal, detail: camDetail },
			{ icon: Cpu, label: 'Processor', value: chipVal.replace(/\s*chip\s*/i, ''), detail: chipDetail },
			{ icon: Battery, label: 'Battery', value: battVal.toLowerCase().includes('mah') ? battVal : `${battVal} mAh`, detail: battDetail },
			{ icon: HardDrive, label: 'Storage', value: storageVal, detail: storageDetail },
			{ icon: Layers, label: 'RAM', value: ramVal, detail: ramDetail },
			{ icon: Plug, label: 'Charging', value: chargingVal, detail: chargingDetail },
			{ icon: Wifi, label: 'Network', value: networkVal, detail: networkDetail },
		]
	}, [product, selectedStorage])

	if (product === undefined) {
		return (
			<main className="min-h-screen bg-background">
				<Navigation />
				<DetailShimmer />
				<Footer />
			</main>
		)
	}

	if (product === null || product.is_wholesale || !product.is_active) {
		return (
			<main className="min-h-screen bg-background">
				<Navigation />
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
					<h1 className="text-3xl font-bold text-foreground mb-4">Product Not Found</h1>
					<Link href="/products?category=iphones" className="text-primary hover:underline text-sm">
						Back to Products
					</Link>
				</div>
				<Footer />
			</main>
		)
	}

	const legacySpecs = product.product_specifications ?? []
	const mobileSpecs = product.mobile_specifications ?? {}
	const specCategories = getCategoriesForBrand(product.brand).filter((category) => categoryHasValues(mobileSpecs, category))
	const customSpecs = (mobileSpecs.custom ?? []).filter((c) => c.key.trim() && c.value.trim())
	const templateEntries = (product.template_specifications?.entries ?? []).filter((e) => e.value.trim())
	const templateCustom = (product.template_specifications?.custom ?? []).filter((c) => c.label.trim() && c.value.trim())
	const displayOriginalPrice = getOriginalPrice(product, selectedVariant)
	const hasDiscount = isProductOnSale(product)
	const displayPrice = hasDiscount ? getDiscountedPrice(product, selectedVariant) : displayOriginalPrice
	const maxStock = selectedVariant?.stock_quantity ?? 0
	const inStock = variants.length === 0 || maxStock > 0

	const handleAddToCart = () => {
		if (variants.length > 0 && !selectedVariant) {
			toast({
				title: 'Select an option',
				description: hasStorageDimension ? 'Please choose a color and storage.' : 'Please choose a color.',
				variant: 'info',
			})
			return
		}
		if (!inStock) return
		addToLocalCart({
			productId: product.id,
			variantId: selectedVariant?.id ?? null,
			quantity,
		})
		const storageLabel = selectedVariant?.ram ? `${selectedVariant.ram}/${selectedVariant.storage}` : selectedVariant?.storage
		const variantLabel = [selectedVariant?.color, storageLabel].filter(Boolean).join(' — ')
		toast({
			title: 'Added to cart',
			description: `${product.name}${variantLabel ? ` — ${variantLabel}` : ''} × ${quantity}`,
			variant: 'success',
		})
	}

	const handleWishlist = () => {
		const added = toggleWishlist(product.id)
		setIsWishlisted(added)
		toast({
			title: added ? 'Saved to wishlist' : 'Removed from wishlist',
			variant: 'info',
		})
	}

	return (
		<main className="min-h-screen bg-background">
			<Navigation />

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<nav className="text-xs text-muted-foreground mb-8 uppercase tracking-[0.14em]">
					<Link href="/" className="hover:text-primary transition-colors">Home</Link>
					<span className="mx-2">/</span>
					<Link href="/products?category=iphones" className="hover:text-primary transition-colors">Products</Link>
					<span className="mx-2">/</span>
					<span className="text-foreground">{product.name}</span>
				</nav>

				<div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
					{/* Image carousel */}
					<div className="lg:col-span-5">
						<div className="relative aspect-square bg-[#f8f9fa] border border-border/40 rounded-3xl overflow-hidden group flex items-center justify-center p-8 md:p-12">
							{images.length > 0 ? (
								<img
									src={images[selectedImage]?.image_url}
									alt={product.name}
									className="max-w-full max-h-full object-contain transition-transform duration-500 group-hover:scale-105"
								/>
							) : (
								<div className="w-full h-full flex items-center justify-center">
									<Smartphone className="w-16 h-16 text-muted-foreground/30" />
								</div>
							)}
							{images.length > 1 && (
								<>
									<button
										onClick={() => setSelectedImage((i) => (i - 1 + images.length) % images.length)}
										className="absolute left-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-background/80 backdrop-blur border border-border opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
										aria-label="Previous image"
									>
										<ChevronLeft className="w-4 h-4" />
									</button>
									<button
										onClick={() => setSelectedImage((i) => (i + 1) % images.length)}
										className="absolute right-4 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-background/80 backdrop-blur border border-border opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
										aria-label="Next image"
									>
										<ChevronRight className="w-4 h-4" />
									</button>
								</>
							)}
						</div>
						{images.length > 1 && (
							<div className="flex gap-3 mt-4 overflow-x-auto no-scrollbar">
								{images.map((image, index) => (
									<button
										key={image.id}
										onClick={() => setSelectedImage(index)}
										className={`w-16 h-16 rounded-2xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer bg-[#f8f9fa] p-1.5 flex items-center justify-center ${
											selectedImage === index ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
										}`}
									>
										<img src={image.image_url} alt="" className="max-w-full max-h-full object-contain" />
									</button>
								))}
							</div>
						)}
					</div>

					{/* Details */}
					<div className="lg:col-span-7">
						{product.brand && (
							<p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">{product.brand}</p>
						)}
						<h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{product.name}</h1>
						<div className="flex items-center gap-3 mb-6">
							<span className="px-3 py-1 rounded-full bg-secondary text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/80 capitalize">
								{product.condition}
							</span>
							{hasDiscount && (
								<span className="px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 text-[10px] font-bold uppercase tracking-[0.14em]">
									{Number(product.discount_percent)}% Off
								</span>
							)}
						</div>

						<div className="flex items-baseline gap-3 mb-6">
							<p className="text-3xl font-bold text-primary">
								${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
							</p>
							{hasDiscount && (
								<p className="text-lg font-medium text-muted-foreground line-through decoration-muted-foreground/60">
									${displayOriginalPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
								</p>
							)}
						</div>

						{product.description && (
							<p className="text-sm text-foreground/75 leading-relaxed mb-8">{product.description}</p>
						)}

						{/* Variant selectors — depleted combinations disabled */}
						{variants.length > 0 && (
							<div className="mb-8">
								<p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">Color</p>
								<div className="flex flex-wrap gap-2.5">
									{uniqueColors.map(({ color, swatch_hex }) => {
										const depleted = !colorHasStock(color)
										const active = (selectedColor ?? '') === (color ?? '')

										const label = (
											<>
												{color && (
													<span
														className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0 shadow-sm"
														style={{ backgroundColor: swatch_hex || getColorHexFallback(color) }}
													/>
												)}
												{color ?? 'Standard'}
												{!hasStorageDimension && selectedVariant && active && !depleted && Number(selectedVariant.price_adjustment) !== 0 && (
													<span className="ml-1.5 opacity-70">
														{Number(selectedVariant.price_adjustment) > 0 ? '+' : ''}${Number(selectedVariant.price_adjustment).toFixed(0)}
													</span>
												)}
											</>
										)

										if (active && !depleted) {
											return (
												<div key={color ?? '__standard__'} className="glow-outline-btn glow-outline-primary">
													<span className="glow-outline-beam" />
													<button
														onClick={() => handleSelectColor(color)}
														className="glow-outline-inner inline-flex items-center gap-2 px-5 py-2.5 text-xs font-medium text-foreground cursor-pointer"
													>
														{label}
													</button>
												</div>
											)
										}

										return (
											<button
												key={color ?? '__standard__'}
												disabled={depleted}
												onClick={() => handleSelectColor(color)}
												className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-medium transition-all ${
													depleted
														? 'border-border text-muted-foreground/50 line-through cursor-not-allowed'
														: 'border-border text-foreground hover:border-primary cursor-pointer'
												}`}
											>
												{label}
											</button>
										)
									})}
								</div>
							</div>
						)}

						{hasStorageDimension && storageOptions.length > 0 && (
							<div className="mb-8">
								<p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">Storage</p>
								<div className="flex flex-wrap gap-2.5">
									{storageOptions.map((storage) => {
										const variant = variants.find(
											(v) => (v.color ?? '') === (selectedColor ?? '') && (v.storage ?? '').trim() === storage
										)
										const depleted = !variant || variant.stock_quantity === 0
										const active = (selectedStorage ?? '') === storage
										return (
											<button
												key={storage}
												disabled={depleted}
												onClick={() => handleSelectStorage(storage)}
												className={`px-5 py-2.5 rounded-full border text-xs font-medium transition-all ${
													depleted
														? 'border-border text-muted-foreground/50 line-through cursor-not-allowed'
														: active
														? 'border-primary bg-primary text-primary-foreground cursor-pointer'
														: 'border-border text-foreground hover:border-primary cursor-pointer'
												}`}
											>
												{variant?.ram ? `${variant.ram} / ${storage}` : storage}
												{variant && Number(variant.price_adjustment) !== 0 && !depleted && (
													<span className="ml-1.5 opacity-70">
														{Number(variant.price_adjustment) > 0 ? '+' : ''}${Number(variant.price_adjustment).toFixed(0)}
													</span>
												)}
											</button>
										)
									})}
								</div>
							</div>
						)}

						{variants.length > 0 && selectedVariant && selectedVariant.stock_quantity > 0 && selectedVariant.stock_quantity <= 5 && (
							<p className="text-xs text-destructive mb-8 -mt-4">Only {selectedVariant.stock_quantity} left in stock</p>
						)}

						{/* Quantity + actions */}
						<div className="flex flex-wrap items-center gap-4 mb-10">
							<div className="flex items-center border border-border rounded-full overflow-hidden">
								<button
									onClick={() => setQuantity((q) => Math.max(1, q - 1))}
									className="p-3 hover:bg-muted transition-colors cursor-pointer"
									aria-label="Decrease quantity"
								>
									<Minus className="w-3.5 h-3.5" />
								</button>
								<span className="w-10 text-center text-sm font-semibold">{quantity}</span>
								<button
									onClick={() => setQuantity((q) => (maxStock > 0 ? Math.min(maxStock, q + 1) : q + 1))}
									className="p-3 hover:bg-muted transition-colors cursor-pointer"
									aria-label="Increase quantity"
								>
									<Plus className="w-3.5 h-3.5" />
								</button>
							</div>
							<button
								onClick={handleAddToCart}
								disabled={!inStock}
								className={`flex-1 min-w-[180px] flex items-center justify-center gap-2 px-8 py-3.5 rounded-full text-xs font-bold uppercase tracking-[0.18em] transition-all ${
									inStock
										? 'bg-primary text-primary-foreground hover:opacity-90 hover:scale-[1.02] active:scale-95 cursor-pointer shadow-lg'
										: 'bg-muted text-muted-foreground cursor-not-allowed'
								}`}
							>
								<ShoppingCart className="w-4 h-4" />
								{inStock ? 'Add to Cart' : 'Out of Stock'}
							</button>
							<button
								onClick={handleWishlist}
								className={`p-3.5 rounded-full border transition-all cursor-pointer ${
									isWishlisted
										? 'border-primary bg-primary/10 text-primary'
										: 'border-border text-foreground hover:border-primary hover:text-primary'
								}`}
								aria-label="Toggle wishlist"
							>
								<Heart className={`w-4.5 h-4.5 ${isWishlisted ? 'fill-current' : ''}`} />
							</button>
						</div>

						{/* Specifications */}
						{specHighlights.length > 0 && (
							<div className="mt-8">
								<h2 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground mb-4">
									Specifications
								</h2>
								
								{/* Premium Highlights Grid */}
								<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
									{specHighlights.map((highlight, index) => {
										const HighlightIcon = highlight.icon
										return (
											<div key={index} className="bg-[#f8f9fa] border border-border/40 rounded-2xl p-4 flex items-center gap-4 hover:shadow-md transition-all duration-300">
												<div className="w-12 h-12 rounded-xl bg-[#62936c]/10 text-[#62936c] flex items-center justify-center shrink-0">
													<HighlightIcon className="w-6 h-6" />
												</div>
												<div className="flex flex-col text-left">
													<span className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground leading-none">
														{highlight.label}
													</span>
													<span className="text-base font-bold text-foreground leading-tight mt-1.5">
														{highlight.value}
													</span>
													<span className="text-[11px] text-muted-foreground mt-1 leading-none">
														{highlight.detail}
													</span>
												</div>
											</div>
										)
									})}
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<ProductReviewsSection productId={product.id} productName={product.name} />
			</div>

			<Footer />
		</main>
	)
}
