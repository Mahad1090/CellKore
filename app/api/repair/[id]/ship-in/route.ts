import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { authorizeSellRequestCustomer } from '@/lib/sell-request-auth'
import { notifyRepairStatusChange } from '@/lib/repair-notifications'

// Customer-facing: once paid, the customer ships their device to
// CellKore themselves and reports the courier/tracking here.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	const body = await request.json()
	const courier = String(body.courier ?? '').trim()
	const tracking = String(body.tracking_number ?? '').trim()
	if (!courier || !tracking) {
		return NextResponse.json({ error: 'Courier and tracking number are required' }, { status: 400 })
	}

	const service = createServiceClient()
	const { data: existing, error: fetchError } = await service
		.from('repair_requests')
		.select('id, user_id, status, contact_email, contact_phone')
		.eq('id', id)
		.maybeSingle()
	if (fetchError || !existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

	const authError = await authorizeSellRequestCustomer(request, body, existing)
	if (authError) return authError

	if (existing.status !== 'awaiting_device') {
		return NextResponse.json({ error: 'Shipment details can only be submitted once payment is confirmed' }, { status: 400 })
	}

	const { error: updateError } = await service
		.from('repair_requests')
		.update({
			inbound_carrier: courier,
			inbound_tracking_number: tracking,
			inbound_shipped_at: new Date().toISOString(),
			status: 'device_shipped',
			updated_at: new Date().toISOString(),
		})
		.eq('id', id)
	if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

	await service.from('repair_status_history').insert({
		request_id: id,
		status: 'device_shipped',
		note: `Courier: ${courier} · Tracking #: ${tracking}`,
		changed_by: 'customer',
	})
	await notifyRepairStatusChange(existing, 'device_shipped')

	return NextResponse.json({ success: true })
}
