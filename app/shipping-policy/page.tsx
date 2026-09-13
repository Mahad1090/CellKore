import type { Metadata } from 'next'
import { CmsPageView } from '@/components/cms-page'

export const metadata: Metadata = {
	title: 'Shipping & Delivery Policy',
	description: 'CellKore\'s shipping and delivery policy — carriers, timelines, and coverage across the US and Canada marketplaces.',
	alternates: { canonical: '/shipping-policy' },
}

export default function ShippingPolicyPage() {
	return <CmsPageView slug="shipping-policy" fallbackTitle="Shipping & Delivery Policy" />
}
