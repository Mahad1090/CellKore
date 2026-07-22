import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request, 'sell-requests:read')
	if ('error' in auth) return auth.error
	const service = createServiceClient()
	const { data, error } = await service
		.from('sell_phone_requests')
		.select('*, sell_phone_images ( id, image_url ), sell_phone_status_history ( id, status, note, changed_by, created_at ), sell_phone_return_shipments ( * )')
		.order('submitted_at', { ascending: false })
		.order('created_at', { referencedTable: 'sell_phone_status_history', ascending: true })
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ requests: data })
}
