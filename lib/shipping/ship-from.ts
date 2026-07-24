import { createServiceClient } from '@/lib/supabase-server'
import type { ShippingParty } from '@/lib/shipping/types'

/**
 * The warehouse/ship-from address every outbound label originates from.
 * Admin-configured (Admin → Store Addresses) rather than env-based,
 * since it's a business fact that can change, not deploy-time config —
 * stored on the repair_settings singleton, which already hosts the
 * free-text warehouse_address shown on receipts/policy pages.
 */
export async function getShipFromAddress(): Promise<ShippingParty> {
	const service = createServiceClient()
	const { data } = await service
		.from('repair_settings')
		.select(
			'ship_from_name, ship_from_company, ship_from_phone, ship_from_line1, ship_from_line2, ship_from_city, ship_from_state_province, ship_from_postal_code, ship_from_country'
		)
		.limit(1)
		.maybeSingle()

	if (
		!data?.ship_from_name ||
		!data.ship_from_phone ||
		!data.ship_from_line1 ||
		!data.ship_from_city ||
		!data.ship_from_state_province ||
		!data.ship_from_postal_code ||
		!data.ship_from_country
	) {
		throw new Error('Ship-from address is not configured — set it in Admin → Store Addresses')
	}

	return {
		name: data.ship_from_name,
		company: data.ship_from_company ?? undefined,
		phone: data.ship_from_phone,
		line1: data.ship_from_line1,
		line2: data.ship_from_line2 ?? undefined,
		city: data.ship_from_city,
		stateProvince: data.ship_from_state_province,
		postalCode: data.ship_from_postal_code,
		country: data.ship_from_country,
	}
}
