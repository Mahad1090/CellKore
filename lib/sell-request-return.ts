import type { SupabaseClient } from '@supabase/supabase-js'
import { createShipmentWithCarrier } from '@/lib/shipping/create-shipment'
import { uploadShippingLabel } from '@/lib/shipping/label-storage'
import { computePackageForItems } from '@/lib/shipping/package'
import { getShipFromAddress } from '@/lib/shipping/ship-from'
import type { ShippingCarrier } from '@/lib/types'

/**
 * Marks a return shipment as paid and attempts real label generation via
 * the carrier + service the customer selected at payment time. Called
 * from the Stripe webhook, the PayPal capture route, and the PayPal
 * webhook backstop once payment is confirmed, so all payment paths stay
 * in sync. The device is already physically at CellKore's warehouse by
 * this point, so — unlike the repair flow's outbound leg — label
 * generation is attempted immediately rather than waiting for a separate
 * admin action; admin can still retry or enter a label manually if this
 * fails.
 *
 * Idempotent: the PayPal capture route and the PayPal webhook backstop can
 * both fire for the same payment, and this isn't safe to run twice (it
 * would attempt a second, duplicate label purchase from the carrier).
 */
export async function markReturnShipmentPaid(
	service: SupabaseClient,
	requestId: string,
	paymentProvider: string,
	paymentReference: string
): Promise<void> {
	const { data: shipment } = await service
		.from('sell_phone_return_shipments')
		.select(
			'address_line1, address_line2, city, state_province, postal_code, country, phone, carrier, service_code, paid_at'
		)
		.eq('request_id', requestId)
		.maybeSingle()
	if (shipment?.paid_at) return

	await service
		.from('sell_phone_return_shipments')
		.update({
			payment_provider: paymentProvider,
			payment_reference: paymentReference,
			paid_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		})
		.eq('request_id', requestId)

	if (!shipment?.address_line1 || !shipment.city || !shipment.country || !shipment.carrier || !shipment.service_code) {
		return
	}

	try {
		const origin = await getShipFromAddress()
		const pkg = computePackageForItems([{ quantity: 1 }])
		const shipmentRequest = {
			serviceCode: shipment.service_code,
			reference: requestId,
			pkg,
			shipFrom: origin,
			shipTo: {
				name: 'Customer',
				phone: shipment.phone || origin.phone,
				line1: shipment.address_line1,
				line2: shipment.address_line2 ?? undefined,
				city: shipment.city,
				stateProvince: shipment.state_province ?? '',
				postalCode: shipment.postal_code ?? '',
				country: shipment.country,
			},
		}
		const result = await createShipmentWithCarrier(shipment.carrier as ShippingCarrier, shipmentRequest)
		const labelUrl = await uploadShippingLabel(`sell-returns/${requestId}`, result.labelBytes, result.labelContentType)

		await service
			.from('sell_phone_return_shipments')
			.update({
				label_status: 'generated',
				tracking_number: result.trackingNumber,
				label_url: labelUrl,
				updated_at: new Date().toISOString(),
			})
			.eq('request_id', requestId)
	} catch (err) {
		await service
			.from('sell_phone_return_shipments')
			.update({ label_status: 'failed', updated_at: new Date().toISOString() })
			.eq('request_id', requestId)
		await service
			.from('admin_logs')
			.insert({
				level: 'error',
				source: shipment.carrier,
				message: `Return label generation failed for sell request ${requestId}: ${err instanceof Error ? err.message : String(err)}`,
			})
			.then(undefined, () => undefined)
	}
}
