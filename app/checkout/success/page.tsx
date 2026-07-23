'use client'

import { Suspense, useEffect } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2 } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { StoreReviewForm } from '@/components/store-review-form'
import { clearLocalCart } from '@/lib/cart'

export default function CheckoutSuccessPage() {
	return (
		<Suspense fallback={null}>
			<SuccessContent />
		</Suspense>
	)
}

function SuccessContent() {
	const searchParams = useSearchParams()
	const reference = searchParams.get('ref')

	useEffect(() => {
		clearLocalCart()
		localStorage.removeItem('cellkore_checkout_draft')
	}, [])

	return (
		<main className="min-h-screen bg-background">
			<Navigation />
			<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
				<div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-8">
					<CheckCircle2 className="w-9 h-9 text-primary" />
				</div>
				<h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-luxury uppercase mb-4">
					Order Confirmed
				</h1>
				{reference && (
					<p className="text-sm text-muted-foreground mb-2 uppercase tracking-[0.18em]">
						Order Reference
					</p>
				)}
				{reference && (
					<p className="text-xl font-bold text-primary mb-8 tracking-wider">{reference}</p>
				)}
				<p className="text-sm text-foreground/75 leading-relaxed mb-10">
					Thank you for your purchase. A confirmation has been sent to your email. Keep your order
					reference for any support inquiries. All sales are final per our No Return & Exchange Policy.
				</p>
				<Link
					href="/products?category=iphones"
					className="inline-block px-8 py-3.5 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-[0.18em] hover:opacity-90 transition-all mb-12"
				>
					Continue Shopping
				</Link>

				<div className="text-left">
					<StoreReviewForm
						title="How was your checkout experience?"
						subtitle="Leave a store review to help future CellKore customers"
					/>
				</div>
			</div>
			<Footer />
		</main>
	)
}
