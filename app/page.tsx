import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { CATEGORIES, FEATURED_PRODUCTS } from '@/lib/mock-data'
import Link from 'next/link'
import { Star, Smartphone, Headphones, Wrench, SmartphoneCharging } from 'lucide-react'

function getCategoryIcon(id: string) {
  const iconClass = "w-10 h-10 transition-transform group-hover:scale-110 duration-300 text-primary"
  switch (id) {
    case 'iphone':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          className={iconClass}
        >
          <rect x="5.5" y="2" width="13" height="20" rx="3.5" />
          <rect x="6.7" y="3.2" width="10.6" height="17.6" rx="2.2" className="opacity-30" />
          <rect x="10.2" y="4.5" width="3.6" height="0.8" rx="0.4" fill="currentColor" stroke="none" />
          <circle cx="12" cy="18" r="0.6" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'samsung':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          className={iconClass}
        >
          <rect x="5.5" y="2" width="13" height="20" rx="1" />
          <rect x="6.5" y="3" width="11" height="18" rx="0.5" className="opacity-30" />
          <circle cx="12" cy="4.5" r="0.5" fill="currentColor" stroke="none" />
          <path d="M16 12l2-2m-2 2l2 2m-2-2l-3 3v1.5h1.5l3-3" strokeWidth="1" />
        </svg>
      )
    case 'android':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          className={iconClass}
        >
          <rect x="5.5" y="2" width="13" height="20" rx="2.5" />
          <rect x="7.5" y="4" width="4" height="4" rx="0.8" className="opacity-30" strokeWidth="1" />
          <circle cx="15.5" cy="6" r="1.5" className="opacity-30" strokeWidth="1" />
          <rect x="7.5" y="10" width="9" height="4" rx="0.8" className="opacity-30" strokeWidth="1" />
          <circle cx="12" cy="3" r="0.4" fill="currentColor" stroke="none" />
        </svg>
      )
    case 'accessories':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          className={iconClass}
        >
          <path d="M3 14c0-4.97 4.03-9 9-9s9 4.03 9 9" />
          <rect x="2" y="13" width="2.5" height="5" rx="1.2" fill="currentColor" stroke="none" />
          <rect x="2" y="13" width="2.5" height="5" rx="1.2" />
          <rect x="19.5" y="13" width="2.5" height="5" rx="1.2" fill="currentColor" stroke="none" />
          <rect x="19.5" y="13" width="2.5" height="5" rx="1.2" />
          <path d="M12 5v2m-3-2v1m6-1v1" className="opacity-40" />
        </svg>
      )
    case 'spare-parts':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          className={iconClass}
        >
          <rect x="5" y="5" width="14" height="14" rx="2" />
          <rect x="9.5" y="9.5" width="5" height="5" rx="1" fill="currentColor" stroke="none" />
          <rect x="9.5" y="9.5" width="5" height="5" rx="1" />
          <path d="M9 2v3m6-3v3M9 19v3m6-3v3M2 9h3m-3 6h3M19 9h3m-3 6h3" className="opacity-50" strokeLinecap="round" />
        </svg>
      )
    default:
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.2"
          className={iconClass}
        >
          <rect x="7" y="4" width="11" height="17" rx="2" className="opacity-40" />
          <rect x="4" y="7" width="11" height="15" rx="2" />
          <line x1="9" y1="19" x2="10" y2="19" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )
  }
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />
      {/* Hero Section */}
      <section className="relative text-white w-full aspect-video max-h-[500px] overflow-hidden flex items-center justify-center">
        {/* Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0"
        >
          <source src="/hero_banner_video.mp4" type="video/mp4" />
        </video>
        {/* Premium dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/50 to-primary/40 z-10"></div>
        
        <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-luxury uppercase drop-shadow-md animate-fade-in">
              Welcome to CellKore
            </h1>
            <p className="text-lg md:text-2xl opacity-90 mb-8 font-light max-w-2xl mx-auto drop-shadow-sm">
              Your trusted destination for premium cell phones, accessories, and spare parts
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/products" className="px-8 py-3 bg-white text-primary rounded-lg hover:bg-gray-100 transition font-semibold shadow-lg hover:scale-105 active:scale-95 duration-200">
                Shop Now
              </Link>
              <Link href="/marketplace" className="px-8 py-3 border-2 border-white rounded-lg hover:bg-white hover:text-primary transition font-semibold shadow-lg hover:scale-105 active:scale-95 duration-200">
                Visit Marketplace
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-8 text-foreground tracking-luxury uppercase">Shop by Category</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORIES.map((category) => (
            <Link key={category.id} href={`/products?category=${category.id}`}>
              <div className="bg-card border border-border/80 rounded-2xl p-6 text-center shadow-sm hover:shadow-xl hover:border-primary -translate-y-0 hover:-translate-y-1.5 transition-all duration-300 cursor-pointer h-full flex flex-col items-center justify-center group">
                <div className="mb-4 w-16 h-16 rounded-full bg-primary/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:scale-105 transition-all duration-300">
                  {getCategoryIcon(category.id)}
                </div>
                <h3 className="font-semibold text-foreground text-sm tracking-wide group-hover:text-primary transition-colors duration-300">{category.name}</h3>
                <p className="text-xs text-muted-foreground mt-1.5 font-light">{category.count} items</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-muted rounded-lg">
        <h2 className="text-3xl font-bold mb-8 text-foreground tracking-luxury uppercase">Featured Products</h2>
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
                  <div className="text-xs font-semibold text-primary">
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
        <div className="bg-gradient-to-r from-primary to-black text-white rounded-lg p-8 md:p-12 text-center shadow-lg">
          <h2 className="text-3xl font-bold mb-4 tracking-luxury uppercase">Wholesale Program Available</h2>
          <p className="text-lg opacity-90 mb-6 font-light">
            Are you a business owner? Get bulk pricing and exclusive wholesale deals
          </p>
          <Link href="/wholesale" className="inline-block px-8 py-3 bg-white text-primary rounded-lg hover:bg-gray-100 transition font-semibold">
            Learn About Wholesale
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  )
}
