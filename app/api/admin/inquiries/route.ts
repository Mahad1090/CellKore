import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request, 'inquiries:read')
	if ('error' in auth) return auth.error
	const service = createServiceClient()
	const status = request.nextUrl.searchParams.get('status')
	let query = service.from('contact_inquiries').select('*').order('submitted_at', { ascending: false })
	if (status === 'new' || status === 'responded') query = query.eq('status', status)
	const { data, error } = await query
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ inquiries: data })
}
