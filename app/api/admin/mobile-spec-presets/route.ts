import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request, 'products:read')
	if ('error' in auth) return auth.error
	const service = createServiceClient()
	const { data, error } = await service
		.from('mobile_spec_presets')
		.select('*')
		.order('sort_order', { ascending: true })
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ mobileSpecPresets: data })
}

export async function POST(request: NextRequest) {
	const auth = await requireAdmin(request, 'categories:write')
	if ('error' in auth) return auth.error
	const body = await request.json()
	if (!body.name) {
		return NextResponse.json({ error: 'Name is required' }, { status: 400 })
	}
	const service = createServiceClient()
	const { data, error } = await service
		.from('mobile_spec_presets')
		.insert({
			name: body.name,
			brand: body.brand || null,
			mobile_specifications: body.mobile_specifications ?? {},
			is_active: body.is_active ?? true,
			sort_order: body.sort_order ?? 0,
		})
		.select('*')
		.single()
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ mobileSpecPreset: data })
}
