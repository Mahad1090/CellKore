'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Upload, Check, X, ImageIcon, Loader2 } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { fetchCmsPage } from '@/lib/data'
import { uploadSellPhoneImages, MAX_UPLOAD_BYTES } from '@/lib/storage'
import { isValidPhone } from '@/lib/tax'

const CONDITIONS = [
	{ value: 'new', label: 'New / Like New' },
	{ value: 'used', label: 'Used' },
	{ value: 'refurbished', label: 'Refurbished' },
] as const

export default function SellYourPhonePage() {
	const { toast } = useToast()
	const { user } = useAuth()
	const [submitting, setSubmitting] = useState(false)
	const [submitted, setSubmitted] = useState(false)
	const [successCopy, setSuccessCopy] = useState<{ title: string; content: string } | null>(null)
	const [files, setFiles] = useState<File[]>([])
	const [form, setForm] = useState({
		brand: '',
		model: '',
		storage: '',
		ram: '',
		color: '',
		condition: 'used' as 'new' | 'used' | 'refurbished',
		damages: '',
		comments: '',
		name: '',
		email: '',
		phone: '',
	})

	// Success-screen copy comes from the CMS, not hardcoded strings
	useEffect(() => {
		fetchCmsPage('sell-success')
			.then((page) =>
				setSuccessCopy(
					page
						? { title: page.title, content: page.content ?? '' }
						: null
				)
			)
			.catch(() => setSuccessCopy(null))
	}, [])

	const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
		setForm((f) => ({ ...f, [field]: e.target.value }))

	const handleFiles = (selected: FileList | null) => {
		if (!selected) return
		const next: File[] = [...files]
		for (const file of Array.from(selected)) {
			if (!file.type.startsWith('image/')) {
				toast({ title: 'Unsupported file', description: `${file.name} is not an image.`, variant: 'error' })
				continue
			}
			if (file.size > MAX_UPLOAD_BYTES) {
				toast({ title: 'File too large', description: `${file.name} exceeds the 5MB limit.`, variant: 'error' })
				continue
			}
			if (next.length >= 8) break
			next.push(file)
		}
		setFiles(next)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!form.brand.trim() || !form.model.trim()) {
			toast({ title: 'Missing details', description: 'Device brand and model are required.', variant: 'error' })
			return
		}
		if (!form.email.trim() && !form.phone.trim()) {
			toast({ title: 'Contact required', description: 'Provide an email or a phone number so we can send your quote.', variant: 'error' })
			return
		}
		if (form.phone.trim() && !isValidPhone(form.phone)) {
			toast({ title: 'Invalid phone', description: 'Please enter a valid phone number (10–15 digits).', variant: 'error' })
			return
		}

		setSubmitting(true)
		try {
			const description = [
				form.storage && `Storage: ${form.storage}`,
				form.ram && `RAM: ${form.ram}`,
				form.color && `Color: ${form.color}`,
				form.damages && `Damages: ${form.damages}`,
				form.comments && `Comments: ${form.comments}`,
				form.name && `Contact name: ${form.name}`,
			]
				.filter(Boolean)
				.join('\n')

			// Upload photos first (compressed client-side). If any upload fails the
			// helper rolls back already-uploaded files and throws — we then abort
			// without writing the request row.
			const requestId = crypto.randomUUID()
			const uploaded = await uploadSellPhoneImages(requestId, files)

			const { error: insertError } = await supabase.from('sell_phone_requests').insert({
				id: requestId,
				user_id: user?.id ?? null,
				device_brand: form.brand.trim(),
				device_model: form.model.trim(),
				condition: form.condition,
				description,
				contact_phone: form.phone.trim() || null,
				contact_email: form.email.trim() || null,
				status: 'submitted',
			})
			if (insertError) {
				// Roll back storage so no dead files remain
				if (uploaded.length > 0) {
					await supabase.storage
						.from('sell-phone-images')
						.remove(uploaded.map((u) => u.path))
						.catch(() => undefined)
				}
				throw insertError
			}

			if (uploaded.length > 0) {
				await supabase.from('sell_phone_images').insert(
					uploaded.map((u) => ({ request_id: requestId, image_url: u.publicUrl }))
				)
			}

			setSubmitted(true)
			window.scrollTo({ top: 0, behavior: 'smooth' })
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

	if (submitted) {
		return (
			<main className="min-h-screen bg-background">
				<Navigation />
				<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
					<div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-8">
						<Check className="w-9 h-9 text-primary" />
					</div>
					<h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-luxury uppercase mb-6">
						{successCopy?.title ?? 'Quote Request Received'}
					</h1>
					<p className="text-sm md:text-base text-foreground/75 leading-relaxed whitespace-pre-line mb-10">
						{successCopy?.content ??
							'Thank you for your submission. A CellKore support agent will contact you within 24 hours with an official quote.'}
					</p>
					<Link
						href="/"
						className="inline-block px-8 py-3.5 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-[0.18em] hover:opacity-90 transition-all"
					>
						Back to Home
					</Link>
				</div>
				<Footer />
			</main>
		)
	}

	const inputClass =
		'w-full px-4 py-3 border border-border rounded-xl bg-background text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-all'

	return (
		<main className="min-h-screen bg-background">
			<Navigation />

			<section className="relative text-white w-full min-h-[420px] md:min-h-[480px] py-16 md:py-24 overflow-hidden flex items-center justify-center text-center">
				<video
					key="sell-ur-phone-new"
					autoPlay
					loop
					muted
					playsInline
					preload="auto"
					src="/sell_ur_phone_banner.mp4?v=4"
					className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none z-0"
				/>
				<div className="absolute inset-0 bg-black/55 z-10" />
				<div className="relative z-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
					<p className="text-xs md:text-sm uppercase tracking-[0.25em] text-white/80 mb-3 font-medium">Sell Your Device</p>
					<h1 className="text-3xl md:text-5xl font-bold tracking-luxury uppercase text-white drop-shadow-md">Get an Official Quote</h1>
					<p className="text-white/90 mt-4 text-xs md:text-sm font-light max-w-xl mx-auto leading-relaxed drop-shadow-sm">
						Tell us about your device — our expert team will review your submission and return an official valuation quote.
					</p>
				</div>
			</section>

			<form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
				{/* Device */}
				<div className="bg-card border border-border rounded-3xl p-7">
					<div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
						<span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center border border-emerald-500/30 shadow-sm">1</span>
						<div>
							<p className="text-[9px] uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400 font-bold">Step 01</p>
							<h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-foreground bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
								Device Details
							</h2>
						</div>
					</div>
					<div className="grid sm:grid-cols-2 gap-4">
						<input required placeholder="Brand (e.g. Apple)" value={form.brand} onChange={set('brand')} className={inputClass} />
						<input required placeholder="Model (e.g. iPhone 15 Pro)" value={form.model} onChange={set('model')} className={inputClass} />
						<input placeholder="Storage (e.g. 256GB)" value={form.storage} onChange={set('storage')} className={inputClass} />
						<input placeholder="RAM (e.g. 8GB)" value={form.ram} onChange={set('ram')} className={inputClass} />
						<input placeholder="Color" value={form.color} onChange={set('color')} className={inputClass} />
						<select value={form.condition} onChange={set('condition')} className={`${inputClass} cursor-pointer`}>
							{CONDITIONS.map((c) => (
								<option key={c.value} value={c.value}>{c.label}</option>
							))}
						</select>
					</div>
					<textarea
						placeholder="Any damage? (scratches, cracked screen, battery health...)"
						value={form.damages}
						onChange={set('damages')}
						rows={3}
						className={`${inputClass} mt-4 resize-none`}
					/>
					<textarea
						placeholder="Additional comments"
						value={form.comments}
						onChange={set('comments')}
						rows={2}
						className={`${inputClass} mt-4 resize-none`}
					/>
				</div>

				{/* Photos */}
				<div className="bg-card border border-border rounded-3xl p-7">
					<div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/60">
						<span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center border border-emerald-500/30 shadow-sm">2</span>
						<div>
							<p className="text-[9px] uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400 font-bold">Step 02</p>
							<h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-foreground bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
								Device Photos
							</h2>
						</div>
					</div>
					<p className="text-xs text-muted-foreground mb-6">
						Up to 8 photos, 5MB each. Photos are compressed automatically before upload.
					</p>
					<label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl py-10 cursor-pointer hover:border-primary hover:bg-secondary/50 transition-all">
						<Upload className="w-6 h-6 text-muted-foreground mb-3" />
						<span className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">
							Click to select images
						</span>
						<input
							type="file"
							accept="image/*"
							multiple
							className="hidden"
							onChange={(e) => {
								handleFiles(e.target.files)
								e.target.value = ''
							}}
						/>
					</label>
					{files.length > 0 && (
						<div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mt-5">
							{files.map((file, index) => (
								<div key={`${file.name}-${index}`} className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
									<img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
									<button
										type="button"
										onClick={() => setFiles(files.filter((_, i) => i !== index))}
										className="absolute top-1 right-1 p-1 rounded-full bg-background/90 border border-border opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
										aria-label="Remove photo"
									>
										<X className="w-3 h-3" />
									</button>
								</div>
							))}
						</div>
					)}
					{files.length === 0 && (
						<div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
							<ImageIcon className="w-3.5 h-3.5" />
							Photos help us give you a more accurate quote.
						</div>
					)}
				</div>

				{/* Contact */}
				<div className="bg-card border border-border rounded-3xl p-7">
					<div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
						<span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center border border-emerald-500/30 shadow-sm">3</span>
						<div>
							<p className="text-[9px] uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400 font-bold">Step 03</p>
							<h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-foreground bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
								Contact Information
							</h2>
						</div>
					</div>
					<div className="grid sm:grid-cols-2 gap-4">
						<input placeholder="Full name" value={form.name} onChange={set('name')} className={inputClass} />
						<input type="email" placeholder="Email address" value={form.email} onChange={set('email')} className={inputClass} />
						<input type="tel" placeholder="Phone number" value={form.phone} onChange={set('phone')} className={`${inputClass} sm:col-span-2`} />
					</div>
				</div>

				<button
					type="submit"
					disabled={submitting}
					className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:opacity-90 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
				>
					{submitting && <Loader2 className="w-4 h-4 animate-spin" />}
					{submitting ? 'Submitting your request...' : 'Request My Quote'}
				</button>
			</form>

			<Footer />
		</main>
	)
}
