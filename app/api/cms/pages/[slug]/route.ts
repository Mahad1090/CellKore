import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ slug: string }> }
) {
	const { slug } = await params
	if (!slug) return NextResponse.json({ error: 'Slug is required' }, { status: 400 })

	const service = createServiceClient()
	const { data, error } = await service
		.from('cms_pages')
		.select('*')
		.eq('slug', slug)
		.maybeSingle()

	if (error) {
		return NextResponse.json({ error: error.message }, { status: 500 })
	}

	return NextResponse.json({ page: data })
}
