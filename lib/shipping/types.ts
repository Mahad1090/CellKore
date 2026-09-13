import type { ShippingCarrier } from '@/lib/types'

const CARRIER_DISPLAY_NAMES: Record<ShippingCarrier, string> = {
	canada_post: 'Canada Post',
	ups: 'UPS',
	stallion: 'Stallion Express',
}

/** Single source of truth for a carrier's human-readable name — every UI
 *  label/badge should go through this instead of its own ternary, so
 *  adding a carrier only ever means updating this one map. */
export function carrierDisplayName(carrier: ShippingCarrier): string {
	return CARRIER_DISPLAY_NAMES[carrier] ?? carrier
}

export interface ShippingParty {
	name: string
	company?: string
	phone: string
	line1: string
	line2?: string
	city: string
	stateProvince: string
	postalCode: string
	country: string
}

/** One physical package to be rated/shipped. */
export interface PackageInput {
	weightKg: number
	lengthCm: number
	widthCm: number
	heightCm: number
}

export interface NormalizedRate {
	carrier: ShippingCarrier
	serviceCode: string
	serviceName: string
	cost: number
	currency: string
	transitDays?: number
	/** Raw carrier response for this rate, kept for audit/debugging. */
	raw?: unknown
}

export interface RateQuoteResult {
	rates: NormalizedRate[]
	errors: Partial<Record<ShippingCarrier, string>>
}

export interface ShipmentRequest {
	serviceCode: string
	shipFrom: ShippingParty
	shipTo: ShippingParty
	pkg: PackageInput
	/** Used by the caller for reference numbers / label metadata. */
	reference: string
}

export interface ShipmentResult {
	carrier: ShippingCarrier
	trackingNumber: string
	labelBytes: Buffer
	labelContentType: string
	/** Carrier's own shipment/label identifier (needed for Canada Post's
	 *  artifact fetch and any future void/refund calls). */
	carrierShipmentId: string
}
