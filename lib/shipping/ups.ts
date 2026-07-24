import { upsApiBase, upsCredentials } from '@/lib/shipping/env'
import type { NormalizedRate, PackageInput, ShipmentRequest, ShipmentResult, ShippingParty } from '@/lib/shipping/types'

// UPS API (github.com/UPS-API/api-documentation): OAuth2 client_credentials,
// wwwcie.ups.com (test/CIE) vs onlinetools.ups.com (production) — a
// long-standing, stable UPS convention.
//
// NOTE: exact Rating/Shipping request+response field names (packaging
// type codes, service codes, the rating "requestoption" value, API
// version segment) should be confirmed against the real Rating.yaml /
// Shipping.yaml in that repo before going live — the shapes below are
// this integration's best-effort mapping of UPS's long-documented
// JSON schema for these two APIs. Adjust only the marked request/response
// field access; call sites don't need to change.

const API_VERSION = 'v2409'

// getShippingRates() runs UPS and Canada Post in parallel via
// Promise.allSettled and returns whichever carrier responds — bound every
// request so a slow/hung carrier can't block the other's rates from
// showing up promptly at checkout.
const REQUEST_TIMEOUT_MS = 8000
const SHIPMENT_TIMEOUT_MS = 20000

// UPS's Rating API returns Service.Description as an empty string on this
// account/region rather than omitting it or a human-readable name, so a
// nullish (??) fallback never triggers — "" is not null/undefined. Service
// codes are stable, long-documented UPS constants, so map the common ones
// directly instead of relying on the API to describe itself.
const UPS_SERVICE_NAMES: Record<string, string> = {
	'01': 'UPS Next Day Air',
	'02': 'UPS 2nd Day Air',
	'03': 'UPS Ground',
	'07': 'UPS Worldwide Express',
	'08': 'UPS Worldwide Expedited',
	'11': 'UPS Standard',
	'12': 'UPS 3 Day Select',
	'13': 'UPS Next Day Air Saver',
	'14': 'UPS Next Day Air Early',
	'54': 'UPS Worldwide Express Plus',
	'59': 'UPS 2nd Day Air A.M.',
	'65': 'UPS Worldwide Saver',
}

let cachedToken: { token: string; expiresAt: number } | null = null

async function upsToken(): Promise<string> {
	if (cachedToken && cachedToken.expiresAt > Date.now() + 5000) return cachedToken.token

	const { clientId, clientSecret } = upsCredentials()
	const res = await fetch(`${upsApiBase()}/security/v1/oauth/token`, {
		method: 'POST',
		headers: {
			Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: 'grant_type=client_credentials',
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	})
	if (!res.ok) throw new Error('UPS authentication failed')
	const json = await res.json()
	const token = json.access_token as string
	const expiresInSec = Number(json.expires_in ?? 3600)
	cachedToken = { token, expiresAt: Date.now() + expiresInSec * 1000 }
	return token
}

function upsAddress(party: ShippingParty) {
	return {
		Name: party.name,
		Phone: { Number: party.phone },
		Address: {
			AddressLine: [party.line1, party.line2].filter(Boolean),
			City: party.city,
			StateProvinceCode: party.stateProvince,
			PostalCode: party.postalCode,
			CountryCode: party.country,
		},
	}
}

export async function getUpsRates(
	pkg: PackageInput,
	origin: ShippingParty,
	destination: ShippingParty
): Promise<NormalizedRate[]> {
	const token = await upsToken()
	const { accountNumber } = upsCredentials()

	// "Shop" returns rates for every available service in one call.
	const res = await fetch(`${upsApiBase()}/api/rating/${API_VERSION}/Shop`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			transId: `${Date.now()}`,
			transactionSrc: 'cellkore',
		},
		body: JSON.stringify({
			RateRequest: {
				Request: { RequestOption: 'Shop' },
				Shipment: {
					Shipper: { ...upsAddress(origin), ShipperNumber: accountNumber },
					ShipFrom: upsAddress(origin),
					ShipTo: upsAddress(destination),
					Package: [
						{
							PackagingType: { Code: '02' },
							Dimensions: {
								UnitOfMeasurement: { Code: 'CM' },
								Length: String(pkg.lengthCm),
								Width: String(pkg.widthCm),
								Height: String(pkg.heightCm),
							},
							PackageWeight: {
								UnitOfMeasurement: { Code: 'KGS' },
								Weight: String(pkg.weightKg),
							},
						},
					],
				},
			},
		}),
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	})
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`UPS rating failed: ${res.status} ${detail}`.trim())
	}
	const json = await res.json()
	const ratedShipments: any[] = Array.isArray(json.RateResponse?.RatedShipment)
		? json.RateResponse.RatedShipment
		: json.RateResponse?.RatedShipment
		? [json.RateResponse.RatedShipment]
		: []

	return ratedShipments.map((rs) => {
		const code = rs.Service?.Code ?? ''
		return {
			carrier: 'ups' as const,
			serviceCode: code,
			serviceName: rs.Service?.Description || UPS_SERVICE_NAMES[code] || `UPS ${code}`.trim(),
			cost: Number(rs.TotalCharges?.MonetaryValue ?? 0),
			currency: rs.TotalCharges?.CurrencyCode ?? 'USD',
			transitDays: rs.GuaranteedDelivery?.BusinessDaysInTransit
				? Number(rs.GuaranteedDelivery.BusinessDaysInTransit)
				: undefined,
			raw: rs,
		}
	})
}

export async function createUpsShipment(req: ShipmentRequest): Promise<ShipmentResult> {
	const token = await upsToken()
	const { accountNumber } = upsCredentials()

	const res = await fetch(`${upsApiBase()}/api/shipments/${API_VERSION}/ship`, {
		method: 'POST',
		headers: {
			Authorization: `Bearer ${token}`,
			'Content-Type': 'application/json',
			transId: `${Date.now()}`,
			transactionSrc: 'cellkore',
		},
		body: JSON.stringify({
			ShipmentRequest: {
				Shipment: {
					Description: `CellKore order ${req.reference}`,
					Shipper: { ...upsAddress(req.shipFrom), ShipperNumber: accountNumber },
					ShipFrom: upsAddress(req.shipFrom),
					ShipTo: upsAddress(req.shipTo),
					PaymentInformation: {
						ShipmentCharge: { Type: '01', BillShipper: { AccountNumber: accountNumber } },
					},
					Service: { Code: req.serviceCode },
					Package: [
						{
							Packaging: { Code: '02' },
							Dimensions: {
								UnitOfMeasurement: { Code: 'CM' },
								Length: String(req.pkg.lengthCm),
								Width: String(req.pkg.widthCm),
								Height: String(req.pkg.heightCm),
							},
							PackageWeight: {
								UnitOfMeasurement: { Code: 'KGS' },
								Weight: String(req.pkg.weightKg),
							},
						},
					],
				},
				LabelSpecification: {
					LabelImageFormat: { Code: 'PDF' },
				},
			},
		}),
		signal: AbortSignal.timeout(SHIPMENT_TIMEOUT_MS),
	})
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`UPS shipment creation failed: ${res.status} ${detail}`.trim())
	}
	const json = await res.json()

	const shipmentResults = json.ShipmentResponse?.ShipmentResults
	const packageResult = Array.isArray(shipmentResults?.PackageResults)
		? shipmentResults.PackageResults[0]
		: shipmentResults?.PackageResults

	const trackingNumber: string = packageResult?.TrackingNumber ?? ''
	const carrierShipmentId: string = shipmentResults?.ShipmentIdentificationNumber ?? ''
	const labelBase64: string | undefined = packageResult?.ShippingLabel?.GraphicImage

	if (!trackingNumber || !labelBase64) {
		throw new Error('UPS shipment response is missing a tracking number or label image')
	}

	return {
		carrier: 'ups',
		trackingNumber,
		labelBytes: Buffer.from(labelBase64, 'base64'),
		labelContentType: 'application/pdf',
		carrierShipmentId,
	}
}
