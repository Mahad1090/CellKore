'use client'

import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { ALL_PRODUCTS, CATEGORIES, Product } from '@/lib/mock-data'
import Link from 'next/link'
import { Star } from 'lucide-react'
import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'

export default function ProductsPage() {
  const searchParams = useSearchParams()
  const categoryParam = searchParams.get('category')
  const searchParam = searchParams.get('search')
  const [selectedCategory, setSelectedCategory] = useState(categoryParam || 'all')
  const [sortBy, setSortBy] = useState('featured')
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(2000)
  const [searchQuery, setSearchQuery] = useState(searchParam || '')

  const filteredProducts = useMemo(() => {
    let products = ALL_PRODUCTS

    // Filter by search query
    if (searchQuery.trim()) {
      products = products.filter((p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      products = products.filter((p) => p.category === selectedCategory)
    }

    // Filter by price
    products = products.filter((p) => p.price >= minPrice && p.price <= maxPrice)

    // Sort
    if (sortBy === 'price-low') {
      products.sort((a, b) => a.price - b.price)
    } else if (sortBy === 'price-high') {
      products.sort((a, b) => b.price - a.price)
    } else if (sortBy === 'rating') {
      products.sort((a, b) => b.rating - a.rating)
    } else if (sortBy === 'newest') {
      products.reverse()
    }

    return products
  }, [selectedCategory, sortBy, minPrice, maxPrice])

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="bg-primary text-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {searchQuery ? (
            <>
              <h1 className="text-3xl font-bold">Search Results</h1>
              <p className="opacity-90 mt-2">
                Found {filteredProducts.length} result{filteredProducts.length !== 1 ? 's' : ''} for &quot;{searchQuery}&quot;
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold">Our Products</h1>
              <p className="opacity-90 mt-2">Discover our wide range of quality cell phones and accessories</p>
            </>
          )}
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Filters */}
          <div className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-6 sticky top-24 space-y-6">
              {/* Category Filter */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Categories</h3>
                <div className="space-y-2">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      name="category"
                      value="all"
                      checked={selectedCategory === 'all'}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm text-foreground">All Products</span>
                  </label>
                  {CATEGORIES.map((cat) => (
                    <label key={cat.id} className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        name="category"
                        value={cat.id}
                        checked={selectedCategory === cat.id}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="mr-2"
                      />
                      <span className="text-sm text-foreground">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Price Filter */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Price Range</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground">Min: ${minPrice}</label>
                    <input
                      type="range"
                      min="0"
                      max="2000"
                      value={minPrice}
                      onChange={(e) => setMinPrice(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-muted-foreground">Max: ${maxPrice}</label>
                    <input
                      type="range"
                      min="0"
                      max="2000"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>
                </div>
              </div>

              {/* Sort Options */}
              <div>
                <h3 className="font-semibold text-foreground mb-4">Sort By</h3>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-background"
                >
                  <option value="featured">Featured</option>
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="rating">Top Rated</option>
                </select>
              </div>

              {/* Reset Filters */}
              <button
                onClick={() => {
                  setSelectedCategory('all')
                  setSortBy('featured')
                  setMinPrice(0)
                  setMaxPrice(2000)
                }}
                className="w-full px-4 py-2 bg-accent text-accent-foreground rounded-lg hover:opacity-90 transition font-semibold text-sm"
              >
                Reset Filters
              </button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="lg:col-span-3">
            {/* Results Count */}
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-foreground">
                Showing {filteredProducts.length} products
              </h2>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product) => (
                  <Link key={product.id} href={`/products/${product.id}`}>
                    <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-primary transition h-full flex flex-col">
                      {/* Product Image */}
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
                        {product.condition && product.condition !== 'new' && (
                          <div className="absolute top-2 left-2 bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-semibold capitalize">
                            {product.condition}
                          </div>
                        )}
                      </div>

                      {/* Product Info */}
                      <div className="p-4 flex-1 flex flex-col">
                        <h3 className="font-semibold text-foreground line-clamp-2 mb-2">{product.name}</h3>

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
                        <div className="flex items-center gap-2 mb-3 mt-auto">
                          <span className="text-2xl font-bold text-primary">${product.price}</span>
                          {product.originalPrice && (
                            <span className="text-sm text-muted-foreground line-through">${product.originalPrice}</span>
                          )}
                        </div>

                        {/* Stock Status */}
                        <div className={`text-xs font-semibold ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                          {product.inStock ? 'In Stock' : 'Out of Stock'}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="col-span-full text-center py-12">
                  <p className="text-muted-foreground text-lg">No products found matching your filters.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </main>
  )
}
