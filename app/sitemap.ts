import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/email/template'
import { fetchActiveCategories, fetchCatalogProducts, fetchWholesaleLots } from '@/lib/data'

// Static, evergreen routes — every real content page a visitor (or crawler)
// can land on outside of the dynamic catalog itself.
const STATIC_ROUTES: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
	{ path: '/', priority: 1.0, changeFrequency: 'daily' },
	{ path: '/products', priority: 0.9, changeFrequency: 'daily' },
	{ path: '/categories', priority: 0.8, changeFrequency: 'weekly' },
	{ path: '/wholesale', priority: 0.8, changeFrequency: 'daily' },
	{ path: '/spare-parts', priority: 0.7, changeFrequency: 'weekly' },
	{ path: '/repair', priority: 0.7, changeFrequency: 'weekly' },
	{ path: '/sell', priority: 0.7, changeFrequency: 'weekly' },
	{ path: '/about', priority: 0.6, changeFrequency: 'monthly' },
	{ path: '/contact', priority: 0.6, changeFrequency: 'monthly' },
	{ path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
	{ path: '/testimonials', priority: 0.5, changeFrequency: 'weekly' },
	{ path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
	{ path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
	{ path: '/return-policy', priority: 0.3, changeFrequency: 'yearly' },
	{ path: '/shipping-policy', priority: 0.3, changeFrequency: 'yearly' },
	{ path: '/data-deletion', priority: 0.2, changeFrequency: 'yearly' },
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
	const base = siteUrl()
	const now = new Date()

	const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((r) => ({
		url: `${base}${r.path}`,
		lastModified: now,
		changeFrequency: r.changeFrequency,
		priority: r.priority,
	}))

	// Best-effort dynamic sections — a failed fetch (e.g. DB hiccup at build
	// time) must never take down the whole sitemap, so each is isolated.
	const [categories, products, wholesaleLots] = await Promise.all([
		fetchActiveCategories().catch(() => []),
		fetchCatalogProducts({ limit: 5000 }).catch(() => []),
		fetchWholesaleLots().catch(() => []),
	])

	const categoryEntries: MetadataRoute.Sitemap = categories.map((c) => ({
		url: `${base}/products?category=${encodeURIComponent(c.slug)}`,
		lastModified: c.created_at ? new Date(c.created_at) : now,
		changeFrequency: 'weekly',
		priority: 0.6,
	}))

	const productEntries: MetadataRoute.Sitemap = products.map((p) => ({
		url: `${base}/products/${p.id}`,
		lastModified: p.updated_at ? new Date(p.updated_at) : now,
		changeFrequency: 'weekly',
		priority: 0.7,
	}))

	const wholesaleEntries: MetadataRoute.Sitemap = wholesaleLots.map((p) => ({
		url: `${base}/wholesale/${p.id}`,
		lastModified: p.updated_at ? new Date(p.updated_at) : now,
		changeFrequency: 'weekly',
		priority: 0.6,
	}))

	return [...staticEntries, ...categoryEntries, ...productEntries, ...wholesaleEntries]
}
