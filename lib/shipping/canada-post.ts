import { Agent } from 'undici'
import { canadaPostCredentials } from '@/lib/shipping/env'
import type { NormalizedRate, PackageInput, ShipmentRequest, ShipmentResult, ShippingParty } from '@/lib/shipping/types'

// Canada Post's current developer platform: OAuth2 + JSON REST, replacing
// the legacy XML/SOAP/Basic-Auth "SOA gateway" this file used to call
// (retired 2026-04-30 per Canada Post's own Rating API docs). One host
// serves both sandbox and production — environment is selected entirely by
// which API Key/Secret Key pair (used as the OAuth2 client_id/client_secret)
// requests the access token, not by the URL.
//
// TEMP (business decision, for now): rate quoting (getCanadaPostRates) is
// forced to LIVE so checkout shows real prices, while shipment/label
// creation (createCanadaPostShipment) is forced to TEST so no real labels
// or charges are generated yet. Once ready to go fully live, delete the
// explicit 'live'/'test' arguments below so both follow CANADA_POST_ENV
// uniformly again.
//
// Shipment creation uses transmitShipment: true + settlementInfo.
// intendedMethodOfPayment: 'CreditCard' (the default card saved on the
// account's Canada Post profile) — CellKore has no negotiated shipping
// contract, so the Account/contractId payment path doesn't apply.

// Exported so lib/shipping/canada-post-pickup.ts (Pickup API, same host/auth,
// different path prefix) reuses the same OAuth token cache/retry logic
// instead of duplicating it.
export const API_ROOT = 'https://api.canadapost-postescanada.ca/prod/devportal-portaildesdeveloppeurs'
const TOKEN_URL = `${API_ROOT}/cpc-api-native-oauth-provider/oauth2/token`

// Canada Post's new platform has shown highly variable latency (sub-second
// to 30s+, occasionally an outright gateway error) since replacing the
// legacy gateway. getShippingRates() runs this in parallel with UPS via
// Promise.allSettled and still returns whichever carrier responds, but
// only if a slow Canada Post call doesn't block the whole checkout page —
// bound every request so it fails fast into that fallback instead of
// leaving the customer staring at a spinner.
const REQUEST_TIMEOUT_MS = 8000
// Shipment/label creation is admin-triggered (not on the customer checkout
// path) and does more work server-side, so it gets a longer allowance
// before it's treated as hung.
const SHIPMENT_TIMEOUT_MS = 20000

interface CachedToken {
	accessToken: string
	expiresAt: number
}

const tokenCache = new Map<string, CachedToken>()

// The abort logs for this endpoint are consistently "operation aborted due
// to timeout" with no error body — i.e. Canada Post's server just hasn't
// answered yet, not a real failure. Most of those are transient (a repeat
// request right after succeeds), so one bounded retry recovers a real quote
// in those cases instead of surfacing "unavailable" for a blip. This never
// fabricates data — if the retry also times out, the caller still gets a
// real error and the checkout page still shows "Canada Post unavailable".
export async function fetchWithTimeoutRetry(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
	try {
		return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
	} catch (err) {
		if (err instanceof Error && err.name === 'TimeoutError') {
			return await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) })
		}
		throw err
	}
}

export async function getAccessToken(mode: 'test' | 'live'): Promise<string> {
	const cached = tokenCache.get(mode)
	if (cached && cached.expiresAt > Date.now()) return cached.accessToken

	const { apiKey, secretKey } = canadaPostCredentials(mode)
	const res = await fetchWithTimeoutRetry(
		TOKEN_URL,
		{
			method: 'POST',
			headers: {
				'X-IBM-Client-Id': apiKey,
				'X-IBM-Client-Secret': secretKey,
				'Content-Type': 'application/x-www-form-urlencoded',
				Accept: 'application/json',
			},
			body: 'grant_type=client_credentials&scope=merchant',
		},
		REQUEST_TIMEOUT_MS
	)
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`Canada Post OAuth token request failed: ${res.status} ${detail}`.trim())
	}
	const json = await res.json()
	const accessToken = json.access_token as string
	// Refresh a minute early so a near-expiry token never gets used mid-request.
	const expiresAt = Date.now() + (Number(json.expires_in ?? 0) - 60) * 1000
	tokenCache.set(mode, { accessToken, expiresAt })
	return accessToken
}

// Fetches and caches the LIVE token ahead of any customer request (see
// instrumentation.ts, called once at server startup) so a customer's first
// rate lookup isn't stacked behind both a token fetch and the rating call
// inside the same request — only the rating call (the one that's actually
// slow/variable) is on the clock by the time checkout asks for rates.
// Best-effort: if this fails or hasn't finished yet, getAccessToken() just
// fetches its own token as it always did, so there's no new failure mode.
export function warmCanadaPostToken(): void {
	getAccessToken('live').catch(() => undefined)
}

function destinationBlock(destination: ShippingParty): Record<string, unknown> {
	const country = destination.country.toUpperCase()
	if (country === 'CA') return { domestic: { postalCode: destination.postalCode.replace(/\s/g, '') } }
	if (country === 'US') return { unitedStates: { zipCode: destination.postalCode } }
	return { international: { countryCode: country } }
}

// Rate requests repeat constantly with identical parameters — the same
// customer re-fires this on every address-field edit and cart-quantity
// tweak during one checkout, and separate customers converge on the same
// handful of (origin, destination, package) combos day to day. Caching a
// successful quote for a few hours turns those repeats into a sub-1ms
// lookup instead of another round trip to Canada Post's slow/variable
// endpoint. A plain in-memory Map (not Redis) matches how this app already
// caches the OAuth token above: it runs as one persistent Node process, not
// stateless serverless functions, so there's no shared-cache-across-
// instances need to justify an external cache service. Only successful
// responses are ever cached — a timeout/error is never stored, so this
// can't paper over a real outage with a stale "unavailable".
const RATE_CACHE_TTL_MS = 3 * 60 * 60 * 1000 // 3 hours — list-rate pricing doesn't move intraday
const RATE_CACHE_PRUNE_THRESHOLD = 500 // sweep expired entries once the map grows past this, instead of every write

interface CachedRateEntry {
	rates: NormalizedRate[]
	expiresAt: number
}

const rateCache = new Map<string, CachedRateEntry>()

function rateCacheKey(pkg: PackageInput, originPostalCode: string, destination: ShippingParty): string {
	// Round weight/dimensions so float noise from summing item weights
	// (computePackageForItems) doesn't produce a "different" key for what is
	// effectively the same package, and normalize postal codes so
	// casing/spacing differences don't either.
	const origin = originPostalCode.replace(/\s/g, '').toUpperCase()
	const destPostal = destination.postalCode.replace(/\s/g, '').toUpperCase()
	const destCountry = destination.country.toUpperCase()
	const weight = pkg.weightKg.toFixed(3)
	const dims = `${pkg.lengthCm.toFixed(1)}x${pkg.widthCm.toFixed(1)}x${pkg.heightCm.toFixed(1)}`
	return `${origin}>${destCountry}:${destPostal}|${weight}kg|${dims}`
}

function pruneExpiredRateCacheEntries(): void {
	const now = Date.now()
	for (const [key, entry] of rateCache) {
		if (entry.expiresAt <= now) rateCache.delete(key)
	}
}

// Explicit, generous connection pool for the rating call specifically
// (previously an implicit bare `fetch()` relying on undici's default global
// dispatcher). There's no documented Canada Post rate limit on concurrent
// connections that would call for capping this lower, so 50 is a generous
// default relative to CellKore's real concurrency rather than an arbitrary
// low number that would itself become a bottleneck under load (a sale,
// a promo, many checkouts quoting rates at once).
const ratingPooledDispatcher = new Agent({ connections: 50, keepAliveTimeout: 10_000, keepAliveMaxTimeout: 30_000 })

const RATE_PRIMARY_TIMEOUT_MS = 6000
const RATE_HEDGE_TIMEOUT_MS = 10000
// Above real fresh-connection latency (so a healthy primary isn't hedged
// against needlessly) but well below the primary's own timeout (so a dead
// pooled socket doesn't cost the full primary timeout before a fresh
// attempt even starts).
const RATE_HEDGE_DELAY_MS = 2500

type FetchInit = RequestInit & { dispatcher?: Agent }
type FetchOutcome = { ok: true; res: Response } | { ok: false; err: unknown }

function toOutcome(p: Promise<Response>): Promise<FetchOutcome> {
	return p.then(
		(res): FetchOutcome => ({ ok: true, res }),
		(err): FetchOutcome => ({ ok: false, err })
	)
}

// Unlike axios, fetch() only rejects on a network failure/timeout — an
// HTTP error status (4xx/5xx) still resolves the promise. So "a real
// answer" here is simply "the fetch settled" rather than needing to
// inspect the error/response shape the way an axios-based hedge would.
function isRealAnswer(o: FetchOutcome): o is { ok: true; res: Response } {
	return o.ok
}

function unwrap(o: FetchOutcome): Response {
	if (o.ok) return o.res
	throw o.err
}

/**
 * Hedged retry for the Canada Post rating call only: races the primary
 * attempt (pooled/keep-alive connection) against a "hedge" attempt fired on
 * a guaranteed-fresh connection after a short delay, instead of waiting for
 * the primary to fail before even starting a retry. A plain
 * timeout-then-retry (see fetchWithTimeoutRetry above) costs the FULL
 * primary timeout before a stuck/dead pooled socket ever gets replaced,
 * even though a fresh-connection retry usually recovers in ~1-2s. A
 * legitimately slow-but-alive primary is unaffected — it still gets its
 * own full timeout budget via the race; only the dead-socket case gets
 * short-circuited. Never fabricates a rate: if both attempts fail, the
 * caller still gets a real error.
 */
async function fetchRatesHedged(url: string, init: FetchInit): Promise<Response> {
	const primary = toOutcome(
		fetch(url, { ...init, dispatcher: ratingPooledDispatcher, signal: AbortSignal.timeout(RATE_PRIMARY_TIMEOUT_MS) } as FetchInit)
	)
	const delayElapsed = new Promise<'delay'>((resolve) => setTimeout(() => resolve('delay'), RATE_HEDGE_DELAY_MS))

	const first = await Promise.race([primary, delayElapsed])
	if (first !== 'delay' && isRealAnswer(first)) return first.res

	// Primary failed fast (dead pooled connection), or is slow enough to
	// suspect one — race a fresh connection without waiting any further.
	const hedge = toOutcome(
		fetch(url, { ...init, dispatcher: new Agent({ connections: 1 }), signal: AbortSignal.timeout(RATE_HEDGE_TIMEOUT_MS) } as FetchInit)
	)
	const tagged = [primary.then((o) => ({ idx: 0 as const, o })), hedge.then((o) => ({ idx: 1 as const, o }))] as const
	const winner = await Promise.race(tagged)
	if (isRealAnswer(winner.o)) return winner.o.res

	const other = await tagged[winner.idx === 0 ? 1 : 0]
	return unwrap(other.o) // both failed — surface whichever error
}

export async function getCanadaPostRates(
	pkg: PackageInput,
	origin: { postalCode: string },
	destination: ShippingParty
): Promise<NormalizedRate[]> {
	const cacheKey = rateCacheKey(pkg, origin.postalCode, destination)
	const cached = rateCache.get(cacheKey)
	if (cached && cached.expiresAt > Date.now()) return cached.rates

	const { customerNumber } = canadaPostCredentials('live')
	const accessToken = await getAccessToken('live')

	const res = await fetchRatesHedged(`${API_ROOT}/rating/v1/prices`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: JSON.stringify({
			customerNumber,
			parcelCharacteristics: {
				weight: pkg.weightKg,
				dimensions: { length: pkg.lengthCm, width: pkg.widthCm, height: pkg.heightCm },
			},
			originPostalCode: origin.postalCode.replace(/\s/g, ''),
			destination: destinationBlock(destination),
		}),
	})
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`Canada Post rating failed: ${res.status} ${detail}`.trim())
	}

	const quotes = (await res.json()) as Array<{
		serviceCode?: string
		serviceName?: string
		priceDetails?: { due?: number }
		serviceStandard?: { expectedTransitTime?: number }
	}>

	const rates: NormalizedRate[] = quotes.map((q) => ({
		carrier: 'canada_post' as const,
		serviceCode: q.serviceCode ?? '',
		serviceName: q.serviceName ?? 'Canada Post',
		cost: Number(q.priceDetails?.due ?? 0),
		currency: 'CAD',
		transitDays: q.serviceStandard?.expectedTransitTime,
		raw: q,
	}))

	if (rateCache.size >= RATE_CACHE_PRUNE_THRESHOLD) pruneExpiredRateCacheEntries()
	rateCache.set(cacheKey, { rates, expiresAt: Date.now() + RATE_CACHE_TTL_MS })

	return rates
}

async function fetchCanadaPostLabelArtifact(artifactUrl: string, accessToken: string): Promise<{ bytes: Buffer; contentType: string }> {
	const res = await fetch(artifactUrl, {
		headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/pdf' },
		signal: AbortSignal.timeout(SHIPMENT_TIMEOUT_MS),
	})
	if (!res.ok) throw new Error('Canada Post label artifact fetch failed')
	const contentType = res.headers.get('content-type') || 'application/pdf'
	const bytes = Buffer.from(await res.arrayBuffer())
	return { bytes, contentType }
}

export async function createCanadaPostShipment(req: ShipmentRequest): Promise<ShipmentResult> {
	const { customerNumber } = canadaPostCredentials('test')
	const accessToken = await getAccessToken('test')

	// mailedBy/mobo ("mail on behalf of") both equal the account's own
	// customer number here — CellKore ships its own packages rather than
	// acting as a platform mailing on behalf of other customers.
	const res = await fetch(`${API_ROOT}/shipping/v1/${customerNumber}/${customerNumber}/shipments`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${accessToken}`,
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: JSON.stringify({
			// No manifest required for proof of payment — matches shipping
			// fewer than 50 parcels/day. groupId must be omitted whenever
			// transmitShipment is provided (the two are mutually exclusive).
			transmitShipment: true,
			deliverySpec: {
				serviceCode: req.serviceCode,
				sender: {
					name: req.shipFrom.name,
					company: req.shipFrom.company || req.shipFrom.name,
					contactPhone: req.shipFrom.phone,
					addressDetails: {
						addressLine1: req.shipFrom.line1,
						addressLine2: req.shipFrom.line2,
						city: req.shipFrom.city,
						provState: req.shipFrom.stateProvince,
						countryCode: 'CA',
						postalZipCode: req.shipFrom.postalCode,
					},
				},
				destination: {
					name: req.shipTo.name,
					company: req.shipTo.company,
					clientVoiceNumber: req.shipTo.phone,
					addressDetails: {
						addressLine1: req.shipTo.line1,
						addressLine2: req.shipTo.line2,
						city: req.shipTo.city,
						provState: req.shipTo.stateProvince,
						countryCode: req.shipTo.country,
						postalZipCode: req.shipTo.postalCode,
					},
				},
				parcelCharacteristics: {
					weight: req.pkg.weightKg,
					dimensions: { length: req.pkg.lengthCm, width: req.pkg.widthCm, height: req.pkg.heightCm },
				},
				preferences: { showPackingInstructions: false },
				references: { customerRef1: req.reference },
				settlementInfo: { intendedMethodOfPayment: 'CreditCard' },
			},
		}),
		signal: AbortSignal.timeout(SHIPMENT_TIMEOUT_MS),
	})
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`Canada Post shipment creation failed: ${res.status} ${detail}`.trim())
	}

	const json = await res.json()
	const trackingNumber: string = json.trackingPin ?? ''
	const carrierShipmentId: string = json.shipmentId ?? ''
	const links: Array<{ rel?: string; href?: string }> = json.links ?? []
	const artifactUrl = links.find((l) => l.rel === 'label')?.href

	if (!trackingNumber || !artifactUrl) {
		throw new Error('Canada Post shipment response is missing a tracking number or label artifact link')
	}

	const { bytes, contentType } = await fetchCanadaPostLabelArtifact(artifactUrl, accessToken)

	return {
		carrier: 'canada_post',
		trackingNumber,
		labelBytes: bytes,
		labelContentType: contentType,
		carrierShipmentId,
	}
}
