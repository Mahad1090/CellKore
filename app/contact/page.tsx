'use client'

import { useEffect, useState } from 'react'
import { Check, Loader2 } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { useToast } from '@/components/ui/toast'
import { fetchSocialLinks } from '@/lib/data'
import type { SocialLink } from '@/lib/types'

export default function ContactPage() {
	const { toast } = useToast()
	const [socialLinks, setSocialLinks] = useState<SocialLink[]>([])
	const [submitted, setSubmitted] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const [form, setForm] = useState({ name: '', email: '', message: '' })

	useEffect(() => {
		fetchSocialLinks().then(setSocialLinks).catch(() => setSocialLinks([]))
	}, [])

	const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
		setForm((f) => ({ ...f, [field]: e.target.value }))

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
			toast({ title: 'Missing details', description: 'Name, email and a message are required.', variant: 'error' })
			return
		}
		setSubmitting(true)
		try {
			const res = await fetch('/api/contact', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					name: form.name.trim(),
					email: form.email.trim(),
					country: 'US',
					message: form.message.trim(),
				}),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
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

	// Filter WhatsApp links from DB or fallback defaults
	const usWhatsapp = socialLinks.find((l) => l.platform.toLowerCase().includes('us'))?.url || '+1 (206) 841-2427'
	const caWhatsapp = socialLinks.find((l) => l.platform.toLowerCase().includes('canada'))?.url || '+1 (143) 745-0926'

	const inputClass =
		'w-full px-4 py-3.5 border border-border/80 rounded-xl bg-card text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-all'

	return (
		<main className="min-h-screen bg-background">
			<Navigation />

			{/* Page Header */}
			<section className="py-12 bg-background border-b border-border/60 text-center">
				<div className="max-w-4xl mx-auto px-4">
					<p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-primary mb-2">
						GET IN TOUCH
					</p>
					<h1 className="text-3xl md:text-5xl font-serif font-normal tracking-tight text-foreground">
						Contact Us
					</h1>
				</div>
			</section>

			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid lg:grid-cols-12 gap-12">
				{/* Left Side: Contact Form */}
				<div className="lg:col-span-6 space-y-6">
					{submitted ? (
						<div className="bg-card border border-border/80 rounded-3xl p-10 text-center shadow-sm">
							<div className="w-14 h-14 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-5">
								<Check className="w-6 h-6 text-primary" />
							</div>
							<h2 className="text-xl font-bold text-card-foreground mb-2">Message Received</h2>
							<p className="text-sm text-muted-foreground leading-relaxed">
								Thank you for reaching out. Our team will get back to you as soon as possible.
							</p>
						</div>
					) : (
						<form onSubmit={handleSubmit} className="space-y-5">
							<div>
								<label className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground block mb-2">
									NAME
								</label>
								<input
									required
									placeholder=""
									value={form.name}
									onChange={set('name')}
									className={inputClass}
								/>
							</div>

							<div>
								<label className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground block mb-2">
									EMAIL
								</label>
								<input
									required
									type="email"
									placeholder=""
									value={form.email}
									onChange={set('email')}
									className={inputClass}
								/>
							</div>

							<div>
								<label className="text-[10px] font-bold uppercase tracking-[0.18em] text-foreground block mb-2">
									MESSAGE
								</label>
								<textarea
									required
									rows={6}
									placeholder=""
									value={form.message}
									onChange={set('message')}
									className={`${inputClass} resize-none`}
								/>
							</div>

							<button
								type="submit"
								disabled={submitting}
								className="w-full py-4 bg-[#599161] hover:bg-[#46754e] text-white font-extrabold text-xs uppercase tracking-[0.18em] rounded-xl transition-all cursor-pointer shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
							>
								{submitting && <Loader2 className="w-4 h-4 animate-spin" />}
								Send Message
							</button>
						</form>
					)}
				</div>

				{/* Right Side: Department Directory, WhatsApp Support, Follow Us */}
				<div className="lg:col-span-6 space-y-8">
					{/* Department Directory */}
					<div className="space-y-4">
						<h3 className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-muted-foreground">
							DEPARTMENT DIRECTORY
						</h3>
						<p className="text-[10px] uppercase font-medium tracking-wider text-muted-foreground/80">
							FOR DIRECT INQUIRIES, REACH OUT TO THE CORRESPONDING DEPARTMENT BELOW.
						</p>

						<div className="bg-[#FAFBF9] border border-border/80 rounded-2xl p-6 space-y-4 font-sans text-xs">
							<div className="flex items-center justify-between border-b border-border/60 pb-3">
								<span className="font-extrabold uppercase tracking-wider text-foreground text-[11px]">
									GENERAL INFO &amp; COLLABS
								</span>
								<a
									href="mailto:info@cellkore.com"
									className="font-semibold text-foreground/80 hover:text-primary transition-colors"
								>
									info@cellkore.com
								</a>
							</div>

							<div className="flex items-center justify-between border-b border-border/60 pb-3">
								<span className="font-extrabold uppercase tracking-wider text-foreground text-[11px]">
									CLIENT SUPPORT
								</span>
								<a
									href="mailto:support@cellkore.com"
									className="font-semibold text-foreground/80 hover:text-primary transition-colors"
								>
									support@cellkore.com
								</a>
							</div>

							<div className="flex items-center justify-between">
								<span className="font-extrabold uppercase tracking-wider text-foreground text-[11px]">
									ORDERS &amp; RETURNS
								</span>
								<a
									href="mailto:orders@cellkore.com"
									className="font-semibold text-foreground/80 hover:text-primary transition-colors"
								>
									orders@cellkore.com
								</a>
							</div>
						</div>
					</div>

					{/* WhatsApp Support */}
					<div className="space-y-4">
						<h3 className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-muted-foreground">
							WHATSAPP SUPPORT
						</h3>
						<div className="grid sm:grid-cols-2 gap-4">
							<a
								href={`https://wa.me/${usWhatsapp.replace(/\D/g, '')}`}
								target="_blank"
								rel="noreferrer"
								className="bg-[#FAFBF9] border border-border/80 hover:border-emerald-500/50 rounded-2xl p-4 flex items-center gap-3.5 transition-all group"
							>
								<div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
									<img src="/whatsapp.svg" alt="WhatsApp" className="w-6 h-6 object-contain" />
								</div>
								<div>
									<p className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">
										UNITED STATES
									</p>
									<p className="text-xs font-extrabold text-foreground group-hover:text-emerald-600 transition-colors">
										{usWhatsapp}
									</p>
								</div>
							</a>

							<a
								href={`https://wa.me/${caWhatsapp.replace(/\D/g, '')}`}
								target="_blank"
								rel="noreferrer"
								className="bg-[#FAFBF9] border border-border/80 hover:border-emerald-500/50 rounded-2xl p-4 flex items-center gap-3.5 transition-all group"
							>
								<div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
									<img src="/whatsapp.svg" alt="WhatsApp" className="w-6 h-6 object-contain" />
								</div>
								<div>
									<p className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground">
										CANADA
									</p>
									<p className="text-xs font-extrabold text-foreground group-hover:text-emerald-600 transition-colors">
										{caWhatsapp}
									</p>
								</div>
							</a>
						</div>
					</div>

					{/* Follow Us Social Icons */}
					<div className="space-y-4">
						<h3 className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-muted-foreground">
							FOLLOW US
						</h3>
						<div className="flex flex-wrap items-center gap-3">
							<a
								href="https://facebook.com/cellkore"
								target="_blank"
								rel="noreferrer"
								className="w-11 h-11 rounded-xl border border-border/80 bg-card hover:bg-muted flex items-center justify-center transition-all cursor-pointer shadow-3xs"
								title="Facebook"
							>
								<img src="/facebook.svg" alt="Facebook" className="w-5 h-5 object-contain" />
							</a>
							<a
								href="https://instagram.com/cellkore"
								target="_blank"
								rel="noreferrer"
								className="w-11 h-11 rounded-xl border border-border/80 bg-card hover:bg-muted flex items-center justify-center transition-all cursor-pointer shadow-3xs"
								title="Instagram"
							>
								<img src="/instagram.svg" alt="Instagram" className="w-5 h-5 object-contain" />
							</a>
							<a
								href="https://tiktok.com/@cellkore"
								target="_blank"
								rel="noreferrer"
								className="w-11 h-11 rounded-xl border border-border/80 bg-card hover:bg-muted flex items-center justify-center transition-all cursor-pointer shadow-3xs"
								title="TikTok"
							>
								<img src="/tiktok.svg" alt="TikTok" className="w-5 h-5 object-contain" />
							</a>
						</div>
					</div>
				</div>
			</div>

			<Footer />
		</main>
	)
}
