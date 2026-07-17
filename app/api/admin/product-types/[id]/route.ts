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
		.from('product_types')
		.update({
			name: body.name,
			category_id: body.category_id || null,
			is_phone_type: body.is_phone_type,
			is_active: body.is_active,
			sort_order: body.sort_order,
		})
		.eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest, { params }: Params) {
	const auth = await requireAdmin(request, 'categories:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const service = createServiceClient()

	// Guard: block deletion while products are still assigned
	const { count } = await service
		.from('products')
		.select('id', { count: 'exact', head: true })
		.eq('product_type_id', id)
	if ((count ?? 0) > 0) {
		return NextResponse.json(
			{ error: 'This product type still has products assigned. Reassign them before deleting.' },
			{ status: 409 }
		)
	}

	const { error } = await service.from('product_types').delete().eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}
