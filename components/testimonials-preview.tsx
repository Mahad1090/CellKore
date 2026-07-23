'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, Quote } from 'lucide-react'
import { fetchFeaturedTestimonials } from '@/lib/data'
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

export function TestimonialsPreview() {
	const [testimonials, setTestimonials] = useState<StoreTestimonial[] | null>(null)

	useEffect(() => {
		let active = true
		fetchFeaturedTestimonials()
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

	return (
		<section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
			<div className="flex flex-wrap items-end justify-between gap-4 mb-10 pb-5 border-b border-border/60">
				<div>
					<div className="flex items-center gap-2 mb-2">
						<span className="h-0.5 w-6 bg-primary rounded-full inline-block" />
						<p className="text-[10px] uppercase tracking-[0.28em] text-primary font-bold">Verified Reviews</p>
					</div>
					<h2 className="text-2xl sm:text-4xl font-extrabold tracking-luxury uppercase text-foreground bg-gradient-to-r from-foreground via-foreground/90 to-primary/80 bg-clip-text text-transparent">
						What Our Customers Say
					</h2>
				</div>
				<Link href="/testimonials" className="glow-outline-btn glow-outline-primary">
					<span className="glow-outline-beam" />
					<span className="glow-outline-inner px-4.5 py-2 text-xs font-bold uppercase tracking-[0.18em] text-primary">
						Read All Testimonials
					</span>
				</Link>
			</div>

			{testimonials === null ? (
				<div className="grid md:grid-cols-3 gap-4">
					{Array.from({ length: 3 }).map((_, index) => (
						<div key={index} className="animate-pulse h-48 rounded-3xl bg-muted" />
					))}
				</div>
			) : testimonials.length === 0 ? (
				<div className="text-center py-14 border border-dashed border-border rounded-3xl">
					<p className="text-sm text-muted-foreground">Approved testimonials will appear here once published.</p>
				</div>
			) : (
				<div className="grid md:grid-cols-3 gap-4">
					{testimonials.map((testimonial) => (
						<article key={testimonial.id} className="bg-card border border-border rounded-3xl p-6 shadow-sm">
							<div className="flex items-start justify-between gap-3">
								<div className="flex items-center gap-3 min-w-0">
									<div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
										{testimonial.customer_name.split(/\s+/).filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? '').join('') || 'CK'}
									</div>
									<div className="min-w-0">
										<p className="text-sm font-semibold text-card-foreground truncate">{testimonial.customer_name}</p>
										<p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground mt-0.5">{new Date(testimonial.created_at).toLocaleDateString()}</p>
									</div>
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
		</section>
	)
}
