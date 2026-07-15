import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="bg-primary text-primary-foreground py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">About CellKore</h1>
          <p className="text-lg md:text-xl opacity-90">
            Your trusted partner in quality mobile devices and accessories
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-foreground">Our Mission</h2>
            <p className="text-muted-foreground mb-4">
              CellKore is dedicated to providing customers with access to premium cell phones, accessories, and spare parts at competitive prices. We believe in quality, transparency, and customer satisfaction.
            </p>
            <p className="text-muted-foreground mb-4">
              Since our founding in 2018, we&apos;ve served over 100,000 customers across North America, offering both new and refurbished devices with comprehensive warranties and expert support.
            </p>
            <p className="text-muted-foreground">
              Our commitment to excellence extends to our wholesale program, where we partner with businesses to provide bulk solutions and dedicated account management.
            </p>
          </div>
          <div className="bg-gradient-to-r from-primary to-accent rounded-lg h-96" />
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-muted rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div>
            <div className="text-4xl font-bold text-primary mb-2">100K+</div>
            <p className="text-muted-foreground">Satisfied Customers</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">15+</div>
            <p className="text-muted-foreground">Physical Locations</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">5000+</div>
            <p className="text-muted-foreground">Products Available</p>
          </div>
          <div>
            <div className="text-4xl font-bold text-primary mb-2">6 years</div>
            <p className="text-muted-foreground">In Business</p>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-12 text-foreground text-center">Our Values</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-5xl mb-4 text-primary mx-auto">🏆</div>
            <h3 className="font-bold text-foreground mb-2 text-lg">Quality</h3>
            <p className="text-muted-foreground text-sm">Only the best products</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-5xl mb-4 text-primary mx-auto">👥</div>
            <h3 className="font-bold text-foreground mb-2 text-lg">Customer Focus</h3>
            <p className="text-muted-foreground text-sm">Your satisfaction matters</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-5xl mb-4 text-primary mx-auto">🌍</div>
            <h3 className="font-bold text-foreground mb-2 text-lg">Accessibility</h3>
            <p className="text-muted-foreground text-sm">Available where you are</p>
          </div>
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="text-5xl mb-4 text-primary mx-auto">📈</div>
            <h3 className="font-bold text-foreground mb-2 text-lg">Innovation</h3>
            <p className="text-muted-foreground text-sm">Always improving</p>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-12 text-foreground text-center">Why Choose CellKore?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center mt-1">✓</div>
            <p className="text-muted-foreground">Wide selection of new, refurbished, and pre-owned devices</p>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center mt-1">✓</div>
            <p className="text-muted-foreground">Competitive pricing with frequent promotions</p>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center mt-1">✓</div>
            <p className="text-muted-foreground">Expert customer service and technical support</p>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center mt-1">✓</div>
            <p className="text-muted-foreground">Comprehensive warranty and return policies</p>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center mt-1">✓</div>
            <p className="text-muted-foreground">Multiple physical locations for in-person shopping</p>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center mt-1">✓</div>
            <p className="text-muted-foreground">Wholesale and bulk purchase programs</p>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center mt-1">✓</div>
            <p className="text-muted-foreground">Free shipping on orders over $50</p>
          </div>
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-accent text-accent-foreground flex items-center justify-center mt-1">✓</div>
            <p className="text-muted-foreground">Secure online shopping with multiple payment options</p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
