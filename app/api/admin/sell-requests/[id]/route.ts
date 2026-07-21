import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

const VALID_STATUSES = ['submitted', 'reviewed', 'quoted', 'contacted', 'closed']

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireAdmin(request, 'sell-requests:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const body = await request.json()

	const update: Record<string, unknown> = {}
	if (body.status !== undefined) {
		if (!VALID_STATUSES.includes(body.status)) {
			return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
		}
		update.status = body.status
	}
	if (body.offered_price !== undefined) {
		update.offered_price = body.offered_price === null ? null : Number(body.offered_price)
	}
	if (body.payout_amount !== undefined) {
		update.payout_amount = body.payout_amount === null ? null : Number(body.payout_amount)
	}
	if (body.payout_reference !== undefined) {
		update.payout_reference = body.payout_reference ? String(body.payout_reference).trim() : null
	}
	if (body.payout_notes !== undefined) {
		update.payout_notes = body.payout_notes ? String(body.payout_notes).trim() : null
	}
	if (body.payout_confirmed_at !== undefined) {
		update.payout_confirmed_at = body.payout_confirmed_at || null
	}
	if (Object.keys(update).length === 0) {
		return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
	}

	const service = createServiceClient()
	const { error } = await service.from('sell_phone_requests').update(update).eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}
