import type { Metadata } from 'next'
import { CmsPageView } from '@/components/cms-page'

export const metadata: Metadata = {
	title: 'Data Deletion Instructions',
	description: 'How to request deletion of your personal data from CellKore\'s systems.',
	alternates: { canonical: '/data-deletion' },
}

export default function DataDeletionPage() {
	return <CmsPageView slug="data-deletion" fallbackTitle="Data Deletion Instructions" />
}
