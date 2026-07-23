import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request)
	if ('error' in auth) return auth.error
	const service = createServiceClient()
	const { data, error } = await service.from('social_links').select('*').order('platform')
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ links: data })
}

export async function POST(request: NextRequest) {
	const auth = await requireAdmin(request, 'settings:write')
	if ('error' in auth) return auth.error
	const body = await request.json()
	if (!body.platform) {
		return NextResponse.json({ error: 'platform is required' }, { status: 400 })
	}
	const service = createServiceClient()
	const { data, error } = await service
		.from('social_links')
		.insert({ platform: body.platform, url: body.url ?? '', is_active: body.is_active ?? true })
		.select('id')
		.single()
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ id: data.id })
}

export async function PUT(request: NextRequest) {
	const auth = await requireAdmin(request, 'settings:write')
	if ('error' in auth) return auth.error
	const body = await request.json()
	if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
	const service = createServiceClient()
	const { error } = await service
		.from('social_links')
		.update({ platform: body.platform, url: body.url, is_active: body.is_active })
		.eq('id', body.id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
	const auth = await requireAdmin(request, 'settings:write')
	if ('error' in auth) return auth.error
	const id = request.nextUrl.searchParams.get('id')
	if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
	const service = createServiceClient()
	const { error } = await service.from('social_links').delete().eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}
