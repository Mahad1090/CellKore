import type { Metadata } from 'next'
import { cache } from 'react'
import { fetchProductById } from '@/lib/data'
import { primaryImage, type Product } from '@/lib/types'
import { siteUrl } from '@/lib/email/template'
import WholesaleDetailPageClient from './wholesale-detail-client'

const getLot = cache((id: string) => fetchProductById(id).catch(() => null))

// `brand` is optional in the DB — join it in only when present, instead of
// stringifying a literal "null" into the title.
function displayName(lot: Product): string {
	return [lot.brand, lot.name].filter(Boolean).join(' ').trim()
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params
	const lot = await getLot(id)
	if (!lot) {
		return { title: 'Bundle Not Found', robots: { index: false, follow: true } }
	}
	const name = displayName(lot)
	const title = `${name} — Wholesale Lot`
	const description =
		lot.description?.slice(0, 155) ||
		`Buy the ${name} wholesale bundle at CellKore with tiered bulk pricing for resellers and businesses.`
	const image = primaryImage(lot)

	return {
		title,
		description,
		alternates: { canonical: `/wholesale/${lot.id}` },
		openGraph: {
			title,
			description,
			url: `${siteUrl()}/wholesale/${lot.id}`,
			images: image ? [{ url: image }] : undefined,
		},
	}
}

export default function WholesaleDetailPage() {
	return <WholesaleDetailPageClient />
}
