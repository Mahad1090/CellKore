import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireAdmin(request, 'inquiries:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const { status } = await request.json()
	if (status !== 'new' && status !== 'responded') {
		return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
	}
	const service = createServiceClient()
	const { error } = await service.from('contact_inquiries').update({ status }).eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}
