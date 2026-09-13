import type { Metadata } from 'next'
import { CmsPageView } from '@/components/cms-page'

export const metadata: Metadata = {
	title: 'Privacy Policy',
	description: 'Read how CellKore collects, uses, and protects your personal information across our storefront, repair, sell, and wholesale services.',
	alternates: { canonical: '/privacy' },
}

export default function PrivacyPage() {
	return <CmsPageView slug="privacy" fallbackTitle="Privacy Policy" />
}
