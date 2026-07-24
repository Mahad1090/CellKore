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

	return ratedShipments.map((rs) => ({
		carrier: 'ups' as const,
		serviceCode: rs.Service?.Code ?? '',
		serviceName: rs.Service?.Description ?? `UPS ${rs.Service?.Code ?? ''}`.trim(),
		cost: Number(rs.TotalCharges?.MonetaryValue ?? 0),
		currency: rs.TotalCharges?.CurrencyCode ?? 'USD',
		transitDays: rs.GuaranteedDelivery?.BusinessDaysInTransit
			? Number(rs.GuaranteedDelivery.BusinessDaysInTransit)
			: undefined,
		raw: rs,
	}))
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
