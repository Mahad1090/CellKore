import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

type Params = { params: Promise<{ id: string }> }

export async function PUT(request: NextRequest, { params }: Params) {
	const auth = await requireAdmin(request, 'settings:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const body = await request.json()
	const service = createServiceClient()
	const { error } = await service
		.from('tax_rates')
		.update({
			tax_rate: body.tax_rate != null ? Number(body.tax_rate) : undefined,
			is_active: body.is_active,
			updated_at: new Date().toISOString(),
		})
		.eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest, { params }: Params) {
	const auth = await requireAdmin(request, 'settings:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const service = createServiceClient()
	const { error } = await service.from('tax_rates').delete().eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}
