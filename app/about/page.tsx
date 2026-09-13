import type { Metadata } from 'next'
import { CmsPageView } from '@/components/cms-page'

export const metadata: Metadata = {
	title: 'About Us',
	description: 'Learn about CellKore — your trusted marketplace for premium new and refurbished phones, tablets, laptops, device repair, trade-ins, and wholesale bulk pricing.',
	alternates: { canonical: '/about' },
}

export default function AboutPage() {
	return <CmsPageView slug="about" fallbackTitle="About CellKore" />
}
