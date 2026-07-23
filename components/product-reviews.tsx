'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, Star, MessageCircle, ShieldCheck } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import { fetchMyProductReview, fetchProductReviews } from '@/lib/data'
import { supabase } from '@/lib/supabase'
import type { ProductReview } from '@/lib/types'

function Stars({ value }: { value: number }) {
	return (
		<div className="flex items-center gap-0.5 text-amber-400">
			{Array.from({ length: 5 }).map((_, index) => (
				<Star key={index} className={`w-3.5 h-3.5 ${index < value ? 'fill-current' : 'text-amber-200'}`} />
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
	const { toast } = useToast()
	const [reviews, setReviews] = useState<ProductReview[] | null>(null)
	const [myReview, setMyReview] = useState<ProductReview | null>(null)
	const [rating, setRating] = useState(0)
	const [title, setTitle] = useState('')
	const [comment, setComment] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [loadingMine, setLoadingMine] = useState(false)

	useEffect(() => {
		let active = true
		setReviews(null)
		fetchProductReviews(productId)
			.then((data) => {
				if (active) setReviews(data)
			})
			.catch(() => {
				if (active) setReviews([])
			})
		return () => {
			active = false
		}
	}, [productId])

	useEffect(() => {
		if (!user) {
			setMyReview(null)
			return
		}
		let active = true
		setLoadingMine(true)
		fetchMyProductReview(productId, user.id)
			.then((data) => {
				if (active) setMyReview(data)
			})
			.catch(() => {
				if (active) setMyReview(null)
			})
			.finally(() => {
				if (active) setLoadingMine(false)
			})
		return () => {
			active = false
		}
	}, [productId, user])

	const summary = useMemo(() => {
		const list = reviews ?? []
		if (list.length === 0) return { average: 0, count: 0 }
		const average = list.reduce((sum, item) => sum + item.rating, 0) / list.length
		return { average, count: list.length }
	}, [reviews])

	const submitReview = async () => {
		if (!user) {
			toast({ title: 'Sign in required', description: 'Please sign in to submit a review.', variant: 'error' })
			return
		}
		if (!title.trim() || !comment.trim()) {
			toast({ title: 'Missing details', description: 'Please add a title and review message.', variant: 'error' })
			return
		}
		setSubmitting(true)
		try {
			const { error } = await supabase.from('product_reviews').insert({
				product_id: productId,
				user_id: user.id,
				reviewer_name: user.user_metadata?.full_name ?? user.email ?? 'Customer',
				reviewer_email: user.email ?? null,
				rating,
				title: title.trim(),
				comment: comment.trim(),
				status: 'pending',
				is_featured: false,
			})
			if (error) throw error
			toast({ title: 'Review submitted', description: 'It will appear after admin approval.', variant: 'success' })
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

	const starsInput = (
		<div className="flex items-center gap-1.5">
			{Array.from({ length: 5 }).map((_, index) => (
				<button
					key={index}
					type="button"
					onClick={() => setRating(index + 1)}
					className="cursor-pointer"
					aria-label={`Set rating ${index + 1}`}
				>
					<Star className={`w-5 h-5 ${index < rating ? 'fill-amber-400 text-amber-400' : 'text-amber-200'}`} />
				</button>
			))}
		</div>
	)

	return (
		<section className="mt-16 bg-card border border-border rounded-3xl overflow-hidden">
			<div className="p-6 md:p-8 border-b border-border bg-secondary/40">
				<div className="flex items-center justify-between gap-4 flex-wrap">
					<div>
						<p className="text-[10px] uppercase tracking-[0.22em] text-primary font-bold">Customer Feedback</p>
						<h2 className="text-2xl font-bold text-card-foreground mt-1">Reviews for {productName}</h2>
					</div>
					<div className="flex items-center gap-4">
						<div className="text-right">
							<p className="text-xl font-bold text-card-foreground">{summary.average ? summary.average.toFixed(1) : '0.0'}</p>
							<p className="text-xs text-muted-foreground">Average rating</p>
						</div>
						<div className="text-right">
							<p className="text-xl font-bold text-card-foreground">{summary.count}</p>
							<p className="text-xs text-muted-foreground">Approved reviews</p>
						</div>
					</div>
				</div>
				<div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
					<ShieldCheck className="w-3.5 h-3.5 text-primary" />
					Reviews are moderated before appearing publicly.
				</div>
			</div>

			<div className="grid lg:grid-cols-[1.3fr_0.9fr] gap-0">
				<div className="p-6 md:p-8 border-r border-border">
					{reviews === null ? (
						<div className="space-y-4">
							{Array.from({ length: 3 }).map((_, index) => (
								<div key={index} className="animate-pulse rounded-2xl border border-border p-4 h-28 bg-muted/30" />
							))}
						</div>
					) : reviews.length === 0 ? (
						<div className="text-center py-10 border border-dashed border-border rounded-3xl">
							<p className="text-sm text-muted-foreground">No approved reviews yet. Be the first to leave one.</p>
						</div>
					) : (
						<div className="space-y-4">
							{reviews.map((review) => (
								<article key={review.id} className="rounded-2xl border border-border bg-background p-5">
									<div className="flex items-start justify-between gap-4">
										<div className="flex items-center gap-3 min-w-0">
											<div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs shrink-0">
												{initials(review.reviewer_name) || 'CK'}
											</div>
											<div className="min-w-0">
												<p className="text-sm font-semibold text-card-foreground truncate">{review.reviewer_name}</p>
												<p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mt-0.5">
													{new Date(review.created_at).toLocaleDateString()}
												</p>
											</div>
										</div>
										<Stars value={review.rating} />
									</div>
									{review.title && <p className="mt-4 text-sm font-bold text-card-foreground">{review.title}</p>}
									<p className="mt-2 text-sm text-foreground/75 leading-relaxed whitespace-pre-line">{review.comment}</p>
								</article>
							))}
						</div>
					)}
				</div>

				<div className="p-6 md:p-8 bg-secondary/20">
					<h3 className="text-sm font-bold uppercase tracking-[0.16em] text-card-foreground">Write a Review</h3>
					<p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
						Tell others what you thought about {productName}. Your review will be published after approval.
					</p>

					{authLoading ? (
						<div className="mt-6 space-y-3">
							<div className="h-10 rounded-2xl bg-muted animate-pulse" />
							<div className="h-28 rounded-2xl bg-muted animate-pulse" />
						</div>
					) : user ? (
						myReview ? (
							<div className="mt-6 rounded-2xl border border-border bg-background p-4 text-sm">
								<p className="font-semibold text-card-foreground">You already submitted a review</p>
								<p className="text-xs text-muted-foreground mt-1">
									Status: <span className="font-semibold capitalize text-foreground">{myReview.status}</span>
								</p>
								<p className="text-xs text-muted-foreground mt-2">Only one review per product is allowed for each signed-in customer.</p>
							</div>
						) : (
							<div className="mt-6 space-y-4">
								<div>
									<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2">Rating</p>
									{starsInput}
								</div>
								<div>
									<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2">Title</p>
									<input
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										placeholder="What stood out most?"
										className="w-full px-4 py-3 border border-border rounded-2xl bg-background text-sm focus:outline-none focus:border-primary"
									/>
								</div>
								<div>
									<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2">Comment</p>
									<textarea
										value={comment}
										onChange={(e) => setComment(e.target.value)}
										placeholder="Share your honest experience"
										rows={6}
										className="w-full px-4 py-3 border border-border rounded-2xl bg-background text-sm focus:outline-none focus:border-primary resize-none"
									/>
								</div>
								<button
									onClick={submitReview}
									disabled={submitting}
									className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-[0.16em] hover:opacity-90 transition-all disabled:opacity-60"
								>
									{submitting && <Loader2 className="w-4 h-4 animate-spin" />}
									Submit Review
								</button>
							</div>
						)
					) : (
						<div className="mt-6 rounded-2xl border border-dashed border-border bg-background p-5 text-sm">
							<p className="text-foreground/80 leading-relaxed">Sign in to leave a review for this product.</p>
							<Link href="/auth/signin" className="inline-flex items-center gap-2 mt-4 text-xs font-bold uppercase tracking-[0.16em] text-primary hover:opacity-80">
								<MessageCircle className="w-3.5 h-3.5" />
								Sign In
							</Link>
						</div>
					)}
				</div>
			</div>
		</section>
	)
}