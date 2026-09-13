import type { Metadata } from 'next'
import { cache } from 'react'
import { fetchProductById } from '@/lib/data'
import { primaryImage, type Product } from '@/lib/types'
import { siteUrl } from '@/lib/email/template'
import ProductDetailPageClient from './product-detail-client'

// Both generateMetadata and the page component need the same product —
// React's request-scoped cache collapses that into a single DB round-trip.
const getProduct = cache((id: string) => fetchProductById(id).catch(() => null))

// `brand` is optional in the DB — join it in only when present, instead of
// stringifying a literal "null" into the title/schema.
function displayName(product: Product): string {
	return [product.brand, product.name].filter(Boolean).join(' ').trim()
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
	const { id } = await params
	const product = await getProduct(id)
	if (!product) {
		return {
			title: 'Product Not Found',
			robots: { index: false, follow: true },
		}
	}
	const price = Number(product.base_price) * (1 - (product.discount_percent ?? 0) / 100)
	const title = displayName(product)
	const description =
		product.description?.slice(0, 155) ||
		`Buy the ${title} at CellKore — ${product.condition} condition, starting at $${price.toFixed(2)}. Fast shipping across the US and Canada.`
	const image = primaryImage(product)

	return {
		title,
		description,
		alternates: { canonical: `/products/${product.id}` },
		openGraph: {
			title,
			description,
			url: `${siteUrl()}/products/${product.id}`,
			images: image ? [{ url: image }] : undefined,
			type: 'website',
		},
	}
}

export default async function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	const product = await getProduct(id)

	const schema = product
		? {
				'@context': 'https://schema.org',
				'@type': 'Product',
				name: displayName(product),
				description: product.description || undefined,
				image: primaryImage(product) || undefined,
				brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
				sku: product.sku || undefined,
				offers: {
					'@type': 'Offer',
					url: `${siteUrl()}/products/${product.id}`,
					priceCurrency: 'USD',
					price: (Number(product.base_price) * (1 - (product.discount_percent ?? 0) / 100)).toFixed(2),
					availability: 'https://schema.org/InStock',
					itemCondition:
						product.condition === 'new'
							? 'https://schema.org/NewCondition'
							: 'https://schema.org/UsedCondition',
				},
			}
		: null

	return (
		<>
			{schema && (
				<script
					type="application/ld+json"
					// eslint-disable-next-line react/no-danger
					dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
				/>
			)}
			<ProductDetailPageClient />
		</>
	)
}
