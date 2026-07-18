'use client'

import Link from 'next/link'
import {
	ShoppingCart, Heart, Menu, X, Search, Home, Smartphone, Store, DollarSign,
	Package, Info, Mail, User, Globe, ChevronDown, BookOpen,
} from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import { useMarketplace, type Marketplace } from '@/contexts/marketplace-context'
import { fetchActiveCategories, fetchCatalogProducts } from '@/lib/data'
import { getLocalCart, getWishlist } from '@/lib/cart'
import type { Category, Product } from '@/lib/types'
import { primaryImage } from '@/lib/types'

const MARKETPLACE_OPTIONS: { value: Marketplace; label: string }[] = [
	{ value: 'US', label: 'US Marketplace' },
	{ value: 'CA', label: 'Canada Marketplace' },
	{ value: 'BOTH', label: 'US & Canada' },
]

function UsFlag({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 20 14" className={className} aria-hidden="true">
			<rect width="20" height="14" rx="1.5" fill="#fff" />
			{[0, 2, 4, 6, 8, 10, 12].map((y) => (
				<rect key={y} y={y} width="20" height="1.0769" fill="#B22234" />
			))}
			<rect width="8" height="7.5385" rx="1" fill="#3C3B6E" />
		</svg>
	)
}

function CaFlag({ className }: { className?: string }) {
	return (
		<svg viewBox="0 0 20 14" className={className} aria-hidden="true">
			<rect width="20" height="14" rx="1.5" fill="#fff" />
			<rect width="5" height="14" fill="#FF0000" />
			<rect x="15" width="5" height="14" fill="#FF0000" />
			<path
				d="M10 3.2l0.55 1.45 1.45-0.65-0.45 1.45 1.5 0.15-1.05 1.1 0.9 1.15-1.5-0.1 0.15 1.5-1.25-0.8-0.3 1.5-0.3-1.5-1.25 0.8 0.15-1.5-1.5 0.1 0.9-1.15-1.05-1.1 1.5-0.15-0.45-1.45 1.45 0.65z"
				fill="#FF0000"
			/>
		</svg>
	)
}

function MarketFlag({ value, className }: { value: Marketplace; className?: string }) {
	if (value === 'BOTH') {
		return (
			<span className="inline-flex -space-x-1.5">
				<UsFlag className={className} />
				<CaFlag className={className} />
			</span>
		)
	}
	return value === 'US' ? <UsFlag className={className} /> : <CaFlag className={className} />
}

export function Navigation() {
	const router = useRouter()
	const { user, signOut } = useAuth()
	const { marketplace, setMarketplace, isInternational } = useMarketplace()
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
	const [cartCount, setCartCount] = useState(0)
	const [wishlistCount, setWishlistCount] = useState(0)
	const [searchQuery, setSearchQuery] = useState('')
	const [searchResults, setSearchResults] = useState<Product[]>([])
	const [showSearchDropdown, setShowSearchDropdown] = useState(false)
	const [marketMenuOpen, setMarketMenuOpen] = useState(false)
	const [categories, setCategories] = useState<Category[]>([])
	const [intBannerDismissed, setIntBannerDismissed] = useState(false)
	const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
	const [profileMenuOpen, setProfileMenuOpen] = useState(false)
	const profileMenuRef = useRef<HTMLDivElement>(null)
	const [drawerCategoriesOpen, setDrawerCategoriesOpen] = useState(false)

	useEffect(() => {
		const refreshCounts = () => {
			setCartCount(getLocalCart().reduce((sum, i) => sum + i.quantity, 0))
			setWishlistCount(getWishlist().length)
		}
		refreshCounts()
		window.addEventListener('storage', refreshCounts)
		window.addEventListener('cellkore-cart-change', refreshCounts)
		return () => {
			window.removeEventListener('storage', refreshCounts)
			window.removeEventListener('cellkore-cart-change', refreshCounts)
		}
	}, [])

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
				setProfileMenuOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => {
			document.removeEventListener('mousedown', handleClickOutside)
		}
	}, [])

	// Dynamic category navigation from the database
	useEffect(() => {
		fetchActiveCategories().then(setCategories).catch(() => setCategories([]))
	}, [])

	useEffect(() => {
		document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
		return () => {
			document.body.style.overflow = ''
		}
	}, [mobileMenuOpen])

	const navLinks = [
		{ href: '/', label: 'Home', icon: Home },
		{ href: '/about', label: 'About Us', icon: Info },
		{ href: '/contact', label: 'Contact Us', icon: Mail },
	]

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const query = e.target.value
		setSearchQuery(query)
		if (searchTimer.current) clearTimeout(searchTimer.current)
		if (!query.trim()) {
			setSearchResults([])
			setShowSearchDropdown(false)
			return
		}
		searchTimer.current = setTimeout(() => {
			fetchCatalogProducts({ search: query.trim(), marketplace, limit: 8 })
				.then((results) => {
					setSearchResults(results)
					setShowSearchDropdown(true)
				})
				.catch(() => setSearchResults([]))
		}, 250)
	}

	const handleSearchSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		if (searchQuery.trim()) {
			router.push(`/products?search=${encodeURIComponent(searchQuery)}`)
			setSearchQuery('')
			setShowSearchDropdown(false)
		}
	}

	const currentMarket = MARKETPLACE_OPTIONS.find((o) => o.value === marketplace)

	return (
		<div className="w-full">
			{/* Premium Announcement Bar */}
			<div className="w-full bg-accent border-b border-accent/20 overflow-hidden py-3 text-accent-foreground">
				<div className="relative flex overflow-hidden">
					<div className="animate-marquee whitespace-nowrap flex gap-16 text-[10px] tracking-[0.25em] font-sans uppercase font-medium">
						{[0, 1].map((dup) => (
							<span key={dup} className="flex gap-16">
								<span>Complimentary Express Delivery on All Orders</span>
								<span className="opacity-50">•</span>
								<span>Certified Authentic Inventory & Grading</span>
								<span className="opacity-50">•</span>
								<span>Wholesale Contracts & Bulk Pricing Available</span>
								<span className="opacity-50">•</span>
							</span>
						))}
					</div>
				</div>
			</div>

			{/* International visitor marketplace banner */}
			{isInternational && !intBannerDismissed && (
				<div className="w-full bg-secondary border-b border-border py-3 px-4">
					<div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-3">
						<Globe className="w-4 h-4 text-primary" />
						<span className="text-[11px] uppercase tracking-[0.14em] text-foreground/80 font-medium">
							You are browsing internationally — choose your marketplace
						</span>
						<div className="flex rounded-full border border-border overflow-hidden bg-background">
							{MARKETPLACE_OPTIONS.map((option) => (
								<button
									key={option.value}
									onClick={() => setMarketplace(option.value)}
									className={`px-4 py-1.5 text-[10px] uppercase tracking-[0.14em] font-semibold transition-colors cursor-pointer ${marketplace === option.value
										? 'bg-primary text-primary-foreground'
										: 'text-foreground/70 hover:bg-muted'
										}`}
								>
									{option.label}
								</button>
							))}
						</div>
						<button
							onClick={() => setIntBannerDismissed(true)}
							className="p-1 rounded-full hover:bg-muted transition-colors cursor-pointer"
							aria-label="Dismiss"
						>
							<X className="w-3.5 h-3.5 text-muted-foreground" />
						</button>
					</div>
				</div>
			)}

			<nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-accent/10 shadow-[0_2px_15px_-3px_rgba(0,0,0,0.05)] text-foreground">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="flex items-center justify-between min-h-[76px] md:min-h-[136px] py-2 md:py-4 gap-2 md:gap-4">
						{/* Left Block */}
						<div className="flex items-center w-auto md:w-1/3 justify-start gap-2 md:gap-3">
							<button
								onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
								className="p-1.5 sm:p-2 hover:bg-muted rounded-full transition-colors text-foreground cursor-pointer"
								aria-label="Toggle Menu"
							>
								{mobileMenuOpen ? <X className="w-4.5 h-4.5" /> : <Menu className="w-4.5 h-4.5" />}
							</button>

							<div className="hidden md:flex items-center space-x-4 lg:space-x-6">
								{navLinks.map((link) => (
									<Link
										key={link.href}
										href={link.href}
										className="relative text-foreground/80 hover:text-primary transition-all duration-300 text-[10px] lg:text-[11px] font-semibold tracking-[0.12em] lg:tracking-[0.18em] uppercase py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-[1px] after:bg-primary after:transition-all after:duration-300 hover:after:w-full whitespace-nowrap"
									>
										{link.label}
									</Link>
								))}
							</div>
						</div>

						{/* Center Block - Logo + tagline */}
						<div className="flex flex-col items-center justify-center flex-1 min-w-0 md:flex-none md:w-1/3">
							<Link href="/" className="flex-shrink-0 group flex flex-col items-center">
								<img
									src="/cellkore_apple_green.webp"
									alt="CellKore Logo"
									className="h-14 sm:h-20 md:h-32 w-auto object-contain rounded transition-transform group-hover:scale-105 duration-300"
								/>
								<span className="hidden md:block text-[9px] uppercase tracking-[0.3em] text-muted-foreground mt-1">
									Your Premium Electronics Hub
								</span>
							</Link>
						</div>

						{/* Right Block - Actions */}
						<div className="flex items-center justify-end w-auto md:w-1/3 space-x-0.5 sm:space-x-2 lg:space-x-3">
							{/* Persistent marketplace selector */}
							<div className="relative md:mr-2">
								<button
									onClick={() => setMarketMenuOpen((open) => !open)}
									onBlur={() => setTimeout(() => setMarketMenuOpen(false), 150)}
									className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 sm:py-2 rounded-full border border-border/80 hover:border-primary hover:text-primary transition-all text-[10px] font-semibold uppercase tracking-[0.14em] cursor-pointer"
								>
									{currentMarket ? (
										<MarketFlag value={currentMarket.value} className="w-4 h-3 mr-0.5 rounded-[2px] shadow-sm" />
									) : (
										<Globe className="w-3.5 h-3.5 mr-0.5" />
									)}
									<span className="hidden sm:inline">{currentMarket?.label ?? 'Marketplace'}</span>
									<ChevronDown className="w-3 h-3" />
								</button>
								{marketMenuOpen && (
									<div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-2 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50 min-w-[190px] animate-in fade-in slide-in-from-top-2 duration-200">
										{MARKETPLACE_OPTIONS.map((option) => (
											<button
												key={option.value}
												onClick={() => {
													setMarketplace(option.value)
													setMarketMenuOpen(false)
												}}
												className={`w-full text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] transition-colors cursor-pointer flex items-center gap-2 ${marketplace === option.value
													? 'bg-secondary text-primary'
													: 'text-foreground/75 hover:bg-muted'
													}`}
											>
												<MarketFlag value={option.value} className="w-4 h-3 rounded-[2px] shadow-sm" />
												<span>{option.label}</span>
											</button>
										))}
									</div>
								)}
							</div>

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
											className="w-36 focus:w-44 px-3.5 py-1.5 pr-8 border border-border/80 rounded-full bg-background/50 text-foreground placeholder-muted-foreground text-xs focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-all duration-300 font-light"
										/>
										<Search className="absolute right-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
										{showSearchDropdown && searchResults.length > 0 && (
											<div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl z-50 max-h-80 overflow-y-auto w-72 no-scrollbar">
												{searchResults.map((product) => (
													<button
														key={product.id}
														onClick={() => {
															router.push(`/products/${product.id}`)
															setSearchQuery('')
															setShowSearchDropdown(false)
														}}
														className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted transition-colors text-left border-b border-border last:border-b-0 cursor-pointer"
													>
														{primaryImage(product) ? (
															<img
																src={primaryImage(product)!}
																alt={product.name}
																className="w-10 h-10 object-cover rounded-lg"
															/>
														) : (
															<div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
																<Smartphone className="w-4 h-4 text-muted-foreground" />
															</div>
														)}
														<div className="flex-1 min-w-0">
															<p className="font-medium text-card-foreground text-sm truncate">{product.name}</p>
															<p className="text-xs text-muted-foreground">${Number(product.base_price).toFixed(2)}</p>
														</div>
													</button>
												))}
											</div>
										)}
									</div>
								</form>
							</div>

							<button
								onClick={() => router.push('/products')}
								className="xl:hidden p-1.5 sm:p-2 hover:bg-muted rounded-full transition-colors text-foreground cursor-pointer"
								aria-label="Search products"
							>
								<Search className="w-4.5 h-4.5" />
							</button>

							<Link href="/wishlist" className="relative p-1.5 sm:p-2 hover:bg-muted rounded-full transition-colors text-foreground hover:text-rose-500">
								<Heart className={`w-4.5 h-4.5 transition-colors duration-300 ${wishlistCount > 0 ? 'fill-rose-500 text-rose-500' : ''}`} />
								{wishlistCount > 0 && (
									<span className="absolute top-0 right-0 bg-rose-500 text-white text-[9px] rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold animate-pulse">
										{wishlistCount}
									</span>
								)}
							</Link>

							<Link href="/cart" className="relative p-1.5 sm:p-2 hover:bg-muted rounded-full transition-colors text-foreground hover:text-primary sm:mr-1">
								<ShoppingCart className="w-4.5 h-4.5" />
								{cartCount > 0 && (
									<span className="absolute top-0 right-0 bg-primary text-primary-foreground text-[9px] rounded-full w-4.5 h-4.5 flex items-center justify-center font-bold">
										{cartCount}
									</span>
								)}
							</Link>

							{/* Profile Dropdown */}
							<div className="relative animate-fade-in" ref={profileMenuRef}>
								<button
									onClick={() => setProfileMenuOpen(!profileMenuOpen)}
									className="flex items-center gap-1.5 px-2 sm:px-4 py-1.5 sm:py-2 rounded-full border border-border/80 hover:border-primary hover:text-primary transition-all text-[10px] font-semibold uppercase tracking-[0.14em] cursor-pointer"
								>
									<User className="w-3.5 h-3.5" />
									<span className="hidden sm:inline">Profile</span>
									<ChevronDown className="hidden sm:block w-3 h-3 transition-transform duration-300" style={{ transform: profileMenuOpen ? 'rotate(180deg)' : 'none' }} />
								</button>
								{profileMenuOpen && (
									<div className="absolute top-full right-0 mt-2 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50 min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-200">
										{user ? (
											<div className="py-2">
												<div className="px-5 py-3 border-b border-border">
													<p className="text-[10px] text-muted-foreground uppercase tracking-wider">Signed in as</p>
													<p className="text-xs font-semibold text-foreground truncate mt-0.5">{user.email}</p>
												</div>
												<Link href="/account" onClick={() => setProfileMenuOpen(false)}>
													<span className="block px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/75 hover:bg-muted hover:text-primary transition-colors cursor-pointer">
														My Account
													</span>
												</Link>
												<button
													onClick={() => {
														signOut()
														setProfileMenuOpen(false)
													}}
													className="w-full text-left px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-red-500 hover:bg-muted transition-colors cursor-pointer border-t border-border"
												>
													Sign Out
												</button>
											</div>
										) : (
											<div className="py-1">
												<Link href="/auth/signin" onClick={() => setProfileMenuOpen(false)}>
													<span className="block px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/75 hover:bg-muted hover:text-primary transition-colors cursor-pointer">
														Sign In
													</span>
												</Link>
												<Link href="/auth/signup" onClick={() => setProfileMenuOpen(false)}>
													<span className="block px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/75 hover:bg-muted hover:text-primary transition-colors cursor-pointer border-t border-border">
														Sign Up
													</span>
												</Link>
											</div>
										)}
									</div>
								)}
							</div>
						</div>
					</div>



				</div>
			</nav>

			{/* Drawer */}
			{mobileMenuOpen && (
				<div className="fixed inset-0 z-[9999]">
					<div
						className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
						onClick={() => setMobileMenuOpen(false)}
					/>
					<div className="fixed inset-y-0 left-0 max-w-sm w-full bg-background border-r border-border/60 shadow-[25px_0_50px_-15px_rgba(0,0,0,0.15)] p-8 flex flex-col justify-between z-50 animate-in slide-in-from-left duration-300 overflow-y-auto no-scrollbar">
						<div>
							<div className="relative flex flex-col items-center justify-center pb-6 border-b border-border/60">
								<Link href="/" onClick={() => setMobileMenuOpen(false)} className="flex items-center justify-center">
									<img src="/cellkore_apple_green.webp" alt="CellKore Logo" className="h-24 w-auto object-contain rounded" />
								</Link>
								<button
									onClick={() => setMobileMenuOpen(false)}
									className="absolute -top-2 right-0 p-2.5 bg-muted hover:bg-secondary rounded-full transition-all duration-300 text-foreground/70 hover:text-foreground hover:rotate-90 cursor-pointer"
									aria-label="Close menu"
								>
									<X className="w-4.5 h-4.5" />
								</button>
							</div>

							<nav className="mt-8 space-y-1">
								{/* Home */}
								<Link
									href="/"
									className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted transition-all duration-300 text-foreground/75 hover:text-primary group text-xs font-semibold tracking-[0.18em] uppercase"
									onClick={() => setMobileMenuOpen(false)}
								>
									<Home className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
									<span className="group-hover:translate-x-1 transition-transform duration-300">Home</span>
								</Link>

								{/* Products */}
								<Link
									href="/products"
									className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted transition-all duration-300 text-foreground/75 hover:text-primary group text-xs font-semibold tracking-[0.18em] uppercase"
									onClick={() => setMobileMenuOpen(false)}
								>
									<Smartphone className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
									<span className="group-hover:translate-x-1 transition-transform duration-300">Products</span>
								</Link>

								{/* Marketplace */}
								<Link
									href="/marketplace"
									className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted transition-all duration-300 text-foreground/75 hover:text-primary group text-xs font-semibold tracking-[0.18em] uppercase"
									onClick={() => setMobileMenuOpen(false)}
								>
									<Store className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
									<span className="group-hover:translate-x-1 transition-transform duration-300">Marketplace</span>
								</Link>

								{/* Sell Your Phone */}
								<Link
									href="/sell"
									className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted transition-all duration-300 text-foreground/75 hover:text-primary group text-xs font-semibold tracking-[0.18em] uppercase"
									onClick={() => setMobileMenuOpen(false)}
								>
									<DollarSign className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
									<span className="group-hover:translate-x-1 transition-transform duration-300">Sell Your Phone</span>
								</Link>

								{/* Wholesale */}
								<Link
									href="/wholesale"
									className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted transition-all duration-300 text-foreground/75 hover:text-primary group text-xs font-semibold tracking-[0.18em] uppercase"
									onClick={() => setMobileMenuOpen(false)}
								>
									<Package className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
									<span className="group-hover:translate-x-1 transition-transform duration-300">Wholesale</span>
								</Link>

								{/* Shop by Category Accordion */}
								{categories.length > 0 && (
									<div className="space-y-1">
										<button
											onClick={() => setDrawerCategoriesOpen(!drawerCategoriesOpen)}
											className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-muted transition-all duration-300 text-foreground/75 hover:text-primary group text-xs font-semibold tracking-[0.18em] uppercase cursor-pointer"
										>
											<span className="flex items-center gap-4">
												<Globe className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
												<span>Shop Categories</span>
											</span>
											<ChevronDown className="w-3.5 h-3.5 transition-transform duration-300" style={{ transform: drawerCategoriesOpen ? 'rotate(180deg)' : 'none' }} />
										</button>
										{drawerCategoriesOpen && (
											<div className="pl-12 pr-4 py-2 space-y-3 border-l border-border/80 ml-6 animate-in fade-in slide-in-from-top-1 duration-200">
												{categories.map((category) => (
													<Link
														key={category.id}
														href={`/products?category=${category.slug}`}
														onClick={() => setMobileMenuOpen(false)}
														className="block text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/70 hover:text-primary transition-colors"
													>
														{category.name}
													</Link>
												))}
											</div>
										)}
									</div>
								)}

								{/* About Us */}
								<Link
									href="/about"
									className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted transition-all duration-300 text-foreground/75 hover:text-primary group text-xs font-semibold tracking-[0.18em] uppercase"
									onClick={() => setMobileMenuOpen(false)}
								>
									<Info className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
									<span className="group-hover:translate-x-1 transition-transform duration-300">About Us</span>
								</Link>

								{/* Contact Us */}
								<Link
									href="/contact"
									className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted transition-all duration-300 text-foreground/75 hover:text-primary group text-xs font-semibold tracking-[0.18em] uppercase"
									onClick={() => setMobileMenuOpen(false)}
								>
									<Mail className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors duration-300" />
									<span className="group-hover:translate-x-1 transition-transform duration-300">Contact Us</span>
								</Link>
							</nav>
					</div>
				</div>
			</div>
		)}
		</div>
	)
}
