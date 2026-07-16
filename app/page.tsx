import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { CATEGORIES, FEATURED_PRODUCTS } from '@/lib/mock-data'
import Link from 'next/link'
import { Star, Smartphone, Headphones, Wrench, SmartphoneCharging } from 'lucide-react'

function getCategoryIcon(id: string) {
  const iconClass = "w-10 h-10 transition-transform group-hover:scale-110 duration-300"
  switch (id) {
    case 'iphone':
      return (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`${iconClass} text-primary`}
        >
          {/* Outer Bezel */}
          <rect x="5" y="2" width="14" height="20" rx="3.5" />
          {/* Inner Screen */}
          <rect x="6.2" y="3.2" width="11.6" height="17.6" rx="2.2" strokeWidth="1" className="opacity-40" />
          {/* Dynamic Island */}
          <rect x="10.5" y="4.5" width="3" height="0.8" rx="0.4" fill="currentColor" stroke="none" />
          {/* Home Indicator */}
          <line x1="10" y1="19.5" x2="14" y2="19.5" strokeWidth="1.2" className="opacity-80" />
        </svg>
      )
    case 'samsung':
      return <SmartphoneCharging className={`${iconClass} text-accent`} />
    case 'android':
      return <Smartphone className={`${iconClass} text-emerald-700`} />
    case 'accessories':
      return <Headphones className={`${iconClass} text-accent`} />
    case 'spare-parts':
      return <Wrench className={`${iconClass} text-primary`} />
    default:
      return <Smartphone className={`${iconClass} text-slate-400`} />
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
              <div className="bg-card border border-border rounded-lg p-6 text-center hover:shadow-lg hover:border-primary transition cursor-pointer h-full flex flex-col items-center justify-center group">
                <div className="mb-4 h-12 flex items-center justify-center">{getCategoryIcon(category.id)}</div>
                <h3 className="font-semibold text-foreground text-sm">{category.name}</h3>
                <p className="text-xs text-muted-foreground mt-1">{category.count} items</p>
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
        <div className="bg-gradient-to-r from-primary to-[#073b31] text-white rounded-lg p-8 md:p-12 text-center shadow-lg">
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
