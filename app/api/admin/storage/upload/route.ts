import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

const BUCKET = 'product-images'
const MAX_BYTES = 5 * 1024 * 1024

export async function POST(request: NextRequest) {
	const auth = await requireAdmin(request, 'products:write')
	if ('error' in auth) return auth.error

	const form = await request.formData()
	const file = form.get('file')
	const path = String(form.get('path') ?? '')

	if (!(file instanceof File) || !path) {
		return NextResponse.json({ error: 'file and path are required' }, { status: 400 })
	}
	if (file.size > MAX_BYTES) {
		return NextResponse.json({ error: 'File exceeds the 5MB upload limit' }, { status: 400 })
	}
	if (path.includes('..')) {
		return NextResponse.json({ error: 'Invalid path' }, { status: 400 })
	}

	const service = createServiceClient()
	const { error } = await service.storage
		.from(BUCKET)
		.upload(path, file, { contentType: file.type || 'image/jpeg', upsert: false })
	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 })
	}
	const { data } = service.storage.from(BUCKET).getPublicUrl(path)
	return NextResponse.json({ publicUrl: data.publicUrl, path })
}
