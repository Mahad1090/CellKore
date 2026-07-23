'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
	Save,
	Loader2,
	Eye,
	ExternalLink,
	Plus,
	Trash2,
	Lock,
	FileText,
	RotateCcw,
	Truck,
	ShieldAlert,
	HelpCircle,
	Info,
	CheckCircle2,
} from 'lucide-react'
import { PageTitle, Panel, adminButton, adminButtonGhost, adminInput } from '@/components/admin/ui'
import { FormShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import type { CmsPage } from '@/lib/types'

type MainTab = 'policies' | 'faq' | 'about'

interface FaqItem {
	id: string
	question: string
	answer: string
}

const POLICY_PAGES: { slug: string; label: string; icon: any }[] = [
	{ slug: 'privacy', label: 'Privacy Policy', icon: Lock },
	{ slug: 'terms', label: 'Terms & Conditions', icon: FileText },
	{ slug: 'return-policy', label: 'Return Policy', icon: RotateCcw },
	{ slug: 'shipping-policy', label: 'Shipping Policy', icon: Truck },
	{ slug: 'data-deletion', label: 'Data Deletion Instructions', icon: ShieldAlert },
]

const DEFAULT_FAQS: FaqItem[] = [
	{
		id: 'faq-1',
		question: 'HOW LONG WILL IT TAKE TO RECEIVE MY ORDER?',
		answer:
			'Ready-to-ship items are processed in 1-2 business days before dispatch. Express shipping delivers within 2-4 business days across US and Canada. Once your order ships, you will receive an email with live tracking details.',
	},
	{
		id: 'faq-2',
		question: 'WHAT IS CELLKORE AND HOW ARE DEVICES TESTED?',
		answer:
			'CellKore is your premium certified electronics hub. Every refurbished phone, tablet, and accessory undergoes a rigorous 90-point technical hardware diagnostic and battery health test before being listed.',
	},
	{
		id: 'faq-3',
		question: 'WHAT IS YOUR RETURN & WARRANTY POLICY?',
		answer:
			'We stand behind every product sold. All devices come with a 30-day CellKore Warranty. Eligible returns are processed within 3-5 business days upon receiving the item back at our facility.',
	},
]

export default function AdminContentPage() {
	const { toast } = useToast()
	const { can } = useAdmin()
	const writable = can('cms:write')

	const [pages, setPages] = useState<CmsPage[] | null>(null)
	const [activeMainTab, setActiveMainTab] = useState<MainTab>('policies')

	// Policies state
	const [selectedPolicySlug, setSelectedPolicySlug] = useState('privacy')
	const [policyTitle, setPolicyTitle] = useState('')
	const [policyContent, setPolicyContent] = useState('')
	const [policyUpdatedAt, setPolicyUpdatedAt] = useState<string | null>(null)
	const [policyPreviewMode, setPolicyPreviewMode] = useState(false)

	// FAQ state
	const [faqItems, setFaqItems] = useState<FaqItem[]>(DEFAULT_FAQS)
	const [selectedFaqId, setSelectedFaqId] = useState<string>('faq-1')

	// About Us state
	const [aboutTitle, setAboutTitle] = useState('About CellKore')
	const [aboutContent, setAboutContent] = useState('')
	const [aboutUpdatedAt, setAboutUpdatedAt] = useState<string | null>(null)
	const [aboutPreviewMode, setAboutPreviewMode] = useState(false)

	const [saving, setSaving] = useState(false)

	// Fetch CMS pages
	useEffect(() => {
		fetch('/api/admin/cms')
			.then((res) => res.json())
			.then((json) => {
				const fetchedPages: CmsPage[] = json.pages ?? []
				setPages(fetchedPages)

				// Load FAQ
				const faqPage = fetchedPages.find((p) => p.slug === 'faq')
				if (faqPage && faqPage.content) {
					try {
						const parsed = JSON.parse(faqPage.content)
						if (Array.isArray(parsed) && parsed.length > 0) {
							setFaqItems(parsed)
							setSelectedFaqId(parsed[0].id)
						}
					} catch {
						// Keep default
					}
				}

				// Load About Us
				const aboutPage = fetchedPages.find((p) => p.slug === 'about')
				if (aboutPage) {
					setAboutTitle(aboutPage.title || 'About CellKore')
					setAboutContent(aboutPage.content || '')
					setAboutUpdatedAt(aboutPage.updated_at || null)
				}
			})
			.catch(() => setPages([]))
	}, [])

	// Update selected policy details when policy slug changes
	useEffect(() => {
		if (!pages) return
		const p = pages.find((page) => page.slug === selectedPolicySlug)
		const known = POLICY_PAGES.find((k) => k.slug === selectedPolicySlug)
		setPolicyTitle(p?.title ?? known?.label ?? '')
		setPolicyContent(p?.content ?? '')
		setPolicyUpdatedAt(p?.updated_at ?? null)
	}, [pages, selectedPolicySlug])

	// Save policy
	const savePolicy = async () => {
		setSaving(true)
		try {
			const res = await fetch('/api/admin/cms', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ slug: selectedPolicySlug, title: policyTitle, content: policyContent }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)

			const now = new Date().toISOString()
			setPolicyUpdatedAt(now)
			toast({ title: 'Policy saved', description: `"${policyTitle}" has been published.`, variant: 'success' })
			setPages((prev) => {
				const list = [...(prev ?? [])]
				const idx = list.findIndex((p) => p.slug === selectedPolicySlug)
				const item = { id: selectedPolicySlug, slug: selectedPolicySlug, title: policyTitle, content: policyContent, updated_at: now }
				if (idx >= 0) list[idx] = { ...list[idx], ...item }
				else list.push(item as CmsPage)
				return list
			})
		} catch (err) {
			toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSaving(false)
		}
	}

	// Save FAQ
	const saveFaq = async () => {
		setSaving(true)
		try {
			const res = await fetch('/api/admin/cms', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ slug: 'faq', title: 'Frequently Asked Questions', content: JSON.stringify(faqItems) }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'FAQ saved', description: 'Frequently Asked Questions have been published to storefront.', variant: 'success' })
		} catch (err) {
			toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSaving(false)
		}
	}

	// Save About Us
	const saveAbout = async () => {
		setSaving(true)
		try {
			const res = await fetch('/api/admin/cms', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ slug: 'about', title: aboutTitle, content: aboutContent }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			const now = new Date().toISOString()
			setAboutUpdatedAt(now)
			toast({ title: 'About page saved', description: 'About Us page has been updated.', variant: 'success' })
		} catch (err) {
			toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSaving(false)
		}
	}

	// FAQ Handlers
	const addFaqQuestion = () => {
		const newId = `faq-${Date.now()}`
		const newQuestion: FaqItem = {
			id: newId,
			question: 'NEW CUSTOM QUESTION',
			answer: 'Enter detailed answer here...',
		}
		setFaqItems((prev) => [...prev, newQuestion])
		setSelectedFaqId(newId)
	}

	const deleteFaqQuestion = (id: string) => {
		if (faqItems.length <= 1) {
			toast({ title: 'Cannot delete', description: 'At least one FAQ item is required.', variant: 'info' })
			return
		}
		const updated = faqItems.filter((f) => f.id !== id)
		setFaqItems(updated)
		if (selectedFaqId === id) {
			setSelectedFaqId(updated[0].id)
		}
	}

	const updateSelectedFaq = (field: 'question' | 'answer', value: string) => {
		setFaqItems((prev) =>
			prev.map((item) => (item.id === selectedFaqId ? { ...item, [field]: value } : item))
		)
	}

	const activeFaq = faqItems.find((f) => f.id === selectedFaqId) || faqItems[0]

	const activePolicyConfig = POLICY_PAGES.find((p) => p.slug === selectedPolicySlug)

	return (
		<div className="space-y-6">
			<PageTitle
				title="Content Management System (CMS)"
				subtitle="Manage legal policies, FAQ database, and store pages served on CellKore storefront"
			/>

			{/* Main Top Navigation Tabs (Legal Policies | FAQ | About Us) */}
			<div className="flex border-b border-border/80 gap-8">
				<button
					onClick={() => setActiveMainTab('policies')}
					className={`pb-3 text-xs font-bold uppercase tracking-[0.16em] border-b-2 transition-all cursor-pointer ${
						activeMainTab === 'policies'
							? 'border-foreground text-foreground'
							: 'border-transparent text-muted-foreground hover:text-foreground'
					}`}
				>
					Legal Policies
				</button>
				<button
					onClick={() => setActiveMainTab('faq')}
					className={`pb-3 text-xs font-bold uppercase tracking-[0.16em] border-b-2 transition-all cursor-pointer ${
						activeMainTab === 'faq'
							? 'border-foreground text-foreground'
							: 'border-transparent text-muted-foreground hover:text-foreground'
					}`}
				>
					FAQ Management
				</button>
				<button
					onClick={() => setActiveMainTab('about')}
					className={`pb-3 text-xs font-bold uppercase tracking-[0.16em] border-b-2 transition-all cursor-pointer ${
						activeMainTab === 'about'
							? 'border-foreground text-foreground'
							: 'border-transparent text-muted-foreground hover:text-foreground'
					}`}
				>
					About Us
				</button>
			</div>

			{pages === null ? (
				<FormShimmer />
			) : (
				<>
					{/* TAB 1: LEGAL POLICIES */}
					{activeMainTab === 'policies' && (
						<div className="grid lg:grid-cols-4 gap-6 items-start">
							{/* Sidebar */}
							<div className="space-y-6 lg:col-span-1">
								<div className="bg-white rounded-2xl border border-border/80 p-3 space-y-1 shadow-3xs">
									{POLICY_PAGES.map((policy) => {
										const Icon = policy.icon
										const isSelected = selectedPolicySlug === policy.slug
										return (
											<button
												key={policy.slug}
												onClick={() => setSelectedPolicySlug(policy.slug)}
												className={`w-full text-left px-3.5 py-3 rounded-xl text-xs font-bold uppercase tracking-[0.12em] transition-all flex items-center gap-3 cursor-pointer ${
													isSelected
														? 'bg-foreground text-background shadow-xs'
														: 'text-foreground/80 hover:bg-muted'
												}`}
											>
												<Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-background' : 'text-primary'}`} />
												<span className="truncate">{policy.label}</span>
											</button>
										)
									})}
								</div>

								{/* Format Guide */}
								<div className="bg-muted/40 rounded-2xl border border-border/60 p-4 space-y-2 text-xs">
									<h4 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">
										FORMAT GUIDE
									</h4>
									<div className="space-y-1.5 font-mono text-[11px] text-foreground/80">
										<p><strong className="text-foreground font-bold">## Heading</strong></p>
										<p><strong className="text-foreground font-bold">**bold text**</strong></p>
										<p><em className="text-foreground italic">*italic text*</em></p>
										<p>- bullet point item</p>
										<p>[link text](url)</p>
									</div>
								</div>
							</div>

							{/* Main Policy Editor */}
							<div className="lg:col-span-3 space-y-4">
								<div className="bg-white rounded-2xl border border-border/80 p-6 space-y-5 shadow-3xs">
									{/* Top Editor Header */}
									<div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/60">
										<div className="flex items-center gap-2">
											{activePolicyConfig?.icon && (
												<activePolicyConfig.icon className="w-5 h-5 text-primary" />
											)}
											<h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
												{policyTitle || activePolicyConfig?.label}
											</h2>
										</div>
										<div className="flex items-center gap-3">
											{policyUpdatedAt && (
												<span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
													Last saved: {new Date(policyUpdatedAt).toLocaleString()}
												</span>
											)}
											<button
												onClick={() => setPolicyPreviewMode(!policyPreviewMode)}
												className={`${adminButtonGhost} px-3 py-1.5 text-xs`}
											>
												<Eye className="w-3.5 h-3.5" />
												{policyPreviewMode ? 'Edit Mode' : 'Preview'}
											</button>
											<Link
												href={`/${selectedPolicySlug}`}
												target="_blank"
												className={`${adminButtonGhost} px-3 py-1.5 text-xs`}
											>
												<ExternalLink className="w-3.5 h-3.5" />
												View Live
											</Link>
											{writable && (
												<button
													onClick={savePolicy}
													disabled={saving || !policyTitle.trim()}
													className={`${adminButton} px-4 py-1.5`}
												>
													{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
													Save Changes
												</button>
											)}
										</div>
									</div>

									{/* Policy Inputs */}
									<div className="space-y-4">
										<div>
											<label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1.5 block">
												Policy Title
											</label>
											<input
												value={policyTitle}
												onChange={(e) => setPolicyTitle(e.target.value)}
												className={adminInput}
												disabled={!writable}
											/>
										</div>

										<div>
											<label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1.5 block">
												Policy Body (Markdown)
											</label>
											{policyPreviewMode ? (
												<div className="min-h-[420px] p-5 rounded-xl border border-border/80 bg-muted/20 text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground">
													{policyContent || <span className="text-muted-foreground italic">No content typed yet.</span>}
												</div>
											) : (
												<textarea
													value={policyContent}
													onChange={(e) => setPolicyContent(e.target.value)}
													rows={18}
													className={`${adminInput} resize-y leading-relaxed font-mono text-xs`}
													placeholder="Write markdown policy content here..."
													disabled={!writable}
												/>
											)}
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* TAB 2: FAQ MANAGEMENT */}
					{activeMainTab === 'faq' && (
						<div className="grid lg:grid-cols-4 gap-6 items-start">
							{/* FAQ Sidebar List */}
							<div className="space-y-4 lg:col-span-1">
								<div className="bg-white rounded-2xl border border-border/80 p-3 space-y-2 shadow-3xs">
									<h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground px-2 pt-1">
										Questions ({faqItems.length})
									</h3>
									<div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
										{faqItems.map((item) => {
											const isSelected = selectedFaqId === item.id
											return (
												<button
													key={item.id}
													onClick={() => setSelectedFaqId(item.id)}
													className={`w-full text-left p-3 rounded-xl text-xs font-bold transition-all flex items-start gap-2.5 cursor-pointer border ${
														isSelected
															? 'bg-foreground text-background border-foreground shadow-xs'
															: 'bg-background text-foreground/80 border-border/60 hover:bg-muted'
													}`}
												>
													<span
														className={`w-5 h-5 rounded-md text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5 ${
															isSelected ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-foreground/70'
														}`}
													>
														?
													</span>
													<span className="line-clamp-2 uppercase tracking-[0.08em] leading-snug">
														{item.question || 'Untitled Question'}
													</span>
												</button>
											)
										})}
									</div>

									<button
										onClick={addFaqQuestion}
										className="w-full mt-2 py-3 rounded-xl border border-dashed border-primary/40 hover:border-primary text-primary hover:bg-[#EEF7F0] text-xs font-bold uppercase tracking-[0.14em] transition-all flex items-center justify-center gap-2 cursor-pointer"
									>
										<Plus className="w-4 h-4" />
										Add Question
									</button>
								</div>
							</div>

							{/* FAQ Main Question Editor */}
							<div className="lg:col-span-3 space-y-4">
								<div className="bg-white rounded-2xl border border-border/80 p-6 space-y-5 shadow-3xs">
									{/* Top Action Header */}
									<div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/60">
										<div className="flex items-center gap-2">
											<HelpCircle className="w-5 h-5 text-primary" />
											<h2 className="text-xs font-extrabold uppercase tracking-wider text-foreground">
												Edit FAQ Item
											</h2>
										</div>
										<div className="flex items-center gap-3">
											<button
												onClick={() => deleteFaqQuestion(activeFaq.id)}
												className="px-3 py-1.5 text-xs font-bold text-destructive hover:bg-destructive/10 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer uppercase tracking-wider"
											>
												<Trash2 className="w-3.5 h-3.5" />
												Delete
											</button>
											<Link
												href="/faq"
												target="_blank"
												className={`${adminButtonGhost} px-3 py-1.5 text-xs`}
											>
												<ExternalLink className="w-3.5 h-3.5" />
												View Live FAQ
											</Link>
											{writable && (
												<button onClick={saveFaq} disabled={saving} className={`${adminButton} px-4 py-1.5`}>
													{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
													Save All FAQs
												</button>
											)}
										</div>
									</div>

									{/* Question & Answer Inputs */}
									<div className="space-y-5">
										<div>
											<label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1.5 block">
												Question Headline
											</label>
											<input
												value={activeFaq.question}
												onChange={(e) => updateSelectedFaq('question', e.target.value)}
												className={`${adminInput} font-bold text-sm uppercase tracking-wider`}
												placeholder="e.g. HOW LONG WILL IT TAKE TO RECEIVE MY ORDER?"
												disabled={!writable}
											/>
										</div>

										<div>
											<label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1.5 block">
												Answer Content
											</label>
											<textarea
												value={activeFaq.answer}
												onChange={(e) => updateSelectedFaq('answer', e.target.value)}
												rows={12}
												className={`${adminInput} resize-y leading-relaxed text-sm`}
												placeholder="Write comprehensive answer details for customers..."
												disabled={!writable}
											/>
										</div>
									</div>
								</div>
							</div>
						</div>
					)}

					{/* TAB 3: ABOUT US */}
					{activeMainTab === 'about' && (
						<div className="max-w-4xl space-y-4">
							<div className="bg-white rounded-2xl border border-border/80 p-6 space-y-5 shadow-3xs">
								<div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-border/60">
									<div className="flex items-center gap-2">
										<Info className="w-5 h-5 text-primary" />
										<h2 className="text-sm font-extrabold uppercase tracking-wider text-foreground">
											About Us Page Content
										</h2>
									</div>
									<div className="flex items-center gap-3">
										{aboutUpdatedAt && (
											<span className="text-[11px] text-muted-foreground font-medium hidden sm:inline">
												Last saved: {new Date(aboutUpdatedAt).toLocaleString()}
											</span>
										)}
										<button
											onClick={() => setAboutPreviewMode(!aboutPreviewMode)}
											className={`${adminButtonGhost} px-3 py-1.5 text-xs`}
										>
											<Eye className="w-3.5 h-3.5" />
											{aboutPreviewMode ? 'Edit Mode' : 'Preview'}
										</button>
										<Link
											href="/about"
											target="_blank"
											className={`${adminButtonGhost} px-3 py-1.5 text-xs`}
										>
											<ExternalLink className="w-3.5 h-3.5" />
											View Live Page
										</Link>
										{writable && (
											<button
												onClick={saveAbout}
												disabled={saving || !aboutTitle.trim()}
												className={`${adminButton} px-4 py-1.5`}
											>
												{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
												Save Changes
											</button>
										)}
									</div>
								</div>

								<div className="space-y-4">
									<div>
										<label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1.5 block">
											Page Headline Title
										</label>
										<input
											value={aboutTitle}
											onChange={(e) => setAboutTitle(e.target.value)}
											className={adminInput}
											disabled={!writable}
										/>
									</div>

									<div>
										<label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1.5 block">
											Body Content (Markdown Supported)
										</label>
										{aboutPreviewMode ? (
											<div className="min-h-[380px] p-5 rounded-xl border border-border/80 bg-muted/20 text-sm leading-relaxed whitespace-pre-wrap font-sans text-foreground">
												{aboutContent || <span className="text-muted-foreground italic">No content typed yet.</span>}
											</div>
										) : (
											<textarea
												value={aboutContent}
												onChange={(e) => setAboutContent(e.target.value)}
												rows={16}
												className={`${adminInput} resize-y leading-relaxed font-mono text-xs`}
												placeholder="Write about us content here..."
												disabled={!writable}
											/>
										)}
									</div>
								</div>
							</div>
						</div>
					)}
				</>
			)}
		</div>
	)
}
