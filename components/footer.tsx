'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
	Mail, Phone, MessageCircle, Loader2, ArrowRight, ShieldCheck,
	Truck, Award, RefreshCw, Lock, Sparkles, CreditCard
} from 'lucide-react'
import { useToast } from '@/components/ui/toast'
import { fetchCountryContacts, fetchSocialLinks, subscribeToNewsletter } from '@/lib/data'
import type { CountryContactInfo, SocialLink } from '@/lib/types'

export function Footer() {
	const { toast } = useToast()
	const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
	const [contacts, setContacts] = useState<CountryContactInfo[]>([])
	const [email, setEmail] = useState('')
	const [subscribing, setSubscribing] = useState(false)

	useEffect(() => {
		fetchSocialLinks().then(setSocialLinks).catch(() => setSocialLinks([]))
		fetchCountryContacts().then(setContacts).catch(() => setContacts([]))
	}, [])

	const handleSubscribe = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!/^\S+@\S+\.\S+$/.test(email)) {
			toast({ title: 'Invalid email', description: 'Please enter a valid email address.', variant: 'error' })
			return
		}
		setSubscribing(true)
		try {
			const { alreadySubscribed } = await subscribeToNewsletter(email.trim().toLowerCase())
			toast({
				title: alreadySubscribed ? 'Already subscribed' : 'Subscribed',
				description: alreadySubscribed
					? 'This email is already on our list.'
					: 'Welcome aboard — you will hear from us soon.',
				variant: 'success',
			})
			setEmail('')
		} catch {
			toast({ title: 'Subscription failed', description: 'Please try again later.', variant: 'error' })
		} finally {
			setSubscribing(false)
		}
	}

	const primaryContact = contacts.find((c) => c.email || c.landline || c.whatsapp_number)

	const valuePillars = [
		{
			icon: ShieldCheck,
			title: 'Authenticated Stock',
			desc: '100% Inspected & Certified Devices',
			colors: {
				bg: 'bg-blue-700',
				border: 'border-blue-800',
				text: 'text-white',
				hoverBg: 'group-hover:bg-blue-800',
				hoverBorder: 'hover:border-blue-600/50',
				hoverTitle: 'group-hover:text-blue-700'
			}
		},
		{
			icon: Truck,
			title: 'Express Shipping',
			desc: 'Insured Priority Dispatch Across US & CA',
			colors: {
				bg: 'bg-orange-600',
				border: 'border-orange-700',
				text: 'text-white',
				hoverBg: 'group-hover:bg-orange-700',
				hoverBorder: 'hover:border-orange-600/50',
				hoverTitle: 'group-hover:text-orange-600'
			}
		},
		{
			icon: Award,
			title: 'Wholesale Contracts',
			desc: 'Bulk Tier Pricing & Commercial Accounts',
			colors: {
				bg: 'bg-teal-600',
				border: 'border-teal-700',
				text: 'text-white',
				hoverBg: 'group-hover:bg-teal-700',
				hoverBorder: 'hover:border-teal-600/50',
				hoverTitle: 'group-hover:text-teal-600'
			}
		},
		{
			icon: RefreshCw,
			title: 'Valuation & Repair',
			desc: 'Guaranteed Trade-In & Diagnostics',
			colors: {
				bg: 'bg-violet-600',
				border: 'border-violet-700',
				text: 'text-white',
				hoverBg: 'group-hover:bg-violet-700',
				hoverBorder: 'hover:border-violet-600/50',
				hoverTitle: 'group-hover:text-violet-600'
			}
		},
	]

	return (
		<footer className="bg-[#edf4ee] text-[#111c13] pt-14 pb-10 mt-20 border-t border-[#599063]/30 relative shadow-sm">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

				{/* Top Value Pillars */}
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 pb-12 mb-12 border-b border-[#599063]/25">
					{valuePillars.map((pillar, idx) => {
						const Icon = pillar.icon
						const colors = pillar.colors
						return (
							<div
								key={idx}
								className={`flex items-center gap-3.5 p-4 rounded-2xl bg-white border border-[#599063]/20 shadow-sm hover:shadow-md ${colors.hoverBorder} transition-all duration-300 group`}
							>
								<div className={`w-11 h-11 rounded-xl ${colors.bg} border ${colors.border} flex items-center justify-center ${colors.text} ${colors.hoverBg} transition-all duration-300 shrink-0`}>
									<Icon className="w-5 h-5" />
								</div>
								<div>
									<h5 className={`text-xs font-extrabold uppercase tracking-[0.12em] text-[#0e1710] ${colors.hoverTitle} transition-colors`}>
										{pillar.title}
									</h5>
									<p className="text-[11px] text-[#2d4633] font-medium mt-0.5 leading-snug">
										{pillar.desc}
									</p>
								</div>
							</div>
						)
					})}
				</div>

				{/* Main Footer Grid */}
				<div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12 text-center md:text-left">

					{/* Company Info Column */}
					<div className="flex flex-col items-center md:items-start space-y-3.5">
						<Link href="/" className="inline-block group">
							<img
								src="/cellkore_apple_green.webp"
								alt="CellKore Logo"
								className="h-16 md:h-20 w-auto object-contain transition-transform group-hover:scale-105 duration-300"
							/>
						</Link>

						<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#599063]/15 border border-[#599063]/30 text-[10px] uppercase font-bold tracking-[0.14em] text-[#275330]">
							<span>North America Marketplace</span>
						</div>

						<p className="text-xs text-[#253b2a] font-medium leading-relaxed max-w-sm">
							Your Premium Electronics Hub — buy retail, wholesale bulk, sell pre-owned devices, and book repairs with guaranteed authenticity.
						</p>

						{socialLinks.length > 0 && (
							<div className="pt-2">
								<p className="text-[10px] uppercase font-extrabold tracking-[0.18em] text-[#1e3323] mb-2">
									Follow Us
								</p>
								<div className="flex flex-wrap justify-center md:justify-start gap-2">
									{socialLinks.map((link) => (
										<a
											key={link.id}
											href={link.url}
											target="_blank"
											rel="noreferrer"
											className="px-3.5 py-1.5 rounded-full border border-[#599063]/30 bg-white text-[#111c13] text-[10px] font-bold uppercase tracking-[0.12em] hover:bg-[#599063] hover:text-white hover:border-[#599063] transition-all shadow-sm"
										>
											{link.platform}
										</a>
									))}
								</div>
							</div>
						)}
					</div>

					{/* Quick Links Column */}
					<div className="flex flex-col items-center md:items-start">
						<h4 className="text-xs font-extrabold tracking-[0.18em] uppercase text-[#0e1710] mb-4 pb-1.5 border-b border-[#599063]/30 inline-block">
							Explore Catalog
						</h4>
						<ul className="space-y-2.5 text-xs font-bold text-[#1e3323]">
							<li><Link href="/" className="hover:text-[#599063] transition-colors">Home Portal</Link></li>
							<li><Link href="/products?category=iphones" className="hover:text-[#599063] transition-colors">All Certified Devices</Link></li>
							<li><Link href="/marketplace" className="hover:text-[#599063] transition-colors">Regional Marketplaces</Link></li>
							<li><Link href="/wholesale" className="hover:text-[#599063] transition-colors">Wholesale & Bulk Lots</Link></li>
							<li><Link href="/spare-parts" className="hover:text-[#599063] transition-colors">Spare Parts Catalog</Link></li>
							<li><Link href="/sell" className="hover:text-[#599063] transition-colors">Sell Your Device</Link></li>
							<li><Link href="/repair" className="hover:text-[#599063] transition-colors">Repair Portal</Link></li>
						</ul>
					</div>

					{/* Customer Support Column */}
					<div className="flex flex-col items-center md:items-start">
						<h4 className="text-xs font-extrabold tracking-[0.18em] uppercase text-[#0e1710] mb-4 pb-1.5 border-b border-[#599063]/30 inline-block">
							Help & Support
						</h4>
						<ul className="space-y-2.5 text-xs font-bold text-[#1e3323]">
							<li><Link href="/about" className="hover:text-[#599063] transition-colors">About CellKore</Link></li>
							<li><Link href="/contact" className="hover:text-[#599063] transition-colors">Support Center</Link></li>
							<li><Link href="/testimonials" className="hover:text-[#599063] transition-colors">Testimonials</Link></li>
							<li><Link href="/sell/track" className="hover:text-[#599063] transition-colors">Track Sell Request</Link></li>
							<li><Link href="/terms" className="hover:text-[#599063] transition-colors">Terms of Service</Link></li>
							<li><Link href="/privacy" className="hover:text-[#599063] transition-colors">Privacy Policy</Link></li>
						</ul>

						{primaryContact && (
							<div className="mt-5 pt-4 border-t border-[#599063]/25 w-full flex flex-col items-center md:items-start space-y-2">
								<p className="text-[10px] uppercase font-extrabold tracking-[0.16em] text-[#1e3323]">Direct Contact</p>
								{primaryContact.email && (
									<a href={`mailto:${primaryContact.email}`} className="flex items-center justify-center md:justify-start gap-2 text-xs text-[#111c13] font-bold hover:text-[#599063] transition-colors">
										<Mail className="w-3.5 h-3.5 text-[#275330]" />
										<span>{primaryContact.email}</span>
									</a>
								)}
								{primaryContact.landline && (
									<a href={`tel:${primaryContact.landline}`} className="flex items-center justify-center md:justify-start gap-2 text-xs text-[#111c13] font-bold hover:text-[#599063] transition-colors">
										<Phone className="w-3.5 h-3.5 text-[#275330]" />
										<span>{primaryContact.landline}</span>
									</a>
								)}
								{primaryContact.whatsapp_number && (
									<a href={`https://wa.me/${primaryContact.whatsapp_number.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center md:justify-start gap-2 text-xs text-[#275330] font-extrabold hover:opacity-80 transition-opacity">
										<MessageCircle className="w-3.5 h-3.5" />
										<span>WhatsApp Desk</span>
									</a>
								)}
							</div>
						)}
					</div>

					{/* Newsletter Column */}
					<div className="flex flex-col items-center md:items-start">
						<h4 className="text-xs font-extrabold tracking-[0.18em] uppercase text-[#0e1710] mb-4 pb-1.5 border-b border-[#599063]/30 inline-block">
							Newsletter
						</h4>
						<p className="text-xs text-[#253b2a] font-medium mb-3.5 leading-relaxed max-w-sm">
							Subscribe for new inventory arrivals, wholesale price drops, and exclusive deals.
						</p>

						<form onSubmit={handleSubscribe} className="flex w-full max-w-sm mb-3">
							<input
								type="email"
								placeholder="Enter your email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="flex-1 min-w-0 px-4 py-2 rounded-l-full bg-white border border-[#599063]/40 border-r-0 text-xs text-[#0e1710] font-bold placeholder:text-gray-500 focus:outline-none focus:border-[#599063] transition-colors shadow-sm"
							/>
							<button
								type="submit"
								disabled={subscribing}
								className="px-4.5 py-2 rounded-r-full bg-[#599063] text-white font-extrabold text-xs border border-[#599063] hover:bg-[#46754e] transition-all cursor-pointer disabled:opacity-60 shadow-sm shrink-0"
								aria-label="Subscribe"
							>
								{subscribing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
							</button>
						</form>

						<div className="flex items-center gap-1.5 text-[10px] text-[#2d4633] font-bold">
							<Lock className="w-3 h-3 text-[#275330]" />
							<span>No spam · Unsubscribe anytime</span>
						</div>
					</div>

				</div>

				{/* Payment Methods Row */}
				<div className="pt-6 pb-6 border-t border-[#599063]/25 flex flex-col sm:flex-row items-center justify-center gap-4.5 md:gap-6 text-center">
					<div className="flex items-center gap-2 text-xs font-bold text-[#1e3323] tracking-wide">
						<CreditCard className="w-4 h-4 text-[#275330]" />
						<span>We Accept</span>
					</div>
					<div className="flex flex-wrap items-center justify-center gap-3">
						<img src="/visa.svg?v=3" alt="Visa" className="h-8 w-auto object-contain" />
						<img src="/mastercard.svg?v=3" alt="Mastercard" className="h-8 w-auto object-contain" />
						<img src="/paypal.svg?v=3" alt="PayPal" className="h-14 w-auto object-contain" />
						<img src="/apple_pay.svg?v=3" alt="Apple Pay" className="h-14 w-auto object-contain" />
						<img src="/google_pay.svg?v=3" alt="Google Pay" className="h-10 w-auto object-contain" />
					</div>
				</div>

				{/* Bottom Bar */}
				<div className="pt-6 border-t border-[#599063]/25 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
					<div className="flex items-center gap-2">
						<span className="w-2 h-2 rounded-full bg-[#599063]" />
						<p className="text-xs text-[#2d4633] font-medium">
							© {new Date().getFullYear()} <span className="font-extrabold text-[#0e1710]">CellKore</span>, A brand name owned by Yulkore Group Inc.
						</p>
					</div>

					<div className="flex flex-wrap items-center justify-center gap-4 text-[10px] uppercase tracking-[0.16em] text-[#1e3323] font-bold">
						<span>Certified North America Hub</span>
						<span>•</span>
						<span>All Sales Final Policy</span>
					</div>
				</div>

			</div>
		</footer>
	)
}
