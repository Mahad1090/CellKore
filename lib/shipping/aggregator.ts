import { createServiceClient } from '@/lib/supabase-server'
import { getCanadaPostRates } from '@/lib/shipping/canada-post'
import { getUpsRates } from '@/lib/shipping/ups'
import { getStallionRates } from '@/lib/shipping/stallion'
import { getShipFromAddress } from '@/lib/shipping/ship-from'
import { getCarrierSettings, isCarrierEnabledForCountry } from '@/lib/shipping/carrier-settings'
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
 * Queries Canada Post, UPS, and Stallion in parallel and returns a merged,
 * cost-sorted rate list. All three are queried regardless of destination
 * marketplace (CA/US) — let price/ETA decide, rather than hardcoding
 * carrier-by-marketplace — except a carrier the admin has switched off for
 * that destination's region (see lib/shipping/carrier-settings.ts), which
 * is skipped entirely rather than queried and discarded. If a queried
 * carrier errors, the others' rates are still returned; if all error, an
 * empty rate list is returned so checkout can block placing the order
 * rather than fabricating a flat-rate fallback.
 */
export async function getShippingRates(pkg: PackageInput, destination: RateDestination): Promise<RateQuoteResult> {
	let origin: ShippingParty
	try {
		origin = await getShipFromAddress()
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Ship-from address is not configured'
		return { rates: [], errors: { canada_post: message, ups: message, stallion: message } }
	}
	const destParty = toShippingParty(destination)
	const settings = await getCarrierSettings()

	const canadaPostEnabled = isCarrierEnabledForCountry(settings, 'canada_post', destination.country)
	const upsEnabled = isCarrierEnabledForCountry(settings, 'ups', destination.country)
	const stallionEnabled = isCarrierEnabledForCountry(settings, 'stallion', destination.country)

	const [canadaPostResult, upsResult, stallionResult] = await Promise.allSettled([
		canadaPostEnabled ? getCanadaPostRates(pkg, { postalCode: origin.postalCode }, destParty) : Promise.resolve([]),
		upsEnabled ? getUpsRates(pkg, toShippingParty(origin), destParty) : Promise.resolve([]),
		stallionEnabled ? getStallionRates(pkg, toShippingParty(origin), destParty) : Promise.resolve([]),
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

	if (stallionResult.status === 'fulfilled') {
		rates.push(...stallionResult.value)
	} else {
		const message = stallionResult.reason instanceof Error ? stallionResult.reason.message : 'Stallion rates unavailable'
		errors.stallion = message
		await logShippingError('stallion', message)
	}

	rates.sort((a, b) => a.cost - b.cost)
	return { rates, errors }
}

export interface CarrierRateResult {
	rates: NormalizedRate[]
	error?: string
}

/**
 * Single-carrier variants of getShippingRates(), for the checkout page's
 * progressive rate display — called as independent requests so a fast
 * carrier can show up immediately while a slower one is still loading,
 * rather than the whole shipping-method list waiting on the slowest.
 * Each silently returns no rates (not an error) when the admin has
 * disabled that carrier for the destination's region.
 */
export async function getUpsShippingRates(pkg: PackageInput, destination: RateDestination): Promise<CarrierRateResult> {
	const settings = await getCarrierSettings()
	if (!isCarrierEnabledForCountry(settings, 'ups', destination.country)) return { rates: [] }
	try {
		const origin = await getShipFromAddress()
		const rates = await getUpsRates(pkg, toShippingParty(origin), toShippingParty(destination))
		return { rates }
	} catch (err) {
		const message = err instanceof Error ? err.message : 'UPS rates unavailable'
		await logShippingError('ups', message)
		return { rates: [], error: message }
	}
}

export async function getCanadaPostShippingRates(pkg: PackageInput, destination: RateDestination): Promise<CarrierRateResult> {
	const settings = await getCarrierSettings()
	if (!isCarrierEnabledForCountry(settings, 'canada_post', destination.country)) return { rates: [] }
	try {
		const origin = await getShipFromAddress()
		const rates = await getCanadaPostRates(pkg, { postalCode: origin.postalCode }, toShippingParty(destination))
		return { rates }
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Canada Post rates unavailable'
		await logShippingError('canada_post', message)
		return { rates: [], error: message }
	}
}

export async function getStallionShippingRates(pkg: PackageInput, destination: RateDestination): Promise<CarrierRateResult> {
	const settings = await getCarrierSettings()
	if (!isCarrierEnabledForCountry(settings, 'stallion', destination.country)) return { rates: [] }
	try {
		const origin = await getShipFromAddress()
		const rates = await getStallionRates(pkg, toShippingParty(origin), toShippingParty(destination))
		return { rates }
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Stallion rates unavailable'
		await logShippingError('stallion', message)
		return { rates: [], error: message }
	}
}

async function logShippingError(source: 'canada_post' | 'ups' | 'stallion', message: string): Promise<void> {
	await createServiceClient()
		.from('admin_logs')
		.insert({ level: 'warning', source, message: `Shipping rate quote failed: ${message}` })
		.then(undefined, () => undefined)
}
