'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Star, ChevronLeft, ChevronRight, Award } from 'lucide-react'
import { fetchFeaturedTestimonials } from '@/lib/data'
import type { StoreTestimonial } from '@/lib/types'

function Stars({ value }: { value: number }) {
	return (
		<div className="flex items-center justify-center gap-1 text-[#599161] mb-6">
			{Array.from({ length: 5 }).map((_, index) => (
				<Star
					key={index}
					className={`w-5 h-5 ${index < value ? 'fill-[#599161]' : 'text-[#C8E6CE]'}`}
				/>
			))}
		</div>
	)
}

export function TestimonialsPreview() {
	const [testimonials, setTestimonials] = useState<StoreTestimonial[] | null>(null)
	const [currentIndex, setCurrentIndex] = useState(0)

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

	const currentTestimonial = testimonials && testimonials.length > 0 ? testimonials[currentIndex] : null

	const handlePrev = () => {
		if (!testimonials || testimonials.length === 0) return
		setCurrentIndex((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))
	}

	const handleNext = () => {
		if (!testimonials || testimonials.length === 0) return
		setCurrentIndex((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))
	}

	return (
		<section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
			{/* Centered Luxury Header */}
			<div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
				<p className="text-[11px] font-extrabold uppercase tracking-[0.25em] text-[#599161]">
					REAL STORIES
				</p>
				<h2 className="text-3xl sm:text-5xl font-serif font-normal text-[#111111] tracking-tight">
					What Our Customers Say
				</h2>
			</div>

			{testimonials === null ? (
				<div className="max-w-3xl mx-auto h-64 rounded-3xl bg-muted/40 animate-pulse" />
			) : !currentTestimonial ? (
				<div className="max-w-3xl mx-auto text-center py-16 border border-dashed border-[#E9ECEA] rounded-3xl bg-[#FAFBF9]">
					<p className="text-sm text-muted-foreground font-sans">
						Approved testimonials will appear here once published.
					</p>
				</div>
			) : (
				<div className="max-w-3xl mx-auto space-y-8">
					{/* Single Featured Testimonial Card */}
					<div className="bg-[#FAFBF9] border border-[#E9ECEA] rounded-3xl p-8 sm:p-14 text-center shadow-3xs relative font-sans transition-all">
						{/* Badge */}
						{currentTestimonial.is_featured && (
							<div className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1 rounded-full bg-[#EEF7F0] border border-[#C8E6CE] text-[#599161] text-[10px] font-extrabold uppercase tracking-wider mb-6">
								<Award className="w-3.5 h-3.5 text-[#599161]" />
								FEATURED
							</div>
						)}

						{/* Star Rating */}
						<Stars value={currentTestimonial.rating || 5} />

						{/* Testimonial Quote */}
						<blockquote className="font-serif italic text-lg sm:text-2xl text-[#111111] leading-relaxed max-w-2xl mx-auto mb-8">
							&ldquo;{currentTestimonial.comment}&rdquo;
						</blockquote>

						{/* Customer Info */}
						<div className="flex items-center justify-center gap-3.5 pt-2">
							<div className="w-12 h-12 rounded-full bg-white border border-[#E9ECEA] text-[#599161] font-extrabold text-sm flex items-center justify-center shadow-3xs shrink-0 font-sans">
								{currentTestimonial.customer_name
									.split(/\s+/)
									.filter(Boolean)
									.slice(0, 2)
									.map((p) => p[0]?.toUpperCase() ?? '')
									.join('') || 'CK'}
							</div>
							<div className="text-left min-w-0">
								<h4 className="font-serif font-bold text-[#111111] text-base leading-tight truncate">
									{currentTestimonial.customer_name}
								</h4>
								<p className="text-xs text-muted-foreground font-sans mt-0.5">
									Verified Customer
								</p>
							</div>
						</div>
					</div>

					{/* Carousel Controls */}
					{testimonials.length > 1 && (
						<div className="flex items-center justify-center gap-5 pt-2">
							<button
								type="button"
								onClick={handlePrev}
								className="w-10 h-10 rounded-full border border-[#E9ECEA] bg-white hover:bg-[#EEF7F0] hover:border-[#C8E6CE] text-[#111111] hover:text-[#599161] flex items-center justify-center transition-all cursor-pointer shadow-3xs"
								aria-label="Previous Testimonial"
							>
								<ChevronLeft className="w-5 h-5" />
							</button>

							{/* Pill Indicators */}
							<div className="flex items-center gap-2">
								{testimonials.map((_, idx) => (
									<button
										key={idx}
										type="button"
										onClick={() => setCurrentIndex(idx)}
										className={`transition-all rounded-full cursor-pointer ${
											idx === currentIndex
												? 'w-7 h-2 bg-[#599161]'
												: 'w-2 h-2 bg-[#E9ECEA] hover:bg-[#C8E6CE]'
										}`}
										aria-label={`Go to slide ${idx + 1}`}
									/>
								))}
							</div>

							<button
								type="button"
								onClick={handleNext}
								className="w-10 h-10 rounded-full border border-[#E9ECEA] bg-white hover:bg-[#EEF7F0] hover:border-[#C8E6CE] text-[#111111] hover:text-[#599161] flex items-center justify-center transition-all cursor-pointer shadow-3xs"
								aria-label="Next Testimonial"
							>
								<ChevronRight className="w-5 h-5" />
							</button>
						</div>
					)}
				</div>
			)}
		</section>
	)
}
