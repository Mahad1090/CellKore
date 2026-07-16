'use client'

import Link from 'next/link'
import { Mail, Phone, MapPin } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-black text-white py-16 mt-16 border-t border-accent/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Company Info */}
          <div>
            <h3 className="text-xl font-bold mb-4 font-heading tracking-luxury uppercase text-accent">CellKore</h3>
            <p className="text-sm opacity-90 font-light">
              Your trusted partner for premium cell phones, accessories, and spare parts.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold mb-4 tracking-wider uppercase text-xs text-accent/80">Quick Links</h4>
            <ul className="space-y-2 text-sm font-light">
              <li><Link href="/" className="hover:text-accent transition-colors">Home</Link></li>
              <li><Link href="/products" className="hover:text-accent transition-colors">Products</Link></li>
              <li><Link href="/marketplace" className="hover:text-accent transition-colors">Marketplace</Link></li>
              <li><Link href="/wholesale" className="hover:text-accent transition-colors">Wholesale</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4 tracking-wider uppercase text-xs text-accent/80">Support</h4>
            <ul className="space-y-2 text-sm font-light">
              <li><Link href="/contact" className="hover:text-accent transition-colors">Contact Us</Link></li>
              <li><Link href="/about" className="hover:text-accent transition-colors">About Us</Link></li>
              <li><Link href="/terms" className="hover:text-accent transition-colors">Terms & Conditions</Link></li>
              <li><Link href="/privacy" className="hover:text-accent transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold mb-4 tracking-wider uppercase text-xs text-accent/80">Contact</h4>
            <div className="space-y-3 text-sm font-light">
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-accent" />
                <span>1-800-CELL-CORE</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-accent" />
                <span>info@cellkore.com</span>
              </div>
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-accent mt-0.5" />
                <span>123 Tech Street, Silicon Valley, CA</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-accent/10 pt-8 text-center text-sm opacity-90">
          <p>&copy; {new Date().getFullYear()} CellKore. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
