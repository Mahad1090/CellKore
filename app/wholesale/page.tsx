import type { Metadata } from 'next'
import WholesalePageClient from './wholesale-client'

export const metadata: Metadata = {
	title: 'Wholesale Bulk Device Lots',
	description: 'Shop wholesale bulk lots of phones, tablets, and laptops at tiered pricing. Ideal for resellers and businesses buying in volume.',
	alternates: { canonical: '/wholesale' },
}

export default function WholesalePage() {
	return <WholesalePageClient />
}
