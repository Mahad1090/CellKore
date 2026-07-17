import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request, 'products:read')
	if ('error' in auth) return auth.error
	const productId = request.nextUrl.searchParams.get('product_id')
	const service = createServiceClient()
	let query = service.from('wholesale_price_tiers').select('*').order('min_quantity')
	if (productId) query = query.eq('product_id', productId)
	const { data, error } = await query
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ tiers: data })
}

export async function POST(request: NextRequest) {
	const auth = await requireAdmin(request, 'wholesale:write')
	if ('error' in auth) return auth.error
	const body = await request.json()
	const min = Number(body.min_quantity)
	const max = body.max_quantity == null || body.max_quantity === '' ? null : Number(body.max_quantity)
	const price = Number(body.price_per_unit)

	if (!body.product_id || !Number.isFinite(min) || min < 1 || !Number.isFinite(price) || price <= 0) {
		return NextResponse.json({ error: 'Valid product, minimum quantity and price are required' }, { status: 400 })
	}
	if (max != null && max < min) {
		return NextResponse.json({ error: 'Maximum quantity must be greater than or equal to minimum' }, { status: 400 })
	}

	const service = createServiceClient()

	// Overlap validation (also enforced by a DB trigger)
	const { data: existing } = await service
		.from('wholesale_price_tiers')
		.select('id, min_quantity, max_quantity')
		.eq('product_id', body.product_id)
	const overlaps = (existing ?? []).some(
		(t) => min <= (t.max_quantity ?? Infinity) && (max ?? Infinity) >= t.min_quantity
	)
	if (overlaps) {
		return NextResponse.json(
			{ error: 'This bracket overlaps an existing pricing tier. Adjust the quantity bounds.' },
			{ status: 409 }
		)
	}

	const { data, error } = await service
		.from('wholesale_price_tiers')
		.insert({ product_id: body.product_id, min_quantity: min, max_quantity: max, price_per_unit: price })
		.select('id')
		.single()
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ id: data.id })
}
