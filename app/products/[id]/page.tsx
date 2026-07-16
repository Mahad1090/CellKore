'use client'

import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { ALL_PRODUCTS, ProductVariant } from '@/lib/mock-data'
import { useState, useEffect } from 'react'
import { Star, Heart, ShoppingCart, Check } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { ProductVariantSelector } from '@/components/product-variant-selector'
import { ProductSpecifications } from '@/components/product-specifications'

export default function ProductDetailPage() {
  const params = useParams()
  const id = typeof params.id === 'string' ? params.id : ''
  const product = ALL_PRODUCTS.find((p) => p.id === id)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selectedImage, setSelectedImage] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [isWishlisted, setIsWishlisted] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  useEffect(() => {
    if (product?.variants && product.variants.length > 0) {
      setSelectedVariant(product.variants[0])
    }
  }, [product])

  if (!product) {
    return (
      <main className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Product Not Found</h1>
          <Link href="/products" className="text-primary hover:underline">
            Back to Products
          </Link>
        </div>
        <Footer />
      </main>
    )
  }

  const images = product.images || [product.image]
  const displayPrice = selectedVariant?.price || product.price
  const displayOriginalPrice = selectedVariant?.originalPrice || product.originalPrice
  const isInStock = selectedVariant?.inStock ?? product.inStock

  const handleAddToCart = () => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const cartItem = {
      ...product,
      variant: selectedVariant,
      quantity,
    }
    const existingItem = cart.find((item: any) => item.id === product.id && item.variant?.id === selectedVariant?.id)

    if (existingItem) {
      existingItem.quantity += quantity
    } else {
      cart.push(cartItem)
    }

    localStorage.setItem('cart', JSON.stringify(cart))
    setAddedToCart(true)
    setTimeout(() => setAddedToCart(false), 2000)
    window.dispatchEvent(new Event('storage'))
  }

  const handleAddToWishlist = () => {
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
    const exists = wishlist.find((item: any) => item.id === product.id)

    if (exists) {
      const filtered = wishlist.filter((item: any) => item.id !== product.id)
      localStorage.setItem('wishlist', JSON.stringify(filtered))
      setIsWishlisted(false)
    } else {
      wishlist.push(product)
      localStorage.setItem('wishlist', JSON.stringify(wishlist))
      setIsWishlisted(true)
    }

    window.dispatchEvent(new Event('storage'))
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Breadcrumb */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <span>/</span>
          <Link href="/products" className="hover:text-primary">
            Products
          </Link>
          <span>/</span>
          <span className="text-foreground">{product.name}</span>
        </div>
      </div>

      {/* Product Detail */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Images */}
          <div className="flex flex-col-reverse md:flex-col gap-4">
            {/* Main Image */}
            <div className="bg-white rounded-lg overflow-hidden h-96 md:h-[500px]">
              <img src={images[selectedImage]} alt={product.name} className="w-full h-full object-contain" />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition ${
                      selectedImage === idx ? 'border-primary' : 'border-border hover:border-primary'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="flex flex-col">
            {/* Category Badge */}
            <div className="mb-2">
              <span className="inline-block px-3 py-1 bg-muted text-muted-foreground rounded text-xs font-semibold capitalize">
                {product.category}
              </span>
            </div>

            {product.country && (
              <div className="mb-4">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-foreground text-background">
                  Available in {product.country === 'US' ? 'United States' : 'Canada'}
                </span>
              </div>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">{product.name}</h1>

            {/* Rating */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${i < Math.floor(product.rating) ? 'fill-accent text-accent' : 'text-muted'}`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {product.rating} out of 5 ({product.reviews} reviews)
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center gap-3 mb-6">
              <span className="text-4xl font-bold text-primary">${displayPrice}</span>
              {displayOriginalPrice && (
                <div className="flex items-center gap-2">
                  <span className="text-lg text-muted-foreground line-through">${displayOriginalPrice}</span>
                  <span className="bg-accent text-accent-foreground px-2 py-1 rounded text-sm font-semibold">
                    Save ${(displayOriginalPrice - displayPrice).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            {/* Condition & Warranty */}
            <div className="bg-muted rounded-lg p-4 mb-6 space-y-2">
              {product.country && (
                <div>
                  <span className="font-semibold text-foreground">Country: </span>
                  <span className="text-muted-foreground">{product.country === 'US' ? 'United States' : 'Canada'}</span>
                </div>
              )}
              {product.condition && (
                <div>
                  <span className="font-semibold text-foreground">Condition: </span>
                  <span className="text-muted-foreground capitalize">{product.condition}</span>
                </div>
              )}
              {product.warranty && (
                <div>
                  <span className="font-semibold text-foreground">Warranty: </span>
                  <span className="text-muted-foreground">{product.warranty}</span>
                </div>
              )}
            </div>

            {/* Variant Selector */}
            {product.variants && product.variants.length > 0 && (
              <div className="mb-6">
                <ProductVariantSelector
                  variants={product.variants}
                  onSelectVariant={setSelectedVariant}
                  selectedVariant={selectedVariant}
                />
              </div>
            )}

            {/* Quantity & Actions */}
            <div className="flex gap-4 mb-6">
              <div className="flex items-center gap-2 bg-muted rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-4 py-2 hover:bg-opacity-80 transition"
                >
                  −
                </button>
                <span className="px-4 py-2 font-semibold">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="px-4 py-2 hover:bg-opacity-80 transition">
                  +
                </button>
              </div>

              <button
                onClick={handleAddToCart}
                disabled={!isInStock}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingCart className="w-5 h-5" />
                {addedToCart ? 'Added to Cart!' : 'Add to Cart'}
              </button>

              <button
                onClick={handleAddToWishlist}
                className={`px-6 py-3 rounded-lg border-2 transition font-semibold ${
                  isWishlisted ? 'bg-accent text-accent-foreground border-accent' : 'border-border hover:border-primary'
                }`}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
              </button>
            </div>

            {/* Description */}
            {product.description && (
              <div className="text-muted-foreground">
                <h3 className="font-semibold text-foreground mb-2">About This Product</h3>
                <p>{product.description}</p>
              </div>
            )}
          </div>
        </div>

        {/* Specifications Section */}
        {product.specifications && <ProductSpecifications product={product} />}
      </div>

      <Footer />
    </main>
  )
}
