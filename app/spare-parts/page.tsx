import type { Metadata } from 'next'
import SparePartsPageClient from './spare-parts-client'

export const metadata: Metadata = {
	title: 'Spare Parts & Components',
	description: 'Shop genuine and high-quality spare parts for phones, tablets, and laptops — screens, batteries, cameras, charging ports, and more.',
	alternates: { canonical: '/spare-parts' },
}

export default function SparePartsPage() {
	return <SparePartsPageClient />
}
