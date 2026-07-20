'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Wrench, ShieldCheck, Clock, Award, Upload, Check, X, ImageIcon, Loader2, Smartphone, Laptop, Tablet, Watch } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { fetchCmsPage } from '@/lib/data'
import { uploadSellPhoneImages, MAX_UPLOAD_BYTES } from '@/lib/storage'
import { isValidPhone } from '@/lib/tax'

const DEVICE_CATEGORIES = [
	{ id: 'iphone', label: 'iPhone', icon: Smartphone },
	{ id: 'samsung', label: 'Samsung', icon: Smartphone },
	{ id: 'ipad', label: 'iPad', icon: Tablet },
	{ id: 'tablet', label: 'Tablet', icon: Tablet },
	{ id: 'watch', label: 'Watch', icon: Watch },
	{ id: 'laptop', label: 'Laptop', icon: Laptop },
	{ id: 'other', label: 'Other Device', icon: Wrench },
] as const

const REPAIR_ISSUES = [
	'Screen & Glass Replacement',
	'Battery Health & Replacement',
	'Water & Liquid Damage Restoration',
	'Charging Port & Speaker Repair',
	'Camera & Lens Replacement',
	'Logic Board & Micro-Soldering',
	'Full Diagnostic & Health Inspection',
	'Other / Custom Issue',
] as const

const SERVICE_METHODS = [
	{ id: 'mail_in', label: 'Mail-in Repair Service (Prepaid Label)', desc: 'Ship your device safely with insured tracking.' },
	{ id: 'drop_off', label: 'In-Person Store Drop-off', desc: 'Bring your device directly to our certified service hub.' },
] as const

export default function RepairPage() {
	const { toast } = useToast()
	const { user } = useAuth()
	const [submitting, setSubmitting] = useState(false)
	const [submitted, setSubmitted] = useState(false)
	const [successCopy, setSuccessCopy] = useState<{ title: string; content: string } | null>(null)
	const [files, setFiles] = useState<File[]>([])
	const [selectedCategory, setSelectedCategory] = useState<string>('iphone')
	const [customCategory, setCustomCategory] = useState('')
	const [selectedIssues, setSelectedIssues] = useState<string[]>(['Screen & Glass Replacement'])
	const [customIssue, setCustomIssue] = useState('')
	const [serviceMethod, setServiceMethod] = useState<'mail_in' | 'drop_off'>('mail_in')
	const [form, setForm] = useState({
		brand: '',
		model: '',
		serialNumber: '',
		description: '',
		name: '',
		email: '',
		phone: '',
	})

	useEffect(() => {
		fetchCmsPage('repair-success')
			.then((page) =>
				setSuccessCopy(
					page ? { title: page.title, content: page.content ?? '' } : null
				)
			)
			.catch(() => setSuccessCopy(null))
	}, [])

	const set = (field: keyof typeof form) => (
		e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
	) => setForm((f) => ({ ...f, [field]: e.target.value }))

	const toggleIssue = (issue: string) => {
		setSelectedIssues((prev) =>
			prev.includes(issue)
				? prev.filter((i) => i !== issue)
				: [...prev, issue]
		)
	}

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
		if (selectedIssues.length === 0) {
			toast({ title: 'Select an issue', description: 'Please choose at least one repair issue.', variant: 'error' })
			return
		}
		if (!form.email.trim() && !form.phone.trim()) {
			toast({ title: 'Contact required', description: 'Provide an email or phone number for quote & status updates.', variant: 'error' })
			return
		}
		if (form.phone.trim() && !isValidPhone(form.phone)) {
			toast({ title: 'Invalid phone', description: 'Please enter a valid phone number (10–15 digits).', variant: 'error' })
			return
		}

		setSubmitting(true)
		try {
			const formattedIssues = selectedIssues.map((i) =>
				i === 'Other / Custom Issue' && customIssue.trim() ? `Other: ${customIssue.trim()}` : i
			)
			const catText = selectedCategory === 'other' && customCategory.trim()
				? `OTHER (${customCategory.trim()})`
				: selectedCategory.toUpperCase()
			const deviceInfo = [
				`Category: ${catText}`,
				`Brand: ${form.brand.trim()}`,
				`Model: ${form.model.trim()}`,
				form.serialNumber && `Serial/IMEI: ${form.serialNumber.trim()}`,
				`Issues: ${formattedIssues.join(', ')}`,
				`Service Method: ${serviceMethod === 'mail_in' ? 'Mail-in' : 'Store Drop-off'}`,
				form.description && `Notes: ${form.description.trim()}`,
				form.name && `Contact Name: ${form.name.trim()}`,
				form.phone && `Contact Phone: ${form.phone.trim()}`,
				form.email && `Contact Email: ${form.email.trim()}`,
			]
				.filter(Boolean)
				.join('\n')

			const requestId = crypto.randomUUID()
			let uploadedUrls: string[] = []

			if (files.length > 0) {
				const uploaded = await uploadSellPhoneImages(requestId, files)
				uploadedUrls = uploaded.map((u) => u.publicUrl)
			}

			const { error: insertError } = await supabase.from('repair_requests').insert({
				id: requestId,
				user_id: user?.id ?? null,
				device_info: deviceInfo,
				current_status: 'pending_approval',
			})

			if (insertError) {
				// Fallback to inserting formatted record into sell_phone_requests if repair_requests table has strict schema constraints
				await supabase.from('sell_phone_requests').insert({
					id: requestId,
					user_id: user?.id ?? null,
					device_brand: `REPAIR: ${form.brand.trim()}`,
					device_model: form.model.trim(),
					condition: 'used',
					description: deviceInfo,
					contact_phone: form.phone.trim() || null,
					contact_email: form.email.trim() || null,
					status: 'submitted',
				})
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
						{successCopy?.title ?? 'Repair Request Submitted'}
					</h1>
					<p className="text-sm md:text-base text-foreground/75 leading-relaxed whitespace-pre-line mb-10">
						{successCopy?.content ??
							'Thank you for trusting CellKore! Our certified technicians are assessing your device details and will send your official repair estimate within 24 hours.'}
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

			{/* Hero Banner Section */}
			<section className="relative text-white w-full min-h-[420px] md:min-h-[480px] py-16 md:py-24 overflow-hidden flex items-center justify-center text-center">
				<video
					autoPlay
					loop
					muted
					playsInline
					preload="auto"
					src="/laptop_banner.mp4"
					className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none z-0"
				/>
				<div className="absolute inset-0 bg-black/60 z-10" />
				<div className="relative z-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
					<p className="text-xs md:text-sm uppercase tracking-[0.25em] text-white/80 mb-3 font-medium">Certified OEM Service</p>
					<h1 className="text-3xl md:text-5xl font-bold tracking-luxury uppercase text-white drop-shadow-md">Device Repair & Restoration</h1>
					<p className="text-white/90 mt-4 text-xs md:text-sm font-light max-w-xl mx-auto leading-relaxed drop-shadow-sm">
						Professional screen, battery, component, and chip-level repairs for smartphones, tablets, laptops, and smartwatches.
					</p>
				</div>
			</section>

			{/* Trust Badges */}
			<section className="border-b border-border bg-muted/40 py-8">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
						<div className="flex flex-col items-center">
							<ShieldCheck className="w-6 h-6 text-primary mb-2" />
							<h3 className="text-xs font-bold uppercase tracking-wider text-foreground">OEM Certified Parts</h3>
							<p className="text-[11px] text-muted-foreground mt-0.5">Grade-A genuine replacement components</p>
						</div>
						<div className="flex flex-col items-center">
							<Clock className="w-6 h-6 text-primary mb-2" />
							<h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Fast Turnaround</h3>
							<p className="text-[11px] text-muted-foreground mt-0.5">Same-day diagnostic & rapid turnaround</p>
						</div>
						<div className="flex flex-col items-center">
							<Award className="w-6 h-6 text-primary mb-2" />
							<h3 className="text-xs font-bold uppercase tracking-wider text-foreground">90-Day Warranty</h3>
							<p className="text-[11px] text-muted-foreground mt-0.5">Comprehensive coverage on all repairs</p>
						</div>
						<div className="flex flex-col items-center">
							<Wrench className="w-6 h-6 text-primary mb-2" />
							<h3 className="text-xs font-bold uppercase tracking-wider text-foreground">Free Quote</h3>
							<p className="text-[11px] text-muted-foreground mt-0.5">No upfront fee for repair assessment</p>
						</div>
					</div>
				</div>
			</section>

			{/* Repair Booking Form */}
			<form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-10">
				{/* Step 1: Device Category */}
				<div className="bg-card border border-border rounded-3xl p-7">
					<h2 className="text-sm font-bold uppercase tracking-[0.18em] text-card-foreground mb-6">1 · Select Device Category</h2>
					<div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
						{DEVICE_CATEGORIES.map((cat) => {
							const Icon = cat.icon
							const isSelected = selectedCategory === cat.id
							return (
								<button
									key={cat.id}
									type="button"
									onClick={() => setSelectedCategory(cat.id)}
									className={`flex flex-col items-center justify-center p-4 rounded-2xl border transition-all cursor-pointer ${isSelected
										? 'border-primary bg-primary/10 text-primary font-bold shadow-sm'
										: 'border-border bg-background text-foreground/75 hover:border-primary/50'
										}`}
								>
									<Icon className="w-6 h-6 mb-2" />
									<span className="text-xs uppercase tracking-wider">{cat.label}</span>
								</button>
							)
						})}
					</div>
					{selectedCategory === 'other' && (
						<div className="mt-4 pt-4 border-t border-border/60 animate-in fade-in duration-200">
							<label className="block text-xs font-semibold text-foreground/80 mb-2 uppercase tracking-wider">
								Specify Custom Device Category
							</label>
							<input
								type="text"
								placeholder="Enter your device type (e.g. Gaming Console, Camera, Drone, Audio Equipment)..."
								value={customCategory}
								onChange={(e) => setCustomCategory(e.target.value)}
								className={inputClass}
							/>
						</div>
					)}
				</div>

				{/* Step 2: Select Issues */}
				<div className="bg-card border border-border rounded-3xl p-7">
					<h2 className="text-sm font-bold uppercase tracking-[0.18em] text-card-foreground mb-4">2 · What Needs Repair?</h2>
					<p className="text-xs text-muted-foreground mb-6">Select all that apply to your device issue:</p>
					<div className="grid sm:grid-cols-2 gap-3">
						{REPAIR_ISSUES.map((issue) => {
							const isSelected = selectedIssues.includes(issue)
							return (
								<button
									key={issue}
									type="button"
									onClick={() => toggleIssue(issue)}
									className={`w-full text-left p-3.5 rounded-xl border text-xs font-medium transition-all cursor-pointer flex items-center justify-between ${isSelected
										? 'border-primary bg-primary/10 text-primary font-semibold'
										: 'border-border bg-background text-foreground/80 hover:bg-muted'
										}`}
								>
									<span>{issue}</span>
									<div className={`w-4 h-4 rounded-full border flex items-center justify-center ${isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
										{isSelected && <Check className="w-3 h-3" />}
									</div>
								</button>
							)
						})}
					</div>
					{selectedIssues.includes('Other / Custom Issue') && (
						<div className="mt-4 pt-4 border-t border-border/60 animate-in fade-in duration-200">
							<label className="block text-xs font-semibold text-foreground/80 mb-2 uppercase tracking-wider">
								Specify Custom Issue / Request Details
							</label>
							<input
								type="text"
								placeholder="Enter your custom repair request or issue details here..."
								value={customIssue}
								onChange={(e) => setCustomIssue(e.target.value)}
								className={inputClass}
							/>
						</div>
					)}
				</div>

				{/* Step 3: Device Model & Details */}
				<div className="bg-card border border-border rounded-3xl p-7">
					<h2 className="text-sm font-bold uppercase tracking-[0.18em] text-card-foreground mb-6">3 · Device Specification</h2>
					<div className="grid sm:grid-cols-2 gap-4">
						<input required placeholder="Brand (e.g. Apple, Samsung, Dell)" value={form.brand} onChange={set('brand')} className={inputClass} />
						<input required placeholder="Model (e.g. iPhone 15 Pro, S24 Ultra, MacBook M3)" value={form.model} onChange={set('model')} className={inputClass} />
						<input placeholder="Serial / IMEI (optional)" value={form.serialNumber} onChange={set('serialNumber')} className={`${inputClass} sm:col-span-2`} />
					</div>
					<textarea
						placeholder="Describe the issue in detail (e.g., screen flashes green, battery drains in 1 hour, touch non-responsive)..."
						value={form.description}
						onChange={set('description')}
						rows={3}
						className={`${inputClass} mt-4 resize-none`}
					/>
				</div>

				{/* Step 4: Device Photos */}
				<div className="bg-card border border-border rounded-3xl p-7">
					<h2 className="text-sm font-bold uppercase tracking-[0.18em] text-card-foreground mb-2">4 · Upload Device Damage Photos</h2>
					<p className="text-xs text-muted-foreground mb-6">
						Upload photos showing the damage or issue (up to 8 photos, 5MB max each).
					</p>
					<label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl py-8 cursor-pointer hover:border-primary hover:bg-secondary/50 transition-all">
						<Upload className="w-6 h-6 text-muted-foreground mb-2" />
						<span className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">
							Click to select photos
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
							Photos help technicians provide an accurate repair quote faster.
						</div>
					)}
				</div>

				{/* Step 5: Service Method & Contact */}
				<div className="bg-card border border-border rounded-3xl p-7">
					<h2 className="text-sm font-bold uppercase tracking-[0.18em] text-card-foreground mb-6">5 · Service Method & Contact</h2>
					<div className="grid sm:grid-cols-2 gap-3 mb-6">
						{SERVICE_METHODS.map((method) => (
							<button
								key={method.id}
								type="button"
								onClick={() => setServiceMethod(method.id as 'mail_in' | 'drop_off')}
								className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${serviceMethod === method.id
									? 'border-primary bg-primary/10'
									: 'border-border bg-background hover:bg-muted'
									}`}
							>
								<p className="text-xs font-bold uppercase tracking-wider text-foreground">{method.label}</p>
								<p className="text-[11px] text-muted-foreground mt-1 leading-relaxed">{method.desc}</p>
							</button>
						))}
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
					{submitting ? 'Submitting repair request...' : 'Submit Repair Request'}
				</button>
			</form>

			<Footer />
		</main>
	)
}
