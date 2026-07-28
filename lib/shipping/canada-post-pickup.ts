import { canadaPostCredentials, type CanadaPostMode } from '@/lib/shipping/env'
import { API_ROOT, getAccessToken, fetchWithTimeoutRetry } from '@/lib/shipping/canada-post'
import type { ShippingParty } from '@/lib/shipping/types'

// Canada Post Pickup API: same OAuth2 client/host as Rating/Shipping
// (lib/shipping/canada-post.ts), under /pickup/v1 instead of /rating/v1 or
// /shipping/v1. A pickup asks Canada Post to send a driver to CellKore's
// own ship-from address to collect already-labeled outbound packages.

const PICKUP_API_ROOT = `${API_ROOT}/pickup/v1`
const REQUEST_TIMEOUT_MS = 8000
const CREATE_TIMEOUT_MS = 15000

// Same TEMP business decision as createCanadaPostShipment
// (lib/shipping/canada-post.ts): scheduling a real driver pickup is an even
// bigger real-world side effect than a label, so every Pickup API call
// stays on 'test' until the business is ready to go fully live. Delete this
// override (thread a mode through instead) once ready.
const MODE: CanadaPostMode = 'test'

function pickupHeaders(accessToken: string): Record<string, string> {
	return {
		Authorization: `Bearer ${accessToken}`,
		'Content-Type': 'application/json',
		Accept: 'application/json',
		'Accept-Language': 'en-CA',
	}
}

// Canada Post's Contact schema requires phone in strict 999-999-9999 form;
// CellKore's ship-from phone is free text, so normalize rather than fail.
function formatPhoneForCanadaPost(phone: string): string {
	const digits = phone.replace(/\D/g, '').slice(-10)
	if (digits.length !== 10) return phone
	return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
}

export interface CanadaPostPickupInput {
	origin: ShippingParty
	email: string
	date: string // YYYY-MM-DD
	preferredTime: string // HH:MM, between 12:00 and 16:00 in 15-min steps
	closingTime: string // HH:MM, at least 1hr after preferredTime
	pickupInstructions: string
	pickupVolume: string
	loadingDockFlag?: boolean
	fiveTonFlag?: boolean
}

function alternateAddressBlock(origin: ShippingParty) {
	return {
		company: (origin.company || origin.name).slice(0, 35),
		addressLine1: origin.line1.slice(0, 35),
		city: origin.city.slice(0, 35),
		province: origin.stateProvince,
		postalCode: origin.postalCode.replace(/\s/g, ''),
	}
}

function contactInfoBlock(input: CanadaPostPickupInput) {
	return {
		contactName: input.origin.name.slice(0, 35),
		email: input.email,
		contactPhone: formatPhoneForCanadaPost(input.origin.phone),
		lang: 'e' as const,
		receiveEmailUpdatesFlag: true,
	}
}

function locationDetailsBlock(input: CanadaPostPickupInput) {
	return {
		fiveTonFlag: input.fiveTonFlag ?? false,
		loadingDockFlag: input.loadingDockFlag ?? false,
		pickupInstructions: input.pickupInstructions.slice(0, 40),
	}
}

export interface CanadaPostPickupCreateResult {
	requestId: string
	price?: { preTaxAmount?: string; gstAmount?: string; pstAmount?: string; hstAmount?: string; dueAmount?: string }
	raw: unknown
}

/** "Create On-demand Pickup" — books a driver pickup at an alternate (ship-from) address, paid by credit card per Canada Post's rules for third-party pickups. */
export async function createCanadaPostPickup(input: CanadaPostPickupInput): Promise<CanadaPostPickupCreateResult> {
	const { customerNumber } = canadaPostCredentials(MODE)
	const accessToken = await getAccessToken(MODE)

	const res = await fetchWithTimeoutRetry(
		`${PICKUP_API_ROOT}/${customerNumber}/pickup-request`,
		{
			method: 'POST',
			headers: pickupHeaders(accessToken),
			body: JSON.stringify({
				pickupType: 'OnDemand',
				pickupLocation: { businessAddressFlag: false, alternateAddress: alternateAddressBlock(input.origin) },
				contactInfo: contactInfoBlock(input),
				locationDetails: locationDetailsBlock(input),
				pickupVolume: input.pickupVolume.slice(0, 40),
				pickupTimes: {
					onDemandPickupTime: { date: input.date, preferredTime: input.preferredTime, closingTime: input.closingTime },
				},
				paymentInfo: { methodOfPayment: 'CreditCard' },
			}),
		},
		CREATE_TIMEOUT_MS
	)
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`Canada Post pickup creation failed: ${res.status} ${detail}`.trim())
	}
	const json = await res.json()
	const requestId: string = json.pickupRequestHeader?.requestId ?? ''
	if (!requestId) throw new Error('Canada Post pickup creation response is missing a request ID')

	return { requestId, price: json.pickupRequestPrice, raw: json }
}

/** "Modify On-demand Pickup" — contact/location/volume/times/payment can change; address/type cannot. */
export async function modifyCanadaPostPickup(requestId: string, input: CanadaPostPickupInput): Promise<void> {
	const { customerNumber } = canadaPostCredentials(MODE)
	const accessToken = await getAccessToken(MODE)

	const res = await fetchWithTimeoutRetry(
		`${PICKUP_API_ROOT}/${customerNumber}/pickup-request/${requestId}`,
		{
			method: 'PUT',
			headers: pickupHeaders(accessToken),
			body: JSON.stringify({
				contactInfo: contactInfoBlock(input),
				locationDetails: locationDetailsBlock(input),
				pickupVolume: input.pickupVolume.slice(0, 40),
				pickupTimes: {
					onDemandPickupTime: { date: input.date, preferredTime: input.preferredTime, closingTime: input.closingTime },
				},
				paymentInfo: { methodOfPayment: 'CreditCard' },
			}),
		},
		CREATE_TIMEOUT_MS
	)
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`Canada Post pickup modification failed: ${res.status} ${detail}`.trim())
	}
}

/** "Cancel On-demand Pickup" */
export async function cancelCanadaPostPickup(requestId: string): Promise<void> {
	const { customerNumber } = canadaPostCredentials(MODE)
	const accessToken = await getAccessToken(MODE)

	const res = await fetchWithTimeoutRetry(
		`${PICKUP_API_ROOT}/${customerNumber}/pickup-request/${requestId}`,
		{ method: 'DELETE', headers: pickupHeaders(accessToken) },
		REQUEST_TIMEOUT_MS
	)
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`Canada Post pickup cancellation failed: ${res.status} ${detail}`.trim())
	}
}

export interface CanadaPostPickupSummary {
	requestId: string
	requestStatus: string
	pickupType: string
	requestDate: string
	nextPickupDate?: string
}

/** "Get All On-demand Pickups" */
export async function listCanadaPostPickups(): Promise<CanadaPostPickupSummary[]> {
	const { customerNumber } = canadaPostCredentials(MODE)
	const accessToken = await getAccessToken(MODE)

	const res = await fetchWithTimeoutRetry(
		`${PICKUP_API_ROOT}/${customerNumber}/pickup-request`,
		{ method: 'GET', headers: pickupHeaders(accessToken) },
		REQUEST_TIMEOUT_MS
	)
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`Canada Post pickup list failed: ${res.status} ${detail}`.trim())
	}
	const json = await res.json()
	// The spec's example payload and schema disagree on the key name
	// ("pickupRequests" vs "pickupRequest") — accept either.
	const list: any[] = json.pickupRequest ?? json.pickupRequests ?? []
	return list.map((entry) => {
		const header = entry.pickupRequestHeader ?? entry
		return {
			requestId: header.requestId ?? '',
			requestStatus: header.requestStatus ?? '',
			pickupType: header.pickupType ?? '',
			requestDate: header.requestDate ?? '',
			nextPickupDate: header.nextPickupDate,
		}
	})
}

/** "Get Pickup Details" */
export async function getCanadaPostPickupDetails(requestId: string): Promise<any> {
	const { customerNumber } = canadaPostCredentials(MODE)
	const accessToken = await getAccessToken(MODE)

	const res = await fetchWithTimeoutRetry(
		`${PICKUP_API_ROOT}/${customerNumber}/pickup-request/${requestId}/details`,
		{ method: 'GET', headers: pickupHeaders(accessToken) },
		REQUEST_TIMEOUT_MS
	)
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`Canada Post pickup details lookup failed: ${res.status} ${detail}`.trim())
	}
	return res.json()
}

export interface CanadaPostPickupPriceParams {
	date: string // YYYY-MM-DD
	contractId?: string
	priorityFlag?: boolean
	alternateAddressPostalCode?: string
}

export interface CanadaPostPickupPrice {
	preTaxAmount: string
	gstAmount: string
	pstAmount: string
	hstAmount: string
	dueAmount: string
}

/** "Get Pickup Price" — cost preview only, no booking made. */
export async function getCanadaPostPickupPrice(params: CanadaPostPickupPriceParams): Promise<CanadaPostPickupPrice> {
	const { customerNumber } = canadaPostCredentials(MODE)
	const accessToken = await getAccessToken(MODE)

	const query = new URLSearchParams({ date: params.date })
	if (params.contractId) query.set('contractId', params.contractId)
	if (params.priorityFlag !== undefined) query.set('priorityFlag', String(params.priorityFlag))
	if (params.alternateAddressPostalCode) query.set('alternateAddressPostalCode', params.alternateAddressPostalCode.replace(/\s/g, ''))

	const res = await fetchWithTimeoutRetry(
		`${PICKUP_API_ROOT}/${customerNumber}/pickup-request/price?${query.toString()}`,
		{ method: 'GET', headers: pickupHeaders(accessToken) },
		REQUEST_TIMEOUT_MS
	)
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`Canada Post pickup price lookup failed: ${res.status} ${detail}`.trim())
	}
	return res.json()
}

export interface CanadaPostPickupAvailability {
	postalCode: string
	onDemandCutoff: string
	onDemandTour: boolean
	scheduledPickupsAvailable: boolean
}

/** "Get Pickup Availability" — no {customer} prefix, per spec. */
export async function getCanadaPostPickupAvailability(postalCode: string): Promise<CanadaPostPickupAvailability> {
	const accessToken = await getAccessToken(MODE)
	const normalized = postalCode.replace(/\s/g, '').toUpperCase()

	const res = await fetchWithTimeoutRetry(
		`${PICKUP_API_ROOT}/pickup-availability/${normalized}`,
		{ method: 'GET', headers: pickupHeaders(accessToken) },
		REQUEST_TIMEOUT_MS
	)
	if (!res.ok) {
		const detail = await res.text().catch(() => '')
		throw new Error(`Canada Post pickup availability lookup failed: ${res.status} ${detail}`.trim())
	}
	return res.json()
}
