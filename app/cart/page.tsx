'use client'

import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Trash2, ArrowRight } from 'lucide-react'

export default function CartPage() {
  const [cartItems, setCartItems] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    setIsLoading(true)
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    setCartItems(cart)
    setIsLoading(false)

    const handleStorageChange = () => {
      const updatedCart = JSON.parse(localStorage.getItem('cart') || '[]')
      setCartItems(updatedCart)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const updateQuantity = (productId: string, newQuantity: number) => {
    const updated = cartItems.map((item) =>
      item.id === productId ? { ...item, quantity: Math.max(1, newQuantity) } : item
    )
    setCartItems(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
    window.dispatchEvent(new Event('storage'))
  }

  const removeItem = (productId: string) => {
    const updated = cartItems.filter((item) => item.id !== productId)
    setCartItems(updated)
    localStorage.setItem('cart', JSON.stringify(updated))
    window.dispatchEvent(new Event('storage'))
  }

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const tax = subtotal * 0.1
  const total = subtotal + tax

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
          <h1 className="text-3xl font-bold">Shopping Cart</h1>
          <p className="opacity-90 mt-2">Review your items and proceed to checkout</p>
        </div>
      </section>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cartItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-xl text-muted-foreground mb-6">Your cart is empty</p>
            <Link href="/products" className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-semibold">
              Continue Shopping
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2">
              <div className="bg-card border border-border rounded-lg overflow-hidden">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 p-6 border-b border-border last:border-b-0 items-start">
                    {/* Image */}
                    <Link href={`/products/${item.id}`} className="flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <Link href={`/products/${item.id}`} className="font-semibold text-foreground hover:text-primary transition line-clamp-2">
                        {item.name}
                      </Link>
                      <p className="text-sm text-muted-foreground mt-1">${item.price.toFixed(2)}</p>
                    </div>

                    {/* Quantity */}
                    <div className="flex items-center gap-2 bg-muted rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="px-3 py-2 hover:bg-opacity-80 transition"
                      >
                        −
                      </button>
                      <span className="px-3 py-2 font-semibold">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="px-3 py-2 hover:bg-opacity-80 transition"
                      >
                        +
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right min-w-[100px]">
                      <p className="font-bold text-foreground">${(item.price * item.quantity).toFixed(2)}</p>
                    </div>

                    {/* Remove */}
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 hover:bg-muted rounded-lg transition text-muted-foreground hover:text-red-600"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Continue Shopping */}
              <Link href="/products" className="inline-flex items-center gap-2 text-primary hover:underline mt-6 font-semibold">
                ← Continue Shopping
              </Link>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-lg p-6 sticky top-24">
                <h2 className="text-xl font-bold text-foreground mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span>${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax (10%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span>Free</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4 mb-6">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-primary">${total.toFixed(2)}</span>
                  </div>
                </div>

                <button className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-semibold flex items-center justify-center gap-2 mb-3">
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button className="w-full px-6 py-3 border border-border rounded-lg hover:bg-muted transition font-semibold text-foreground">
                  Apply Coupon
                </button>

                {/* Security Info */}
                <div className="mt-6 pt-6 border-t border-border text-xs text-muted-foreground text-center">
                  <p>✓ Secure checkout</p>
                  <p>✓ Free returns within 30 days</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </main>
  )
}
