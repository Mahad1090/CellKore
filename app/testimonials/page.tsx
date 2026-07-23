'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, Star, MessageCircle, Pencil, Trash2, ImageIcon, Quote } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import { fetchApprovedTestimonials, fetchMyStoreTestimonial } from '@/lib/data'
import { supabase } from '@/lib/supabase'
import type { StoreTestimonial } from '@/lib/types'

function Stars({ value, size = 'sm' }: { value: number; size?: 'sm' | 'md' | 'lg' }) {
	const iconSize = size === 'lg' ? 'w-5 h-5' : size === 'md' ? 'w-4 h-4' : 'w-3.5 h-3.5'
	return (
		<div className="flex items-center gap-0.5 text-amber-400">
			{Array.from({ length: 5 }).map((_, index) => (
				<Star
					key={index}
					className={`${iconSize} ${index < Math.round(value) ? 'fill-amber-400 text-amber-400' : 'text-amber-200/60'}`}
				/>
			))}
		</div>
	)
}

function initials(name: string) {
	return name
		.split(/\s+/)
		.filter(Boolean)
		.slice(0, 2)
		.map((part) => part[0]?.toUpperCase() ?? '')
		.join('')
}

export default function TestimonialsPage() {
	const { user, loading: authLoading } = useAuth()
	const { toast, confirm } = useToast()

	const [testimonials, setTestimonials] = useState<StoreTestimonial[] | null>(null)
	const [myTestimonial, setMyTestimonial] = useState<StoreTestimonial | null>(null)
	const [rating, setRating] = useState(0)
	const [title, setTitle] = useState('')
	const [comment, setComment] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest'>('recent')

	const loadTestimonials = () => {
		fetchApprovedTestimonials()
			.then((data) => setTestimonials(data))
			.catch(() => setTestimonials([]))
	}

	useEffect(() => {
		loadTestimonials()
	}, [])

	useEffect(() => {
		if (!user) {
			setMyTestimonial(null)
			return
		}
		fetchMyStoreTestimonial(user.id)
			.then((data) => setMyTestimonial(data))
			.catch(() => setMyTestimonial(null))
	}, [user])

	const summary = useMemo(() => {
		const list = testimonials ?? []
		if (list.length === 0) {
			return { average: 0, count: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 } }
		}
		const average = list.reduce((sum, item) => sum + item.rating, 0) / list.length
		const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
		list.forEach((item) => {
			const r = Math.min(5, Math.max(1, Math.round(item.rating))) as 1 | 2 | 3 | 4 | 5
			breakdown[r] = (breakdown[r] || 0) + 1
		})
		return { average, count: list.length, breakdown }
	}, [testimonials])

	const sortedTestimonials = useMemo(() => {
		const list = [...(testimonials ?? [])]
		if (sortBy === 'highest') {
			return list.sort((a, b) => b.rating - a.rating)
		}
		if (sortBy === 'lowest') {
			return list.sort((a, b) => a.rating - b.rating)
		}
		return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
	}, [testimonials, sortBy])

	const submitTestimonial = async () => {
		if (!user) {
			toast({ title: 'Sign in required', description: 'Please sign in to submit a store review.', variant: 'error' })
			return
		}
		if (rating === 0) {
			toast({ title: 'Rating required', description: 'Please select a star rating.', variant: 'error' })
			return
		}
		if (!comment.trim()) {
			toast({ title: 'Missing review', description: 'Please write a brief comment.', variant: 'error' })
			return
		}

		setSubmitting(true)
		try {
			if (myTestimonial && isEditing) {
				// Update existing store review
				const { error } = await supabase
					.from('store_testimonials')
					.update({
						rating,
						title: title.trim() || 'Store Experience',
						comment: comment.trim(),
						status: 'pending',
						updated_at: new Date().toISOString(),
					})
					.eq('id', myTestimonial.id)

				if (error) throw error
				toast({ title: 'Testimonial updated', description: 'Your updated store review has been submitted for approval.', variant: 'success' })
				setIsEditing(false)
			} else {
				// Create new store review
				const { error } = await supabase.from('store_testimonials').insert({
					user_id: user.id,
					customer_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Customer',
					customer_email: user.email ?? null,
					rating,
					title: title.trim() || 'Store Experience',
					comment: comment.trim(),
					status: 'pending',
					is_featured: false,
				})

				if (error) throw error
				toast({ title: 'Testimonial submitted', description: 'Thank you! Your store review will appear after admin approval.', variant: 'success' })
			}

			setTitle('')
			setComment('')
			setRating(0)
			fetchMyStoreTestimonial(user.id).then(setMyTestimonial).catch(() => undefined)
		} catch (error) {
			toast({ title: 'Submission failed', description: error instanceof Error ? error.message : undefined, variant: 'error' })
		} finally {
			setSubmitting(false)
		}
	}

	const handleDeleteMyTestimonial = async () => {
		if (!myTestimonial) return
		const ok = await confirm({
			title: 'Delete Store Review?',
			description: 'Are you sure you want to remove your testimonial for CellKore?',
			confirmLabel: 'Delete',
			destructive: true,
		})
		if (!ok) return

		try {
			const { error } = await supabase.from('store_testimonials').delete().eq('id', myTestimonial.id)
			if (error) throw error
			toast({ title: 'Testimonial deleted', description: 'Your store review has been removed.', variant: 'success' })
			setMyTestimonial(null)
			setIsEditing(false)
			setTitle('')
			setComment('')
			setRating(0)
			loadTestimonials()
		} catch (err) {
			toast({ title: 'Delete failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		}
	}

	const starsInput = (
		<div className="flex items-center gap-2">
			{Array.from({ length: 5 }).map((_, index) => (
				<button
					key={index}
					type="button"
					onClick={() => setRating(index + 1)}
					className="cursor-pointer transition-transform hover:scale-110"
					aria-label={`Set rating ${index + 1}`}
				>
					<Star
						className={`w-6 h-6 ${index < rating ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/30 hover:text-amber-300'}`}
					/>
				</button>
			))}
		</div>
	)

	return (
		<main className="min-h-screen bg-background flex flex-col">
			<Navigation />

			{/* Hero Banner Header */}
			<section className="bg-primary text-primary-foreground py-14 border-b border-primary-foreground/10">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<p className="text-[10px] uppercase tracking-[0.24em] opacity-80 mb-2 font-bold">STORE REVIEWS</p>
					<h1 className="text-3xl sm:text-4xl md:text-5xl font-serif tracking-luxury uppercase font-bold">
						CUSTOMER STORIES
					</h1>
					<p className="mt-3 max-w-2xl text-xs sm:text-sm opacity-90 leading-relaxed font-medium">
						Read real feedback from verified CellKore customers or share your own store experience.
					</p>
				</div>
			</section>

			{/* Main Grid Content */}
			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex-1 w-full">
				<div className="grid lg:grid-cols-[380px_1fr] gap-12 items-start">
					{/* LEFT COLUMN: STORE REVIEWS SUMMARY & SHARE YOUR STORY */}
					<div className="space-y-8">
						<div className="space-y-4">
							<h2 className="text-xl sm:text-2xl font-serif tracking-luxury text-foreground uppercase">
								WHAT OUR CUSTOMERS SAY
							</h2>

							<div className="space-y-1.5">
								<div className="flex items-baseline gap-3">
									<span className="text-4xl sm:text-5xl font-extrabold text-foreground font-serif">
										{summary.count > 0 ? summary.average.toFixed(1) : '0'}
									</span>
									<div className="space-y-1">
										<Stars value={summary.average} size="md" />
										<p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-bold">
											BASED ON {summary.count} APPROVED STORE REVIEW{summary.count !== 1 ? 'S' : ''}
										</p>
									</div>
								</div>
							</div>

							{/* Star Breakdown Bars */}
							<div className="space-y-2 pt-2">
								{[5, 4, 3, 2, 1].map((star) => {
									const count = summary.breakdown[star as 5 | 4 | 3 | 2 | 1] || 0
									const pct = summary.count > 0 ? (count / summary.count) * 100 : 0
									return (
										<div key={star} className="flex items-center gap-3 text-xs text-muted-foreground font-medium">
											<span className="w-5 text-right font-bold text-foreground/80">{star}★</span>
											<div className="flex-1 h-2 bg-muted/60 rounded-full overflow-hidden">
												<div className="h-full bg-amber-400 transition-all duration-500 rounded-full" style={{ width: `${pct}%` }} />
											</div>
											<span className="w-5 text-left font-bold text-foreground/60">{count}</span>
										</div>
									)
								})}
							</div>
						</div>

						{/* SHARE YOUR STORY CARD */}
						<div className="bg-secondary/30 rounded-2xl border border-border/80 p-6 space-y-4 shadow-3xs">
							<h3 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground font-serif">
								SHARE YOUR STORY
							</h3>

							{authLoading ? (
								<div className="space-y-3 pt-2">
									<div className="h-8 rounded-xl bg-muted animate-pulse" />
									<div className="h-20 rounded-xl bg-muted animate-pulse" />
								</div>
							) : user ? (
								myTestimonial && !isEditing ? (
									/* EDGE CASE — Already Submitted Store Review */
									<div className="space-y-3 pt-1">
										<p className="text-xs text-muted-foreground leading-relaxed font-normal">
											You have already submitted a store review. You can update or delete your submission.
										</p>
										<div className="flex items-center gap-2 pt-2">
											<button
												onClick={() => {
													setRating(myTestimonial.rating)
													setTitle(myTestimonial.title || '')
													setComment(myTestimonial.comment)
													setIsEditing(true)
												}}
												className="px-4 py-2 bg-background border border-border rounded-xl text-xs font-bold uppercase tracking-wider text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer shadow-3xs"
											>
												<Pencil className="w-3.5 h-3.5 text-primary" />
												Edit Review
											</button>
											<button
												onClick={handleDeleteMyTestimonial}
												className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
											>
												<Trash2 className="w-3.5 h-3.5" />
												Delete
											</button>
										</div>
									</div>
								) : (
									/* New / Edit Store Review Form */
									<div className="space-y-4 pt-1">
										{isEditing && (
											<div className="flex items-center justify-between text-xs font-bold text-primary pb-1">
												<span>Editing Your Store Review</span>
												<button
													onClick={() => setIsEditing(false)}
													className="text-muted-foreground hover:text-foreground underline cursor-pointer text-[11px]"
												>
													Cancel
												</button>
											</div>
										)}
										<div>
											<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1.5">
												Rating
											</p>
											{starsInput}
										</div>
										<div>
											<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1.5">
												Headline Title (Optional)
											</p>
											<input
												value={title}
												onChange={(e) => setTitle(e.target.value)}
												placeholder="What did you love most about CellKore?"
												className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-background text-xs text-foreground focus:outline-none focus:border-primary font-medium"
											/>
										</div>
										<div>
											<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1.5">
												Your Store Experience
											</p>
											<textarea
												value={comment}
												onChange={(e) => setComment(e.target.value)}
												placeholder="Tell us about your experience with customer service, shipping, or device condition..."
												rows={4}
												className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-background text-xs text-foreground focus:outline-none focus:border-primary resize-none font-medium leading-relaxed"
											/>
										</div>
										<button
											onClick={submitTestimonial}
											disabled={submitting || rating === 0 || !comment.trim()}
											className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-[0.16em] hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
										>
											{submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
											{isEditing ? 'Update Testimonial' : 'Submit Testimonial'}
										</button>
									</div>
								)
							) : (
								/* Guest / Unauthenticated State */
								<div className="space-y-3 pt-1">
									<p className="text-xs text-muted-foreground leading-relaxed font-medium">
										Sign in to share your experience with CellKore.
									</p>
									<Link
										href="/auth/signin"
										className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-background border border-border text-xs font-bold uppercase tracking-[0.16em] text-foreground hover:bg-muted transition-colors shadow-3xs"
									>
										<MessageCircle className="w-3.5 h-3.5 text-primary" />
										SIGN IN
									</Link>
								</div>
							)}
						</div>
					</div>

					{/* RIGHT COLUMN: TESTIMONIALS LIST & SORTING */}
					<div className="space-y-6">
						{/* Header bar with Sort By */}
						<div className="flex items-center justify-between pb-4 border-b border-border/80 flex-wrap gap-4">
							<h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-foreground">
								STORE TESTIMONIALS ({summary.count})
							</h3>

							<div className="flex items-center gap-2 text-xs">
								<span className="text-muted-foreground font-medium uppercase tracking-wider text-[11px]">Sort by:</span>
								<select
									value={sortBy}
									onChange={(e) => setSortBy(e.target.value as any)}
									className="bg-transparent font-extrabold uppercase tracking-wider text-xs text-foreground focus:outline-none cursor-pointer border-none py-1 pr-4"
								>
									<option value="recent">MOST RECENT</option>
									<option value="highest">HIGHEST RATING</option>
									<option value="lowest">LOWEST RATING</option>
								</select>
							</div>
						</div>

						{/* Testimonials List / Empty State */}
						{testimonials === null ? (
							<div className="space-y-4">
								{Array.from({ length: 2 }).map((_, index) => (
									<div key={index} className="animate-pulse rounded-2xl border border-border/60 p-6 h-32 bg-muted/20" />
								))}
							</div>
						) : sortedTestimonials.length === 0 ? (
							/* Empty State matching Product Reviews design */
							<div className="border border-dashed border-border/80 rounded-3xl p-12 text-center space-y-3 bg-secondary/10">
								<div className="w-12 h-12 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground/60">
									<ImageIcon className="w-6 h-6" />
								</div>
								<h4 className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
									NO TESTIMONIALS YET
								</h4>
								<p className="text-xs text-muted-foreground max-w-sm mx-auto font-medium">
									Be the first to share your experience with CellKore!
								</p>
							</div>
						) : (
							<div className="space-y-4">
								{sortedTestimonials.map((testimonial) => (
									<article
										key={testimonial.id}
										className="rounded-2xl border border-border/80 bg-white p-6 space-y-3 shadow-3xs transition-all hover:border-border"
									>
										<div className="flex items-center justify-between gap-4 flex-wrap">
											<div className="flex items-center gap-3">
												<div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
													{initials(testimonial.customer_name) || 'CK'}
												</div>
												<div>
													<div className="flex items-center gap-2">
														<p className="text-xs font-extrabold text-foreground">{testimonial.customer_name}</p>
														<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EEF7F0] border border-[#C8E6CE] text-[#599161] text-[9px] font-bold uppercase tracking-wider">
															Verified Customer
														</span>
													</div>
													<p className="text-[10px] text-muted-foreground font-medium mt-0.5">
														{new Date(testimonial.created_at).toLocaleDateString()}
													</p>
												</div>
											</div>
											<div className="flex items-center gap-3">
												<Quote className="w-4 h-4 text-muted-foreground/30" />
												<Stars value={testimonial.rating} />
											</div>
										</div>

										{testimonial.title && (
											<h5 className="text-xs font-extrabold uppercase tracking-wider text-foreground pt-1">
												{testimonial.title}
											</h5>
										)}
										<p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line font-medium">
											{testimonial.comment}
										</p>
									</article>
								))}
							</div>
						)}
					</div>
				</div>
			</section>

			<Footer />
		</main>
	)
}
