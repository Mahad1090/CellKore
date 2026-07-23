'use client'

import { useState } from 'react'
import { Star, Send, CheckCircle2, MessageSquareHeart } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'

export function StoreReviewForm({
	onSuccess,
	title = 'How was your experience?',
	subtitle = 'Share your feedback with CellKore customers',
}: {
	onSuccess?: () => void
	title?: string
	subtitle?: string
}) {
	const { user } = useAuth()
	const { toast } = useToast()

	const [rating, setRating] = useState(5)
	const [hoverRating, setHoverRating] = useState<number | null>(null)
	const [reviewTitle, setReviewTitle] = useState('')
	const [comment, setComment] = useState('')
	const [customerName, setCustomerName] = useState(
		user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? ''
	)
	const [submitting, setSubmitting] = useState(false)
	const [submitted, setSubmitted] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!customerName.trim()) {
			toast({ title: 'Name required', description: 'Please enter your name.', variant: 'error' })
			return
		}
		if (!comment.trim()) {
			toast({ title: 'Comment required', description: 'Please write a brief review.', variant: 'error' })
			return
		}

		setSubmitting(true)
		try {
			const { error } = await supabase.from('store_testimonials').insert({
				user_id: user?.id ?? null,
				customer_name: customerName.trim(),
				customer_email: user?.email ?? null,
				rating,
				title: reviewTitle.trim() || 'Store Experience',
				comment: comment.trim(),
				status: 'pending',
				is_featured: false,
			})

			if (error) throw error

			toast({
				title: 'Review Submitted!',
				description: 'Thank you for your feedback! It will be published after review.',
				variant: 'success',
			})
			setSubmitted(true)
			if (onSuccess) onSuccess()
		} catch (err) {
			toast({
				title: 'Submission failed',
				description: err instanceof Error ? err.message : 'Could not save review.',
				variant: 'error',
			})
		} finally {
			setSubmitting(false)
		}
	}

	if (submitted) {
		return (
			<div className="bg-card border border-[#C8E6CE] bg-[#F4F9F5] rounded-3xl p-8 text-center space-y-3">
				<div className="w-12 h-12 mx-auto rounded-full bg-[#EEF7F0] border border-[#C8E6CE] flex items-center justify-center text-[#599161]">
					<CheckCircle2 className="w-6 h-6" />
				</div>
				<h3 className="text-base font-extrabold uppercase tracking-luxury text-foreground">
					Thank You For Your Review!
				</h3>
				<p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
					Your feedback helps us continuously improve our service and inventory. Your review has been submitted for publication.
				</p>
			</div>
		)
	}

	return (
		<div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
			<div className="flex items-center gap-3 pb-4 border-b border-border/60">
				<div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
					<MessageSquareHeart className="w-5 h-5" />
				</div>
				<div>
					<h3 className="text-sm font-extrabold uppercase tracking-luxury text-card-foreground">
						{title}
					</h3>
					<p className="text-xs text-muted-foreground">{subtitle}</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-4 text-xs">
				{/* Rating Stars */}
				<div>
					<label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground block mb-2">
						Your Rating
					</label>
					<div className="flex items-center gap-1.5">
						{[1, 2, 3, 4, 5].map((star) => {
							const active = (hoverRating ?? rating) >= star
							return (
								<button
									key={star}
									type="button"
									onMouseEnter={() => setHoverRating(star)}
									onMouseLeave={() => setHoverRating(null)}
									onClick={() => setRating(star)}
									className="p-1 text-amber-400 hover:scale-125 transition-transform cursor-pointer focus:outline-none"
									title={`${star} Star${star > 1 ? 's' : ''}`}
								>
									<Star className={`w-6 h-6 ${active ? 'fill-current' : 'text-muted-foreground/30'}`} />
								</button>
							);
						})}
						<span className="ml-2 font-bold text-foreground text-xs">
							{rating} of 5 Star{rating > 1 ? 's' : ''}
						</span>
					</div>
				</div>

				{/* Name */}
				<div>
					<label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground block mb-1.5">
						Your Name
					</label>
					<input
						type="text"
						required
						value={customerName}
						onChange={(e) => setCustomerName(e.target.value)}
						placeholder="e.g. Alex M."
						className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:border-primary focus:outline-none transition-colors"
					/>
				</div>

				{/* Review Title */}
				<div>
					<label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground block mb-1.5">
						Headline / Summary
					</label>
					<input
						type="text"
						value={reviewTitle}
						onChange={(e) => setReviewTitle(e.target.value)}
						placeholder="e.g. Great prices and fast dispatch!"
						className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:border-primary focus:outline-none transition-colors"
					/>
				</div>

				{/* Comment */}
				<div>
					<label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground block mb-1.5">
						Your Store Review
					</label>
					<textarea
						rows={3}
						required
						value={comment}
						onChange={(e) => setComment(e.target.value)}
						placeholder="Tell us about your experience buying, selling, or repairing devices with CellKore..."
						className="w-full px-4 py-2.5 rounded-xl border border-border bg-background text-foreground text-xs focus:border-primary focus:outline-none transition-colors resize-none"
					/>
				</div>

				<button
					type="submit"
					disabled={submitting}
					className="w-full py-3 px-6 bg-primary text-primary-foreground font-bold text-xs uppercase tracking-[0.16em] rounded-full hover:opacity-90 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
				>
					{submitting ? (
						<span>Submitting...</span>
					) : (
						<>
							<Send className="w-3.5 h-3.5" /> Submit Store Review
						</>
					)}
				</button>
			</form>
		</div>
	)
}
