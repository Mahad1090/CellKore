'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Loader2, MessageCircle, Star, Quote, Sparkles } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { useAuth } from '@/contexts/auth-context'
import { useToast } from '@/components/ui/toast'
import { fetchApprovedTestimonials } from '@/lib/data'
import { supabase } from '@/lib/supabase'
import type { StoreTestimonial } from '@/lib/types'

function Stars({ value }: { value: number }) {
	return (
		<div className="flex items-center gap-0.5 text-amber-400">
			{Array.from({ length: 5 }).map((_, index) => (
				<Star key={index} className={`w-3.5 h-3.5 ${index < value ? 'fill-current' : 'text-amber-200'}`} />
			))}
		</div>
	)
}

export default function TestimonialsPage() {
	const { user, loading: authLoading } = useAuth()
	const { toast } = useToast()
	const [testimonials, setTestimonials] = useState<StoreTestimonial[] | null>(null)
	const [rating, setRating] = useState(5)
	const [title, setTitle] = useState('')
	const [comment, setComment] = useState('')
	const [submitting, setSubmitting] = useState(false)

	useEffect(() => {
		let active = true
		fetchApprovedTestimonials()
			.then((data) => {
				if (active) setTestimonials(data)
			})
			.catch(() => {
				if (active) setTestimonials([])
			})
		return () => {
			active = false
		}
	}, [])

	const submitTestimonial = async () => {
		if (!user) {
			toast({ title: 'Sign in required', description: 'Please sign in to share your testimonial.', variant: 'error' })
			return
		}
		if (!title.trim() || !comment.trim()) {
			toast({ title: 'Missing details', description: 'Please add a title and testimonial message.', variant: 'error' })
			return
		}
		setSubmitting(true)
		try {
			const { error } = await supabase.from('store_testimonials').insert({
				user_id: user.id,
				customer_name: user.user_metadata?.full_name ?? user.email ?? 'Customer',
				customer_email: user.email ?? null,
				rating,
				title: title.trim(),
				comment: comment.trim(),
				status: 'pending',
				is_featured: false,
			})
			if (error) throw error
			toast({ title: 'Testimonial submitted', description: 'It will appear after admin approval.', variant: 'success' })
			setTitle('')
			setComment('')
			setRating(5)
			fetchApprovedTestimonials().then(setTestimonials).catch(() => undefined)
		} catch (error) {
			toast({ title: 'Submission failed', description: error instanceof Error ? error.message : undefined, variant: 'error' })
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<main className="min-h-screen bg-background">
			<Navigation />
			<section className="bg-primary text-primary-foreground py-12">
				<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
					<p className="text-[10px] uppercase tracking-[0.24em] opacity-80 mb-3">Testimonials</p>
					<h1 className="text-3xl md:text-4xl font-bold tracking-luxury uppercase">Customer Stories</h1>
					<p className="mt-3 max-w-2xl text-sm opacity-90">
						See what customers say about CellKore and share your own experience.
					</p>
				</div>
			</section>

			<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid lg:grid-cols-[1.15fr_0.85fr] gap-8">
				<div className="space-y-6">
					<div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em] text-primary">
						<Sparkles className="w-3.5 h-3.5" /> Approved testimonials
					</div>
					{testimonials === null ? (
						<div className="grid sm:grid-cols-2 gap-4">
							{Array.from({ length: 4 }).map((_, index) => (
								<div key={index} className="animate-pulse h-44 rounded-3xl bg-muted" />
							))}
						</div>
					) : testimonials.length === 0 ? (
						<div className="text-center py-16 border border-dashed border-border rounded-3xl bg-card">
							<p className="text-sm text-muted-foreground">No approved testimonials yet.</p>
						</div>
					) : (
						<div className="grid sm:grid-cols-2 gap-4">
							{testimonials.map((testimonial) => (
								<article key={testimonial.id} className="bg-card border border-border rounded-3xl p-6 shadow-sm">
									<div className="flex items-start justify-between gap-4">
										<div>
											<p className="text-sm font-semibold text-card-foreground">{testimonial.customer_name}</p>
											<p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mt-0.5">{new Date(testimonial.created_at).toLocaleDateString()}</p>
										</div>
										<Stars value={testimonial.rating} />
									</div>
									<Quote className="w-5 h-5 text-primary/20 mt-5" />
									{testimonial.title && <p className="mt-3 text-sm font-bold text-card-foreground">{testimonial.title}</p>}
									<p className="mt-2 text-sm text-foreground/75 leading-relaxed">{testimonial.comment}</p>
								</article>
							))}
						</div>
					)}
				</div>

				<div className="bg-card border border-border rounded-3xl p-7 h-fit sticky top-6">
					<h2 className="text-sm font-bold uppercase tracking-[0.16em] text-card-foreground">Share Your Story</h2>
					<p className="text-sm text-muted-foreground mt-2 leading-relaxed">
						We publish testimonials after moderation. Sign in to submit your feedback.
					</p>

					{authLoading ? (
						<div className="mt-6 space-y-3">
							<div className="h-10 bg-muted animate-pulse rounded-2xl" />
							<div className="h-28 bg-muted animate-pulse rounded-2xl" />
						</div>
					) : user ? (
						<div className="mt-6 space-y-4">
							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2">Rating</p>
								<div className="flex items-center gap-1.5">
									{Array.from({ length: 5 }).map((_, index) => (
										<button key={index} type="button" onClick={() => setRating(index + 1)} aria-label={`Set rating ${index + 1}`}>
											<Star className={`w-5 h-5 ${index < rating ? 'fill-amber-400 text-amber-400' : 'text-amber-200'}`} />
										</button>
									))}
								</div>
							</div>
							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2">Title</p>
								<input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-4 py-3 border border-border rounded-2xl bg-background text-sm focus:outline-none focus:border-primary" placeholder="What did you love most?" />
							</div>
							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2">Message</p>
								<textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={6} className="w-full px-4 py-3 border border-border rounded-2xl bg-background text-sm focus:outline-none focus:border-primary resize-none" placeholder="Tell us about your experience" />
							</div>
							<button onClick={submitTestimonial} disabled={submitting} className="w-full inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-[0.16em] hover:opacity-90 transition-all disabled:opacity-60">
								{submitting && <Loader2 className="w-4 h-4 animate-spin" />}
								Submit Testimonial
							</button>
						</div>
					) : (
						<div className="mt-6 rounded-2xl border border-dashed border-border bg-secondary/40 p-5 text-sm">
							<p className="text-foreground/80 leading-relaxed">Please sign in to submit a testimonial.</p>
							<Link href="/auth/signin" className="inline-flex items-center gap-2 mt-4 text-xs font-bold uppercase tracking-[0.16em] text-primary hover:opacity-80">
								<MessageCircle className="w-3.5 h-3.5" />
								Sign In
							</Link>
						</div>
					)}
				</div>
			</section>

			<Footer />
		</main>
	)
}
