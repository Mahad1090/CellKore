'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, Star, MessageCircle, ShieldCheck, Pencil, Trash2, ImageIcon, ChevronDown } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import { fetchMyProductReview, fetchProductReviews } from '@/lib/data'
import { supabase } from '@/lib/supabase'
import type { ProductReview } from '@/lib/types'

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

export function ProductReviewsSection({ productId, productName }: { productId: string; productName: string }) {
	const { user, loading: authLoading } = useAuth()
	const { toast, confirm } = useToast()

	const [reviews, setReviews] = useState<ProductReview[] | null>(null)
	const [myReview, setMyReview] = useState<ProductReview | null>(null)
	const [rating, setRating] = useState(0)
	const [title, setTitle] = useState('')
	const [comment, setComment] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [isEditing, setIsEditing] = useState(false)
	const [sortBy, setSortBy] = useState<'recent' | 'highest' | 'lowest'>('recent')

	const loadReviews = () => {
		fetchProductReviews(productId)
			.then((data) => setReviews(data))
			.catch(() => setReviews([]))
	}

	useEffect(() => {
		loadReviews()
	}, [productId])

	useEffect(() => {
		if (!user) {
			setMyReview(null)
			return
		}
		fetchMyProductReview(productId, user.id)
			.then((data) => setMyReview(data))
			.catch(() => setMyReview(null))
	}, [productId, user])

	const summary = useMemo(() => {
		const list = reviews ?? []
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
	}, [reviews])

	const sortedReviews = useMemo(() => {
		const list = [...(reviews ?? [])]
		if (sortBy === 'highest') {
			return list.sort((a, b) => b.rating - a.rating)
		}
		if (sortBy === 'lowest') {
			return list.sort((a, b) => a.rating - b.rating)
		}
		return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
	}, [reviews, sortBy])

	const submitReview = async () => {
		if (!user) {
			toast({ title: 'Sign in required', description: 'Please sign in to submit a review.', variant: 'error' })
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
			if (myReview && isEditing) {
				// Update existing review
				const { error } = await supabase
					.from('product_reviews')
					.update({
						rating,
						title: title.trim(),
						comment: comment.trim(),
						status: 'pending',
						updated_at: new Date().toISOString(),
					})
					.eq('id', myReview.id)

				if (error) throw error
				toast({ title: 'Review updated', description: 'Your updated review has been submitted for approval.', variant: 'success' })
				setIsEditing(false)
			} else {
				// Create new review
				const { error } = await supabase.from('product_reviews').insert({
					product_id: productId,
					user_id: user.id,
					reviewer_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? 'Customer',
					reviewer_email: user.email ?? null,
					rating,
					title: title.trim(),
					comment: comment.trim(),
					status: 'pending',
					is_featured: false,
				})

				if (error) throw error
				toast({ title: 'Review submitted', description: 'Thank you! Your review will appear after admin approval.', variant: 'success' })
			}

			setTitle('')
			setComment('')
			setRating(0)
			fetchMyProductReview(productId, user.id).then(setMyReview).catch(() => undefined)
		} catch (error) {
			toast({ title: 'Submission failed', description: error instanceof Error ? error.message : undefined, variant: 'error' })
		} finally {
			setSubmitting(false)
		}
	}

	const handleDeleteMyReview = async () => {
		if (!myReview) return
		const ok = await confirm({
			title: 'Delete Review?',
			description: 'Are you sure you want to remove your review for this product?',
			confirmLabel: 'Delete',
			destructive: true,
		})
		if (!ok) return

		try {
			const { error } = await supabase.from('product_reviews').delete().eq('id', myReview.id)
			if (error) throw error
			toast({ title: 'Review deleted', description: 'Your review has been removed.', variant: 'success' })
			setMyReview(null)
			setIsEditing(false)
			setTitle('')
			setComment('')
			setRating(0)
			loadReviews()
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
		<section className="mt-20 pt-10 border-t border-border/80">
			<div className="grid lg:grid-cols-[380px_1fr] gap-12 items-start">
				{/* LEFT COLUMN: CUSTOMER REVIEWS SUMMARY & SHARE EXPERIENCE */}
				<div className="space-y-8">
					<div className="space-y-4">
						<h2 className="text-xl sm:text-2xl font-serif tracking-luxury text-foreground uppercase">
							CUSTOMER REVIEWS
						</h2>

						<div className="space-y-1.5">
							<div className="flex items-baseline gap-3">
								<span className="text-4xl sm:text-5xl font-extrabold text-foreground font-serif">
									{summary.count > 0 ? summary.average.toFixed(1) : '0'}
								</span>
								<div className="space-y-1">
									<Stars value={summary.average} size="md" />
									<p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-bold">
										BASED ON {summary.count} APPROVED REVIEW{summary.count !== 1 ? 'S' : ''}
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

					{/* SHARE YOUR EXPERIENCE CARD */}
					<div className="bg-secondary/30 rounded-2xl border border-border/80 p-6 space-y-4 shadow-3xs">
						<h3 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground font-serif">
							SHARE YOUR EXPERIENCE
						</h3>

						{authLoading ? (
							<div className="space-y-3 pt-2">
								<div className="h-8 rounded-xl bg-muted animate-pulse" />
								<div className="h-20 rounded-xl bg-muted animate-pulse" />
							</div>
						) : user ? (
							myReview && !isEditing ? (
								/* EDGE CASE — Already Submitted Review */
								<div className="space-y-3 pt-1">
									<p className="text-xs text-muted-foreground leading-relaxed font-normal">
										You have already reviewed this product. You can update or delete your submission.
									</p>
									<div className="flex items-center gap-2 pt-2">
										<button
											onClick={() => {
												setRating(myReview.rating)
												setTitle(myReview.title || '')
												setComment(myReview.comment)
												setIsEditing(true)
											}}
											className="px-4 py-2 bg-background border border-border rounded-xl text-xs font-bold uppercase tracking-wider text-foreground hover:bg-muted transition-colors flex items-center gap-1.5 cursor-pointer shadow-3xs"
										>
											<Pencil className="w-3.5 h-3.5 text-primary" />
											Edit Review
										</button>
										<button
											onClick={handleDeleteMyReview}
											className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-destructive hover:bg-destructive/10 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
										>
											<Trash2 className="w-3.5 h-3.5" />
											Delete
										</button>
									</div>
								</div>
							) : (
								/* New / Edit Review Form */
								<div className="space-y-4 pt-1">
									{isEditing && (
										<div className="flex items-center justify-between text-xs font-bold text-primary pb-1">
											<span>Editing Your Review</span>
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
											placeholder="What stood out most?"
											className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-background text-xs text-foreground focus:outline-none focus:border-primary font-medium"
										/>
									</div>
									<div>
										<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1.5">
											Your Review
										</p>
										<textarea
											value={comment}
											onChange={(e) => setComment(e.target.value)}
											placeholder="Share details about condition, battery life, performance..."
											rows={4}
											className="w-full px-3.5 py-2.5 border border-border rounded-xl bg-background text-xs text-foreground focus:outline-none focus:border-primary resize-none font-medium leading-relaxed"
										/>
									</div>
									<button
										onClick={submitReview}
										disabled={submitting || rating === 0 || !comment.trim()}
										className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-[0.16em] hover:opacity-90 transition-all disabled:opacity-50 cursor-pointer shadow-sm"
									>
										{submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
										{isEditing ? 'Update Review' : 'Submit Review'}
									</button>
								</div>
							)
						) : (
							/* Guest / Unauthenticated State */
							<div className="space-y-3 pt-1">
								<p className="text-xs text-muted-foreground leading-relaxed font-medium">
									Sign in to leave a review for this product.
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

				{/* RIGHT COLUMN: REVIEWS LIST & SORTING */}
				<div className="space-y-6">
					{/* Header bar with Sort By */}
					<div className="flex items-center justify-between pb-4 border-b border-border/80 flex-wrap gap-4">
						<h3 className="text-xs font-extrabold uppercase tracking-[0.18em] text-foreground">
							REVIEWS ({summary.count})
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

					{/* Reviews List / Empty State */}
					{reviews === null ? (
						<div className="space-y-4">
							{Array.from({ length: 2 }).map((_, index) => (
								<div key={index} className="animate-pulse rounded-2xl border border-border/60 p-6 h-32 bg-muted/20" />
							))}
						</div>
					) : sortedReviews.length === 0 ? (
						/* Empty State matching Screenshot 2 */
						<div className="border border-dashed border-border/80 rounded-3xl p-12 text-center space-y-3 bg-secondary/10">
							<div className="w-12 h-12 mx-auto rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground/60">
								<ImageIcon className="w-6 h-6" />
							</div>
							<h4 className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted-foreground">
								NO REVIEWS YET
							</h4>
							<p className="text-xs text-muted-foreground max-w-sm mx-auto font-medium">
								Be the first to share your experience with this item!
							</p>
						</div>
					) : (
						<div className="space-y-4">
							{sortedReviews.map((review) => (
								<article
									key={review.id}
									className="rounded-2xl border border-border/80 bg-white p-6 space-y-3 shadow-3xs transition-all hover:border-border"
								>
									<div className="flex items-center justify-between gap-4 flex-wrap">
										<div className="flex items-center gap-3">
											<div className="w-9 h-9 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
												{initials(review.reviewer_name) || 'CK'}
											</div>
											<div>
												<div className="flex items-center gap-2">
													<p className="text-xs font-extrabold text-foreground">{review.reviewer_name}</p>
													<span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#EEF7F0] border border-[#C8E6CE] text-[#599161] text-[9px] font-bold uppercase tracking-wider">
														Verified Buyer
													</span>
												</div>
												<p className="text-[10px] text-muted-foreground font-medium mt-0.5">
													{new Date(review.created_at).toLocaleDateString()}
												</p>
											</div>
										</div>
										<Stars value={review.rating} />
									</div>

									{review.title && (
										<h5 className="text-xs font-extrabold uppercase tracking-wider text-foreground pt-1">
											{review.title}
										</h5>
									)}
									<p className="text-xs text-foreground/80 leading-relaxed whitespace-pre-line font-medium">
										{review.comment}
									</p>
								</article>
							))}
						</div>
					)}
				</div>
			</div>
		</section>
	)
}