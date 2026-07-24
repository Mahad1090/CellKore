import { createServiceClient } from '@/lib/supabase-server'
import { getCanadaPostRates } from '@/lib/shipping/canada-post'
import { getUpsRates } from '@/lib/shipping/ups'
import { getShipFromAddress } from '@/lib/shipping/ship-from'
import type { NormalizedRate, PackageInput, RateQuoteResult, ShippingParty } from '@/lib/shipping/types'

export interface RateDestination {
	name: string
	phone: string
	line1: string
	line2?: string
	city: string
	stateProvince: string
	postalCode: string
	country: string
}

function toShippingParty(destination: RateDestination): ShippingParty {
	return {
		name: destination.name,
		phone: destination.phone,
		line1: destination.line1,
		line2: destination.line2,
		city: destination.city,
		stateProvince: destination.stateProvince,
		postalCode: destination.postalCode,
		country: destination.country,
	}
}

/**
 * Queries Canada Post and UPS in parallel and returns a merged,
 * cost-sorted rate list. Both carriers are queried regardless of
 * destination marketplace (CA/US) — let price/ETA decide, rather than
 * hardcoding carrier-by-marketplace. If one carrier errors, the other's
 * rates are still returned; if both error, an empty rate list is
 * returned so checkout can block placing the order rather than
 * fabricating a flat-rate fallback.
 */
export async function getShippingRates(pkg: PackageInput, destination: RateDestination): Promise<RateQuoteResult> {
	let origin: ShippingParty
	try {
		origin = await getShipFromAddress()
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Ship-from address is not configured'
		return { rates: [], errors: { canada_post: message, ups: message } }
	}
	const destParty = toShippingParty(destination)

	const [canadaPostResult, upsResult] = await Promise.allSettled([
		getCanadaPostRates(pkg, { postalCode: origin.postalCode }, destParty),
		getUpsRates(pkg, toShippingParty(origin), destParty),
	])

	const rates: NormalizedRate[] = []
	const errors: RateQuoteResult['errors'] = {}

	if (canadaPostResult.status === 'fulfilled') {
		rates.push(...canadaPostResult.value)
	} else {
		const message = canadaPostResult.reason instanceof Error ? canadaPostResult.reason.message : 'Canada Post rates unavailable'
		errors.canada_post = message
		await logShippingError('canada_post', message)
	}

	if (upsResult.status === 'fulfilled') {
		rates.push(...upsResult.value)
	} else {
		const message = upsResult.reason instanceof Error ? upsResult.reason.message : 'UPS rates unavailable'
		errors.ups = message
		await logShippingError('ups', message)
	}

	rates.sort((a, b) => a.cost - b.cost)
	return { rates, errors }
}

async function logShippingError(source: 'canada_post' | 'ups', message: string): Promise<void> {
	await createServiceClient()
		.from('admin_logs')
		.insert({ level: 'warning', source, message: `Shipping rate quote failed: ${message}` })
		.then(undefined, () => undefined)
}
