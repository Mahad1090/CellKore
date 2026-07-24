import { canadaPostApiBase, canadaPostCredentials } from '@/lib/shipping/env'
import type { NormalizedRate, PackageInput, ShipmentRequest, ShipmentResult, ShippingParty } from '@/lib/shipping/types'

// Canada Post developer API. Auth is HTTP Basic (API Key as username,
// Secret Key as password, base64-encoded) — Canada Post's long-standing
// Developer Program credential model, not OAuth2. Every request also
// carries the Customer Number that identifies the commercial account.
// Test vs production is a host switch (ct.soa-gw vs soa-gw), same
// credentials.
//
// TEMP (business decision, for now): rate quoting (getCanadaPostRates)
// is forced to LIVE so checkout shows real prices, while shipment/label
// creation (createCanadaPostShipment) is forced to TEST so no real
// labels or charges are generated yet. Once ready to go fully live,
// delete the explicit 'live'/'test' arguments below so both follow
// CANADA_POST_ENV uniformly again.
//
// NOTE: the exact /prices request/response field names and the exact
// create-shipment request body could not be confirmed from the
// (JS-rendered) developer portal docs during planning. The shapes below
// are this integration's best-effort mapping of Canada Post's
// documented domain model (parcel characteristics, origin/destination,
// service codes) — verify against the live "Try it out" panel or
// Postman collection, and adjust the marked sections only; the function
// signatures/call sites don't need to change.

function authHeader(mode?: 'test' | 'live'): string {
	const { apiKey, secretKey } = canadaPostCredentials(mode)
	return `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString('base64')}`
}

function destinationBlock(destination: ShippingParty) {
	const country = destination.country.toUpperCase()
	if (country === 'CA') return { domestic: { postalCode: destination.postalCode.replace(/\s/g, '') } }
	if (country === 'US') return { unitedStates: { zipCode: destination.postalCode } }
	return { international: { countryCode: country } }
}

export async function getCanadaPostRates(
	pkg: PackageInput,
	origin: { postalCode: string },
	destination: ShippingParty
): Promise<NormalizedRate[]> {
	const { customerNumber } = canadaPostCredentials('live')
	const res = await fetch(`${canadaPostApiBase('live')}/prices`, {
		method: 'POST',
		headers: {
			Authorization: authHeader('live'),
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: JSON.stringify({
			customerNumber,
			originPostalCode: origin.postalCode.replace(/\s/g, ''),
			parcelCharacteristics: {
				weight: pkg.weightKg,
				dimensions: { length: pkg.lengthCm, width: pkg.widthCm, height: pkg.heightCm },
			},
			destination: destinationBlock(destination),
		}),
	})
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`Canada Post rating failed: ${res.status} ${detail}`.trim())
	}
	const json = await res.json()
	const quotes: any[] = json.priceQuotes ?? json.prices ?? []

	return quotes.map((q) => ({
		carrier: 'canada_post' as const,
		serviceCode: q.serviceCode ?? q.service_code ?? '',
		serviceName: q.serviceName ?? q.service_name ?? 'Canada Post',
		cost: Number(q.priceDetails?.due ?? q.due ?? q.price ?? 0),
		currency: 'CAD',
		transitDays: q.serviceStandard?.expectedTransitTime ?? q.expected_transit_time ?? undefined,
		raw: q,
	}))
}

async function fetchCanadaPostLabelArtifact(artifactUrl: string): Promise<{ bytes: Buffer; contentType: string }> {
	const res = await fetch(artifactUrl, {
		headers: { Authorization: authHeader('test'), Accept: 'application/pdf' },
	})
	if (!res.ok) throw new Error('Canada Post label artifact fetch failed')
	const contentType = res.headers.get('content-type') || 'application/pdf'
	const bytes = Buffer.from(await res.arrayBuffer())
	return { bytes, contentType }
}

export async function createCanadaPostShipment(req: ShipmentRequest): Promise<ShipmentResult> {
	const { customerNumber } = canadaPostCredentials('test')
	// mailedBy/mobo ("mail on behalf of") both equal the account's own
	// customer number here — CellKore ships its own packages rather than
	// acting as a platform mailing on behalf of other customers.
	const mailedBy = customerNumber
	const mobo = customerNumber

	const res = await fetch(`${canadaPostApiBase('test')}/${mailedBy}/${mobo}/shipments`, {
		method: 'POST',
		headers: {
			Authorization: authHeader('test'),
			'Content-Type': 'application/json',
			Accept: 'application/json',
		},
		body: JSON.stringify({
			customerNumber,
			serviceCode: req.serviceCode,
			sender: {
				name: req.shipFrom.name,
				company: req.shipFrom.company,
				phone: req.shipFrom.phone,
				addressDetails: {
					addressLine1: req.shipFrom.line1,
					addressLine2: req.shipFrom.line2,
					city: req.shipFrom.city,
					provState: req.shipFrom.stateProvince,
					postalZipCode: req.shipFrom.postalCode,
					countryCode: req.shipFrom.country,
				},
			},
			destination: {
				name: req.shipTo.name,
				phone: req.shipTo.phone,
				addressDetails: {
					addressLine1: req.shipTo.line1,
					addressLine2: req.shipTo.line2,
					city: req.shipTo.city,
					provState: req.shipTo.stateProvince,
					postalZipCode: req.shipTo.postalCode,
					countryCode: req.shipTo.country,
				},
			},
			parcelCharacteristics: {
				weight: req.pkg.weightKg,
				dimensions: { length: req.pkg.lengthCm, width: req.pkg.widthCm, height: req.pkg.heightCm },
			},
			referenceNumber: req.reference,
			preferences: { showPackingInstructions: false },
		}),
	})
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`Canada Post shipment creation failed: ${res.status} ${detail}`.trim())
	}
	const json = await res.json()

	const trackingNumber: string = json.trackingPin ?? json.tracking_pin ?? json['tracking-pin'] ?? ''
	const carrierShipmentId: string = json.shipmentId ?? json['shipment-id'] ?? json.id ?? ''
	const artifactUrl: string | undefined =
		json.links?.find((l: any) => l.rel === 'label')?.href ?? json.artifact?.href ?? json.labelUrl

	if (!trackingNumber || !artifactUrl) {
		throw new Error('Canada Post shipment response is missing a tracking number or label artifact link')
	}

	const { bytes, contentType } = await fetchCanadaPostLabelArtifact(artifactUrl)

	return {
		carrier: 'canada_post',
		trackingNumber,
		labelBytes: bytes,
		labelContentType: contentType,
		carrierShipmentId,
	}
}
