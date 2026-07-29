import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { StockError } from '@/lib/checkout-server'
import { getCanadaPostShippingRates } from '@/lib/shipping/aggregator'
import { resolveRateRequest, type RateRequestBody, type RateRequestResolution } from '@/lib/shipping/rate-request'

// The checkout page retries this specific endpoint with backoff on a
// transient Canada Post failure (see app/checkout/page.tsx) — up to ~a
// minute of attempts for the same cart/address. Without this, every retry
// would redo resolveRateRequest's DB round trip (stock/price
// re-validation) even though only the carrier rating call actually failed.
// A short-lived cache keyed by the exact cart+address, plus in-flight
// coalescing for any genuinely concurrent calls, means only the first
// attempt pays for that lookup. Only successful resolutions are cached —
// a StockError/validation failure is never cached, so it's re-checked
// fresh next time rather than staying wrong for the TTL window.
const RESOLVE_CACHE_TTL_MS = 60_000
const resolveCache = new Map<string, { data: RateRequestResolution; expiresAt: number }>()
const resolveInFlight = new Map<string, Promise<RateRequestResolution>>()

function buildResolveKey(body: RateRequestBody): string {
	const items = (body.cartItems ?? [])
		.map((i) => `${i.productId}:${i.variantId ?? ''}:${i.quantity}`)
		.sort()
		.join(',')
	const addr = body.shippingAddress ?? ({} as RateRequestBody['shippingAddress'])
	return [items, addr.line1, addr.line2, addr.city, addr.stateProvince, addr.postalCode, addr.country, addr.phone].join('|')
}

function pruneExpiredResolveCacheEntries(): void {
	const now = Date.now()
	for (const [key, entry] of resolveCache) {
		if (entry.expiresAt <= now) resolveCache.delete(key)
	}
}

function resolveRateRequestCached(
	service: ReturnType<typeof createServiceClient>,
	body: RateRequestBody
): Promise<RateRequestResolution> {
	const key = buildResolveKey(body)
	const cached = resolveCache.get(key)
	if (cached && cached.expiresAt > Date.now()) return Promise.resolve(cached.data)

	const existing = resolveInFlight.get(key)
	if (existing) return existing

	const promise = resolveRateRequest(service, body).then((data) => {
		if (resolveCache.size >= 500) pruneExpiredResolveCacheEntries()
		resolveCache.set(key, { data, expiresAt: Date.now() + RESOLVE_CACHE_TTL_MS })
		return data
	})
	// .finally() returns its own derived promise; if left dangling and
	// `promise` rejects (e.g. StockError), that derived promise would also
	// reject and — since nothing else observes it — surface as an
	// unhandled rejection even though the original `promise` below is
	// properly awaited/caught by the route handler. The empty .catch()
	// only silences that derived, otherwise-unobserved promise.
	promise.finally(() => resolveInFlight.delete(key)).catch(() => undefined)
	resolveInFlight.set(key, promise)
	return promise
}

/**
 * Canada Post-only rate quote for the checkout page's progressive
 * shipping-method list — called alongside (not before) the UPS route, so
 * Canada Post's variable latency never delays UPS rates from showing up.
 */
export async function POST(request: NextRequest) {
	try {
		const body: RateRequestBody = await request.json()
		const service = createServiceClient()
		const resolved = await resolveRateRequestCached(service, body)
		if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status })

		const { rates, error } = await getCanadaPostShippingRates(resolved.pkg, resolved.destination)
		return NextResponse.json({ rates, error })
	} catch (err) {
		if (err instanceof StockError) {
			return NextResponse.json({ error: err.message, variantId: err.variantId }, { status: 400 })
		}
		return NextResponse.json({ error: err instanceof Error ? err.message : 'Unable to fetch Canada Post rates' }, { status: 500 })
	}
}
