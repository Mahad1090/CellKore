import type { Metadata } from 'next'
import CategoriesPageClient from './categories-client'

export const metadata: Metadata = {
	title: 'Shop by Category',
	description: 'Browse CellKore\'s full catalog by category — phones, iPads & tablets, laptops, smartwatches, accessories, spare parts, and wholesale lots.',
	alternates: { canonical: '/categories' },
}

export default function CategoriesPage() {
	return <CategoriesPageClient />
}
