const CDN_HOST = process.env.NEXT_PUBLIC_IMAGE_CDN_HOST

/**
 * Rewrites a Supabase Storage public URL to the caching CDN proxy in front
 * of it. No-op (returns the URL unchanged) until NEXT_PUBLIC_IMAGE_CDN_HOST
 * is set, so this is safe to wire in ahead of the CDN actually existing.
 * Never applies to shipping-labels — that bucket is private and served via
 * short-lived signed URLs, not a cache.
 */
export function toImageCdnUrl(supabasePublicUrl: string): string {
	if (!CDN_HOST) return supabasePublicUrl
	const marker = '/storage/v1/object/public/'
	const idx = supabasePublicUrl.indexOf(marker)
	if (idx < 0) return supabasePublicUrl
	return `${CDN_HOST.replace(/\/$/, '')}${supabasePublicUrl.slice(idx)}`
}
