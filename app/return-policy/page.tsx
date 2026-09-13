import type { Metadata } from 'next'
import { CmsPageView } from '@/components/cms-page'

export const metadata: Metadata = {
	title: 'Return & Refund Policy',
	description: 'CellKore\'s return and refund policy for devices, accessories, and spare parts — eligibility windows, condition requirements, and how to start a return.',
	alternates: { canonical: '/return-policy' },
}

export default function ReturnPolicyPage() {
	return <CmsPageView slug="return-policy" fallbackTitle="Return & Refund Policy" />
}
