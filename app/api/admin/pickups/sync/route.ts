import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'
import { getShipFromAddress } from '@/lib/shipping/ship-from'
import { listUpsPendingPickups } from '@/lib/shipping/ups-pickup'
import { listCanadaPostPickups } from '@/lib/shipping/canada-post-pickup'

// Reconciliation safety net: pulls both carriers' full pickup lists and
// inserts any carrier-side pickup that's missing locally, matched by
// (carrier, carrier_request_id) — covers the case where the carrier call
// succeeded (a driver is actually coming) but our own DB insert failed
// right after, same spirit as the manual tracking/label override on the
// order shipment route.
export async function POST(request: NextRequest) {
	const auth = await requireAdmin(request, 'orders:write')
	if ('error' in auth) return auth.error
	const service = createServiceClient()

	const [upsResult, canadaPostResult] = await Promise.allSettled([listUpsPendingPickups('both'), listCanadaPostPickups()])
	const errors: Record<string, string> = {}
	let inserted = 0

	const { data: existing } = await service.from('pickups').select('carrier, carrier_request_id')
	const known = new Set((existing ?? []).map((p) => `${p.carrier}:${p.carrier_request_id}`))

	let origin: Record<string, unknown> = {}
	let originLoaded = false
	const ensureOrigin = async () => {
		if (!originLoaded) {
			origin = (await getShipFromAddress().catch(() => ({}))) as Record<string, unknown>
			originLoaded = true
		}
		return origin
	}

	if (upsResult.status === 'fulfilled') {
		for (const p of upsResult.value) {
			if (!p.prn || known.has(`ups:${p.prn}`)) continue
			const { error } = await service.from('pickups').insert({
				carrier: 'ups',
				pickup_method: 'standard',
				carrier_request_id: p.prn,
				status: 'scheduled',
				pickup_date: p.serviceDate
					? `${p.serviceDate.slice(0, 4)}-${p.serviceDate.slice(4, 6)}-${p.serviceDate.slice(6, 8)}`
					: new Date().toISOString().slice(0, 10),
				piece_count: 1,
				address_snapshot: await ensureOrigin(),
				special_instruction: p.referenceNumber ?? null,
				raw_create_response: p,
			})
			if (!error) inserted++
		}
	} else {
		errors.ups = upsResult.reason instanceof Error ? upsResult.reason.message : 'UPS sync failed'
	}

	if (canadaPostResult.status === 'fulfilled') {
		for (const p of canadaPostResult.value) {
			if (!p.requestId || known.has(`canada_post:${p.requestId}`)) continue
			const { error } = await service.from('pickups').insert({
				carrier: 'canada_post',
				pickup_method: 'standard',
				carrier_request_id: p.requestId,
				status: p.requestStatus?.toLowerCase() === 'cancelled' ? 'cancelled' : 'scheduled',
				pickup_date: p.requestDate || new Date().toISOString().slice(0, 10),
				piece_count: 1,
				address_snapshot: await ensureOrigin(),
				raw_create_response: p,
			})
			if (!error) inserted++
		}
	} else {
		errors.canada_post = canadaPostResult.reason instanceof Error ? canadaPostResult.reason.message : 'Canada Post sync failed'
	}

	return NextResponse.json({ inserted, errors })
}
