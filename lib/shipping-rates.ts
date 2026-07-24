import { getShippingRates } from '@/lib/shipping/aggregator'
import { computePackageForItems } from '@/lib/shipping/package'
import type { RepairShippingOption } from '@/lib/types'

export interface ShippingRateAddress {
	name: string
	phone: string
	line1: string
	line2?: string | null
	city: string
	stateProvince?: string | null
	postalCode?: string | null
	country: string
}

/**
 * Live Canada Post + UPS rates for a repair's shipping-back options,
 * shown on the quote for the customer to pick from. Repairs don't carry
 * per-device weight/dimensions (unlike catalog products), so package
 * sizing falls back to the default box (lib/shipping/package.ts).
 */
export async function getRepairShippingRateOptions(address: ShippingRateAddress): Promise<RepairShippingOption[]> {
	const pkg = computePackageForItems([{ quantity: 1 }])
	const { rates } = await getShippingRates(pkg, {
		name: address.name,
		phone: address.phone,
		line1: address.line1,
		line2: address.line2 ?? undefined,
		city: address.city,
		stateProvince: address.stateProvince ?? '',
		postalCode: address.postalCode ?? '',
		country: address.country,
	})

	return rates.map((r) => ({
		label: `${r.carrier === 'ups' ? 'UPS' : 'Canada Post'} — ${r.serviceName}`,
		cost: r.cost,
		carrier: r.carrier,
		serviceCode: r.serviceCode,
		currency: r.currency,
	}))
}
