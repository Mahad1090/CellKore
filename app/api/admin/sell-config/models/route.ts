import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request, 'sell-config:write')
	if ('error' in auth) return auth.error
	const service = createServiceClient()
	const { data, error } = await service
		.from('sell_device_models')
		.select('*')
		.order('device_type', { ascending: true })
		.order('sort_order', { ascending: true })
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ models: data })
}

export async function POST(request: NextRequest) {
	const auth = await requireAdmin(request, 'sell-config:write')
	if ('error' in auth) return auth.error
	const body = await request.json()
	if (!body.device_type || !body.label?.trim()) {
		return NextResponse.json({ error: 'Device type and label are required' }, { status: 400 })
	}
	const service = createServiceClient()
	const { data, error } = await service
		.from('sell_device_models')
		.insert({
			device_type: body.device_type,
			label: body.label.trim(),
			image_url: body.image_url || null,
			storage_options: Array.isArray(body.storage_options) ? body.storage_options : [],
			is_active: body.is_active ?? true,
			sort_order: body.sort_order ?? 0,
		})
		.select('id')
		.single()
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ id: data.id })
}
