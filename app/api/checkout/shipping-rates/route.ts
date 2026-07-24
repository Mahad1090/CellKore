import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { resolveAndValidateItems, StockError, type CheckoutItemInput, type ShippingAddressInput } from '@/lib/checkout-server'
import { getShippingRates } from '@/lib/shipping/aggregator'
import { computePackageForItems } from '@/lib/shipping/package'

/**
 * Quotes live Canada Post + UPS rates for the current cart + address, for
 * the checkout page's shipping-method selector. Read-only — no payment
 * or stock mutation happens here; the selected rate is re-validated
 * server-side again at actual checkout time (validateAndPriceShipping).
 */
export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const cartItems: CheckoutItemInput[] = body.cartItems
		const shippingAddress: ShippingAddressInput = body.shippingAddress

		if (!shippingAddress?.line1 || !shippingAddress?.city || !shippingAddress?.country || !shippingAddress?.postalCode) {
			return NextResponse.json({ error: 'A complete shipping address is required' }, { status: 400 })
		}
		if (!shippingAddress?.phone) {
			return NextResponse.json({ error: 'A phone number is required for shipping' }, { status: 400 })
		}

		const service = createServiceClient()
		const items = await resolveAndValidateItems(service, cartItems)

		const pkg = computePackageForItems(
			items.map((i) => ({
				quantity: i.quantity,
				weightKg: i.weightKg,
				lengthCm: i.lengthCm,
				widthCm: i.widthCm,
				heightCm: i.heightCm,
			}))
		)

		const { rates, errors } = await getShippingRates(pkg, {
			name: shippingAddress.fullName || 'Customer',
			phone: shippingAddress.phone,
			line1: shippingAddress.line1,
			line2: shippingAddress.line2,
			city: shippingAddress.city,
			stateProvince: shippingAddress.stateProvince ?? '',
			postalCode: shippingAddress.postalCode ?? '',
			country: shippingAddress.country,
		})

		return NextResponse.json({ rates, errors })
	} catch (err) {
		if (err instanceof StockError) {
			return NextResponse.json({ error: err.message, variantId: err.variantId }, { status: 400 })
		}
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : 'Unable to fetch shipping rates' },
			{ status: 500 }
		)
	}
}
