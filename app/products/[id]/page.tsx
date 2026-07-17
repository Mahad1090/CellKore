'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Heart, ShoppingCart, ChevronLeft, ChevronRight, Smartphone, Minus, Plus } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { DetailShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { Accordion } from '@/components/ui/accordion'
import { fetchProductById } from '@/lib/data'
import { addToLocalCart, getWishlist, toggleWishlist } from '@/lib/cart'
import { categoryHasValues, getCategoriesForBrand, getCategoryValues } from '@/lib/mobile-specs'
import type { Product } from '@/lib/types'

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
				setOpenSpecItems(categories.map((c) => c.id))
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
					<Link href="/products" className="text-primary hover:underline text-sm">
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
	const displayPrice = Number(product.base_price) + Number(selectedVariant?.price_adjustment ?? 0)
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
					<Link href="/products" className="hover:text-primary transition-colors">Products</Link>
					<span className="mx-2">/</span>
					<span className="text-foreground">{product.name}</span>
				</nav>

				<div className="grid md:grid-cols-2 gap-12">
					{/* Image carousel */}
					<div>
						<div className="relative aspect-square bg-muted rounded-3xl overflow-hidden group">
							{images.length > 0 ? (
								<img
									src={images[selectedImage]?.image_url}
									alt={product.name}
									className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
										className={`w-20 h-20 rounded-2xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
											selectedImage === index ? 'border-primary' : 'border-transparent opacity-60 hover:opacity-100'
										}`}
									>
										<img src={image.image_url} alt="" className="w-full h-full object-cover" />
									</button>
								))}
							</div>
						)}
					</div>

					{/* Details */}
					<div>
						{product.brand && (
							<p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">{product.brand}</p>
						)}
						<h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">{product.name}</h1>
						<div className="flex items-center gap-3 mb-6">
							<span className="px-3 py-1 rounded-full bg-secondary text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/80 capitalize">
								{product.condition}
							</span>
						</div>

						<p className="text-3xl font-bold text-primary mb-6">
							${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
						</p>

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
										return (
											<button
												key={color ?? '__standard__'}
												disabled={depleted}
												onClick={() => handleSelectColor(color)}
												className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-medium transition-all ${
													depleted
														? 'border-border text-muted-foreground/50 line-through cursor-not-allowed'
														: active
														? 'border-primary bg-primary text-primary-foreground cursor-pointer'
														: 'border-border text-foreground hover:border-primary cursor-pointer'
												}`}
											>
												{swatch_hex && (
													<span
														className="w-3 h-3 rounded-full border border-black/10 shrink-0"
														style={{ backgroundColor: swatch_hex }}
													/>
												)}
												{color ?? 'Standard'}
												{!hasStorageDimension && selectedVariant && active && !depleted && Number(selectedVariant.price_adjustment) !== 0 && (
													<span className="ml-1.5 opacity-70">
														{Number(selectedVariant.price_adjustment) > 0 ? '+' : ''}${Number(selectedVariant.price_adjustment).toFixed(0)}
													</span>
												)}
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
						{(specCategories.length > 0 || customSpecs.length > 0) && (
							<div>
								<h2 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground mb-3">
									Specifications
								</h2>
								<Accordion
									openItems={openSpecItems}
									onOpenItemsChange={setOpenSpecItems}
									items={[
										...specCategories.map((category) => ({
											value: category.id,
											header: category.label,
											content: (() => {
												const categoryValues = getCategoryValues(mobileSpecs, category.id)
												return (
													<dl>
														{category.fields
															.filter((field) => (categoryValues[field.key] ?? '').trim() !== '')
															.map((field, index) => (
																<div
																	key={field.key}
																	className={`flex items-center justify-between py-2.5 text-sm ${index % 2 === 1 ? 'bg-muted/40' : ''}`}
																>
																	<dt className="text-muted-foreground">{field.label}</dt>
																	<dd className="font-medium text-foreground">
																		{field.type === 'checkbox' ? 'Yes' : categoryValues[field.key]}
																		{field.unit && field.type !== 'checkbox' ? ` ${field.unit}` : ''}
																	</dd>
																</div>
															))}
													</dl>
												)
											})(),
										})),
										...(customSpecs.length > 0
											? [
													{
														value: 'additional',
														header: 'Additional Specifications',
														content: (
															<dl>
																{customSpecs.map((spec, index) => (
																	<div
																		key={spec.key}
																		className={`flex items-center justify-between py-2.5 text-sm ${index % 2 === 1 ? 'bg-muted/40' : ''}`}
																	>
																		<dt className="text-muted-foreground">{spec.key}</dt>
																		<dd className="font-medium text-foreground">{spec.value}</dd>
																	</div>
																))}
															</dl>
														),
													},
												]
											: []),
									]}
								/>
							</div>
						)}
						{specCategories.length === 0 && customSpecs.length === 0 && (templateEntries.length > 0 || templateCustom.length > 0) && (
							<div className="border border-border rounded-3xl overflow-hidden">
								<h2 className="px-6 py-4 bg-secondary text-xs font-bold uppercase tracking-[0.18em] text-foreground">
									Specifications
								</h2>
								<dl>
									{[
										...templateEntries.map((e) => ({
											key: e.key,
											label: e.label,
											value: e.type === 'checkbox' ? 'Yes' : `${e.value}${e.unit ? ` ${e.unit}` : ''}`,
										})),
										...templateCustom.map((c) => ({ key: c.label, label: c.label, value: c.value })),
									].map((spec, index) => (
										<div
											key={spec.key}
											className={`flex items-center justify-between px-6 py-3.5 text-sm ${
												index % 2 === 1 ? 'bg-muted/40' : ''
											}`}
										>
											<dt className="text-muted-foreground">{spec.label}</dt>
											<dd className="font-medium text-foreground">{spec.value}</dd>
										</div>
									))}
								</dl>
							</div>
						)}
						{specCategories.length === 0 && customSpecs.length === 0 && templateEntries.length === 0 && templateCustom.length === 0 && legacySpecs.length > 0 && (
							<div className="border border-border rounded-3xl overflow-hidden">
								<h2 className="px-6 py-4 bg-secondary text-xs font-bold uppercase tracking-[0.18em] text-foreground">
									Specifications
								</h2>
								<dl>
									{legacySpecs.map((spec, index) => (
										<div
											key={spec.id}
											className={`flex items-center justify-between px-6 py-3.5 text-sm ${
												index % 2 === 1 ? 'bg-muted/40' : ''
											}`}
										>
											<dt className="text-muted-foreground">{spec.spec_name}</dt>
											<dd className="font-medium text-foreground">{spec.spec_value}</dd>
										</div>
									))}
								</dl>
							</div>
						)}
					</div>
				</div>
			</div>

			<Footer />
		</main>
	)
}
