'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Upload, Check, X, ImageIcon, Loader2, MessageCircle, Search, Plus, HardDrive, Smartphone, ChevronLeft, ChevronRight } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { useToast } from '@/components/ui/toast'
import { PhoneInput } from '@/components/ui/phone-input'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { fetchCmsPage, fetchSellDeviceModels, fetchSellProblemOptions } from '@/lib/data'
import { uploadSellPhoneImages, MAX_UPLOAD_BYTES } from '@/lib/storage'
import { isValidPhone } from '@/lib/tax'
import { PHONE_COUNTRIES } from '@/lib/phone-countries'
import { formatRequestId } from '@/lib/sell-request-contact'
import { useHorizontalScrollHint } from '@/lib/use-horizontal-scroll-hint'
import type { SellDeviceModel, SellProblemOption } from '@/lib/types'

const CONDITIONS = [
	{ value: 'excellent', label: 'Excellent (Like New)' },
	{ value: 'good', label: 'Good (Minor Wear)' },
	{ value: 'fair', label: 'Fair (Visible Wear)' },
	{ value: 'poor', label: 'Poor (Heavy Wear / Damage)' },
] as const

// Fallback storage list for devices with no admin-defined model row to pull
// per-model options from — the "Other" device type, and any named type's
// "Other Model" custom-entry path. Everything else uses the selected model's
// own admin-managed storage_options.
const DEFAULT_STORAGE_OPTIONS = ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB']

// Fixed "None" sentinel for the problems picker — clears every other
// selection when chosen, so it's kept as frontend-only, never admin-managed.
const NONE_PROBLEM = { id: 'none', title: 'None', description: 'Device works just like new!', severity: 'excellent' as const }

const CONDITION_RANK: Record<typeof CONDITIONS[number]['value'], number> = { excellent: 0, good: 1, fair: 2, poor: 3 }

export default function SellYourPhonePage() {
	const { toast } = useToast()
	const { user } = useAuth()
	const [submitting, setSubmitting] = useState(false)
	const [submitted, setSubmitted] = useState(false)
	const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null)
	const [successCopy, setSuccessCopy] = useState<{ title: string; content: string } | null>(null)
	const [supportWhatsapp, setSupportWhatsapp] = useState<string | null>(null)
	const [files, setFiles] = useState<File[]>([])
	const [phoneCountry, setPhoneCountry] = useState(PHONE_COUNTRIES[0])
	const [agreedToPolicy, setAgreedToPolicy] = useState(false)
	const [form, setForm] = useState({
		brand: '',
		model: '',
		storage: '',
		condition: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
		damages: '',
		comments: '',
		name: '',
		email: '',
		phone: '',
	})
	const [selectedDeviceType, setSelectedDeviceType] = useState<string | null>(null)
	const [selectedModel, setSelectedModel] = useState<string | null>(null)
	const [isModelConfirmed, setIsModelConfirmed] = useState(false)
	const [customBrand, setCustomBrand] = useState('')
	const [customModel, setCustomModel] = useState('')
	const [selectedStorage, setSelectedStorage] = useState<string | null>(null)
	const [selectedProblems, setSelectedProblems] = useState<string[]>([])
	const [sellModels, setSellModels] = useState<SellDeviceModel[] | null>(null)
	const [problemOptions, setProblemOptions] = useState<SellProblemOption[] | null>(null)
	const deviceTypeScroll = useHorizontalScrollHint<HTMLDivElement>([])

	// Admin-managed models + problem list, fetched once on mount.
	useEffect(() => {
		fetchSellDeviceModels()
			.then(setSellModels)
			.catch((err) => {
				console.error('fetchSellDeviceModels failed:', err)
				setSellModels([])
			})
		fetchSellProblemOptions()
			.then(setProblemOptions)
			.catch((err) => {
				console.error('fetchSellProblemOptions failed:', err)
				setProblemOptions([])
			})
	}, [])

	const allProblems = [NONE_PROBLEM, ...(problemOptions ?? [])]

	// Once the model is confirmed the picker collapses to a summary — nudge the
	// customer down to the details they still need to fill in.
	useEffect(() => {
		if (!isModelConfirmed) return
		const t = setTimeout(() => {
			document.getElementById('device-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
		}, 80)
		return () => clearTimeout(t)
	}, [isModelConfirmed])

	const selectStorage = (value: string) => {
		setSelectedStorage(value)
		setForm((f) => ({ ...f, storage: value }))
	}

	const toggleProblem = (id: string) => {
		setSelectedProblems((prev) => {
			if (id === 'none') return prev.includes('none') ? [] : ['none']
			const withoutNone = prev.filter((p) => p !== 'none')
			return withoutNone.includes(id) ? withoutNone.filter((p) => p !== id) : [...withoutNone, id]
		})
	}

	// Derive form.condition from the problem picker alone (the separate
	// cosmetic star-rating step was removed — condition now comes purely from
	// whichever selected problem implies the worst severity).
	useEffect(() => {
		if (selectedProblems.length === 0) return
		const chosenProblems = allProblems.filter((p) => selectedProblems.includes(p.id))
		const worst = chosenProblems.reduce<typeof CONDITIONS[number]['value']>(
			(acc, p) => (CONDITION_RANK[p.severity] > CONDITION_RANK[acc] ? p.severity : acc),
			'excellent'
		)
		const damageText = selectedProblems.includes('none') ? '' : chosenProblems.map((p) => p.title).join(', ')
		setForm((f) => ({ ...f, condition: worst, damages: damageText }))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [selectedProblems, problemOptions])

	const DEVICE_TYPES = [
		{ id: 'iphone', label: 'Apple iPhone', brand: 'Apple', image: '/iphone_category.webp' },
		{ id: 'galaxy', label: 'Galaxy', brand: 'Samsung', image: '/samsung_category.webp' },
		{ id: 'ipad', label: 'Apple iPad', brand: 'Apple', image: '/ipad_category.webp' },
		{ id: 'laptop', label: 'Laptop', brand: '', image: '/laptop_category.webp' },
		{ id: 'tablet', label: 'Tablet', brand: '', image: '/tablets_category.webp' },
		{ id: 'other', label: 'Other', brand: '', image: '/other_devices_category.webp' },
	]

	const selectedDeviceTypeData = DEVICE_TYPES.find((d) => d.id === selectedDeviceType)
	const modelsForSelectedType = (sellModels ?? []).filter((m) => m.device_type === selectedDeviceType)
	const selectedModelData = modelsForSelectedType.find((m) => m.label === selectedModel)
	const storageChoices = selectedModelData?.storage_options?.length ? selectedModelData.storage_options : DEFAULT_STORAGE_OPTIONS

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

		supabase
			.from('country_contact_info')
			.select('whatsapp_number')
			.not('whatsapp_number', 'is', null)
			.limit(1)
			.maybeSingle()
			.then(
				({ data }) => setSupportWhatsapp(data?.whatsapp_number ?? null),
				() => setSupportWhatsapp(null)
			)
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
		if (!agreedToPolicy) {
			toast({ title: 'Policy acceptance required', description: 'Please accept the Sell Your Device policy to continue.', variant: 'error' })
			return
		}

		setSubmitting(true)
		try {
			const description = [
				form.storage && `Storage: ${form.storage}`,
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
				contact_phone: form.phone.trim() ? `${phoneCountry.dial} ${form.phone.trim()}` : null,
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

			fetch('/api/sell-requests/notify-new', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: requestId }),
			}).catch(() => undefined)

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
						{successCopy?.title ?? 'Quote Request Received'}
					</h1>
					<p className="text-sm md:text-base text-foreground/75 leading-relaxed whitespace-pre-line mb-6">
						{successCopy?.content ??
							'Thank you for your submission. A CellKore support agent will contact you within 24 hours with an official quote.'}
					</p>
					<p className="text-xs text-muted-foreground mb-2 uppercase tracking-[0.14em] font-semibold">
						Initial request status: Under Review
					</p>
					<p className="text-xs text-muted-foreground mb-6 max-w-lg mx-auto leading-relaxed">
						Next: we&apos;ll review your submission and send you an offer. You can accept or decline it — if you accept, we&apos;ll ask you to send us your device, and process your payment once it&apos;s inspected.
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
					<div className="flex flex-wrap items-center justify-center gap-3">
						<Link
							href={user ? '/account?tab=sell' : `/sell/track${submittedRequestId ? `?id=${encodeURIComponent(formatRequestId(submittedRequestId))}` : ''}`}
							className="inline-block px-8 py-3.5 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-[0.18em] hover:opacity-90 transition-all"
						>
							Track My Request
						</Link>
						{supportWhatsapp && (
							<a
								href={`https://wa.me/${supportWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I just submitted a Sell Your Device request and need help.')}`}
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center gap-2 px-8 py-3.5 border border-border rounded-full text-xs font-bold uppercase tracking-[0.18em] text-foreground/80 hover:border-primary hover:text-primary transition-all"
							>
								<MessageCircle className="w-4 h-4" />
								WhatsApp Support
							</a>
						)}
					</div>
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

			<section className="relative text-white w-full min-h-[580px] md:min-h-[700px] py-24 md:py-36 overflow-hidden flex items-center justify-center text-center">
				<video
					key="sell-ur-phone-new"
					autoPlay
					loop
					muted
					playsInline
					preload="auto"
					src="/sell_ur_phone_banner.mp4?v=5"
					className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none z-0"
				/>
				<div className="absolute inset-0 bg-black/55 z-10" />
				<div className="relative z-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
					<h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-md leading-tight mb-3 uppercase">
						Sell your device for extra cash!
					</h1>
					<p className="text-white/80 text-sm md:text-base font-light max-w-xl mx-auto leading-relaxed drop-shadow-sm mb-7">
						We&apos;ll pay you more money than any other trade-in offer.
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
						<a
							href="#sell-form"
							className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#599161] hover:bg-[#46754e] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:scale-[1.02] active:scale-95 w-full sm:w-auto"
						>
							Sell your device now
						</a>
					</div>
				</div>
			</section>

			{supportWhatsapp && (
				<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-30">
					<a
						href={`https://wa.me/${supportWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent("Hi, I'd like to sell my phone. Here are my device details and photos:")}`}
						target="_blank"
						rel="noreferrer"
						className="flex items-center justify-between gap-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl px-6 py-5 shadow-lg transition-all"
					>
						<div className="flex items-center gap-3.5">
							<div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
								<MessageCircle className="w-5 h-5" />
							</div>
							<div>
								<p className="text-xs font-bold uppercase tracking-[0.16em]">Prefer to chat instead?</p>
								<p className="text-[11px] text-white/85 mt-0.5">Sell via WhatsApp — send your device details and pictures directly to our team.</p>
							</div>
						</div>
						<span className="text-xs font-bold uppercase tracking-[0.14em] whitespace-nowrap">Chat Now →</span>
					</a>
				</div>
			)}

			<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4 text-center">
				<Link
					href="/sell/track"
					className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground hover:text-primary underline underline-offset-4 transition-colors"
				>
					<Search className="w-4 h-4 text-primary" />
					Already submitted a request? Track it here
				</Link>
			</div>

			<form id="sell-form" onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-10">

				{/* Step 00: WHAT TYPE OF DEVICE DO YOU HAVE? */}
				{!isModelConfirmed && (
				<div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
					<div className="mb-6">
						<h2 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-black font-sans">What type of device do you have?</h2>
					</div>
					<div className="relative">
					<div
						ref={deviceTypeScroll.ref}
						onScroll={deviceTypeScroll.onScroll}
						className="device-type-scroll flex items-center gap-4 overflow-x-auto px-2 pt-2 pb-4 no-scrollbar cursor-grab active:cursor-grabbing"
					>
						{DEVICE_TYPES.map((dt) => {
							const isActive = selectedDeviceType === dt.id;
							return (
								<button
									type="button"
									key={dt.id}
									onClick={() => {
										setSelectedDeviceType(dt.id)
										setSelectedModel(null)
										setIsModelConfirmed(false)
										setCustomBrand(dt.brand)
										setCustomModel('')
										setSelectedStorage(null)
										setSelectedProblems([])
										setForm(f => ({ ...f, brand: dt.brand, model: '', storage: '', condition: 'good', damages: '' }))
									}}
									className={`relative group rounded-2xl border bg-card w-[140px] sm:w-[170px] h-[190px] flex-shrink-0 shadow-sm transition-all duration-300 cursor-pointer overflow-hidden ${
										isActive
											? 'border-[#599161] ring-2 ring-[#599161]/20 scale-[1.02] shadow-lg'
											: 'border-border/80 hover:border-[#599161] hover:shadow-xl hover:-translate-y-1.5'
									}`}
								>
									<img
										src={dt.image}
										alt={dt.label}
										className={`w-full h-full object-cover transition-transform duration-500 ${
											dt.id === 'tablet' ? 'object-[center_30%]' : 'object-top'
										} ${
											dt.id === 'ipad'
												? 'scale-110 group-hover:scale-[1.15]'
												: dt.id === 'tablet'
												? 'scale-105 group-hover:scale-[1.10]'
												: 'scale-100 group-hover:scale-[1.05]'
										}`}
									/>
									{isActive && (
										<div className="absolute top-[-1px] right-[-1px] w-8 h-8 bg-[#599161] [clip-path:polygon(100%_0,0_0,100%_100%)] rounded-tr-[15px] pointer-events-none z-20">
											<Check className="absolute top-1 right-1 w-2.5 h-2.5 text-white" />
										</div>
									)}
								</button>
							)
						})}
					</div>

					{/* Right-edge fade — hints the row is swipeable */}
					<div
						className={`pointer-events-none absolute top-2 right-0 bottom-4 w-14 sm:w-20 bg-gradient-to-l from-card to-transparent transition-opacity duration-300 ${
							deviceTypeScroll.atEnd ? 'opacity-0' : 'opacity-100'
						}`}
					/>

					{/* Simple elegant scroll arrows (desktop) */}
					<button
						type="button"
						aria-label="Scroll device types left"
						onClick={() => deviceTypeScroll.scrollBy(-1)}
						className={`hidden sm:flex items-center justify-center absolute top-1/2 -translate-y-1/2 -left-4 w-9 h-9 rounded-full bg-card border border-border/80 shadow-md text-foreground/70 hover:text-primary hover:border-primary transition-all duration-300 ${
							deviceTypeScroll.atStart ? 'opacity-0 pointer-events-none' : 'opacity-100'
						}`}
					>
						<ChevronLeft className="w-4 h-4" />
					</button>
					<button
						type="button"
						aria-label="Scroll device types right"
						onClick={() => deviceTypeScroll.scrollBy(1)}
						className={`hidden sm:flex items-center justify-center absolute top-1/2 -translate-y-1/2 -right-4 w-9 h-9 rounded-full bg-card border border-border/80 shadow-md text-foreground/70 hover:text-primary hover:border-primary transition-all duration-300 ${
							deviceTypeScroll.atEnd ? 'opacity-0 pointer-events-none' : 'opacity-100'
						}`}
					>
						<ChevronRight className="w-4 h-4" />
					</button>
					</div>
					<div className="mx-auto -mt-2 h-1 w-24 rounded-full bg-border/50 overflow-hidden sm:hidden">
						<div
							className="h-full rounded-full bg-primary transition-[left,width] duration-150 ease-out relative"
							style={{ width: `${deviceTypeScroll.thumb.widthPct}%`, left: `${deviceTypeScroll.thumb.leftPct}%` }}
						/>
					</div>
				</div>
				)}

				{/* Collapsed summary — shown once a model is confirmed so the customer
				    sees a compact selection and knows the form continues below */}
				{isModelConfirmed && selectedDeviceTypeData && (
					<div className="bg-card border border-[#599161]/40 rounded-3xl px-6 py-5 shadow-sm flex items-center gap-4">
						<div className="w-11 h-11 rounded-xl bg-[#599161]/10 flex items-center justify-center shrink-0">
							<Check className="w-5 h-5 text-[#599161]" />
						</div>
						<div className="min-w-0 flex-1">
							<p className="text-[9.5px] uppercase tracking-[0.22em] text-[#599161] font-black">Selling</p>
							<p className="text-sm font-extrabold uppercase tracking-wide text-black truncate">
								{form.brand ? `${form.brand} ` : ''}{form.model}
							</p>
							<p className="text-[11px] text-muted-foreground mt-0.5">Complete the details below to get your quote ↓</p>
						</div>
						<button
							type="button"
							onClick={() => setIsModelConfirmed(false)}
							className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground hover:text-[#599161] underline underline-offset-4 shrink-0 cursor-pointer"
						>
							Change
						</button>
					</div>
				)}

				{/* Step 00b: PLEASE SELECT YOUR DEVICE'S MODEL */}
				{selectedDeviceType && selectedDeviceType !== 'other' && !isModelConfirmed && (
					<div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
						<div className="mb-6">
							<h2 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-black font-sans">Please select your device&apos;s model</h2>
						</div>
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
							{modelsForSelectedType.map((m) => {
								const isActive = selectedModel === m.label;
								return (
									<button
										type="button"
										key={m.id}
										onClick={() => {
											setSelectedModel(m.label)
											setForm(f => ({ ...f, model: m.label }))
											setIsModelConfirmed(true)
										}}
										className={`relative group flex flex-col items-center rounded-2xl border bg-card p-1.5 transition-all duration-200 cursor-pointer overflow-visible ${
											isActive
												? 'border-[#599161] ring-2 ring-[#599161]/10 scale-[1.02] shadow-sm'
												: 'border-zinc-200/80 hover:border-[#599161]/50'
										}`}
									>
										<div className="w-full aspect-square overflow-hidden bg-white flex items-center justify-center p-0.5 rounded-xl">
											{m.image_url ? (
												<img
													src={m.image_url}
													alt={m.label}
													className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
												/>
											) : (
												<Smartphone className="w-8 h-8 text-muted-foreground/30" />
											)}
										</div>
										<div className="w-full pt-3 pb-1 text-center border-t border-zinc-100 mt-2">
											<span className={`text-[10px] font-black uppercase tracking-wider block leading-snug line-clamp-2 px-0.5 ${
												isActive ? 'text-[#599161]' : 'text-black'
											}`}>{m.label}</span>
										</div>
										{isActive && (
											<div className="absolute top-[-1px] right-[-1px] w-8 h-8 bg-[#599161] [clip-path:polygon(100%_0,0_0,100%_100%)] rounded-tr-[15px] pointer-events-none z-20">
												<Check className="absolute top-1 right-1 w-2.5 h-2.5 text-white" />
											</div>
										)}
									</button>
								)
							})}
							{/* Other Model option */}
							<button
								type="button"
								onClick={() => {
									setSelectedModel('custom')
									setIsModelConfirmed(false)
								}}
								className={`relative group flex flex-col items-center rounded-2xl border bg-card p-1.5 transition-all duration-200 cursor-pointer overflow-visible ${
									selectedModel === 'custom'
										? 'border-[#599161] ring-2 ring-[#599161]/10 scale-[1.02] shadow-sm'
										: 'border-zinc-200/80 hover:border-[#599161]/50'
								}`}
							>
								<div className="w-full aspect-square overflow-hidden bg-white flex items-center justify-center p-2 rounded-xl text-muted-foreground/35 group-hover:text-[#599161] transition-colors">
									<Plus className="w-8 h-8" />
								</div>
								<div className="w-full pt-3 pb-1 text-center border-t border-zinc-100 mt-2">
									<span className={`text-[10px] font-black uppercase tracking-wider ${
										selectedModel === 'custom' ? 'text-[#599161]' : 'text-black'
									}`}>Other Model</span>
								</div>
								{selectedModel === 'custom' && (
									<div className="absolute top-[-1px] right-[-1px] w-8 h-8 bg-[#599161] [clip-path:polygon(100%_0,0_0,100%_100%)] rounded-tr-[15px] pointer-events-none z-20">
										<Check className="absolute top-1 right-1 w-2.5 h-2.5 text-white" />
									</div>
								)}
							</button>
						</div>

						{/* Custom Model input (inside standard type) */}
						{selectedModel === 'custom' && !isModelConfirmed && (
							<div className="mt-6 max-w-sm mx-auto p-5 bg-muted/20 border border-border rounded-2xl space-y-3">
								<label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Enter Model Name</label>
								<input
									type="text"
									placeholder="e.g. iPhone SE 2020"
									value={customModel}
									onChange={(e) => setCustomModel(e.target.value)}
									className={inputClass}
								/>
								<button
									type="button"
									onClick={() => {
										if (!customModel.trim()) return;
										setForm(f => ({ ...f, model: customModel }))
										setIsModelConfirmed(true)
									}}
									className="w-full py-3 bg-[#4a8f9d] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer"
								>
									Confirm Model
								</button>
							</div>
						)}
					</div>
				)}

				{/* Step 00b: PLEASE SELECT YOUR DEVICE'S MODEL (Other Brand option) */}
				{selectedDeviceType === 'other' && !isModelConfirmed && (
					<div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
						<div className="mb-6">
							<h2 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-black font-sans">Please select your device&apos;s model</h2>
						</div>
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-center">
							<button
								type="button"
								onClick={() => {
									setSelectedModel('custom')
									setIsModelConfirmed(false)
								}}
								className={`relative group flex flex-col items-center rounded-2xl border bg-card p-1.5 transition-all duration-200 cursor-pointer overflow-visible ${
									selectedModel === 'custom'
										? 'border-[#599161] ring-2 ring-[#599161]/10 scale-[1.02] shadow-sm'
										: 'border-zinc-200/80 hover:border-[#599161]/50'
								}`}
							>
								<div className="w-full aspect-square overflow-hidden bg-white flex items-center justify-center p-2 rounded-xl text-muted-foreground/35 group-hover:text-[#599161] transition-colors">
									<Search className="w-8 h-8" />
								</div>
								<div className="w-full pt-3 pb-1 text-center border-t border-zinc-100 mt-2">
									<span className={`text-[10px] font-black uppercase tracking-wider ${
										selectedModel === 'custom' ? 'text-[#599161]' : 'text-black'
									}`}>Choose your model</span>
								</div>
								{selectedModel === 'custom' && (
									<div className="absolute top-[-1px] right-[-1px] w-8 h-8 bg-[#599161] [clip-path:polygon(100%_0,0_0,100%_100%)] rounded-tr-[15px] pointer-events-none z-20">
										<Check className="absolute top-1 right-1 w-2.5 h-2.5 text-white" />
									</div>
								)}
							</button>
						</div>

						{/* Custom Model input (inside custom device brand) */}
						{selectedModel === 'custom' && !isModelConfirmed && (
							<div className="mt-6 max-w-md mx-auto p-5 bg-muted/20 border border-border rounded-2xl space-y-3">
								<div>
									<label className="text-[10px] font-bold uppercase tracking-wider text-black block mb-1">Brand</label>
									<input
										type="text"
										placeholder="e.g. Motorola, Google, OnePlus"
										value={customBrand}
										onChange={(e) => setCustomBrand(e.target.value)}
										className={inputClass}
									/>
								</div>
								<div>
									<label className="text-[10px] font-bold uppercase tracking-wider text-black block mb-1">Model Name</label>
									<input
										type="text"
										placeholder="e.g. Edge 40, OnePlus 11"
										value={customModel}
										onChange={(e) => setCustomModel(e.target.value)}
										className={inputClass}
									/>
								</div>
								<button
									type="button"
									onClick={() => {
										if (!customModel.trim()) return;
										setForm(f => ({ ...f, brand: customBrand || 'Other', model: customModel }))
										setIsModelConfirmed(true)
									}}
									className="w-full py-3 bg-[#599161] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer"
								>
									Confirm Details
								</button>
							</div>
						)}
					</div>
				)}

				{/* Show the remaining steps ONLY after the model is confirmed */}
				{isModelConfirmed && (
					<>
						{/* Device Details Form */}
						<div id="device-details" className="scroll-mt-24 bg-card border border-border rounded-3xl p-7">
							<div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
								<span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center border border-emerald-500/30 shadow-sm">1</span>
								<div>
									<p className="text-[9.5px] uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400 font-black">Step 01</p>
									<h2 className="text-lg font-extrabold uppercase tracking-wide text-black">
										Device Details
									</h2>
								</div>
							</div>
							<div className="grid sm:grid-cols-2 gap-4">
								<input required placeholder="Brand (e.g. Apple)" value={form.brand} onChange={set('brand')} className={inputClass} />
								<input required placeholder="Model (e.g. iPhone 15 Pro)" value={form.model} onChange={set('model')} className={inputClass} />
							</div>

							{/* Storage capacity cards */}
							<div className="mt-6">
								<h3 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-black font-sans mb-4">Please select the storage capacity of your device</h3>
								<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
									{storageChoices.map((opt) => (
										<button
											type="button"
											key={opt}
											onClick={() => selectStorage(opt)}
											className={`relative group flex flex-col items-center rounded-2xl border bg-card p-1.5 transition-all duration-200 cursor-pointer overflow-visible ${
												selectedStorage === opt
													? 'border-[#599161] ring-2 ring-[#599161]/10 scale-[1.02] shadow-sm'
													: 'border-zinc-200/80 hover:border-[#599161]/50'
											}`}
										>
											<div className="w-full aspect-[2/1] rounded-xl flex items-center justify-center bg-[#eaf2ed]">
												<HardDrive className={`w-6 h-6 ${selectedStorage === opt ? 'text-[#599161]' : 'text-[#599161]/45'}`} />
											</div>
											<div className="w-full pt-3 pb-2 text-center border-t border-zinc-100 mt-2">
												<span className={`text-xs font-black uppercase tracking-wider ${
													selectedStorage === opt ? 'text-[#599161]' : 'text-black'
												}`}>{opt}</span>
											</div>
											{selectedStorage === opt && (
												<div className="absolute top-[-1px] right-[-1px] w-7 h-7 bg-[#599161] [clip-path:polygon(100%_0,0_0,100%_100%)] rounded-tr-[15px] pointer-events-none z-20">
													<Check className="absolute top-1 right-1 w-2.5 h-2.5 text-white" />
												</div>
											)}
										</button>
									))}
								</div>
							</div>

							{/* Problems / condition picker — only once storage is picked */}
							{selectedStorage && (
							<div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
								<h3 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-black font-sans mb-4">Are there any problems with your device?</h3>
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
									{allProblems.map((p) => {
										const isActive = selectedProblems.includes(p.id)
										return (
											<button
												type="button"
												key={p.id}
												onClick={() => toggleProblem(p.id)}
												className={`relative flex flex-col items-center justify-center text-center rounded-2xl border p-4 min-h-[104px] transition-all duration-200 cursor-pointer ${
													isActive
														? 'border-[#599161] ring-2 ring-[#599161]/10 bg-[#599161]/5'
														: 'border-zinc-200/80 hover:border-[#599161]/50 bg-card'
												}`}
											>
												<span className={`text-xs font-black uppercase tracking-wide mb-1.5 ${isActive ? 'text-[#599161]' : 'text-black'}`}>{p.title}</span>
												<span className="text-[11px] text-muted-foreground leading-snug">{p.description}</span>
												{isActive && (
													<div className="absolute top-[-1px] right-[-1px] w-7 h-7 bg-[#599161] [clip-path:polygon(100%_0,0_0,100%_100%)] rounded-tr-[15px] pointer-events-none">
														<Check className="absolute top-1 right-1 w-2.5 h-2.5 text-white" />
													</div>
												)}
											</button>
										)
									})}
								</div>
							</div>
							)}

							{selectedProblems.length > 0 && (
							<textarea
								placeholder="Additional comments"
								value={form.comments}
								onChange={set('comments')}
								rows={2}
								className={`${inputClass} mt-6 resize-none animate-in fade-in slide-in-from-top-2 duration-300`}
							/>
							)}
						</div>

						{selectedProblems.length > 0 && (
						<>
						{/* Photos */}
						<div className="bg-card border border-border rounded-3xl p-7">
							<div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/60">
								<span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center border border-emerald-500/30 shadow-sm">2</span>
								<div>
									<p className="text-[9.5px] uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400 font-black">Step 02</p>
									<h2 className="text-lg font-extrabold uppercase tracking-wide text-black">
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
									Add at least one photo to continue to your contact details.
								</div>
							)}
						</div>

						{files.length > 0 && (
						<>
						{/* Contact */}
						<div className="bg-card border border-border rounded-3xl p-7 animate-in fade-in slide-in-from-top-2 duration-300">
							<div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
								<span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center border border-emerald-500/30 shadow-sm">3</span>
								<div>
									<p className="text-[9.5px] uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400 font-black">Step 03</p>
									<h2 className="text-lg font-extrabold uppercase tracking-wide text-black">
										Contact Information
									</h2>
								</div>
							</div>
							<div className="grid sm:grid-cols-2 gap-4">
								<input placeholder="Full name" value={form.name} onChange={set('name')} className={inputClass} />
								<input type="email" placeholder="Email address" value={form.email} onChange={set('email')} className={inputClass} />
								<PhoneInput
									country={phoneCountry}
									onCountryChange={setPhoneCountry}
									value={form.phone}
									onChange={(value) => setForm((f) => ({ ...f, phone: value }))}
									className="sm:col-span-2"
								/>
							</div>
						</div>

						<label className="flex items-start gap-3 bg-card border border-border rounded-3xl p-6 cursor-pointer">
							<input
								type="checkbox"
								checked={agreedToPolicy}
								onChange={(e) => setAgreedToPolicy(e.target.checked)}
								className="mt-0.5 w-4 h-4 accent-[var(--primary)] cursor-pointer shrink-0"
							/>
							<span className="text-xs text-foreground/80 leading-relaxed">
								I confirm the device details above are accurate and I agree to CellKore&apos;s{' '}
								<Link href="/terms" target="_blank" className="text-primary font-semibold hover:underline">
									Sell Your Device policy and Terms of Service
								</Link>
								, including that quotes are subject to in-person inspection and final pricing may adjust based on the device&apos;s actual condition.
							</span>
						</label>

						<button
							type="submit"
							disabled={submitting || !agreedToPolicy}
							className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:opacity-90 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
						>
							{submitting && <Loader2 className="w-4 h-4 animate-spin" />}
							{submitting ? 'Submitting your request...' : 'Request My Quote'}
						</button>
						</>
						)}
						</>
						)}
					</>
				)}
			</form>

			<Footer />
		</main>
	)
}
