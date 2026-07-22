import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { sendNewRepairRequestAdminAlert } from '@/lib/email/repair'

// Fired once, client-side, immediately after a repair request is submitted
// (submission itself is a direct Supabase insert from app/repair/page.tsx).
// Only sends the admin alert for requests still in their initial
// 'submitted' state, so the endpoint can't be replayed to re-notify.
export async function POST(request: NextRequest) {
	const body = await request.json()
	const id = String(body.id ?? '')
	if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

	const service = createServiceClient()
	const { data: existing } = await service
		.from('repair_requests')
		.select('id, status, device_brand, device_model, device_category, issues, description, service_method, contact_name, contact_email, contact_phone')
		.eq('id', id)
		.maybeSingle()
	if (!existing || existing.status !== 'submitted') {
		return NextResponse.json({ success: true })
	}

	await sendNewRepairRequestAdminAlert(existing)
	return NextResponse.json({ success: true })
}
