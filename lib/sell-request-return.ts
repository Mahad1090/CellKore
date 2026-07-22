import type { SupabaseClient } from '@supabase/supabase-js'
import { generateReturnShippingLabel } from '@/lib/shipping-label'

/**
 * Marks a return shipment as paid and attempts label generation. Called
 * from both the Stripe webhook and the PayPal capture route once payment
 * is confirmed, so the two payment paths stay in sync.
 */
export async function markReturnShipmentPaid(
	service: SupabaseClient,
	requestId: string,
	paymentProvider: string,
	paymentReference: string
): Promise<void> {
	const { data: shipment } = await service
		.from('sell_phone_return_shipments')
		.select('address_line1, address_line2, city, state_province, postal_code, country, phone')
		.eq('request_id', requestId)
		.maybeSingle()

	await service
		.from('sell_phone_return_shipments')
		.update({
			payment_provider: paymentProvider,
			payment_reference: paymentReference,
			paid_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		})
		.eq('request_id', requestId)

	if (!shipment?.address_line1 || !shipment.city || !shipment.country) return

	const label = await generateReturnShippingLabel({
		line1: shipment.address_line1,
		line2: shipment.address_line2,
		city: shipment.city,
		stateProvince: shipment.state_province,
		postalCode: shipment.postal_code,
		country: shipment.country,
		phone: shipment.phone,
	}).catch(() => null)

	if (label) {
		await service
			.from('sell_phone_return_shipments')
			.update({
				label_status: 'generated',
				carrier: label.carrier,
				tracking_number: label.trackingNumber,
				label_url: label.labelUrl,
				updated_at: new Date().toISOString(),
			})
			.eq('request_id', requestId)
	}
}
