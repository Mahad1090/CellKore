'use client'

import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { ALL_PRODUCTS } from '@/lib/mock-data'
import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Star } from 'lucide-react'

export default function MarketplacePage() {
  const [selectedCountry, setSelectedCountry] = useState<'US' | 'Canada'>('US')

  const marketplaceProducts = useMemo(() => {
    return ALL_PRODUCTS.filter(
      (product) =>
        ['iphone', 'samsung', 'android'].includes(product.category) && product.country === selectedCountry,
    )
  }, [selectedCountry])

  const activeCountryLabel = selectedCountry === 'US' ? 'United States' : 'Canada'

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="bg-primary text-primary-foreground py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.25em] opacity-80 mb-3">Marketplace</p>
            <h1 className="text-3xl md:text-4xl font-bold">Phones available by country</h1>
            <p className="opacity-90 mt-3 text-base md:text-lg">
              Select US or Canada to browse only the phones stocked for that market.
            </p>
          </div>
        </div>
      </section>

      {/* Country Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-wrap gap-4 mb-8 border-b border-border">
          <button
            onClick={() => setSelectedCountry('US')}
            className={`px-6 py-3 font-semibold transition border-b-2 ${
              selectedCountry === 'US'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            🇺🇸 US
          </button>
          <button
            onClick={() => setSelectedCountry('Canada')}
            className={`px-6 py-3 font-semibold transition border-b-2 ${
              selectedCountry === 'Canada'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            🇨🇦 Canada
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">{activeCountryLabel} inventory</h2>
            <p className="text-muted-foreground">{marketplaceProducts.length} phones available right now</p>
          </div>
          <div className="text-sm text-muted-foreground bg-muted rounded-full px-4 py-2">
            Filtered by country and phone category
          </div>
        </div>

        {/* Phones Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketplaceProducts.map((product) => (
            <Link key={product.id} href={`/products/${product.id}`}>
              <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-primary transition h-full flex flex-col">
                <div className="relative bg-white h-48 overflow-hidden">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover hover:scale-105 transition"
                  />
                  {product.originalPrice && product.originalPrice > product.price && (
                    <div className="absolute top-2 right-2 bg-accent text-accent-foreground px-2 py-1 rounded text-xs font-semibold">
                      -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex flex-col gap-2">
                    {product.condition && product.condition !== 'new' && (
                      <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold capitalize">
                        {product.condition}
                      </div>
                    )}
                    <div className="bg-foreground/90 text-background px-2 py-1 rounded text-xs font-semibold">
                      {product.country === 'US' ? 'United States' : 'Canada'}
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-foreground line-clamp-2 mb-2">{product.name}</h3>

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

                  <div className="flex items-center gap-2 mb-3 mt-auto">
                    <span className="text-2xl font-bold text-primary">${product.price}</span>
                    {product.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through">${product.originalPrice}</span>
                    )}
                  </div>

                  <div className={`text-xs font-semibold ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {marketplaceProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground text-lg">No phones are currently listed for {activeCountryLabel}.</p>
          </div>
        )}
      </section>

      <Footer />
    </main>
  )
}
