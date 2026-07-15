'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4">CellKore</h3>
            <p className="text-sm opacity-90">
              Your trusted partner for premium cell phones, accessories, and spare parts.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/" className="hover:underline">Home</Link></li>
              <li><Link href="/products" className="hover:underline">Products</Link></li>
              <li><Link href="/marketplace" className="hover:underline">Marketplace</Link></li>
              <li><Link href="/wholesale" className="hover:underline">Wholesale</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/contact" className="hover:underline">Contact Us</Link></li>
              <li><Link href="/about" className="hover:underline">About Us</Link></li>
              <li><Link href="/terms" className="hover:underline">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="hover:underline">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4">Contact</h4>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <span>1-800-CELL-CORE</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <span>info@cellkore.com</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 mt-0.5" />
                <span>123 Tech Street, Silicon Valley, CA</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-primary-foreground border-opacity-20 pt-8 text-center text-sm opacity-90">
          <p>&copy; 2024 CellKore. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
