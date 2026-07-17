import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

const TEMPLATE_SELECT = `
	*,
	spec_template_fields ( id, key, label, field_type, options, unit, default_value, sort_order )
`

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request, 'products:read')
	if ('error' in auth) return auth.error
	const service = createServiceClient()
	const { data, error } = await service
		.from('spec_templates')
		.select(TEMPLATE_SELECT)
		.order('sort_order', { ascending: true })
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ specTemplates: data })
}

export async function POST(request: NextRequest) {
	const auth = await requireAdmin(request, 'categories:write')
	if ('error' in auth) return auth.error
	const body = await request.json()
	if (!body.name || !body.product_type_id) {
		return NextResponse.json({ error: 'Name and Product Type are required' }, { status: 400 })
	}
	const service = createServiceClient()
	const { data: template, error } = await service
		.from('spec_templates')
		.insert({
			name: body.name,
			product_type_id: body.product_type_id,
			is_active: body.is_active ?? true,
			sort_order: body.sort_order ?? 0,
		})
		.select('id')
		.single()
	if (error || !template) {
		return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })
	}

	const fields = (body.fields ?? []).filter((f: any) => f.label?.trim())
	if (fields.length > 0) {
		const { error: fieldsError } = await service.from('spec_template_fields').insert(
			fields.map((f: any, index: number) => ({
				template_id: template.id,
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

	return NextResponse.json({ id: template.id })
}
