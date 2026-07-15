'use client'

import Link from 'next/link'
import { ShoppingCart, Heart, Menu, X, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ALL_PRODUCTS } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'

export function Navigation() {
  const router = useRouter()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [cartCount, setCartCount] = useState(0)
  const [wishlistCount, setWishlistCount] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<typeof ALL_PRODUCTS>([])
  const [showSearchDropdown, setShowSearchDropdown] = useState(false)

  // Load cart and wishlist counts from localStorage
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]')
    const wishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
    setCartCount(cart.length)
    setWishlistCount(wishlist.length)

    // Listen for storage changes
    const handleStorageChange = () => {
      const updatedCart = JSON.parse(localStorage.getItem('cart') || '[]')
      const updatedWishlist = JSON.parse(localStorage.getItem('wishlist') || '[]')
      setCartCount(updatedCart.length)
      setWishlistCount(updatedWishlist.length)
    }

    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [])

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/products', label: 'Products' },
    { href: '/marketplace', label: 'Marketplace' },
    { href: '/sell', label: 'Sell Your Phone' },
    { href: '/wholesale', label: 'Wholesale' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ]

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)

    if (query.trim().length > 0) {
      const results = ALL_PRODUCTS.filter((product) =>
        product.name.toLowerCase().includes(query.toLowerCase()) ||
        product.category.toLowerCase().includes(query.toLowerCase()) ||
        product.description?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
      setSearchResults(results)
      setShowSearchDropdown(true)
    } else {
      setSearchResults([])
      setShowSearchDropdown(false)
    }
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery)}`)
      setSearchQuery('')
      setShowSearchDropdown(false)
    }
  }

  const handleProductClick = (productId: string) => {
    router.push(`/products/${productId}`)
    setSearchQuery('')
    setShowSearchDropdown(false)
  }

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-border shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="text-2xl font-bold text-primary">CellKore</div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-foreground hover:text-primary transition-colors text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Search Bar - Hidden on mobile, shown on larger screens */}
          <div className="hidden lg:flex items-center flex-1 mx-8">
            <form onSubmit={handleSearchSubmit} className="w-full">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search phones, accessories..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onFocus={() => searchQuery && setShowSearchDropdown(true)}
                  onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-background text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary"
                />
                {showSearchDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto">
                    {searchResults.map((product) => (
                      <button
                        key={product.id}
                        onClick={() => handleProductClick(product.id)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left border-b border-border last:border-b-0"
                      >
                        <img src={product.image} alt={product.name} className="w-10 h-10 object-cover rounded" />
                        <div className="flex-1">
                          <p className="font-medium text-foreground text-sm">{product.name}</p>
                          <p className="text-xs text-muted-foreground">${product.price}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </form>
          </div>

          {/* Right Section - Search, Cart, Wishlist, Account */}
          <div className="flex items-center space-x-4">
            {/* Search Icon for Mobile */}
            <button className="lg:hidden p-2 hover:bg-muted rounded-lg transition-colors">
              <Search className="w-5 h-5" />
            </button>

            {/* Wishlist */}
            <Link href="/wishlist" className="relative p-2 hover:bg-muted rounded-lg transition-colors">
              <Heart className="w-5 h-5" />
              {wishlistCount > 0 && (
                <span className="absolute top-0 right-0 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            {/* Cart */}
            <Link href="/cart" className="relative p-2 hover:bg-muted rounded-lg transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute top-0 right-0 bg-accent text-accent-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {/* Account */}
            <Link href="/account" className="hidden sm:inline-flex px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-opacity-90 transition-all text-sm font-medium">
              Account
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 hover:bg-muted rounded-lg transition-colors"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-border">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-4 py-2 text-foreground hover:bg-muted transition-colors text-sm"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/account"
              className="block px-4 py-2 text-foreground hover:bg-muted transition-colors text-sm md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            >
              Account
            </Link>
          </div>
        )}
      </div>
    </nav>
  )
}
