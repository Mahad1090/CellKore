import type { SupabaseClient } from '@supabase/supabase-js'
import { resolveAndValidateItems, type CheckoutItemInput, type ShippingAddressInput } from '@/lib/checkout-server'
import { computePackageForItems } from '@/lib/shipping/package'
import type { PackageInput } from '@/lib/shipping/types'
import type { RateDestination } from '@/lib/shipping/aggregator'

export interface RateRequestBody {
	cartItems: CheckoutItemInput[]
	shippingAddress: ShippingAddressInput
}

export type RateRequestResolution = { pkg: PackageInput; destination: RateDestination } | { error: string; status: number }

/**
 * Shared by the checkout page's rate-shopping endpoints (per-carrier):
 * validates the address, re-verifies stock/pricing (throws StockError,
 * left to the caller to catch same as the rest of checkout), and builds
 * the package to rate.
 */
export async function resolveRateRequest(service: SupabaseClient, body: RateRequestBody): Promise<RateRequestResolution> {
	const { cartItems, shippingAddress } = body

	if (!shippingAddress?.line1 || !shippingAddress?.city || !shippingAddress?.country || !shippingAddress?.postalCode) {
		return { error: 'A complete shipping address is required', status: 400 }
	}
	if (!shippingAddress?.phone) {
		return { error: 'A phone number is required for shipping', status: 400 }
	}

	const items = await resolveAndValidateItems(service, cartItems)
	const pkg = computePackageForItems(
		items.map((i) => ({ quantity: i.quantity, weightKg: i.weightKg, lengthCm: i.lengthCm, widthCm: i.widthCm, heightCm: i.heightCm }))
	)
	const destination: RateDestination = {
		name: shippingAddress.fullName || 'Customer',
		phone: shippingAddress.phone,
		line1: shippingAddress.line1,
		line2: shippingAddress.line2,
		city: shippingAddress.city,
		stateProvince: shippingAddress.stateProvince ?? '',
		postalCode: shippingAddress.postalCode ?? '',
		country: shippingAddress.country,
	}

	return { pkg, destination }
}
