import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request, 'orders:read')
	if ('error' in auth) return auth.error
	const service = createServiceClient()
	const { data, error } = await service
		.from('orders')
		.select('*, order_items ( id, product_id, variant_id, quantity, unit_price_at_purchase, products ( name ) )')
		.order('created_at', { ascending: false })
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ orders: data })
}
