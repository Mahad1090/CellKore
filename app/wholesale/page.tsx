'use client'

import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import Link from 'next/link'
import { Check, Package, TrendingUp, Users } from 'lucide-react'

export default function WholesalePage() {
  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">CellKore Wholesale</h1>
          <p className="text-lg md:text-xl opacity-90 mb-8">
            Partner with us for exclusive bulk pricing and business solutions
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="#contact-form" className="px-8 py-3 bg-secondary text-secondary-foreground rounded-lg hover:opacity-90 transition font-semibold">
              Get Started
            </Link>
            <a href="#inventory" className="px-8 py-3 border-2 border-secondary rounded-lg hover:bg-secondary hover:text-secondary-foreground transition font-semibold">
              View Inventory
            </a>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-3xl font-bold mb-12 text-foreground text-center">Why Choose CellKore Wholesale?</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: TrendingUp, title: 'Competitive Pricing', desc: 'Best bulk prices in the industry' },
            { icon: Package, title: 'Large Inventory', desc: 'Thousands of devices in stock' },
            { icon: Users, title: 'Dedicated Support', desc: 'Personal account managers' },
            { icon: Check, title: 'Quality Guaranteed', desc: 'All products thoroughly tested' },
          ].map((benefit, idx) => {
            const Icon = benefit.icon
            return (
              <div key={idx} className="bg-card border border-border rounded-lg p-6 text-center">
                <Icon className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-semibold text-foreground mb-2">{benefit.title}</h3>
                <p className="text-sm text-muted-foreground">{benefit.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* Inventory Section */}
      <section id="inventory" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-muted rounded-lg">
        <h2 className="text-3xl font-bold mb-8 text-foreground">Wholesale Inventory</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-primary text-primary-foreground">
              <tr>
                <th className="px-6 py-3 text-left font-semibold">Product</th>
                <th className="px-6 py-3 text-left font-semibold">Model</th>
                <th className="px-6 py-3 text-left font-semibold">Condition</th>
                <th className="px-6 py-3 text-left font-semibold">Qty Available</th>
                <th className="px-6 py-3 text-left font-semibold">Unit Price (1-50)</th>
                <th className="px-6 py-3 text-left font-semibold">Unit Price (50+)</th>
              </tr>
            </thead>
            <tbody>
              {[
                { product: 'iPhone 15 Pro Max', model: '256GB', condition: 'New', qty: 250, price1: '$950', price2: '$900' },
                { product: 'iPhone 15 Pro', model: '128GB', condition: 'New', qty: 180, price1: '$850', price2: '$800' },
                { product: 'Samsung Galaxy S24 Ultra', model: '512GB', condition: 'New', qty: 200, price1: '$1,050', price2: '$1,000' },
                { product: 'iPhone 14 Pro Max', model: '256GB', condition: 'Refurbished', qty: 320, price1: '$650', price2: '$600' },
                { product: 'Google Pixel 8 Pro', model: '256GB', condition: 'New', qty: 150, price1: '$800', price2: '$750' },
                { product: 'Samsung Galaxy A54', model: '128GB', condition: 'New', qty: 400, price1: '$350', price2: '$320' },
              ].map((item, idx) => (
                <tr key={idx} className="border-b border-border hover:bg-background transition">
                  <td className="px-6 py-3 font-medium text-foreground">{item.product}</td>
                  <td className="px-6 py-3 text-muted-foreground">{item.model}</td>
                  <td className="px-6 py-3">
                    <span className={`px-3 py-1 rounded text-xs font-semibold ${
                      item.condition === 'New' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {item.condition}
                    </span>
                  </td>
                  <td className="px-6 py-3 font-semibold text-foreground">{item.qty}</td>
                  <td className="px-6 py-3 text-primary font-semibold">{item.price1}</td>
                  <td className="px-6 py-3 text-accent font-bold">{item.price2}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-muted-foreground mt-4">Prices subject to change. Contact sales for volume discounts beyond 50 units.</p>
      </section>

      {/* Contact Form */}
      <section id="contact-form" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-foreground text-center">Get Your Wholesale Quote</h2>

          <form className="bg-card border border-border rounded-lg p-8 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Company Name*</label>
                <input type="text" required className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Contact Name*</label>
                <input type="text" required className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Email*</label>
                <input type="email" required className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Phone*</label>
                <input type="tel" required className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Business Type*</label>
              <select required className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary bg-background">
                <option>Select...</option>
                <option>Retail Store</option>
                <option>Online Seller</option>
                <option>Reseller</option>
                <option>Corporate</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Estimated Monthly Volume*</label>
              <select required className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary bg-background">
                <option>Select...</option>
                <option>10-50 units</option>
                <option>50-100 units</option>
                <option>100-500 units</option>
                <option>500+ units</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Message</label>
              <textarea rows={4} className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary" />
            </div>

            <button type="submit" className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-semibold">
              Request Quote
            </button>
          </form>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-muted rounded-lg">
        <h2 className="text-3xl font-bold mb-8 text-foreground text-center">Wholesale FAQ</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          {[
            { q: 'What is the minimum order?', a: 'Minimum order is 10 units. Contact us for bulk customizations.' },
            { q: 'Do you offer payment terms?', a: 'Yes! Net 30 and Net 60 terms available for qualified businesses.' },
            { q: 'What about warranties?', a: 'All devices come with standard manufacturer warranty. Extended warranties available.' },
            { q: 'How fast can you ship?', a: 'Most orders ship within 24-48 hours. Expedited shipping available.' },
          ].map((item, idx) => (
            <div key={idx} className="bg-card border border-border rounded-lg p-6">
              <h3 className="font-semibold text-foreground mb-2">{item.q}</h3>
              <p className="text-muted-foreground">{item.a}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  )
}
