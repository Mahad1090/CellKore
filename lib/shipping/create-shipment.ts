import { createCanadaPostShipment } from '@/lib/shipping/canada-post'
import { createUpsShipment } from '@/lib/shipping/ups'
import { createStallionShipment } from '@/lib/shipping/stallion'
import type { ShipmentRequest, ShipmentResult } from '@/lib/shipping/types'
import type { ShippingCarrier } from '@/lib/types'

/** Single dispatch point for "book a label with whichever carrier the
 *  customer/admin picked" — every call site (order labels, repair outbound
 *  shipments, sell-request return shipments) goes through this instead of
 *  its own carrier === 'ups' ? ... : ... ternary, so adding a carrier only
 *  ever means updating this one function. */
export function createShipmentWithCarrier(carrier: ShippingCarrier, req: ShipmentRequest): Promise<ShipmentResult> {
	if (carrier === 'ups') return createUpsShipment(req)
	if (carrier === 'stallion') return createStallionShipment(req)
	return createCanadaPostShipment(req)
}
