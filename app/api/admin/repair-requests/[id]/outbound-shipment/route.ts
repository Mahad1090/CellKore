import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'
import { notifyRepairStatusChange } from '@/lib/repair-notifications'
import { createCanadaPostShipment } from '@/lib/shipping/canada-post'
import { createUpsShipment } from '@/lib/shipping/ups'
import { uploadShippingLabel } from '@/lib/shipping/label-storage'
import { computePackageForItems } from '@/lib/shipping/package'
import { getShipFromAddress } from '@/lib/shipping/ship-from'
import type { RepairShippingOption } from '@/lib/types'

// Admin attaches the outbound shipping label once the device is
// repaired and ready to send back, per the shipping option the
// customer chose and paid for. Body with carrier/tracking_number/label_url
// records a manually-purchased label (fallback); an empty body triggers
// real label generation via the carrier the customer selected.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireAdmin(request, 'repair-requests:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const body = await request.json().catch(() => ({}))

	const service = createServiceClient()
	const { data: existing, error: fetchError } = await service
		.from('repair_requests')
		.select(
			'id, contact_name, contact_email, contact_phone, device_brand, device_model, selected_shipping_option, address_line1, address_line2, city, state_province, postal_code, country'
		)
		.eq('id', id)
		.maybeSingle()
	if (fetchError || !existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

	const manualCarrier = String(body.carrier ?? '').trim()
	const manualTracking = String(body.tracking_number ?? '').trim()
	const manualLabelUrl = String(body.label_url ?? '').trim()

	let carrier: string
	let trackingNumber: string
	let labelUrl: string

	if (manualCarrier && manualTracking && manualLabelUrl) {
		carrier = manualCarrier
		trackingNumber = manualTracking
		labelUrl = manualLabelUrl
	} else {
		const option = existing.selected_shipping_option as RepairShippingOption | null
		if (!option?.carrier || !option?.serviceCode) {
			return NextResponse.json(
				{ error: 'No shipping option on file for this repair (it may predate live carrier quoting)' },
				{ status: 400 }
			)
		}
		try {
			const origin = await getShipFromAddress()
			const pkg = computePackageForItems([{ quantity: 1 }])
			const shipmentRequest = {
				serviceCode: option.serviceCode,
				reference: existing.id,
				pkg,
				shipFrom: origin,
				shipTo: {
					name: existing.contact_name || 'Customer',
					phone: existing.contact_phone || origin.phone,
					line1: existing.address_line1 ?? '',
					line2: existing.address_line2 ?? undefined,
					city: existing.city ?? '',
					stateProvince: existing.state_province ?? '',
					postalCode: existing.postal_code ?? '',
					country: existing.country ?? '',
				},
			}
			const result =
				option.carrier === 'ups' ? await createUpsShipment(shipmentRequest) : await createCanadaPostShipment(shipmentRequest)
			labelUrl = await uploadShippingLabel(`repair/${id}`, result.labelBytes, result.labelContentType)
			carrier = option.carrier === 'ups' ? 'UPS' : 'Canada Post'
			trackingNumber = result.trackingNumber
		} catch (err) {
			await service
				.from('admin_logs')
				.insert({
					level: 'error',
					source: option.carrier,
					message: `Repair outbound label generation failed for request ${id}: ${err instanceof Error ? err.message : String(err)}`,
				})
				.then(undefined, () => undefined)
			return NextResponse.json(
				{ error: err instanceof Error ? err.message : 'Label generation failed' },
				{ status: 502 }
			)
		}
	}

	const now = new Date().toISOString()
	const { error } = await service
		.from('repair_requests')
		.update({
			outbound_carrier: carrier,
			outbound_tracking_number: trackingNumber,
			outbound_label_url: labelUrl,
			outbound_label_status: 'generated',
			status: 'shipped_back',
			shipped_back_at: now,
			updated_at: now,
		})
		.eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })

	await service.from('repair_status_history').insert({
		request_id: id,
		status: 'shipped_back',
		note: `Carrier: ${carrier} · Tracking #: ${trackingNumber}`,
		changed_by: 'admin',
	})
	await notifyRepairStatusChange(
		{ ...existing, outbound_carrier: carrier, outbound_tracking_number: trackingNumber },
		'shipped_back'
	)

	return NextResponse.json({ success: true, carrier, trackingNumber, labelUrl })
}
