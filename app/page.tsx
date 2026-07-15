import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { CATEGORIES, FEATURED_PRODUCTS } from '@/lib/mock-data'
import Link from 'next/link'
import { Star } from 'lucide-react'

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Welcome to CellKore</h1>
            <p className="text-lg md:text-xl opacity-90 mb-8">
              Your trusted destination for premium cell phones, accessories, and spare parts
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products" className="px-8 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition font-semibold">
                Shop Now
              </Link>
              <Link href="/marketplace" className="px-8 py-3 border-2 border-secondary rounded-lg hover:bg-secondary hover:text-secondary-foreground transition font-semibold">
                Visit Marketplace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-8 text-foreground">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((category) => (
            <Link key={category.id} href={`/products?category=${category.id}`}>
              <div className="bg-card border border-border rounded-lg p-6 text-center hover:shadow-lg hover:border-primary transition cursor-pointer h-full flex flex-col items-center justify-center">
                <div className="text-4xl mb-2">{category.icon}</div>
                <h3 className="font-semibold text-foreground text-sm">{category.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{category.count} items</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-muted rounded-lg">
        <h2 className="text-3xl font-bold mb-8 text-foreground">Featured Products</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURED_PRODUCTS.slice(0, 6).map((product) => (
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
                      -${(product.originalPrice - product.price).toFixed(2)}
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
                  <div className="text-xs font-semibold text-green-600">
                    {product.inStock ? 'In Stock' : 'Out of Stock'}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Call to Action */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-primary text-primary-foreground rounded-lg p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Wholesale Program Available</h2>
          <p className="text-lg opacity-90 mb-6">
            Are you a business owner? Get bulk pricing and exclusive wholesale deals
          </p>
          <Link href="/wholesale" className="inline-block px-8 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition font-semibold">
            Learn About Wholesale
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
