'use client'

import React, { useState } from 'react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { Phone, Mail, MapPin, Clock } from 'lucide-react'

export const dynamic = 'force-dynamic'
export const prerender = false

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
    setTimeout(() => setSubmitted(false), 3000)
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Header */}
      <section className="bg-primary text-primary-foreground py-12 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg md:text-xl opacity-90">
            We&apos;d love to hear from you. Get in touch with our team.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Contact Info Cards */}
          <div className="bg-card border border-border rounded-lg p-6">
            <Phone className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-bold text-foreground mb-2">Phone</h3>
            <p className="text-muted-foreground">1-800-CELL-CORE</p>
            <p className="text-muted-foreground text-sm mt-1">Available 24/7</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <Mail className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-bold text-foreground mb-2">Email</h3>
            <p className="text-muted-foreground">support@cellkore.com</p>
            <p className="text-muted-foreground text-sm mt-1">Response within 2 hours</p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <MapPin className="w-8 h-8 text-primary mb-4" />
            <h3 className="font-bold text-foreground mb-2">Headquarters</h3>
            <p className="text-muted-foreground">123 Tech Street</p>
            <p className="text-muted-foreground text-sm">Silicon Valley, CA 94025</p>
          </div>
        </div>

        {/* Contact Form & Map */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-foreground">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="bg-card border border-border rounded-lg p-8 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">First Name*</label>
                  <input type="text" required className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Last Name*</label>
                  <input type="text" required className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Email*</label>
                <input type="email" required className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Subject*</label>
                <select required className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary bg-background">
                  <option>Select...</option>
                  <option>Product Inquiry</option>
                  <option>Order Status</option>
                  <option>Technical Support</option>
                  <option>Wholesale</option>
                  <option>Feedback</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-foreground mb-2">Message*</label>
                <textarea rows={5} required className="w-full px-4 py-2 border border-border rounded-lg focus:outline-none focus:border-primary" />
              </div>

              <button
                type="submit"
                className="w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-semibold"
              >
                Send Message
              </button>

              {submitted && (
                <div className="p-4 bg-green-100 text-green-700 rounded-lg text-sm">
                  Thank you! We&apos;ll get back to you soon.
                </div>
              )}
            </form>
          </div>

          {/* Business Hours & Locations */}
          <div>
            <h2 className="text-2xl font-bold mb-6 text-foreground">Business Information</h2>

            {/* Hours */}
            <div className="bg-card border border-border rounded-lg p-8 mb-6">
              <h3 className="font-bold text-foreground mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                Business Hours
              </h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex justify-between">
                  <span>Monday - Friday</span>
                  <span>8:00 AM - 8:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span>Saturday</span>
                  <span>10:00 AM - 6:00 PM EST</span>
                </div>
                <div className="flex justify-between">
                  <span>Sunday</span>
                  <span>12:00 PM - 5:00 PM EST</span>
                </div>
              </div>
            </div>

            {/* Departments */}
            <div className="bg-card border border-border rounded-lg p-8">
              <h3 className="font-bold text-foreground mb-4">Departments</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <p className="font-semibold text-foreground">Sales</p>
                  <p className="text-muted-foreground">sales@cellkore.com</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Support</p>
                  <p className="text-muted-foreground">support@cellkore.com</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">Wholesale</p>
                  <p className="text-muted-foreground">wholesale@cellkore.com</p>
                </div>
                <div>
                  <p className="font-semibold text-foreground">General</p>
                  <p className="text-muted-foreground">info@cellkore.com</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 bg-muted rounded-lg">
        <h2 className="text-3xl font-bold mb-8 text-foreground text-center">Frequently Asked Questions</h2>
        <div className="max-w-3xl mx-auto space-y-6">
          {[
            { q: 'How can I track my order?', a: 'You can track your order using the tracking number sent to your email after purchase. You can also check status in your account.' },
            { q: 'What is your return policy?', a: 'We offer 30-day returns for all products. Items must be in original condition with all packaging and accessories.' },
            { q: 'Do you offer refurbished products?', a: 'Yes! We offer certified refurbished products with full warranty. All refurbished items go through rigorous testing.' },
            { q: 'How do I contact customer support?', a: 'You can reach us via phone at 1-800-CELL-CORE, email at support@cellkore.com, or through our website contact form.' },
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
