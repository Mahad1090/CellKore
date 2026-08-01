// Plain-JS copy of src/index.ts for pasting directly into the Cloudflare
// dashboard's online Worker editor (no TypeScript/wrangler build step).
// Keep this in sync with src/index.ts if the logic ever changes.

const ALLOWED_PREFIX = '/storage/v1/object/public/'
// shipping-labels is private + PII — never let this proxy touch it, even if
// the bucket's public flag ever gets flipped back on by mistake.
const BLOCKED_BUCKET_PREFIX = `${ALLOWED_PREFIX}shipping-labels/`

export default {
	async fetch(request, env, ctx) {
		if (request.method !== 'GET' && request.method !== 'HEAD') {
			return new Response('Method not allowed', { status: 405 })
		}

		const url = new URL(request.url)
		if (!url.pathname.startsWith(ALLOWED_PREFIX) || url.pathname.startsWith(BLOCKED_BUCKET_PREFIX)) {
			return new Response('Not found', { status: 404 })
		}

		const cache = caches.default
		const cacheKey = new Request(url.toString(), request)

		const cached = await cache.match(cacheKey)
		if (cached) {
			const hit = new Response(cached.body, cached)
			hit.headers.set('CF-Cache-Status', 'HIT')
			return hit
		}

		const originUrl = `https://${env.SUPABASE_HOST}${url.pathname}${url.search}`
		const originResponse = await fetch(originUrl, {
			method: request.method,
			headers: { 'User-Agent': request.headers.get('User-Agent') || 'cellkore-image-cdn' },
		})

		if (!originResponse.ok) {
			return new Response(originResponse.body, { status: originResponse.status, headers: originResponse.headers })
		}

		const headers = new Headers(originResponse.headers)
		headers.delete('set-cookie')
		headers.set('Cache-Control', 'public, max-age=31536000, immutable')
		headers.set('CF-Cache-Status', 'MISS')

		const response = new Response(originResponse.body, { status: originResponse.status, headers })

		// Stash a copy in the edge cache before returning — cache.put() reads
		// the body, so it must run on a clone, not the response we hand back.
		ctx.waitUntil(cache.put(cacheKey, response.clone()))

		return response
	},
}
