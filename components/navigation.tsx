'use client'

import Link from 'next/link'
import { ShoppingCart, Heart, Menu, X, Search, Home, Smartphone, Store, DollarSign, Package, Info, Mail, User } from 'lucide-react'
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

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  const navLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/products', label: 'Products', icon: Smartphone },
    { href: '/marketplace', label: 'Marketplace', icon: Store },
    { href: '/sell', label: 'Sell Your Phone', icon: DollarSign },
    { href: '/wholesale', label: 'Wholesale', icon: Package },
    { href: '/about', label: 'About', icon: Info },
    { href: '/contact', label: 'Contact', icon: Mail },
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
      <div className="w-full bg-black border-b border-accent/20 overflow-hidden py-3 text-white">
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

      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-accent/10 shadow-[0_2px_15px_-3px_rgba(11,83,69,0.05)] text-foreground">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Row: Menu Button (Left), Logo (Center), Actions (Right) */}
          <div className="flex items-center justify-between min-h-[128px] md:min-h-[160px] py-4 gap-4">
            
            {/* Left Block - Menu Trigger */}
            <div className="flex items-center w-1/3 justify-start">
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
            </div>

            {/* Center Block - Logo */}
            <div className="flex items-center justify-center w-1/3">
              <Link href="/" className="flex-shrink-0 group flex items-center">
                <img
                  src="/logo.jpeg"
                  alt="CellKore Logo"
                  className="h-28 md:h-36 w-auto object-contain rounded transition-transform group-hover:scale-105 duration-300"
                />
              </Link>
            </div>

            {/* Right Block - Actions */}
            <div className="flex items-center justify-end w-1/3 space-x-2 lg:space-x-3">
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

          {/* Bottom Row: Centered Navigation Options (Desktop Only) */}
          <div className="hidden md:flex items-center justify-center py-4 border-t border-accent/10">
            <div className="flex items-center space-x-6 lg:space-x-8 xl:space-x-12">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative text-foreground/80 hover:text-primary transition-all duration-300 text-[10px] lg:text-[11px] font-medium tracking-[0.12em] lg:tracking-[0.18em] uppercase py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-accent after:transition-all after:duration-300 hover:after:w-full"
                >
                  {link.label}
                </Link>
              ))}
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
          <div className="fixed inset-y-0 left-0 max-w-sm w-full bg-white border-r border-border/60 shadow-[25px_0_50px_-15px_rgba(0,0,0,0.15)] p-8 flex flex-col justify-between z-50 animate-in slide-in-from-left duration-300 overflow-y-auto no-scrollbar">
            <div>
              {/* Header */}
              <div className="relative flex flex-col items-center justify-center pb-6 border-b border-border/60">
                <Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center">
                  <img
                    src="/logo.jpeg"
                    alt="CellKore Logo"
                    className="h-28 w-auto object-contain rounded"
                  />
                </Link>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="absolute -top-2 right-0 p-2.5 bg-neutral-100 hover:bg-neutral-200 rounded-full transition-all duration-300 text-neutral-700 hover:text-black hover:rotate-90 cursor-pointer"
                  aria-label="Close menu"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>

              {/* Links */}
              <nav className="mt-8 space-y-2">
                {navLinks.map((link) => {
                  const Icon = link.icon
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-neutral-100 transition-all duration-300 text-neutral-700 hover:text-primary group text-xs font-semibold tracking-[0.18em] uppercase"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Icon className="w-4 h-4 text-neutral-400 group-hover:text-primary transition-colors duration-300" />
                      <span className="group-hover:translate-x-1 transition-transform duration-300">
                        {link.label}
                      </span>
                    </Link>
                  )
                })}
              </nav>
            </div>

            {/* Bottom / Auth Section */}
            <div className="pt-6 border-t border-border/60 mt-auto">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 bg-neutral-50 p-3 rounded-2xl border border-border/60">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <User className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[10px] text-neutral-400 uppercase tracking-widest">Logged In As</p>
                      <p className="text-xs text-neutral-800 font-medium truncate mt-0.5">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      signOut()
                      setMobileMenuOpen(false)
                    }}
                    className="w-full text-center py-3 bg-white hover:bg-neutral-50 border border-border/80 text-foreground text-xs font-semibold tracking-widest uppercase rounded-full cursor-pointer transition-all"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link
                    href="/auth/signin"
                    className="w-full text-center py-3 border border-border/80 hover:bg-neutral-50 text-foreground text-xs font-semibold tracking-widest uppercase rounded-full transition-all"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="w-full text-center py-3 bg-primary hover:opacity-95 text-white text-xs font-bold tracking-widest uppercase rounded-full transition-all"
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
