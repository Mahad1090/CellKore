'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Heart, ShoppingCart, ChevronLeft, ChevronRight, MapPin, Smartphone, Minus, Plus } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { DetailShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { fetchProductById } from '@/lib/data'
import { addToLocalCart, getWishlist, toggleWishlist } from '@/lib/cart'
import type { Product, ProductVariant } from '@/lib/types'

export default function ProductDetailPage() {
	const params = useParams()
	const id = typeof params.id === 'string' ? params.id : ''
	const { toast } = useToast()

	const [product, setProduct] = useState<Product | null | undefined>(undefined)
	const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
	const [selectedImage, setSelectedImage] = useState(0)
	const [quantity, setQuantity] = useState(1)
	const [isWishlisted, setIsWishlisted] = useState(false)

	useEffect(() => {
		if (!id) return
		fetchProductById(id)
			.then((data) => {
				setProduct(data)
				const inStock = (data?.product_variants ?? []).find((v) => v.stock_quantity > 0)
				setSelectedVariant(inStock ?? data?.product_variants?.[0] ?? null)
			})
			.catch(() => setProduct(null))
		setIsWishlisted(getWishlist().includes(id))
	}, [id])

	const images = useMemo(
		() => [...(product?.product_images ?? [])].sort((a, b) => a.sort_order - b.sort_order),
		[product]
	)

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

	const variants = product.product_variants ?? []
	const specs = product.product_specifications ?? []
	const displayPrice = Number(product.base_price) + Number(selectedVariant?.price_adjustment ?? 0)
	const maxStock = selectedVariant?.stock_quantity ?? 0
	const inStock = variants.length === 0 || maxStock > 0

	const handleAddToCart = () => {
		if (variants.length > 0 && !selectedVariant) {
			toast({ title: 'Select an option', description: 'Please choose a color first.', variant: 'info' })
			return
		}
		if (!inStock) return
		addToLocalCart({
			productId: product.id,
			variantId: selectedVariant?.id ?? null,
			quantity,
		})
		toast({
			title: 'Added to cart',
			description: `${product.name}${selectedVariant?.color ? ` — ${selectedVariant.color}` : ''} × ${quantity}`,
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
							{product.location && (
								<span className="flex items-center gap-1 text-xs text-muted-foreground">
									<MapPin className="w-3.5 h-3.5" />
									{product.location}
								</span>
							)}
						</div>

						<p className="text-3xl font-bold text-primary mb-6">
							${displayPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
						</p>

						{product.description && (
							<p className="text-sm text-foreground/75 leading-relaxed mb-8">{product.description}</p>
						)}

						{/* Variant selector — depleted options disabled */}
						{variants.length > 0 && (
							<div className="mb-8">
								<p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground mb-3">Color</p>
								<div className="flex flex-wrap gap-2.5">
									{variants.map((variant) => {
										const depleted = variant.stock_quantity === 0
										return (
											<button
												key={variant.id}
												disabled={depleted}
												onClick={() => {
													setSelectedVariant(variant)
													setQuantity(1)
												}}
												className={`px-5 py-2.5 rounded-full border text-xs font-medium transition-all ${
													depleted
														? 'border-border text-muted-foreground/50 line-through cursor-not-allowed'
														: selectedVariant?.id === variant.id
														? 'border-primary bg-primary text-primary-foreground cursor-pointer'
														: 'border-border text-foreground hover:border-primary cursor-pointer'
												}`}
											>
												{variant.color ?? 'Standard'}
												{Number(variant.price_adjustment) !== 0 && !depleted && (
													<span className="ml-1.5 opacity-70">
														{Number(variant.price_adjustment) > 0 ? '+' : ''}${Number(variant.price_adjustment).toFixed(0)}
													</span>
												)}
											</button>
										)
									})}
								</div>
								{selectedVariant && selectedVariant.stock_quantity > 0 && selectedVariant.stock_quantity <= 5 && (
									<p className="text-xs text-destructive mt-3">Only {selectedVariant.stock_quantity} left in stock</p>
								)}
							</div>
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
						{specs.length > 0 && (
							<div className="border border-border rounded-3xl overflow-hidden">
								<h2 className="px-6 py-4 bg-secondary text-xs font-bold uppercase tracking-[0.18em] text-foreground">
									Specifications
								</h2>
								<dl>
									{specs.map((spec, index) => (
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
