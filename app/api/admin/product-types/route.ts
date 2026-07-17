import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request, 'products:read')
	if ('error' in auth) return auth.error
	const service = createServiceClient()
	const { data, error } = await service
		.from('product_types')
		.select('*')
		.order('sort_order', { ascending: true })
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ productTypes: data })
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
		.from('product_types')
		.insert({
			name: body.name,
			category_id: body.category_id || null,
			is_phone_type: body.is_phone_type ?? false,
			is_active: body.is_active ?? true,
			sort_order: body.sort_order ?? 0,
		})
		.select('id')
		.single()
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ id: data.id })
}
