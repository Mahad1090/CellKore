'use client'

import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { WHOLESALE_LISTINGS } from '@/lib/mock-data'
import Link from 'next/link'
import { ArrowLeft, Search, Package, Tag, Truck, ShieldCheck } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useParams } from 'next/navigation'

export default function WholesaleDetailPage() {
  const params = useParams()
  const listingId = typeof params.id === 'string' ? params.id : ''
  const listing = WHOLESALE_LISTINGS.find((item) => item.id === listingId)
  const [filterText, setFilterText] = useState('')
  const [viewMode, setViewMode] = useState<'manifest' | 'model' | 'capacity' | 'carrier' | 'grade'>('manifest')

  const otherListings = WHOLESALE_LISTINGS.filter((item) => item.id !== listingId)

  const filteredRows = useMemo(() => {
    if (!listing) return []

    return listing.manifestRows.filter((row) => {
      const haystack = `${row.model} ${row.capacity} ${row.carrier} ${row.grade} ${row.quantity}`.toLowerCase()
      return haystack.includes(filterText.toLowerCase())
    })
  }, [listing, filterText])

  if (!listing) {
    return (
      <main className="min-h-screen bg-background">
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Wholesale Lot Not Found</h1>
          <Link href="/wholesale" className="text-primary hover:underline">
            Back to Wholesale
          </Link>
        </div>
        <Footer />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      <section className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Link href="/wholesale" className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Wholesale
          </Link>
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.25em] opacity-70 mb-3">Wholesale Lot</p>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">{listing.name}</h1>
            <p className="text-white/80 text-base md:text-lg">
              Detailed manifest, condition, and quantity breakdown for this wholesale stock.
            </p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 text-sm text-muted-foreground mb-8">
          There might be a 5% variance in the value, unit count, and/or condition listed below. Disputes within the declared variance will not be accepted.
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-8 mb-10">
          <div className="bg-card border border-border rounded-lg overflow-hidden">
            <div className="relative h-64 bg-white">
              <img src={listing.image} alt={listing.name} className="w-full h-full object-cover" />
              <div className="absolute top-3 left-3 rounded-full bg-foreground/90 text-background px-3 py-1 text-xs font-semibold">
                {listing.condition}
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Wholesale price</p>
                <p className="text-3xl font-bold text-primary">${listing.price}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Quantity</p>
                  <p className="text-lg font-semibold text-foreground">{listing.quantity}</p>
                </div>
                <div className="rounded-lg bg-muted p-3">
                  <p className="text-xs text-muted-foreground">Condition</p>
                  <p className="text-lg font-semibold text-foreground">{listing.condition}</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{listing.description}</p>
            </div>
          </div>

          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {[
                { icon: Package, label: 'Lot size', value: `${listing.quantity} units` },
                { icon: Tag, label: 'Start price', value: `$${listing.price}` },
                { icon: Truck, label: 'Fulfillment', value: 'Bulk dispatch' },
                { icon: ShieldCheck, label: 'Condition', value: listing.condition },
              ].map((item, idx) => {
                const Icon = item.icon
                return (
                  <div key={idx} className="bg-card border border-border rounded-lg p-4">
                    <Icon className="w-5 h-5 text-primary mb-3" />
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{item.label}</p>
                    <p className="text-lg font-semibold text-foreground mt-1">{item.value}</p>
                  </div>
                )
              })}
            </div>

            <div className="bg-card border border-border rounded-lg p-4 md:p-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Manifest</h2>
                  <p className="text-sm text-muted-foreground">Filter and review each stock line in this lot.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {([
                    ['manifest', 'Full Manifest'],
                    ['model', 'Model'],
                    ['capacity', 'Capacity'],
                    ['carrier', 'Carrier'],
                    ['grade', 'Grade'],
                  ] as const).map(([value, label]) => (
                    <button
                      key={value}
                      onClick={() => setViewMode(value)}
                      className={`px-3 py-1.5 rounded-full text-sm font-semibold transition ${
                        viewMode === value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <Search className="w-4 h-4 text-muted-foreground" />
                <input
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Filter rows..."
                  className="w-full rounded-lg border border-border bg-background px-4 py-2 text-sm focus:border-primary focus:outline-none"
                />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted text-foreground">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Model</th>
                      <th className="px-4 py-3 text-left font-semibold">Capacity</th>
                      <th className="px-4 py-3 text-left font-semibold">Carrier</th>
                      <th className="px-4 py-3 text-left font-semibold">Grade</th>
                      <th className="px-4 py-3 text-left font-semibold">Qty</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRows.map((row) => (
                      <tr key={row.id} className="border-t border-border hover:bg-muted/60 transition">
                        <td className="px-4 py-3 font-medium text-foreground">{row.model}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.capacity}</td>
                        <td className="px-4 py-3 text-muted-foreground">{row.carrier}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {row.grade}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-foreground">{row.quantity}</td>
                      </tr>
                    ))}
                    {filteredRows.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                          No manifest rows match your filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {otherListings.length > 0 && (
          <section className="mt-12">
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-foreground">More Wholesale Lots</h2>
                <p className="text-sm text-muted-foreground">Additional lots available in the same inventory.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {otherListings.map((other) => (
                <Link key={other.id} href={`/wholesale/${other.id}`}>
                  <div className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg hover:border-primary transition h-full flex flex-col">
                    <div className="relative h-40 bg-white">
                      <img src={other.image} alt={other.name} className="w-full h-full object-cover" />
                      <div className="absolute top-3 left-3 rounded-full bg-foreground/90 text-background px-3 py-1 text-xs font-semibold">
                        {other.condition}
                      </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col">
                      <h3 className="font-semibold text-foreground mb-2">{other.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{other.description}</p>
                      <div className="mt-auto flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">${other.price}</span>
                        <span className="font-semibold text-foreground">{other.quantity} units</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </section>

      <Footer />
    </main>
  )
}
