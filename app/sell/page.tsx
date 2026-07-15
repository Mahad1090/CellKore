'use client'

import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { useState } from 'react'
import { Upload, Check } from 'lucide-react'

export default function SellYourPhonePage() {
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    condition: 'good',
    storage: '',
    ram: '',
    color: '',
    damage: '',
    description: '',
    name: '',
    email: '',
    phone: '',
  })
  const [submitted, setSubmitted] = useState(false)
  const [images, setImages] = useState<File[]>([])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files))
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Sell Phone Form Submitted:', { formData, imageCount: images.length })
    setSubmitted(true)
    setTimeout(() => {
      setSubmitted(false)
      setFormData({
        brand: '',
        model: '',
        condition: 'good',
        storage: '',
        ram: '',
        color: '',
        damage: '',
        description: '',
        name: '',
        email: '',
        phone: '',
      })
      setImages([])
    }, 3000)
  }

  return (
    <main className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-accent text-primary-foreground py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Sell Your Phone</h1>
          <p className="text-lg md:text-xl opacity-90">
            Get instant quote and sell your device to us for the best price
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {submitted ? (
          <div className="bg-card border-2 border-green-500 rounded-lg p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="w-8 h-8 text-white" />
              </div>
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Thank You!</h2>
            <p className="text-muted-foreground mb-4">
              We&apos;ve received your device information. Our team will review and contact you within 24 hours with a quote.
            </p>
            <p className="text-sm text-muted-foreground">Redirecting you back...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Device Information */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Device Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Brand */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Brand *</label>
                  <select
                    name="brand"
                    value={formData.brand}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">Select Brand</option>
                    <option value="apple">Apple</option>
                    <option value="samsung">Samsung</option>
                    <option value="google">Google Pixel</option>
                    <option value="oneplus">OnePlus</option>
                    <option value="motorola">Motorola</option>
                    <option value="xiaomi">Xiaomi</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Model */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Model *</label>
                  <input
                    type="text"
                    name="model"
                    value={formData.model}
                    onChange={handleInputChange}
                    placeholder="e.g. iPhone 15 Pro Max"
                    required
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Storage */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Storage</label>
                  <select
                    name="storage"
                    value={formData.storage}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">Select Storage</option>
                    <option value="64gb">64GB</option>
                    <option value="128gb">128GB</option>
                    <option value="256gb">256GB</option>
                    <option value="512gb">512GB</option>
                    <option value="1tb">1TB</option>
                  </select>
                </div>

                {/* RAM */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">RAM</label>
                  <select
                    name="ram"
                    value={formData.ram}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="">Select RAM</option>
                    <option value="4gb">4GB</option>
                    <option value="6gb">6GB</option>
                    <option value="8gb">8GB</option>
                    <option value="12gb">12GB</option>
                    <option value="16gb">16GB</option>
                  </select>
                </div>

                {/* Color */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Color</label>
                  <input
                    type="text"
                    name="color"
                    value={formData.color}
                    onChange={handleInputChange}
                    placeholder="e.g. Space Black"
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Condition */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Condition *</label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary"
                  >
                    <option value="excellent">Excellent (Like New)</option>
                    <option value="good">Good (Minor Scratches)</option>
                    <option value="fair">Fair (Visible Wear)</option>
                    <option value="poor">Poor (Significant Damage)</option>
                  </select>
                </div>
              </div>

              {/* Damage Description */}
              <div className="mt-6">
                <label className="block text-sm font-semibold text-foreground mb-2">Describe Any Damage</label>
                <textarea
                  name="damage"
                  value={formData.damage}
                  onChange={handleInputChange}
                  placeholder="List any cracks, dents, screen issues, battery problems, etc."
                  rows={4}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              {/* Additional Details */}
              <div className="mt-6">
                <label className="block text-sm font-semibold text-foreground mb-2">Additional Details</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Anything else we should know about the device (accessories included, warranty status, etc.)"
                  rows={3}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Photos */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Device Photos</h2>
              <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-foreground font-semibold mb-2">Upload photos of your device</p>
                <p className="text-muted-foreground text-sm mb-4">Include front, back, and any damage areas</p>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="photos"
                />
                <label htmlFor="photos" className="inline-block px-6 py-2 bg-primary text-primary-foreground rounded-lg cursor-pointer hover:opacity-90 transition">
                  Choose Photos
                </label>
                {images.length > 0 && <p className="text-sm text-green-600 mt-3">{images.length} photo(s) selected</p>}
              </div>
            </div>

            {/* Contact Information */}
            <div className="bg-card border border-border rounded-lg p-6">
              <h2 className="text-2xl font-bold text-foreground mb-6">Your Information</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-sm font-semibold text-foreground mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary"
                  />
                </div>

                {/* Phone */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-foreground mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:border-primary"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full px-8 py-4 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition font-bold text-lg"
            >
              Get Instant Quote
            </button>

            <p className="text-center text-muted-foreground text-sm">
              We respect your privacy. Your information will never be shared with third parties.
            </p>
          </form>
        )}
      </div>

      <Footer />
    </main>
  )
}
