import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
	const auth = await requireAdmin(request, 'cms:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const body = await request.json()
	if (!body.text?.trim()) {
		return NextResponse.json({ error: 'Text is required' }, { status: 400 })
	}
	const service = createServiceClient()
	const { error } = await service
		.from('announcements')
		.update({
			text: body.text.trim(),
			is_active: body.is_active,
			sort_order: body.sort_order,
			updated_at: new Date().toISOString(),
		})
		.eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest, { params }: Params) {
	const auth = await requireAdmin(request, 'cms:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const body = await request.json()
	const service = createServiceClient()
	const { error } = await service
		.from('announcements')
		.update({ sort_order: body.sort_order, updated_at: new Date().toISOString() })
		.eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest, { params }: Params) {
	const auth = await requireAdmin(request, 'cms:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const service = createServiceClient()
	const { error } = await service.from('announcements').delete().eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}
