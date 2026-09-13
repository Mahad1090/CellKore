import type { Metadata } from 'next'
import { CmsPageView } from '@/components/cms-page'

export const metadata: Metadata = {
	title: 'Terms & Conditions',
	description: 'The terms and conditions governing purchases, repairs, device trade-ins, and wholesale orders on CellKore.',
	alternates: { canonical: '/terms' },
}

export default function TermsPage() {
	return <CmsPageView slug="terms" fallbackTitle="Terms & Conditions" />
}
