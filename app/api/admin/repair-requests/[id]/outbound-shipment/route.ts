import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'
import { notifyRepairStatusChange } from '@/lib/repair-notifications'

// Admin attaches the outbound shipping label once the device is
// repaired and ready to send back, per the shipping option the
// customer chose and paid for.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireAdmin(request, 'repair-requests:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const body = await request.json()

	const carrier = String(body.carrier ?? '').trim()
	const trackingNumber = String(body.tracking_number ?? '').trim()
	const labelUrl = String(body.label_url ?? '').trim()
	if (!carrier || !trackingNumber || !labelUrl) {
		return NextResponse.json({ error: 'Carrier, tracking number, and label URL are all required' }, { status: 400 })
	}

	const service = createServiceClient()
	const { data: existing, error: fetchError } = await service
		.from('repair_requests')
		.select('id, contact_email, contact_phone')
		.eq('id', id)
		.maybeSingle()
	if (fetchError || !existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

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
	await notifyRepairStatusChange(existing, 'shipped_back')

	return NextResponse.json({ success: true })
}
