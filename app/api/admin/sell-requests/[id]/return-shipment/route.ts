import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

// Interim manual path: until a carrier API is wired up (see
// lib/shipping-label.ts), admin buys the return label themselves and
// records it here once the customer has paid.
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireAdmin(request, 'sell-requests:write')
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
	const { error } = await service
		.from('sell_phone_return_shipments')
		.update({
			carrier,
			tracking_number: trackingNumber,
			label_url: labelUrl,
			label_status: 'generated',
			updated_at: new Date().toISOString(),
		})
		.eq('request_id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })

	return NextResponse.json({ success: true })
}
