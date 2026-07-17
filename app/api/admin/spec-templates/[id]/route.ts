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
		.from('spec_templates')
		.update({
			name: body.name,
			product_type_id: body.product_type_id,
			is_active: body.is_active,
			sort_order: body.sort_order,
		})
		.eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })

	// Replace-all: delete existing fields, reinsert the submitted list.
	const { error: deleteError } = await service.from('spec_template_fields').delete().eq('template_id', id)
	if (deleteError) return NextResponse.json({ error: deleteError.message }, { status: 500 })

	const fields = (body.fields ?? []).filter((f: any) => f.label?.trim())
	if (fields.length > 0) {
		const { error: fieldsError } = await service.from('spec_template_fields').insert(
			fields.map((f: any, index: number) => ({
				template_id: id,
				key: f.key,
				label: f.label,
				field_type: f.field_type ?? 'text',
				options: f.options ?? null,
				unit: f.unit || null,
				default_value: f.default_value || null,
				sort_order: index,
			}))
		)
		if (fieldsError) return NextResponse.json({ error: fieldsError.message }, { status: 500 })
	}

	return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest, { params }: Params) {
	const auth = await requireAdmin(request, 'categories:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const service = createServiceClient()

	const { count } = await service
		.from('products')
		.select('id', { count: 'exact', head: true })
		.eq('spec_template_id', id)
	if ((count ?? 0) > 0) {
		return NextResponse.json(
			{ error: 'This spec template still has products assigned. Reassign them before deleting.' },
			{ status: 409 }
		)
	}

	const { error } = await service.from('spec_templates').delete().eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}
