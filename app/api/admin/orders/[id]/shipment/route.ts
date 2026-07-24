import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'
import { createCanadaPostShipment } from '@/lib/shipping/canada-post'
import { createUpsShipment } from '@/lib/shipping/ups'
import { uploadShippingLabel } from '@/lib/shipping/label-storage'
import { computePackageForItems } from '@/lib/shipping/package'
import { getShipFromAddress } from '@/lib/shipping/ship-from'

// Admin manually triggers real label generation for whichever
// carrier/service the customer selected and paid for at checkout. Also
// accepts a manual-override body so admin can hand-enter a label if the
// live carrier call fails or a label was purchased out-of-band —
// mirrors the existing repair/sell-request manual shipment routes.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireAdmin(request, 'orders:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const body = await request.json().catch(() => ({}))

	const service = createServiceClient()
	const { data: order, error: fetchError } = await service
		.from('orders')
		.select(
			'id, reference, shipping_carrier, shipping_service_code, gift_recipient_name, gift_recipient_phone, users(full_name, phone), shipping_address:addresses!shipping_address_id(*), order_items ( quantity, products ( weight_kg, length_cm, width_cm, height_cm ) )'
		)
		.eq('id', id)
		.maybeSingle()
	if (fetchError || !order) return NextResponse.json({ error: 'Order not found' }, { status: 404 })

	const manualTrackingNumber = String(body.tracking_number ?? '').trim()
	const manualLabelUrl = String(body.label_url ?? '').trim()
	if (manualTrackingNumber && manualLabelUrl) {
		const { error } = await service
			.from('orders')
			.update({
				shipping_tracking_number: manualTrackingNumber,
				shipping_label_url: manualLabelUrl,
				shipping_label_status: 'generated',
				shipping_label_generated_at: new Date().toISOString(),
			})
			.eq('id', id)
		if (error) return NextResponse.json({ error: error.message }, { status: 500 })
		return NextResponse.json({ success: true })
	}

	const carrier = order.shipping_carrier as 'canada_post' | 'ups' | null
	const serviceCode = order.shipping_service_code as string | null
	const address = order.shipping_address as any
	if (!carrier || !serviceCode || !address) {
		return NextResponse.json(
			{ error: 'This order has no shipping method on file (it may predate live carrier checkout)' },
			{ status: 400 }
		)
	}

	const pkg = computePackageForItems(
		(order.order_items ?? []).map((i: any) => ({
			quantity: i.quantity,
			weightKg: i.products?.weight_kg != null ? Number(i.products.weight_kg) : null,
			lengthCm: i.products?.length_cm != null ? Number(i.products.length_cm) : null,
			widthCm: i.products?.width_cm != null ? Number(i.products.width_cm) : null,
			heightCm: i.products?.height_cm != null ? Number(i.products.height_cm) : null,
		}))
	)

	try {
		const origin = await getShipFromAddress()
		const shipmentRequest = {
			serviceCode,
			reference: order.reference ?? id,
			pkg,
			shipFrom: origin,
			shipTo: {
				name: (order as any).gift_recipient_name || (order as any).users?.full_name || 'Customer',
				phone: address.phone || (order as any).gift_recipient_phone || (order as any).users?.phone || origin.phone,
				line1: address.line1,
				line2: address.line2 ?? undefined,
				city: address.city,
				stateProvince: address.state_province ?? '',
				postalCode: address.postal_code ?? '',
				country: address.country,
			},
		}

		const result = carrier === 'ups' ? await createUpsShipment(shipmentRequest) : await createCanadaPostShipment(shipmentRequest)
		const labelUrl = await uploadShippingLabel(`orders/${id}`, result.labelBytes, result.labelContentType)

		const { error } = await service
			.from('orders')
			.update({
				shipping_tracking_number: result.trackingNumber,
				shipping_label_url: labelUrl,
				shipping_carrier_shipment_id: result.carrierShipmentId,
				shipping_label_status: 'generated',
				shipping_label_generated_at: new Date().toISOString(),
			})
			.eq('id', id)
		if (error) return NextResponse.json({ error: error.message }, { status: 500 })

		return NextResponse.json({ success: true, trackingNumber: result.trackingNumber, labelUrl })
	} catch (err) {
		await service.from('orders').update({ shipping_label_status: 'failed' }).eq('id', id)
		const message = err instanceof Error ? err.message : 'Label generation failed'
		await service
			.from('admin_logs')
			.insert({ level: 'error', source: carrier, message: `Label generation failed for order ${order.reference ?? id}: ${message}` })
			.then(undefined, () => undefined)
		return NextResponse.json({ error: message }, { status: 502 })
	}
}
