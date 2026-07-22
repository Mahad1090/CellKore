export interface ReturnShippingLabel {
	carrier: string
	trackingNumber: string
	labelUrl: string
}

export interface ReturnShippingAddress {
	line1: string
	line2: string | null
	city: string
	stateProvince: string | null
	postalCode: string | null
	country: string
	phone: string | null
}

/**
 * Purchases a return shipping label once payment succeeds. Not yet wired
 * to a real carrier account — swap this function's body for a call to
 * EasyPost / Shippo / ShipEngine (or whichever provider is chosen) once
 * an account and API key exist. Callers already treat a null return as
 * "needs manual admin fulfillment", so no other code changes are needed
 * when this becomes a real integration.
 */
export async function generateReturnShippingLabel(
	_toAddress: ReturnShippingAddress
): Promise<ReturnShippingLabel | null> {
	return null
}
