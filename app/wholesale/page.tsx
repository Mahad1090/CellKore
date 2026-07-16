'use client'

import { Footer } from '@/components/footer'
import { Navigation } from '@/components/navigation'
import { WHOLESALE_LISTINGS } from '@/lib/mock-data'
import Link from 'next/link'
import { Package, Tag, Truck, ShieldCheck, Star } from 'lucide-react'

export default function WholesalePage() {
  const manifestRows = WHOLESALE_LISTINGS.flatMap((listing) =>
    listing.manifestRows.map((row) => ({
      ...row,
      listingId: listing.id,
      listingName: listing.name,
      listingPrice: listing.price,
      listingCondition: listing.condition,
    })),
  )

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <section className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-white py-14 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.25em] opacity-80 mb-3">Wholesale</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Bulk stock ready to move</h1>
            <p className="text-lg md:text-xl opacity-90 mb-8">
              Browse wholesale phones in the same card style as the home page, then open each lot for a full manifest.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <a href="#inventory" className="px-8 py-3 bg-white text-emerald-700 rounded-lg hover:bg-gray-100 transition font-semibold text-center">
                View Stock
              </a>
              <a href="#manifest" className="px-8 py-3 border-2 border-white rounded-lg hover:bg-white hover:text-emerald-700 transition font-semibold text-center">
                View Manifest
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Package, title: 'Bulk Ready', desc: 'Stock organized for quick resale and replenishment.' },
            { icon: Tag, title: 'Clear Pricing', desc: 'See price per lot before opening the detail page.' },
            { icon: Truck, title: 'Fast Fulfillment', desc: 'Wholesale orders can move as soon as the lot is confirmed.' },
            { icon: ShieldCheck, title: 'Condition Graded', desc: 'Every lot shows the condition up front.' },
          ].map((item, idx) => {
            const Icon = item.icon
            return (
              <div key={idx} className="bg-card border border-border rounded-lg p-6">
                <Icon className="w-10 h-10 text-primary mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      <section id="inventory" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-muted rounded-lg">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <h2 className="text-3xl font-bold text-foreground">Wholesale Inventory</h2>
            <p className="text-muted-foreground mt-2">Cards show the lot image, price, quantity, and condition.</p>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground bg-background border border-border rounded-full px-4 py-2">
            <Star className="w-4 h-4 text-accent" />
            Click any lot for full manifest
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {WHOLESALE_LISTINGS.map((listing) => (
            <Link key={listing.id} href={`/wholesale/${listing.id}`}>
              <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-primary transition h-full flex flex-col">
                <div className="relative bg-white h-48 overflow-hidden">
                  <img src={listing.image} alt={listing.name} className="w-full h-full object-cover hover:scale-105 transition" />
                  <div className="absolute top-3 left-3 rounded-full bg-foreground/90 text-background px-3 py-1 text-xs font-semibold">
                    {listing.condition}
                  </div>
                  <div className="absolute top-3 right-3 rounded-full bg-accent text-accent-foreground px-3 py-1 text-xs font-semibold">
                    {listing.quantity} units
                  </div>
                </div>

                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-xl font-bold text-foreground mb-2">{listing.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{listing.description}</p>

                  <div className="mt-auto space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Wholesale price</span>
                      <span className="text-2xl font-bold text-primary">${listing.price}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Quantity</span>
                      <span className="font-semibold text-foreground">{listing.quantity}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Condition</span>
                      <span className="font-semibold text-foreground">{listing.condition}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section id="manifest" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-card border border-border rounded-lg overflow-hidden">
          <div className="p-6 border-b border-border flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-foreground">Wholesale Manifest</h2>
              <p className="text-sm text-muted-foreground">This list combines the lots into a manifest-style view like your reference screen.</p>
            </div>
            <div className="text-sm text-muted-foreground bg-muted rounded-full px-4 py-2">
              {manifestRows.length} manifest rows
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-foreground">
                <tr>
                  <th className="px-6 py-3 text-left font-semibold">Model</th>
                  <th className="px-6 py-3 text-left font-semibold">Capacity</th>
                  <th className="px-6 py-3 text-left font-semibold">Carrier</th>
                  <th className="px-6 py-3 text-left font-semibold">Grade</th>
                  <th className="px-6 py-3 text-left font-semibold">Qty</th>
                </tr>
              </thead>
              <tbody>
                {manifestRows.map((row) => (
                  <tr key={row.id} className="border-t border-border hover:bg-muted/60 transition">
                    <td className="px-6 py-3">
                      <Link href={`/wholesale/${row.listingId}`} className="font-medium text-primary hover:underline">
                        {row.model}
                      </Link>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground">{row.capacity}</td>
                    <td className="px-6 py-3 text-muted-foreground">{row.carrier}</td>
                    <td className="px-6 py-3">
                      <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                        {row.grade}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-semibold text-foreground">{row.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-gradient-to-r from-slate-900 to-slate-700 text-white rounded-lg p-8 md:p-10">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Need a larger lot or a custom mix?</h2>
          <p className="text-white/80 mb-6 max-w-2xl">
            Tell us the model, capacity, carrier, grade, and quantity you want, and we will prepare a dedicated wholesale quote.
          </p>
          <a href="/contact" className="inline-block px-6 py-3 bg-white text-slate-900 rounded-lg hover:bg-slate-100 transition font-semibold">
            Request Wholesale Quote
          </a>
        </div>
      </section>

      <Footer />
    </main>
  )
}
