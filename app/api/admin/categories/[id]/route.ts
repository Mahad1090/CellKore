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
		.from('categories')
		.update({
			name: body.name,
			slug: body.slug,
			image_url: body.image_url ?? null,
			is_active: body.is_active,
			sort_order: body.sort_order,
		})
		.eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}

export async function PATCH(request: NextRequest, { params }: Params) {
	const auth = await requireAdmin(request, 'categories:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const body = await request.json()
	const service = createServiceClient()
	const { error } = await service
		.from('categories')
		.update({ sort_order: body.sort_order })
		.eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest, { params }: Params) {
	const auth = await requireAdmin(request, 'categories:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const service = createServiceClient()

	// Guard: block deletion while products are still assigned (DB trigger backs this up)
	const { count } = await service
		.from('products')
		.select('id', { count: 'exact', head: true })
		.eq('category_id', id)
	if ((count ?? 0) > 0) {
		return NextResponse.json(
			{ error: 'This category still has products assigned. Reassign them before deleting.' },
			{ status: 409 }
		)
	}

	const { error } = await service.from('categories').delete().eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}
