import { stallionApiBase, stallionApiKey } from '@/lib/shipping/env'
import type { NormalizedRate, PackageInput, ShipmentRequest, ShipmentResult, ShippingParty } from '@/lib/shipping/types'

// Stallion Express (docs.stallion.ca, V5 OpenAPI spec) — third rate/label
// source alongside Canada Post and UPS (see lib/shipping/canada-post.ts,
// lib/shipping/ups.ts). Queried in parallel with both via
// Promise.allSettled in lib/shipping/aggregator.ts so a slow/erroring
// carrier never blocks the others' rates from showing up.
//
// Auth: a single bearer token per account (no separate sandbox/live token
// pair) — STALLION_MODE picks which host that token is sent to. See
// lib/shipping/env.ts.
//
// Customs: like this codebase's existing Canada Post/UPS integrations,
// CellKore doesn't currently track a per-order declared customs value —
// shipments here (domestic or cross-border) are quoted/booked without a
// customs line. Stallion's own docs note it validates each item's hs_code
// against its own tariff database for cross-border destinations, so a
// cross-border Stallion rate/label call may reasonably fail where Canada
// Post/UPS silently proceed; that's a pre-existing gap in customs
// valuation across the whole shipping stack, not something specific to
// this carrier. Wiring real per-item customs data through checkout/
// repair/sell-return is a separate, larger change.

const REQUEST_TIMEOUT_MS = 8000
const SHIPMENT_TIMEOUT_MS = 20000

interface StallionApiError extends Error {
	status?: number
}

function wrapError(err: unknown, fallbackMessage: string): StallionApiError {
	if (err instanceof Error) {
		const wrapped: StallionApiError = new Error(err.message || fallbackMessage)
		return wrapped
	}
	return new Error(fallbackMessage)
}

async function stallionFetch(path: string, init: RequestInit & { timeoutMs: number }): Promise<Response> {
	const { timeoutMs, ...rest } = init
	const res = await fetch(`${stallionApiBase()}${path}`, {
		...rest,
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${stallionApiKey()}`,
			...rest.headers,
		},
		signal: AbortSignal.timeout(timeoutMs),
	})
	return res
}

function stallionAddress(party: ShippingParty) {
	return {
		name: party.name,
		company: party.company || undefined,
		address1: party.line1,
		address2: party.line2 || undefined,
		city: party.city,
		// Stallion requires exactly 2 characters — fall back to the country
		// code itself for destinations with no real province/state code.
		province_code: (party.stateProvince || party.country).slice(0, 2).toUpperCase(),
		postal_code: party.postalCode,
		country_code: party.country.toUpperCase(),
		phone: party.phone || undefined,
	}
}

function stallionPackage(pkg: PackageInput) {
	return {
		weight: Math.max(0.1, pkg.weightKg),
		weight_unit: 'kg',
		length: Math.max(1, pkg.lengthCm),
		width: Math.max(1, pkg.widthCm),
		height: Math.max(1, pkg.heightCm),
		size_unit: 'cm',
	}
}

// Verified live against ship.stallion.ca (2026-09-13): /rates 422s with
// "The items field is required" even for a purely domestic CA→CA quote —
// this isn't a cross-border-only requirement as Stallion's docs implied.
// CellKore doesn't carry a per-order declared value anywhere in the
// shipping pipeline (PackageInput is just weight/dims — same gap the
// existing Canada Post/UPS integrations have), so this sends one generic
// placeholder line rather than a real itemized declaration. Fine for
// domestic quotes/labels; a real cross-border shipment should have this
// replaced with actual per-item customs data once that's tracked.
function stallionPlaceholderItems() {
	return [{ title: 'Merchandise', quantity: 1, value: 25, currency: 'CAD' }]
}

export async function getStallionRates(
	pkg: PackageInput,
	origin: ShippingParty,
	destination: ShippingParty
): Promise<NormalizedRate[]> {
	const body = {
		from_address: stallionAddress(origin),
		to_address: stallionAddress(destination),
		packages: [stallionPackage(pkg)],
		items: stallionPlaceholderItems(),
	}

	let res: Response
	try {
		res = await stallionFetch('/rates', { method: 'POST', body: JSON.stringify(body), timeoutMs: REQUEST_TIMEOUT_MS })
	} catch (err) {
		throw wrapError(err, 'Stallion rate quote failed')
	}
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`Stallion rating failed: ${res.status} ${detail}`.trim())
	}
	const json = await res.json()
	const rates: any[] = json?.data ?? []

	return rates.map((r) => ({
		carrier: 'stallion' as const,
		serviceCode: r.service ?? '',
		serviceName: r.service_name || r.carrier || 'Stallion Express',
		cost: Number(r.total) || 0,
		currency: r.currency ?? 'CAD',
		transitDays: r.estimated_delivery_days != null ? Number(r.estimated_delivery_days) : undefined,
		raw: r,
	}))
}

export async function createStallionShipment(req: ShipmentRequest): Promise<ShipmentResult> {
	const body = {
		from_address: stallionAddress(req.shipFrom),
		to_address: stallionAddress(req.shipTo),
		packages: [stallionPackage(req.pkg)],
		items: stallionPlaceholderItems(),
		service: req.serviceCode,
		label_format: 'pdf',
	}

	let res: Response
	try {
		res = await stallionFetch('/labels', {
			method: 'POST',
			body: JSON.stringify(body),
			timeoutMs: SHIPMENT_TIMEOUT_MS,
			// Prevents a retried request (e.g. after a network timeout) from
			// buying a second label for the same shipment.
			headers: { 'Idempotency-Key': `cellkore-${req.reference}` },
		})
	} catch (err) {
		throw wrapError(err, 'Stallion label purchase failed')
	}
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`Stallion label purchase failed: ${res.status} ${detail}`.trim())
	}
	const json = await res.json()
	const label = json?.data

	const trackingNumber: string = label?.tracking_number ?? ''
	const labelUrl: string | undefined = label?.label_url
	const carrierShipmentId: string = String(label?.shipment_id ?? '')
	if (!trackingNumber || !labelUrl) {
		throw new Error('Stallion label response is missing a tracking number or label URL')
	}

	// Stallion's label_url is a signed link valid only briefly — fetch the
	// PDF bytes now (same approach as UPS's inline GraphicImage) so the
	// label survives long after that link expires.
	const pdfRes = await fetch(labelUrl, { signal: AbortSignal.timeout(SHIPMENT_TIMEOUT_MS) })
	if (!pdfRes.ok) throw new Error('Stallion label was purchased but the label PDF could not be downloaded')
	const labelBytes = Buffer.from(await pdfRes.arrayBuffer())

	return {
		carrier: 'stallion',
		trackingNumber,
		labelBytes,
		labelContentType: 'application/pdf',
		carrierShipmentId,
	}
}
