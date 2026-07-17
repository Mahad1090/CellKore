import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

const ORDER_STATUSES = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']
const PAYMENT_STATUSES = ['unpaid', 'paid', 'refunded', 'failed']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireAdmin(request, 'orders:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const body = await request.json()

	const update: Record<string, unknown> = {}
	if (body.status !== undefined) {
		if (!ORDER_STATUSES.includes(body.status)) {
			return NextResponse.json({ error: 'Invalid order status' }, { status: 400 })
		}
		update.status = body.status
	}
	if (body.payment_status !== undefined) {
		if (!PAYMENT_STATUSES.includes(body.payment_status)) {
			return NextResponse.json({ error: 'Invalid payment status' }, { status: 400 })
		}
		update.payment_status = body.payment_status
	}
	if (Object.keys(update).length === 0) {
		return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
	}

	const service = createServiceClient()
	const { error } = await service.from('orders').update(update).eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}
