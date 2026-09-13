import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'
import { createShipmentWithCarrier } from '@/lib/shipping/create-shipment'
import { uploadShippingLabel } from '@/lib/shipping/label-storage'
import { computePackageForItems } from '@/lib/shipping/package'
import { getShipFromAddress } from '@/lib/shipping/ship-from'
import type { ShippingCarrier } from '@/lib/types'

// Interim manual path (carrier/tracking_number/label_url all provided) or
// a retry of the real carrier call (empty body) if the automatic
// generation in lib/sell-request-return.ts's markReturnShipmentPaid
// failed at payment time.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireAdmin(request, 'sell-requests:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const body = await request.json().catch(() => ({}))

	const manualCarrier = String(body.carrier ?? '').trim()
	const manualTracking = String(body.tracking_number ?? '').trim()
	const manualLabelUrl = String(body.label_url ?? '').trim()

	const service = createServiceClient()

	if (manualCarrier && manualTracking && manualLabelUrl) {
		const { error } = await service
			.from('sell_phone_return_shipments')
			.update({
				carrier: manualCarrier,
				tracking_number: manualTracking,
				label_url: manualLabelUrl,
				label_status: 'generated',
				updated_at: new Date().toISOString(),
			})
			.eq('request_id', id)
		if (error) return NextResponse.json({ error: error.message }, { status: 500 })
		return NextResponse.json({ success: true })
	}

	const { data: shipment, error: fetchError } = await service
		.from('sell_phone_return_shipments')
		.select('address_line1, address_line2, city, state_province, postal_code, country, phone, carrier, service_code')
		.eq('request_id', id)
		.maybeSingle()
	if (fetchError || !shipment) return NextResponse.json({ error: 'No return shipment on file' }, { status: 404 })
	if (!shipment.address_line1 || !shipment.city || !shipment.country || !shipment.carrier || !shipment.service_code) {
		return NextResponse.json({ error: 'This return shipment is missing carrier/address details' }, { status: 400 })
	}

	try {
		const origin = await getShipFromAddress()
		const pkg = computePackageForItems([{ quantity: 1 }])
		const shipmentRequest = {
			serviceCode: shipment.service_code,
			reference: id,
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
		const labelUrl = await uploadShippingLabel(`sell-returns/${id}`, result.labelBytes, result.labelContentType)

		const { error } = await service
			.from('sell_phone_return_shipments')
			.update({
				tracking_number: result.trackingNumber,
				label_url: labelUrl,
				label_status: 'generated',
				updated_at: new Date().toISOString(),
			})
			.eq('request_id', id)
		if (error) return NextResponse.json({ error: error.message }, { status: 500 })

		return NextResponse.json({ success: true, trackingNumber: result.trackingNumber, labelUrl })
	} catch (err) {
		await service
			.from('sell_phone_return_shipments')
			.update({ label_status: 'failed', updated_at: new Date().toISOString() })
			.eq('request_id', id)
		return NextResponse.json({ error: err instanceof Error ? err.message : 'Label generation failed' }, { status: 502 })
	}
}
