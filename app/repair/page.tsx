import type { Metadata } from 'next'
import RepairPageClient from './repair-client'

export const metadata: Metadata = {
	title: 'Device Repair & Restoration',
	description: 'Professional screen, battery, component, and chip-level repair for smartphones, tablets, laptops, and smartwatches. Book a repair and track its status online.',
	alternates: { canonical: '/repair' },
}

export default function RepairPage() {
	return <RepairPageClient />
}
