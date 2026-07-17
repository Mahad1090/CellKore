import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request, 'sell-requests:read')
	if ('error' in auth) return auth.error
	const service = createServiceClient()
	const { data, error } = await service
		.from('sell_phone_requests')
		.select('*, sell_phone_images ( id, image_url )')
		.order('submitted_at', { ascending: false })
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ requests: data })
}
