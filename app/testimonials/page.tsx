import type { Metadata } from 'next'
import TestimonialsPageClient from './testimonials-client'

export const metadata: Metadata = {
	title: 'Customer Testimonials',
	description: 'Read what CellKore customers say about buying devices, selling their phones, and getting repairs done right.',
	alternates: { canonical: '/testimonials' },
}

export default function TestimonialsPage() {
	return <TestimonialsPageClient />
}
