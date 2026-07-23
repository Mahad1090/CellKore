'use client'

import { useEffect, useState } from 'react'
import { Star, Send, CheckCircle2, MessageSquareHeart, Edit3, Clock, AlertCircle } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
import { fetchMyStoreTestimonial } from '@/lib/data'
import type { StoreTestimonial } from '@/lib/types'

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

	const [existingReview, setExistingReview] = useState<StoreTestimonial | null>(null)
	const [loadingExisting, setLoadingExisting] = useState(true)
	const [isEditing, setIsEditing] = useState(false)

	const [rating, setRating] = useState(0)
	const [hoverRating, setHoverRating] = useState<number | null>(null)
	const [reviewTitle, setReviewTitle] = useState('')
	const [comment, setComment] = useState('')
	const [customerName, setCustomerName] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [submitted, setSubmitted] = useState(false)

	useEffect(() => {
		if (user) {
			setCustomerName(user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '')
			fetchMyStoreTestimonial(user.id)
				.then((rev) => {
					setExistingReview(rev)
				})
				.catch(() => undefined)
				.finally(() => setLoadingExisting(false))
		} else {
			setLoadingExisting(false)
		}
	}, [user])

	const handleStartEdit = () => {
		if (!existingReview) return
		setRating(existingReview.rating)
		setReviewTitle(existingReview.title ?? '')
		setComment(existingReview.comment)
		setCustomerName(existingReview.customer_name)
		setIsEditing(true)
		setSubmitted(false)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (rating < 1) {
			toast({ title: 'Rating required', description: 'Please select a star rating.', variant: 'error' })
			return
		}
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
			if (existingReview) {
				// UPDATE EXISTING REVIEW -> Sets status back to 'pending' for admin approval!
				const { error } = await supabase
					.from('store_testimonials')
					.update({
						customer_name: customerName.trim(),
						rating,
						title: reviewTitle.trim() || 'Store Experience',
						comment: comment.trim(),
						status: 'pending',
						updated_at: new Date().toISOString(),
					})
					.eq('id', existingReview.id)

				if (error) throw error

				toast({
					title: 'Review Updated!',
					description: 'Your edited store review has been submitted for admin re-approval.',
					variant: 'success',
				})
			} else {
				// INSERT NEW REVIEW
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
					description: 'Thank you for your feedback! It will be published after admin review.',
					variant: 'success',
				})
			}

			setSubmitted(true)
			setIsEditing(false)
			if (user) {
				const fresh = await fetchMyStoreTestimonial(user.id).catch(() => null)
				if (fresh) setExistingReview(fresh)
			}
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

	// 1. Existing Review display view (when user has already submitted a review and is not editing)
	if (existingReview && !isEditing && !submitted) {
		const isPending = existingReview.status === 'pending'
		const isApproved = existingReview.status === 'approved'

		return (
			<div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
				<div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b border-border/60">
					<div className="flex items-center gap-3">
						<div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
							<MessageSquareHeart className="w-5 h-5" />
						</div>
						<div>
							<h3 className="text-sm font-extrabold uppercase tracking-luxury text-card-foreground">
								Your Store Review
							</h3>
							<p className="text-xs text-muted-foreground">
								You have already submitted a review for CellKore. You can edit it below anytime.
							</p>
						</div>
					</div>

					<button
						type="button"
						onClick={handleStartEdit}
						className="px-4 py-2 bg-secondary hover:bg-muted text-foreground border border-border rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer"
					>
						<Edit3 className="w-3.5 h-3.5 text-primary" />
						Edit Review
					</button>
				</div>

				<div className="bg-muted/20 border border-border/70 rounded-2xl p-5 space-y-3 font-sans">
					<div className="flex items-center justify-between flex-wrap gap-2">
						{/* Status Badge */}
						<span
							className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
								isPending
									? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
									: isApproved
									? 'bg-[#EEF7F0] text-[#599161] border border-[#C8E6CE]'
									: 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
							}`}
						>
							{isPending ? (
								<>
									<Clock className="w-3 h-3" /> PENDING ADMIN APPROVAL
								</>
							) : isApproved ? (
								<>
									<CheckCircle2 className="w-3 h-3" /> PUBLISHED / APPROVED
								</>
							) : (
								<>
									<AlertCircle className="w-3 h-3" /> REJECTED
								</>
							)}
						</span>

						{/* Star Rating */}
						<div className="flex items-center gap-0.5 text-[#599161]">
							{Array.from({ length: 5 }).map((_, index) => (
								<Star
									key={index}
									className={`w-4 h-4 ${index < existingReview.rating ? 'fill-[#599161]' : 'text-[#C8E6CE]'}`}
								/>
							))}
						</div>
					</div>

					{existingReview.title && (
						<p className="font-bold text-sm text-foreground">{existingReview.title}</p>
					)}
					<p className="text-xs text-foreground/80 leading-relaxed italic">
						&ldquo;{existingReview.comment}&rdquo;
					</p>
					<p className="text-[10px] text-muted-foreground pt-1">
						Submitted on {new Date(existingReview.created_at).toLocaleDateString()}
						{existingReview.updated_at && ` · Updated ${new Date(existingReview.updated_at).toLocaleDateString()}`}
					</p>
				</div>
			</div>
		)
	}

	// 2. Thank you view after submit/update
	if (submitted) {
		return (
			<div className="bg-card border border-[#C8E6CE] bg-[#F4F9F5] rounded-3xl p-8 text-center space-y-4 font-sans">
				<div className="w-12 h-12 mx-auto rounded-full bg-[#EEF7F0] border border-[#C8E6CE] flex items-center justify-center text-[#599161]">
					<CheckCircle2 className="w-6 h-6" />
				</div>
				<h3 className="text-base font-extrabold uppercase tracking-luxury text-foreground">
					{existingReview ? 'Review Updated & Sent for Approval!' : 'Thank You For Your Review!'}
				</h3>
				<p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
					{existingReview
						? 'Your edits have been saved and sent to the admin team for re-approval. It will update on the site as soon as approved.'
						: 'Your feedback helps us continuously improve. Your review has been submitted for admin approval.'}
				</p>
				<button
					type="button"
					onClick={() => {
						setSubmitted(false)
						setIsEditing(false)
					}}
					className="px-5 py-2 bg-[#599161] hover:bg-[#46754e] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer"
				>
					View My Review
				</button>
			</div>
		)
	}

	// 3. New Review or Edit Review Form
	return (
		<div className="bg-card border border-border/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
			<div className="flex items-center justify-between gap-3 pb-4 border-b border-border/60">
				<div className="flex items-center gap-3">
					<div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
						<MessageSquareHeart className="w-5 h-5" />
					</div>
					<div>
						<h3 className="text-sm font-extrabold uppercase tracking-luxury text-card-foreground">
							{existingReview ? 'Edit Your Store Review' : title}
						</h3>
						<p className="text-xs text-muted-foreground">
							{existingReview
								? 'Updating your review will require admin re-approval before appearing on the site.'
								: subtitle}
						</p>
					</div>
				</div>

				{isEditing && (
					<button
						type="button"
						onClick={() => setIsEditing(false)}
						className="text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer underline"
					>
						Cancel Edit
					</button>
				)}
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
									className="p-1 text-[#599161] hover:scale-125 transition-transform cursor-pointer focus:outline-none"
									title={`${star} Star${star > 1 ? 's' : ''}`}
								>
									<Star className={`w-6 h-6 ${active ? 'fill-[#599161]' : 'text-[#C8E6CE]'}`} />
								</button>
							)
						})}
						<span className="ml-2 font-bold text-foreground text-xs">
							{rating === 0 ? 'Select a Rating' : `${rating} of 5 Stars`}
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
					className="w-full py-3 px-6 bg-[#599161] text-white font-extrabold text-xs uppercase tracking-[0.16em] rounded-full hover:bg-[#46754e] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
				>
					{submitting ? (
						<span>Saving...</span>
					) : (
						<>
							<Send className="w-3.5 h-3.5" />
							{existingReview ? 'Update Store Review & Resubmit' : 'Submit Store Review'}
						</>
					)}
				</button>
			</form>
		</div>
	)
}
