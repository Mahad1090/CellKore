import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request)
	if ('error' in auth) return auth.error
	const service = createServiceClient()
	const { data, error } = await service.from('tax_rates').select('*').order('country_name')
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ rates: data })
}

export async function POST(request: NextRequest) {
	const auth = await requireAdmin(request, 'settings:write')
	if ('error' in auth) return auth.error
	const body = await request.json()
	if (!body.country_code || !body.country_name || body.tax_rate == null) {
		return NextResponse.json({ error: 'country_code, country_name, and tax_rate are required' }, { status: 400 })
	}
	const service = createServiceClient()
	const { data, error } = await service
		.from('tax_rates')
		.insert({
			country_code: String(body.country_code).toUpperCase(),
			country_name: body.country_name,
			tax_rate: Number(body.tax_rate),
			is_active: body.is_active ?? true,
		})
		.select('id')
		.single()
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ id: data.id })
}
