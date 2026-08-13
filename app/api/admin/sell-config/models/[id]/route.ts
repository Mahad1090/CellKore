import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
	const auth = await requireAdmin(request, 'sell-config:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const body = await request.json()
	const service = createServiceClient()
	const { error } = await service
		.from('sell_device_models')
		.update({
			device_type: body.device_type,
			label: body.label,
			image_url: body.image_url || null,
			storage_options: Array.isArray(body.storage_options) ? body.storage_options : [],
			is_active: body.is_active,
			sort_order: body.sort_order,
		})
		.eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest, { params }: Params) {
	const auth = await requireAdmin(request, 'sell-config:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const body = await request.json()
	const service = createServiceClient()
	const { error } = await service
		.from('sell_device_models')
		.update({ sort_order: body.sort_order })
		.eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest, { params }: Params) {
	const auth = await requireAdmin(request, 'sell-config:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const service = createServiceClient()
	const { error } = await service.from('sell_device_models').delete().eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}
