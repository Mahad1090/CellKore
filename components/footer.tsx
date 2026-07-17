'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Mail, Phone, MessageCircle, Loader2, ArrowRight } from 'lucide-react'
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

	return (
		<footer className="bg-accent text-accent-foreground py-16 mt-16 border-t border-accent/20">
			<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
				<div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
					{/* Company */}
					<div>
						<h3 className="text-xl font-bold mb-4 font-heading tracking-luxury uppercase">CellKore</h3>
						<p className="text-sm opacity-80 font-light leading-relaxed">
							Your Premium Electronics Hub — buy, wholesale, and sell devices across the US and Canada.
						</p>
						{socialLinks.length > 0 && (
							<div className="flex flex-wrap gap-2 mt-5">
								{socialLinks.map((link) => (
									<a
										key={link.id}
										href={link.url}
										target="_blank"
										rel="noreferrer"
										className="px-3.5 py-1.5 rounded-full border border-accent-foreground/25 text-[10px] font-semibold uppercase tracking-[0.14em] hover:bg-accent-foreground hover:text-accent transition-all"
									>
										{link.platform}
									</a>
								))}
							</div>
						)}
					</div>

					{/* Quick links */}
					<div>
						<h4 className="font-semibold mb-4 tracking-wider uppercase text-xs opacity-70">Quick Links</h4>
						<ul className="space-y-2.5 text-sm font-light">
							<li><Link href="/" className="opacity-80 hover:opacity-100 transition-opacity">Home</Link></li>
							<li><Link href="/products" className="opacity-80 hover:opacity-100 transition-opacity">Products</Link></li>
							<li><Link href="/marketplace" className="opacity-80 hover:opacity-100 transition-opacity">Marketplace</Link></li>
							<li><Link href="/wholesale" className="opacity-80 hover:opacity-100 transition-opacity">Wholesale</Link></li>
							<li><Link href="/sell" className="opacity-80 hover:opacity-100 transition-opacity">Sell Your Phone</Link></li>
						</ul>
					</div>

					{/* Support */}
					<div>
						<h4 className="font-semibold mb-4 tracking-wider uppercase text-xs opacity-70">Support</h4>
						<ul className="space-y-2.5 text-sm font-light">
							<li><Link href="/contact" className="opacity-80 hover:opacity-100 transition-opacity">Contact Us</Link></li>
							<li><Link href="/terms" className="opacity-80 hover:opacity-100 transition-opacity">Terms & Conditions</Link></li>
							<li><Link href="/privacy" className="opacity-80 hover:opacity-100 transition-opacity">Privacy Policy</Link></li>
							<li><Link href="/about" className="opacity-80 hover:opacity-100 transition-opacity">About Us</Link></li>
						</ul>
						{primaryContact && (
							<ul className="space-y-2.5 text-sm font-light mt-5 pt-5 border-t border-accent-foreground/15">
								{primaryContact.email && (
									<li className="flex items-center gap-2.5 opacity-80">
										<Mail className="w-3.5 h-3.5" />
										{primaryContact.email}
									</li>
								)}
								{primaryContact.landline && (
									<li className="flex items-center gap-2.5 opacity-80">
										<Phone className="w-3.5 h-3.5" />
										{primaryContact.landline}
									</li>
								)}
								{primaryContact.whatsapp_number && (
									<li className="flex items-center gap-2.5 opacity-80">
										<MessageCircle className="w-3.5 h-3.5" />
										{primaryContact.whatsapp_number}
									</li>
								)}
							</ul>
						)}
					</div>

					{/* Newsletter */}
					<div>
						<h4 className="font-semibold mb-4 tracking-wider uppercase text-xs opacity-70">Newsletter</h4>
						<p className="text-sm opacity-80 font-light mb-4 leading-relaxed">
							Subscribe for new arrivals, wholesale lots, and exclusive offers.
						</p>
						<form onSubmit={handleSubscribe} className="flex">
							<input
								type="email"
								placeholder="Your email"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="flex-1 min-w-0 px-4 py-2.5 rounded-l-full bg-accent-foreground/10 border border-accent-foreground/20 border-r-0 text-sm placeholder:opacity-50 focus:outline-none focus:border-accent-foreground/50 transition-colors"
							/>
							<button
								type="submit"
								disabled={subscribing}
								className="px-4 py-2.5 rounded-r-full bg-primary text-primary-foreground border border-primary hover:opacity-90 transition-all cursor-pointer disabled:opacity-60"
								aria-label="Subscribe"
							>
								{subscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
							</button>
						</form>
					</div>
				</div>

				<div className="pt-8 border-t border-accent-foreground/15 flex flex-col sm:flex-row items-center justify-between gap-3">
					<p className="text-xs opacity-60 font-light">
						© {new Date().getFullYear()} CellKore. All rights reserved.
					</p>
					<p className="text-[10px] uppercase tracking-[0.2em] opacity-60">
						All sales final · No Return & Exchange Policy
					</p>
				</div>
			</div>
		</footer>
	)
}
