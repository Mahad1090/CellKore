import type { RepairShippingOption } from '@/lib/types'

export interface ShippingRateAddress {
	line1: string
	line2?: string | null
	city: string
	stateProvince?: string | null
	postalCode?: string | null
	country: string
}

/**
 * Returns the shipping-back options offered on a repair quote. Not yet
 * wired to a real carrier rates API — swap this function's body for a
 * call to EasyPost / Shippo / ShipEngine (or whichever provider is
 * chosen) using the customer's address once an account and API key
 * exist. Callers already treat the result as "the options to present",
 * so no other code changes are needed when this becomes a real
 * integration.
 */
export async function getRepairShippingRateOptions(
	_address: ShippingRateAddress
): Promise<RepairShippingOption[]> {
	return [
		{ label: 'Standard Shipping (5-7 business days)', cost: 9.99 },
		{ label: 'Express Shipping (2-3 business days)', cost: 24.99 },
	]
}
