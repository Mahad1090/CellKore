import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request)
	if ('error' in auth) return auth.error
	const service = createServiceClient()
	const { data, error } = await service.from('repair_settings').select('*').limit(1).maybeSingle()
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ settings: data })
}

export async function PUT(request: NextRequest) {
	const auth = await requireAdmin(request, 'settings:write')
	if ('error' in auth) return auth.error
	const body = await request.json()
	const service = createServiceClient()
	const { data: existing } = await service.from('repair_settings').select('id').limit(1).maybeSingle()

	const payload: Record<string, any> = {
		mail_in_address: body.mail_in_address ?? null,
		updated_at: new Date().toISOString(),
	}

	if (body.warehouse_address !== undefined) {
		payload.warehouse_address = body.warehouse_address ?? null
	}

	const shipFromFields = [
		'ship_from_name',
		'ship_from_company',
		'ship_from_phone',
		'ship_from_line1',
		'ship_from_line2',
		'ship_from_city',
		'ship_from_state_province',
		'ship_from_postal_code',
		'ship_from_country',
	] as const
	for (const field of shipFromFields) {
		if (body[field] !== undefined) payload[field] = body[field] || null
	}

	if (!existing) {
		const { error } = await service.from('repair_settings').insert(payload)
		if (error) {
			delete payload.warehouse_address
			const { error: fallbackError } = await service.from('repair_settings').insert(payload)
			if (fallbackError) return NextResponse.json({ error: fallbackError.message }, { status: 500 })
		}
		return NextResponse.json({ success: true })
	}

	const { error } = await service.from('repair_settings').update(payload).eq('id', existing.id)
	if (error) {
		delete payload.warehouse_address
		const { error: fallbackError } = await service.from('repair_settings').update(payload).eq('id', existing.id)
		if (fallbackError) return NextResponse.json({ error: fallbackError.message }, { status: 500 })
	}

	return NextResponse.json({ success: true })
}
