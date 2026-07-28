import { upsApiBase, upsCredentials } from '@/lib/shipping/env'
import { upsToken } from '@/lib/shipping/ups'
import type { ShippingParty } from '@/lib/shipping/types'

// UPS Pickup API (github.com/UPS-API/api-documentation, Pickup.yaml): same
// OAuth2 app/host as Rating/Shipping (lib/shipping/ups.ts) — a pickup asks
// UPS to send a driver to CellKore's own ship-from address to collect
// already-labeled outbound packages, distinct from the Shipping API's
// "print a label" step.

const API_VERSION = 'v2409'
const REQUEST_TIMEOUT_MS = 8000
const CREATE_TIMEOUT_MS = 15000

export type UpsPickupType = 'oncall' | 'smart' | 'both'

function pickupHeaders(token: string): Record<string, string> {
	return {
		Authorization: `Bearer ${token}`,
		'Content-Type': 'application/json',
		transId: `${Date.now()}`,
		transactionSrc: 'cellkore',
	}
}

function pickupAddressLines(party: ShippingParty): string[] {
	return [party.line1, party.line2].filter((line): line is string => Boolean(line))
}

export interface UpsPickupDateInfo {
	pickupDate: string // yyyyMMdd
	readyTime: string // HHmm
	closeTime: string // HHmm
}

export interface UpsPickupRateResult {
	cost: number
	currency: string
	raw: unknown
}

/** "Pickup Rate" — cost preview for an on-call pickup, no booking made. */
export async function rateUpsPickup(
	origin: ShippingParty,
	dateInfo: UpsPickupDateInfo,
	pickuptype: UpsPickupType = 'oncall'
): Promise<UpsPickupRateResult> {
	const token = await upsToken()
	const { accountNumber } = upsCredentials()

	const res = await fetch(`${upsApiBase()}/api/shipments/${API_VERSION}/pickup/${pickuptype}`, {
		method: 'POST',
		headers: pickupHeaders(token),
		body: JSON.stringify({
			PickupRateRequest: {
				Request: {},
				ShipperAccount: { AccountNumber: accountNumber, AccountCountryCode: origin.country },
				PickupAddress: {
					AddressLine: pickupAddressLines(origin),
					City: origin.city,
					StateProvince: origin.stateProvince,
					PostalCode: origin.postalCode,
					CountryCode: origin.country,
					ResidentialIndicator: 'N',
				},
				AlternateAddressIndicator: 'N',
				ServiceDateOption: '03', // a specific day — we always know the requested date
				PickupDateInfo: { CloseTime: dateInfo.closeTime, ReadyTime: dateInfo.readyTime, PickupDate: dateInfo.pickupDate },
			},
		}),
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	})
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`UPS pickup rate failed: ${res.status} ${detail}`.trim())
	}
	const json = await res.json()
	const rateResult = json.PickupRateResponse?.RateResult
	return {
		cost: Number(rateResult?.GrandTotalOfAllCharge ?? 0),
		currency: rateResult?.CurrencyCode || 'USD',
		raw: json,
	}
}

export interface UpsPickupCreateInput extends UpsPickupDateInfo {
	origin: ShippingParty
	pieceCount: number
	totalWeightKg?: number
	specialInstruction?: string
	referenceNumber?: string
}

export interface UpsPickupCreateResult {
	prn: string
	cost?: number
	currency?: string
	raw: unknown
}

/** "Pickup Creation" (standard on-call flow) — books a driver pickup. */
export async function createUpsPickup(input: UpsPickupCreateInput): Promise<UpsPickupCreateResult> {
	const token = await upsToken()
	const { accountNumber } = upsCredentials()
	const { origin } = input

	const res = await fetch(`${upsApiBase()}/api/pickupcreation/${API_VERSION}/pickup`, {
		method: 'POST',
		headers: pickupHeaders(token),
		body: JSON.stringify({
			PickupCreationRequest: {
				Request: {},
				RatePickupIndicator: 'Y', // ask UPS to rate it inline so we can store estimated_cost
				Shipper: { Account: { AccountNumber: accountNumber, AccountCountryCode: origin.country } },
				PickupDateInfo: { CloseTime: input.closeTime, ReadyTime: input.readyTime, PickupDate: input.pickupDate },
				PickupAddress: {
					CompanyName: (origin.company || origin.name).slice(0, 27),
					ContactName: origin.name.slice(0, 22),
					AddressLine: pickupAddressLines(origin),
					City: origin.city,
					StateProvince: origin.stateProvince,
					CountryCode: origin.country,
					ResidentialIndicator: 'N',
					Phone: { Number: origin.phone },
				},
				AlternateAddressIndicator: 'N',
				PickupPiece: [
					{
						ServiceCode: '001', // UPS Ground — CellKore's default outbound service
						Quantity: String(input.pieceCount),
						DestinationCountryCode: origin.country,
						ContainerCode: '01', // package
					},
				],
				...(input.totalWeightKg
					? { TotalWeight: { Weight: input.totalWeightKg.toFixed(1), UnitOfMeasurement: 'KGS' } }
					: {}),
				OverweightIndicator: 'N',
				PaymentMethod: '01', // pay by shipper account
				...(input.specialInstruction ? { SpecialInstruction: input.specialInstruction.slice(0, 57) } : {}),
				...(input.referenceNumber ? { ReferenceNumber: input.referenceNumber.slice(0, 35) } : {}),
			},
		}),
		signal: AbortSignal.timeout(CREATE_TIMEOUT_MS),
	})
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`UPS pickup creation failed: ${res.status} ${detail}`.trim())
	}
	const json = await res.json()
	const response = json.PickupCreationResponse
	const prn: string = response?.PRN ?? ''
	if (!prn) throw new Error('UPS pickup creation response is missing a PRN')

	return {
		prn,
		cost: response?.RateResult?.GrandTotalOfAllCharge ? Number(response.RateResult.GrandTotalOfAllCharge) : undefined,
		currency: response?.RateResult?.CurrencyCode,
		raw: json,
	}
}

export interface UpsSmartPickupResult {
	prn: string
	serviceDate?: string
	triggerStatusCode?: string
	raw: unknown
}

/** "Pickup Creation" (Smart/GWN flow) — triggers pickup at the account's pre-configured address, no PickupAddress/pieces needed. */
export async function triggerUpsSmartPickup(serviceDateOption: '01' | '02' = '01'): Promise<UpsSmartPickupResult> {
	const token = await upsToken()
	const { accountNumber } = upsCredentials()

	const res = await fetch(`${upsApiBase()}/api/pickupcreation/${API_VERSION}/pickup`, {
		method: 'POST',
		headers: pickupHeaders(token),
		body: JSON.stringify({
			PickupTriggerGWNRequest: {
				Request: {},
				AccountNumber: accountNumber,
				ServiceDateOption: serviceDateOption,
			},
		}),
		signal: AbortSignal.timeout(CREATE_TIMEOUT_MS),
	})
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`UPS Smart Pickup trigger failed: ${res.status} ${detail}`.trim())
	}
	const json = await res.json()
	const response = json.PickupTriggerGWNResponse
	const prn: string = response?.PRN ?? ''
	if (!prn) throw new Error('UPS Smart Pickup response is missing a PRN')

	return {
		prn,
		serviceDate: response?.ServiceDate,
		triggerStatusCode: response?.TriggerStatus?.Code,
		raw: json,
	}
}

/** "Pickup Cancel" by PRN (CancelBy=02) — the only mode this app needs since we always have our own PRN. */
export async function cancelUpsPickup(prn: string): Promise<void> {
	const token = await upsToken()

	const res = await fetch(`${upsApiBase()}/api/shipments/${API_VERSION}/pickup/02`, {
		method: 'DELETE',
		headers: {
			Authorization: `Bearer ${token}`,
			transId: `${Date.now()}`,
			transactionSrc: 'cellkore',
			Prn: prn,
		},
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	})
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`UPS pickup cancellation failed: ${res.status} ${detail}`.trim())
	}
}

export interface UpsPendingPickup {
	prn: string
	pickupType?: string
	serviceDate?: string
	statusMessage?: string
	gwnStatusCode?: string
	referenceNumber?: string
}

/** "Pickup Pending Status" — lists all pending pickups on the account (UPS has no single-PRN status lookup). */
export async function listUpsPendingPickups(pickuptype: UpsPickupType = 'both'): Promise<UpsPendingPickup[]> {
	const token = await upsToken()
	const { accountNumber } = upsCredentials()

	const res = await fetch(`${upsApiBase()}/api/shipments/${API_VERSION}/pickup/${pickuptype}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`,
			transId: `${Date.now()}`,
			transactionSrc: 'cellkore',
			AccountNumber: accountNumber,
		},
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	})
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`UPS pickup status lookup failed: ${res.status} ${detail}`.trim())
	}
	const json = await res.json()
	const list: any[] = Array.isArray(json.PickupPendingStatusResponse?.PendingStatus)
		? json.PickupPendingStatusResponse.PendingStatus
		: json.PickupPendingStatusResponse?.PendingStatus
		? [json.PickupPendingStatusResponse.PendingStatus]
		: []

	return list.map((p) => ({
		prn: p.PRN ?? '',
		pickupType: p.PickupType,
		serviceDate: p.ServiceDate,
		statusMessage: p.PickupStatusMessage,
		gwnStatusCode: p.GWNStatusCode,
		referenceNumber: p.ReferenceNumber,
	}))
}

/** "Pickup Get Political Division1 List" — valid state/province codes for a country. Utility only, not wired into the schedule UI. */
export async function getUpsPoliticalDivisions(countryCode: string): Promise<string[]> {
	const token = await upsToken()

	const res = await fetch(`${upsApiBase()}/api/pickup/${API_VERSION}/countries/${countryCode}`, {
		method: 'GET',
		headers: {
			Authorization: `Bearer ${token}`,
			transId: `${Date.now()}`,
			transactionSrc: 'cellkore',
		},
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	})
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`UPS political division lookup failed: ${res.status} ${detail}`.trim())
	}
	const json = await res.json()
	return json.PickupGetPoliticalDivision1ListResponse?.PoliticalDivision1 ?? []
}

export interface UpsServiceCenterInput {
	serviceCode?: string
	containerCode?: string
	locale?: string
	originAddress?: { city?: string; stateProvince?: string; postalCode?: string; countryCode?: string }
	destinationAddress?: { city?: string; stateProvince?: string; postalCode?: string; countryCode?: string }
}

/** "Pickup Get Service Center Facilities" — UPS Freight/WWEF pallet drop points. Not applicable to CellKore's parcel shipments; utility only. */
export async function getUpsServiceCenterFacilities(input: UpsServiceCenterInput): Promise<unknown> {
	const token = await upsToken()

	const res = await fetch(`${upsApiBase()}/api/pickup/${API_VERSION}/servicecenterlocations`, {
		method: 'POST',
		headers: pickupHeaders(token),
		body: JSON.stringify({
			PickupGetServiceCenterFacilitiesRequest: {
				Request: {},
				PickupPiece: { ServiceCode: input.serviceCode ?? '096', ContainerCode: input.containerCode ?? '03' },
				...(input.originAddress
					? {
							OriginAddress: {
								City: input.originAddress.city,
								StateProvince: input.originAddress.stateProvince,
								PostalCode: input.originAddress.postalCode,
								CountryCode: input.originAddress.countryCode,
							},
					  }
					: {}),
				...(input.destinationAddress
					? {
							DestinationAddress: {
								City: input.destinationAddress.city,
								StateProvince: input.destinationAddress.stateProvince,
								PostalCode: input.destinationAddress.postalCode,
								CountryCode: input.destinationAddress.countryCode,
							},
					  }
					: {}),
				Locale: input.locale ?? 'en_US',
			},
		}),
		signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
	})
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`UPS service center lookup failed: ${res.status} ${detail}`.trim())
	}
	return res.json()
}
