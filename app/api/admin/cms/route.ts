import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request)
	if ('error' in auth) return auth.error
	const service = createServiceClient()
	const { data, error } = await service.from('cms_pages').select('*').order('slug')
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ pages: data })
}

export async function PUT(request: NextRequest) {
	const auth = await requireAdmin(request, 'cms:write')
	if ('error' in auth) return auth.error
	const { slug, title, content } = await request.json()
	if (!slug || !title) {
		return NextResponse.json({ error: 'slug and title are required' }, { status: 400 })
	}
	const service = createServiceClient()
	const { error } = await service
		.from('cms_pages')
		.upsert({ slug, title, content: content ?? '', updated_at: new Date().toISOString() }, { onConflict: 'slug' })
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}
