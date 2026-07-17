'use client'

import { useEffect, useState } from 'react'
import { Phone, Mail, MessageCircle, Check, Loader2 } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
import { fetchCountryContacts } from '@/lib/data'
import type { CountryContactInfo } from '@/lib/types'

const COUNTRY_LABELS: Record<string, string> = { US: 'United States Office', CA: 'Canada Office' }

export default function ContactPage() {
	const { toast } = useToast()
	const [contacts, setContacts] = useState<CountryContactInfo[] | null>(null)
	const [submitted, setSubmitted] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [form, setForm] = useState({ name: '', email: '', phone: '', country: 'US', message: '' })

	useEffect(() => {
		fetchCountryContacts()
			.then(setContacts)
			.catch(() => setContacts([]))
	}, [])

	const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
		setForm((f) => ({ ...f, [field]: e.target.value }))

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
			toast({ title: 'Missing details', description: 'Name, email and a message are required.', variant: 'error' })
			return
		}
		setSubmitting(true)
		try {
			const { error } = await supabase.from('contact_inquiries').insert({
				name: form.name.trim(),
				email: form.email.trim(),
				phone: form.phone.trim() || null,
				country: form.country,
				message: form.message.trim(),
				status: 'new',
			})
			if (error) throw error
			setSubmitted(true)
		} catch (err) {
			toast({
				title: 'Submission failed',
				description: err instanceof Error ? err.message : 'Please try again in a moment.',
				variant: 'error',
			})
		} finally {
			setSubmitting(false)
		}
	}

	const inputClass =
		'w-full px-4 py-3 border border-border rounded-xl bg-background text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-all'

	return (
		<main className="min-h-screen bg-background">
			<Navigation />

			<section className="bg-primary text-primary-foreground py-12">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
					<p className="text-sm uppercase tracking-[0.25em] opacity-80 mb-3">Contact</p>
					<h1 className="text-3xl md:text-4xl font-bold tracking-luxury uppercase">Get in Touch</h1>
				</div>
			</section>

			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid lg:grid-cols-5 gap-10">
				{/* Office contact info from the database */}
				<div className="lg:col-span-2 space-y-5">
					{contacts === null ? (
						Array.from({ length: 2 }).map((_, i) => (
							<div key={i} className="animate-pulse bg-muted rounded-3xl h-44" />
						))
					) : (
						contacts
							.filter((c) => c.whatsapp_number || c.email || c.landline)
							.map((contact) => (
								<div key={contact.id} className="bg-card border border-border rounded-3xl p-7">
									<h2 className="text-xs font-bold uppercase tracking-[0.18em] text-card-foreground mb-5">
										{COUNTRY_LABELS[contact.country] ?? contact.country}
									</h2>
									<div className="space-y-4 text-sm">
										{contact.whatsapp_number && (
											<a
												href={`https://wa.me/${contact.whatsapp_number.replace(/\D/g, '')}`}
												target="_blank"
												rel="noreferrer"
												className="flex items-center gap-3 text-foreground/80 hover:text-primary transition-colors"
											>
												<MessageCircle className="w-4 h-4 text-primary shrink-0" />
												{contact.whatsapp_number}
											</a>
										)}
										{contact.email && (
											<a href={`mailto:${contact.email}`} className="flex items-center gap-3 text-foreground/80 hover:text-primary transition-colors">
												<Mail className="w-4 h-4 text-primary shrink-0" />
												{contact.email}
											</a>
										)}
										{contact.landline && (
											<a href={`tel:${contact.landline}`} className="flex items-center gap-3 text-foreground/80 hover:text-primary transition-colors">
												<Phone className="w-4 h-4 text-primary shrink-0" />
												{contact.landline}
											</a>
										)}
									</div>
								</div>
							))
					)}
					{contacts !== null && contacts.every((c) => !c.whatsapp_number && !c.email && !c.landline) && (
						<div className="bg-card border border-dashed border-border rounded-3xl p-7">
							<p className="text-sm text-muted-foreground">
								Office contact channels will appear here once published.
							</p>
						</div>
					)}
				</div>

				{/* Inquiry form */}
				<div className="lg:col-span-3">
					{submitted ? (
						<div className="bg-card border border-border rounded-3xl p-10 text-center">
							<div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
								<Check className="w-7 h-7 text-primary" />
							</div>
							<h2 className="text-xl font-bold text-card-foreground mb-3">Message Received</h2>
							<p className="text-sm text-foreground/75 leading-relaxed">
								Thank you for reaching out. Our team will get back to you as soon as possible.
							</p>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="bg-card border border-border rounded-3xl p-8 space-y-4">
							<div className="grid sm:grid-cols-2 gap-4">
								<input required placeholder="Full name" value={form.name} onChange={set('name')} className={inputClass} />
								<input required type="email" placeholder="Email address" value={form.email} onChange={set('email')} className={inputClass} />
								<input type="tel" placeholder="Phone (optional)" value={form.phone} onChange={set('phone')} className={inputClass} />
								<select value={form.country} onChange={set('country')} className={`${inputClass} cursor-pointer`}>
									<option value="US">United States</option>
									<option value="CA">Canada</option>
									<option value="Other">Other</option>
								</select>
							</div>
							<textarea
								required
								placeholder="How can we help?"
								value={form.message}
								onChange={set('message')}
								rows={6}
								className={`${inputClass} resize-none`}
							/>
							<button
								type="submit"
								disabled={submitting}
								className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:opacity-90 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer shadow-lg disabled:opacity-60"
							>
								{submitting && <Loader2 className="w-4 h-4 animate-spin" />}
								{submitting ? 'Sending...' : 'Send Message'}
							</button>
						</form>
					)}
				</div>
			</div>

			<Footer />
		</main>
	)
}
