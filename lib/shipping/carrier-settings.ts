import { createServiceClient } from '@/lib/supabase-server'
import type { ShippingCarrier } from '@/lib/types'

/**
 * Admin-controlled on/off switches for which carrier rate/label APIs are
 * ever queried — independently for Canada-bound (domestic) destinations
 * vs US/international destinations. Backed by shipping_carrier_settings
 * (see sql/2026-09-13-shipping-carrier-settings.sql), edited from
 * Admin → Settings → Shipping Carriers, and enforced in
 * lib/shipping/aggregator.ts before each carrier is ever called.
 */
export interface CarrierSettings {
	canadaPost: { ca: boolean; us: boolean }
	ups: { ca: boolean; us: boolean }
	stallion: { ca: boolean; us: boolean }
}

// Fail-open (everything enabled) if the settings row is missing or the
// query errors — a missing row (e.g. migration not yet run) should never
// silently take every carrier offline.
const DEFAULTS: CarrierSettings = {
	canadaPost: { ca: true, us: true },
	ups: { ca: true, us: true },
	stallion: { ca: true, us: true },
}

// Every rate-quote request hits this — a fresh DB round trip each time
// isn't worth it for a value that changes rarely via the admin panel.
const CACHE_TTL_MS = 60_000
let cache: { data: CarrierSettings; fetchedAt: number } | null = null

export async function getCarrierSettings(): Promise<CarrierSettings> {
	if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.data

	const { data, error } = await createServiceClient()
		.from('shipping_carrier_settings')
		.select(
			'canada_post_ca_enabled, canada_post_us_enabled, ups_ca_enabled, ups_us_enabled, stallion_ca_enabled, stallion_us_enabled'
		)
		.eq('id', true)
		.maybeSingle()

	const result: CarrierSettings =
		error || !data
			? DEFAULTS
			: {
					canadaPost: { ca: data.canada_post_ca_enabled !== false, us: data.canada_post_us_enabled !== false },
					ups: { ca: data.ups_ca_enabled !== false, us: data.ups_us_enabled !== false },
					stallion: { ca: data.stallion_ca_enabled !== false, us: data.stallion_us_enabled !== false },
				}

	cache = { data: result, fetchedAt: Date.now() }
	return result
}

/** Called by the admin settings route right after a save, so a toggle
 *  takes effect immediately instead of waiting out the cache TTL. */
export function invalidateCarrierSettingsCache(): void {
	cache = null
}

/** Whether `carrier` should be queried for a destination in `countryCode`
 *  — CA is treated as domestic, anything else (US and every other
 *  country) as the "US/international" bucket, matching the admin panel's
 *  two regions. */
export function isCarrierEnabledForCountry(
	settings: CarrierSettings,
	carrier: ShippingCarrier,
	countryCode: string
): boolean {
	const region = countryCode?.toUpperCase() === 'CA' ? 'ca' : 'us'
	if (carrier === 'canada_post') return settings.canadaPost[region]
	if (carrier === 'ups') return settings.ups[region]
	return settings.stallion[region]
}
