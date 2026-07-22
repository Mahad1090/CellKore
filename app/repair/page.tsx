'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Wrench, Upload, Check, X, ImageIcon, Loader2, Smartphone, Laptop, Tablet, Watch, Copy, MapPin, Search } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { useToast } from '@/components/ui/toast'
import { PhoneInput } from '@/components/ui/phone-input'
import { CountrySelect } from '@/components/ui/country-select'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { fetchCmsPage, fetchRepairSettings, normalizeAddressNewlines } from '@/lib/data'
import { uploadRepairImages, MAX_UPLOAD_BYTES } from '@/lib/storage'
import { isValidPhone } from '@/lib/tax'
import { PHONE_COUNTRIES } from '@/lib/phone-countries'
import { formatRequestId } from '@/lib/sell-request-contact'

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
	{ id: 'mail_in', label: 'Ship to CellKore Office', desc: 'You arrange and pay for your own shipping to our repair center.' },
	{ id: 'drop_off', label: 'In-Person Store Drop-off', desc: 'Bring your device directly to our certified service hub.' },
] as const

export default function RepairPage() {
	const { toast } = useToast()
	const { user } = useAuth()
	const [submitting, setSubmitting] = useState(false)
	const [submitted, setSubmitted] = useState(false)
	const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null)
	const [successCopy, setSuccessCopy] = useState<{ title: string; content: string } | null>(null)
	const [mailInAddress, setMailInAddress] = useState<string | null>(null)
	const [addressCopied, setAddressCopied] = useState(false)
	const [files, setFiles] = useState<File[]>([])
	const [selectedCategory, setSelectedCategory] = useState<string>('iphone')
	const [customCategory, setCustomCategory] = useState('')
	const [selectedIssues, setSelectedIssues] = useState<string[]>(['Screen & Glass Replacement'])
	const [customIssue, setCustomIssue] = useState('')
	const [serviceMethod, setServiceMethod] = useState<'mail_in' | 'drop_off'>('mail_in')
	const [phoneCountry, setPhoneCountry] = useState(PHONE_COUNTRIES[0])
	const [shippingCountry, setShippingCountry] = useState('')
	const [agreedToTerms, setAgreedToTerms] = useState(false)
	const [form, setForm] = useState({
		brand: '',
		model: '',
		serialNumber: '',
		description: '',
		name: '',
		email: '',
		phone: '',
		addressLine1: '',
		addressLine2: '',
		city: '',
		stateProvince: '',
		postalCode: '',
	})

	useEffect(() => {
		fetchCmsPage('repair-success')
			.then((page) =>
				setSuccessCopy(
					page ? { title: page.title, content: page.content ?? '' } : null
				)
			)
			.catch(() => setSuccessCopy(null))
		fetchRepairSettings()
			.then((settings) => setMailInAddress(settings?.mail_in_address ? normalizeAddressNewlines(settings.mail_in_address) : null))
			.catch(() => setMailInAddress(null))
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

	const copyAddress = () => {
		if (!mailInAddress) return
		navigator.clipboard.writeText(mailInAddress)
		setAddressCopied(true)
		toast({ title: 'Address copied', variant: 'success' })
		setTimeout(() => setAddressCopied(false), 2000)
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
		if (!form.name.trim()) {
			toast({ title: 'Name required', description: 'Please provide your full name.', variant: 'error' })
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
		if (!form.addressLine1.trim() || !form.city.trim() || !shippingCountry) {
			toast({ title: 'Address required', description: 'Street address, city, and country are required so we know where to send your quote and shipment back.', variant: 'error' })
			return
		}
		if (!agreedToTerms) {
			toast({ title: 'Terms acceptance required', description: 'Please accept the Repair Service Terms & Conditions to continue.', variant: 'error' })
			return
		}

		setSubmitting(true)
		try {
			const formattedIssues = selectedIssues.map((i) =>
				i === 'Other / Custom Issue' && customIssue.trim() ? `Other: ${customIssue.trim()}` : i
			)

			const requestId = crypto.randomUUID()
			const uploaded = files.length > 0 ? await uploadRepairImages(requestId, files) : []

			const { error: insertError } = await supabase.from('repair_requests').insert({
				id: requestId,
				user_id: user?.id ?? null,
				device_category: selectedCategory,
				device_category_other: selectedCategory === 'other' ? customCategory.trim() || null : null,
				issues: formattedIssues,
				issue_other: selectedIssues.includes('Other / Custom Issue') ? customIssue.trim() || null : null,
				device_brand: form.brand.trim(),
				device_model: form.model.trim(),
				serial_number: form.serialNumber.trim() || null,
				description: form.description.trim() || null,
				service_method: serviceMethod,
				contact_name: form.name.trim(),
				contact_email: form.email.trim() || null,
				contact_phone: form.phone.trim() ? `${phoneCountry.dial} ${form.phone.trim()}` : null,
				contact_country_code: phoneCountry.dial,
				address_line1: form.addressLine1.trim(),
				address_line2: form.addressLine2.trim() || null,
				city: form.city.trim(),
				state_province: form.stateProvince.trim() || null,
				postal_code: form.postalCode.trim() || null,
				country: shippingCountry,
				terms_accepted: true,
				status: 'submitted',
			})

			if (insertError) {
				if (uploaded.length > 0) {
					await supabase.storage
						.from('repair-images')
						.remove(uploaded.map((u) => u.path))
						.catch(() => undefined)
				}
				throw insertError
			}

			if (uploaded.length > 0) {
				await supabase.from('repair_images').insert(
					uploaded.map((u) => ({ request_id: requestId, image_url: u.publicUrl }))
				)
			}

			setSubmittedRequestId(requestId)
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
					<p className="text-sm md:text-base text-foreground/75 leading-relaxed whitespace-pre-line mb-6">
						{successCopy?.content ??
							'Thank you for trusting CellKore! Our certified technicians are reviewing your device details and will send your official repair charges within 24 hours.'}
					</p>
					{!user && submittedRequestId && (
						<div className="mb-10 mx-auto max-w-md rounded-2xl border border-border bg-secondary/40 p-5">
							<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Your Request ID</p>
							<p className="text-xs font-mono font-bold text-card-foreground break-all">{formatRequestId(submittedRequestId)}</p>
							<p className="text-[11px] text-muted-foreground mt-2">
								Save this ID — since you submitted without an account, you&apos;ll need it (with your email or phone) to check your status later.
							</p>
						</div>
					)}
					<Link
						href={submittedRequestId ? `/repair/status?id=${encodeURIComponent(formatRequestId(submittedRequestId))}` : '/repair/status'}
						className="inline-block px-8 py-3.5 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-[0.18em] hover:opacity-90 transition-all"
					>
						Track My Request
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

			<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
				<div className="bg-card border border-border rounded-2xl p-2 grid grid-cols-2 gap-2">
					{[
						{ href: '/repair', label: 'New Request' },
						{ href: '/repair/status', label: 'Track & Pay' },
					].map((tab) => (
						<Link
							key={tab.href}
							href={tab.href}
							className={`text-center px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.14em] transition-all ${
								tab.href === '/repair' ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-muted'
							}`}
						>
							{tab.label}
						</Link>
					))}
				</div>
			</div>

			{/* Hero Banner Section */}
			<section className="relative text-white w-full min-h-[420px] md:min-h-[480px] py-16 md:py-24 overflow-hidden flex items-center justify-center text-center">
				<video
					autoPlay
					loop
					muted
					playsInline
					preload="auto"
					src="/repair_banner.mp4"
					className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none z-0"
				/>
				<div className="absolute inset-0 bg-black/60 z-10" />
				<div className="relative z-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
					<p className="text-xs md:text-sm uppercase tracking-[0.25em] text-white/80 mb-3 font-medium">Repair Portal</p>
					<h1 className="text-3xl md:text-5xl font-bold tracking-luxury uppercase text-white drop-shadow-md">Device Repair & Restoration</h1>
					<p className="text-white/90 mt-4 text-xs md:text-sm font-light max-w-xl mx-auto leading-relaxed drop-shadow-sm">
						Professional screen, battery, component, and chip-level repairs for smartphones, tablets, laptops, and smartwatches.
					</p>
				</div>
			</section>

			<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4 text-center">
				<Link
					href="/repair/status"
					className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground hover:text-primary underline underline-offset-4 transition-colors"
				>
					<Search className="w-4 h-4 text-primary" />
					Already submitted a request? Track it here
				</Link>
			</div>

			{/* Repair Booking Form */}
			<form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-10">
				{/* Step 1: Device Category */}
				<div className="bg-card border border-border rounded-3xl p-7">
					<div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
						<span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-xs flex items-center justify-center border border-amber-500/30 shadow-sm">1</span>
						<div>
							<p className="text-[9px] uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400 font-bold">Step 01</p>
							<h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-foreground bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
								Select Device Category
							</h2>
						</div>
					</div>
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
					<div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/60">
						<span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-xs flex items-center justify-center border border-amber-500/30 shadow-sm">2</span>
						<div>
							<p className="text-[9px] uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400 font-bold">Step 02</p>
							<h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-foreground bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
								What Needs Repair?
							</h2>
						</div>
					</div>
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
					<div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
						<span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-xs flex items-center justify-center border border-amber-500/30 shadow-sm">3</span>
						<div>
							<p className="text-[9px] uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400 font-bold">Step 03</p>
							<h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-foreground bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
								Device Specification
							</h2>
						</div>
					</div>
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
					<div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/60">
						<span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-xs flex items-center justify-center border border-amber-500/30 shadow-sm">4</span>
						<div>
							<p className="text-[9px] uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400 font-bold">Step 04</p>
							<h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-foreground bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
								Upload Damage Photos
							</h2>
						</div>
					</div>
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
					<div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
						<span className="w-8 h-8 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-xs flex items-center justify-center border border-amber-500/30 shadow-sm">5</span>
						<div>
							<p className="text-[9px] uppercase tracking-[0.25em] text-amber-600 dark:text-amber-400 font-bold">Step 05</p>
							<h2 className="text-sm font-extrabold uppercase tracking-[0.18em] text-foreground bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
								Service Method & Contact
							</h2>
						</div>
					</div>
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

					{serviceMethod === 'mail_in' && (
						<div className="mb-6 p-4 rounded-2xl border border-primary/30 bg-primary/5 flex items-start gap-3">
							<MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
							<div className="flex-1">
								<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-foreground mb-1.5">Ship your device to:</p>
								<p className="text-xs text-foreground/85 whitespace-pre-line leading-relaxed font-mono">
									{mailInAddress || 'Loading address...'}
								</p>
								<p className="text-[11px] text-muted-foreground mt-2">
									You are responsible for arranging and paying for shipping to this address. Please include your Request ID (shown after submission) in the package.
								</p>
							</div>
							{mailInAddress && (
								<button
									type="button"
									onClick={copyAddress}
									className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all cursor-pointer shrink-0"
									aria-label="Copy address"
								>
									{addressCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
								</button>
							)}
						</div>
					)}

					<div className="grid sm:grid-cols-2 gap-4 mb-4">
						<input required placeholder="Full name" value={form.name} onChange={set('name')} className={inputClass} />
						<input type="email" placeholder="Email address" value={form.email} onChange={set('email')} className={inputClass} />
						<PhoneInput
							country={phoneCountry}
							onCountryChange={setPhoneCountry}
							value={form.phone}
							onChange={(value) => setForm((f) => ({ ...f, phone: value }))}
							className="sm:col-span-2"
						/>
					</div>

					<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-3">
						Your Address (for the repair quote & return shipment)
					</p>
					<div className="grid sm:grid-cols-2 gap-4">
						<input required placeholder="Street address" value={form.addressLine1} onChange={set('addressLine1')} className={`${inputClass} sm:col-span-2`} />
						<input placeholder="Apt / suite (optional)" value={form.addressLine2} onChange={set('addressLine2')} className={`${inputClass} sm:col-span-2`} />
						<input required placeholder="City" value={form.city} onChange={set('city')} className={inputClass} />
						<input placeholder="State / Province" value={form.stateProvince} onChange={set('stateProvince')} className={inputClass} />
						<input placeholder="Postal code" value={form.postalCode} onChange={set('postalCode')} className={inputClass} />
						<CountrySelect value={shippingCountry} onChange={setShippingCountry} className={inputClass} />
					</div>

					<label className="flex items-start gap-3 mt-6 bg-background border border-border rounded-2xl p-5 cursor-pointer">
						<input
							type="checkbox"
							checked={agreedToTerms}
							onChange={(e) => setAgreedToTerms(e.target.checked)}
							className="mt-0.5 w-4 h-4 accent-[var(--primary)] cursor-pointer shrink-0"
						/>
						<span className="text-xs text-foreground/80 leading-relaxed">
							I confirm the device details above are accurate and I agree to CellKore&apos;s{' '}
							<Link href="/terms" target="_blank" className="text-primary font-semibold hover:underline">
								Repair Service Terms & Conditions
							</Link>
							, including that repair charges are subject to in-person inspection and final pricing may adjust based on the device&apos;s actual condition.
						</span>
					</label>
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
