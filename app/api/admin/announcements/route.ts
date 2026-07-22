import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request)
	if ('error' in auth) return auth.error
	const service = createServiceClient()
	const { data, error } = await service
		.from('announcements')
		.select('*')
		.order('sort_order', { ascending: true })
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ announcements: data })
}

export async function POST(request: NextRequest) {
	const auth = await requireAdmin(request, 'cms:write')
	if ('error' in auth) return auth.error
	const body = await request.json()
	if (!body.text?.trim()) {
		return NextResponse.json({ error: 'Text is required' }, { status: 400 })
	}
	const service = createServiceClient()
	const { data, error } = await service
		.from('announcements')
		.insert({
			text: body.text.trim(),
			is_active: body.is_active ?? true,
			sort_order: body.sort_order ?? 0,
		})
		.select('id')
		.single()
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ id: data.id })
}
