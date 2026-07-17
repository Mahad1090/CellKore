import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
	const auth = await requireAdmin(request, 'categories:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const body = await request.json()
	const service = createServiceClient()
	const { error } = await service
		.from('mobile_spec_presets')
		.update({
			name: body.name,
			brand: body.brand || null,
			mobile_specifications: body.mobile_specifications ?? {},
			is_active: body.is_active,
			sort_order: body.sort_order,
		})
		.eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest, { params }: Params) {
	const auth = await requireAdmin(request, 'categories:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const service = createServiceClient()
	const { error } = await service.from('mobile_spec_presets').delete().eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}
