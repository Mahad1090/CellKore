import type { Metadata } from 'next'
import ProductsPageClient from './products-client'

export const metadata: Metadata = {
	title: 'Shop All Devices',
	description: 'Browse CellKore\'s full range of new and refurbished phones, iPads & tablets, laptops, smartwatches, and accessories — filter by brand, price, and condition.',
	alternates: { canonical: '/products' },
}

export default function ProductsPage() {
	return <ProductsPageClient />
}
