import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request, 'products:read')
	if ('error' in auth) return auth.error
	const service = createServiceClient()
	const { data, error } = await service
		.from('categories')
		.select('*')
		.order('sort_order', { ascending: true })
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ categories: data })
}

export async function POST(request: NextRequest) {
	const auth = await requireAdmin(request, 'categories:write')
	if ('error' in auth) return auth.error
	const body = await request.json()
	if (!body.name || !body.slug) {
		return NextResponse.json({ error: 'Name and slug are required' }, { status: 400 })
	}
	const service = createServiceClient()
	const { data, error } = await service
		.from('categories')
		.insert({
			name: body.name,
			slug: body.slug,
			image_url: body.image_url || null,
			is_active: body.is_active ?? true,
			sort_order: body.sort_order ?? 0,
		})
		.select('id')
		.single()
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ id: data.id })
}
