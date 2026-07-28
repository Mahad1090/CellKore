import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { getShipFromAddress } from '@/lib/shipping/ship-from'
import { rateUpsPickup } from '@/lib/shipping/ups-pickup'
import { getCanadaPostPickupPrice } from '@/lib/shipping/canada-post-pickup'

// Cost preview only — no booking made, no DB write. Backs the "Preview
// Cost" action in the schedule-pickup modal (UPS Pickup Rate / Canada Post
// Get Pickup Price).
export async function POST(request: NextRequest) {
	const auth = await requireAdmin(request, 'orders:read')
	if ('error' in auth) return auth.error
	const body = await request.json().catch(() => ({}))
	const carrier = body.carrier as 'ups' | 'canada_post'
	const pickupDate = String(body.pickup_date ?? '').trim()
	if (!pickupDate) return NextResponse.json({ error: 'pickup_date is required' }, { status: 400 })

	try {
		if (carrier === 'ups') {
			const origin = await getShipFromAddress()
			const result = await rateUpsPickup(origin, {
				pickupDate: pickupDate.replace(/-/g, ''),
				readyTime: String(body.ready_time ?? '09:00').replace(':', ''),
				closeTime: String(body.close_time ?? '17:00').replace(':', ''),
			})
			return NextResponse.json({ cost: result.cost, currency: result.currency })
		}
		if (carrier === 'canada_post') {
			const price = await getCanadaPostPickupPrice({ date: pickupDate })
			return NextResponse.json({ cost: Number(price.dueAmount), currency: 'CAD', breakdown: price })
		}
		return NextResponse.json({ error: 'carrier must be "ups" or "canada_post"' }, { status: 400 })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Rate lookup failed'
		return NextResponse.json({ error: message }, { status: 502 })
	}
}
