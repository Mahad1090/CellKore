'use client'

import Link from 'next/link'
import { ShoppingCart, Heart, Menu, X, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ALL_PRODUCTS } from '@/lib/mock-data'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'

export function Navigation() {
  const router = useRouter()
  const { user, signOut } = useAuth()
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
    <div className="w-full">
      {/* Premium Announcement Bar (Seamless Moving Marquee) */}
      <div className="w-full bg-[#073b31] border-b border-accent/20 overflow-hidden py-3 text-white">
        <div className="relative flex overflow-hidden">
          <div className="animate-marquee whitespace-nowrap flex gap-16 text-[10px] tracking-[0.25em] font-sans uppercase font-medium">
            <span>Complimentary Express Delivery on All Orders</span>
            <span className="text-accent">•</span>
            <span>Certified Authentic Inventory & Grading</span>
            <span className="text-accent">•</span>
            <span>Wholesale Contracts & Bulk Pricing Available</span>
            <span className="text-accent">•</span>
            {/* Duplicate for seamless loop */}
            <span>Complimentary Express Delivery on All Orders</span>
            <span className="text-accent">•</span>
            <span>Certified Authentic Inventory & Grading</span>
            <span className="text-accent">•</span>
            <span>Wholesale Contracts & Bulk Pricing Available</span>
            <span className="text-accent">•</span>
          </div>
        </div>
      </div>

      <nav className="sticky top-0 z-50 bg-background/95 backdrop-blur-xl border-b border-accent/10 shadow-[0_2px_15px_-3px_rgba(11,83,69,0.05)] text-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            
            {/* Left Block - Menu Trigger & Logo */}
            <div className="flex items-center gap-3">
              {/* Menu Button (Desktop & Mobile) */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 hover:bg-muted rounded-full transition-colors text-foreground cursor-pointer"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? (
                  <X className="w-4.5 h-4.5" />
                ) : (
                  <Menu className="w-4.5 h-4.5" />
                )}
              </button>

              {/* Logo */}
              <Link href="/" className="flex-shrink-0 group">
                <div className="text-2xl font-bold text-primary font-heading tracking-[0.12em] uppercase transition-all duration-300 group-hover:text-accent">
                  Cell<span className="font-light text-accent italic group-hover:text-primary transition-all duration-300 lowercase">Kore</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden md:flex md:items-center md:space-x-5 lg:space-x-6 xl:space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative text-foreground/80 hover:text-primary transition-all duration-300 text-[10px] lg:text-[11px] font-medium tracking-[0.12em] lg:tracking-[0.18em] uppercase py-2 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
                >
                  {link.label}
                </Link>
              ))}
            </div>

            {/* Right Section - Search, Cart, Wishlist, Account */}
            <div className="flex items-center space-x-2 lg:space-x-3">
              {/* Compact Expanding Search Bar (Desktop) */}
              <div className="hidden xl:flex items-center max-w-[200px] mr-2">
                <form onSubmit={handleSearchSubmit} className="w-full">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search..."
                      value={searchQuery}
                      onChange={handleSearchChange}
                      onFocus={() => searchQuery && setShowSearchDropdown(true)}
                      onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
                      className="w-36 focus:w-44 px-3.5 py-1.5 pr-8 border border-border/80 rounded-full bg-background/50 text-foreground placeholder-muted-foreground text-xs focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all duration-300 font-light"
                    />
                    <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                    {showSearchDropdown && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-lg z-50 max-h-80 overflow-y-auto w-64">
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

              {/* Search Icon for Mobile & Medium Screens */}
              <button 
                onClick={() => router.push('/products')}
                className="xl:hidden p-2 hover:bg-muted rounded-full transition-colors text-foreground"
              >
                <Search className="w-4.5 h-4.5" />
              </button>

              {/* Wishlist */}
              <Link href="/wishlist" className="relative p-2 hover:bg-muted rounded-full transition-colors text-foreground hover:text-accent">
                <Heart className="w-4.5 h-4.5" />
                {wishlistCount > 0 && (
                  <span className="absolute top-0 right-0 bg-accent text-accent-foreground text-[9px] rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link href="/cart" className="relative p-2 hover:bg-muted rounded-full transition-colors text-foreground hover:text-accent">
                <ShoppingCart className="w-4.5 h-4.5" />
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 bg-accent text-accent-foreground text-[9px] rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold">
                    {cartCount}
                  </span>
                )}
              </Link>

              {/* Account / Auth */}
              {user ? (
                <div className="hidden sm:flex items-center gap-3">
                  <span className="text-[11px] text-foreground/75 font-light tracking-wider truncate max-w-[80px]">{user.email}</span>
                  <Button 
                    onClick={() => signOut()}
                    variant="outline"
                    className="text-[10px] border-border/80 hover:bg-muted hover:border-accent hover:text-accent text-foreground font-medium tracking-[0.18em] uppercase px-4 py-1.5 rounded-full cursor-pointer transition-all"
                  >
                    Sign Out
                  </Button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5">
                  <Link href="/auth/signin">
                    <Button variant="ghost" className="text-[10px] text-foreground hover:text-accent hover:bg-transparent font-medium tracking-[0.18em] uppercase cursor-pointer px-3">
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button className="text-[10px] bg-primary hover:opacity-90 text-white font-medium tracking-[0.18em] uppercase px-5 py-2.5 rounded-full cursor-pointer shadow-sm border border-accent/20 transition-all">
                      Sign Up
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

      </nav>

      {/* Mobile & Desktop Sidebar Navigation Drawer (Theme Consistent) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[9999]">
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />
          
          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 max-w-sm w-full bg-[#073b31] border-r border-accent/30 shadow-[10px_0_30px_rgba(0,0,0,0.5)] p-8 flex flex-col justify-between z-50 animate-in slide-in-from-left duration-300">
            <div>
              {/* Header */}
              <div className="flex items-center justify-between pb-6 border-b border-accent/20">
                <div className="text-2xl font-bold text-white font-heading tracking-[0.15em] uppercase">
                  Cell<span className="font-light text-accent italic lowercase">Kore</span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 hover:bg-[#094a3e] rounded-full transition-colors text-white/80 hover:text-accent cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Links */}
              <nav className="mt-8 space-y-4">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block py-3 text-white/95 hover:text-accent transition-all duration-300 text-xs font-medium tracking-[0.2em] uppercase border-b border-accent/10 hover:border-accent/40 pb-3"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>

            {/* Bottom / Auth Section */}
            <div className="pt-6 border-t border-accent/20 mt-auto">
              {user ? (
                <div className="space-y-4">
                  <div className="text-xs text-accent/80 font-light tracking-wider truncate mb-2">
                    {user.email}
                  </div>
                  <button
                    onClick={() => {
                      signOut()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-center py-3 bg-[#094a3e] hover:bg-[#0d6454] text-white text-xs font-semibold tracking-widest uppercase rounded-full cursor-pointer transition-all border border-accent/20"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/auth/signin"
                    className="w-full text-center py-3 border border-accent/20 hover:bg-[#094a3e] text-white text-xs font-semibold tracking-widest uppercase rounded-full"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="w-full text-center py-3 bg-accent hover:opacity-95 text-primary text-xs font-bold tracking-widest uppercase rounded-full transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
