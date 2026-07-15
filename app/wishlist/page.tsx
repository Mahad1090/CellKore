'use client'

import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Star, ShoppingCart, X } from 'lucide-react'

export default function WishlistPage() {
  const [wishlistItems, setWishlistItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
    setWishlistItems(wishlist)
    setIsLoading(false)

    const handleStorageChange = () => {
      const updatedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
      setWishlistItems(updatedWishlist)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const removeItem = (productId: string) => {
    const updated = wishlistItems.filter((item) => item.id !== productId)
    setWishlistItems(updated)
    localStorage.setItem('wishlist', JSON.stringify(updated))
    window.dispatchEvent(new Event('storage'))
  }

  const addToCart = (product: any) => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const existingItem = cart.find((item: any) => item.id === product.id)

    if (existingItem) {
      existingItem.quantity += 1
    } else {
      cart.push({ ...product, quantity: 1 })
    }

    localStorage.setItem('cart', JSON.stringify(cart))
    window.dispatchEvent(new Event('storage'))
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <p className="text-muted-foreground">Loading...</p>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="bg-primary text-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">My Wishlist</h1>
          <p className="opacity-90 mt-2">Items saved for later</p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {wishlistItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-6">Your wishlist is empty</p>
            <Link href="/products" className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-semibold">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div>
            <p className="text-muted-foreground mb-6">{wishlistItems.length} items in your wishlist</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {wishlistItems.map((product) => (
                <div key={product.id} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-primary transition flex flex-col">
                  {/* Product Image */}
                  <div className="relative bg-white h-48 overflow-hidden">
                    <Link href={`/products/${product.id}`}>
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition"
                      />
                    </Link>
                    <button
                      onClick={() => removeItem(product.id)}
                      className="absolute top-2 right-2 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Product Info */}
                  <div className="p-4 flex-1 flex flex-col">
                    <Link href={`/products/${product.id}`} className="font-semibold text-foreground hover:text-primary transition line-clamp-2 mb-2">
                      {product.name}
                    </Link>

                    {/* Rating */}
                    <div className="flex items-center gap-1 mb-3">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(product.rating) ? 'fill-accent text-accent' : 'text-muted'}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-muted-foreground">({product.reviews})</span>
                    </div>

                    {/* Price */}
                    <div className="flex items-center gap-2 mb-4 mt-auto">
                      <span className="text-xl font-bold text-primary">${product.price}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-muted-foreground line-through">${product.originalPrice}</span>
                      )}
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={() => addToCart(product)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-semibold text-sm"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Add to Cart
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
