import type { Metadata } from 'next'
import FaqPageClient from './faq-client'

export const metadata: Metadata = {
	title: 'Frequently Asked Questions',
	description: 'Answers to common questions about buying devices, selling your phone, booking repairs, shipping, warranties, and wholesale orders at CellKore.',
	alternates: { canonical: '/faq' },
}

export default function FaqPage() {
	return <FaqPageClient />
}
