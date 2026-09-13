import type { MetadataRoute } from 'next'
import { siteUrl } from '@/lib/email/template'

// Utility/account/checkout flows and the admin section carry no unique
// public content and must never be indexed — everything else (storefront,
// products, policy pages) is fair game.
export default function robots(): MetadataRoute.Robots {
	const base = siteUrl()
	return {
		rules: [
			{
				userAgent: '*',
				allow: '/',
				disallow: [
					'/admin',
					'/admin/',
					'/api/',
					'/account',
					'/cart',
					'/checkout',
					'/wishlist',
					'/auth/',
					'/sell/track',
					'/repair/status',
					'/newsletter/unsubscribe',
				],
			},
		],
		sitemap: `${base}/sitemap.xml`,
		host: base,
	}
}
