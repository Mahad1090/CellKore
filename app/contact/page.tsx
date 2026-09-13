import type { Metadata } from 'next'
import ContactPageClient from './contact-client'

export const metadata: Metadata = {
	title: 'Contact Us',
	description: 'Get in touch with CellKore for order support, device repair questions, sell-your-device inquiries, or wholesale bulk pricing.',
	alternates: { canonical: '/contact' },
}

export default function ContactPage() {
	return <ContactPageClient />
}
