import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request)
	if ('error' in auth) return auth.error
	const service = createServiceClient()
	const { data, error } = await service.from('repair_settings').select('*').limit(1).maybeSingle()
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ settings: data })
}

export async function PUT(request: NextRequest) {
	const auth = await requireAdmin(request, 'settings:write')
	if ('error' in auth) return auth.error
	const body = await request.json()
	const service = createServiceClient()
	const { data: existing } = await service.from('repair_settings').select('id').limit(1).maybeSingle()
	if (!existing) {
		const { error } = await service
			.from('repair_settings')
			.insert({ mail_in_address: body.mail_in_address ?? null })
		if (error) return NextResponse.json({ error: error.message }, { status: 500 })
		return NextResponse.json({ success: true })
	}
	const { error } = await service
		.from('repair_settings')
		.update({ mail_in_address: body.mail_in_address ?? null, updated_at: new Date().toISOString() })
		.eq('id', existing.id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}
