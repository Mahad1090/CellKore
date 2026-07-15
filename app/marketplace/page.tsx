'use client'

import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { MARKETPLACES } from '@/lib/mock-data'
import { useState } from 'react'
import { Star, MapPin, Phone, Mail } from 'lucide-react'

export default function MarketplacePage() {
  const [selectedRegion, setSelectedRegion] = useState('us')

  const usLocations = MARKETPLACES.filter((m) => m.id.startsWith('us-'))
  const caLocations = MARKETPLACES.filter((m) => m.id.startsWith('ca-'))

  const displayLocations = selectedRegion === 'us' ? usLocations : caLocations

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="bg-primary text-primary-foreground py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold">CellKore Marketplace</h1>
          <p className="opacity-90 mt-2">Visit our physical locations to see products in person</p>
        </div>
      </section>

      {/* Region Tabs */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-4 mb-8 border-b border-border">
          <button
            onClick={() => setSelectedRegion('us')}
            className={`px-6 py-3 font-semibold transition border-b-2 ${
              selectedRegion === 'us'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            🇺🇸 United States
          </button>
          <button
            onClick={() => setSelectedRegion('ca')}
            className={`px-6 py-3 font-semibold transition border-b-2 ${
              selectedRegion === 'ca'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            🇨🇦 Canada
          </button>
        </div>

        {/* Locations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayLocations.map((location) => (
            <div
              key={location.id}
              className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition"
            >
              {/* Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={location.image}
                  alt={location.name}
                  className="w-full h-full object-cover hover:scale-105 transition"
                />
                {location.featured && (
                  <div className="absolute top-2 right-2 bg-accent text-accent-foreground px-3 py-1 rounded text-xs font-semibold">
                    Featured
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-1">{location.name}</h3>
                <p className="text-sm text-accent font-semibold mb-4">{location.location}</p>

                {/* Rating */}
                <div className="flex items-center gap-1 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${i < Math.floor(location.rating) ? 'fill-accent text-accent' : 'text-muted'}`}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">({location.reviews})</span>
                </div>

                {/* Address */}
                <div className="flex gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-muted-foreground">{location.address}</p>
                </div>

                {/* Phone */}
                <div className="flex gap-2 mb-3">
                  <Phone className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <a href={`tel:${location.phone}`} className="text-sm text-primary hover:underline">
                    {location.phone}
                  </a>
                </div>

                {/* Email */}
                <div className="flex gap-2 mb-4">
                  <Mail className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                  <a href={`mailto:${location.email}`} className="text-sm text-primary hover:underline">
                    {location.email}
                  </a>
                </div>

                {/* CTA */}
                <button className="w-full px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-semibold text-sm">
                  Get Directions
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Info Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-muted rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
          <div>
            <h3 className="text-2xl font-bold text-primary mb-2">In-Person Viewing</h3>
            <p className="text-muted-foreground">See our products up close and ask our experts for guidance</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-primary mb-2">Expert Support</h3>
            <p className="text-muted-foreground">Get personalized recommendations from our knowledgeable staff</p>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-primary mb-2">Quick Service</h3>
            <p className="text-muted-foreground">Fast checkout and same-day pickup options available</p>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  )
}
