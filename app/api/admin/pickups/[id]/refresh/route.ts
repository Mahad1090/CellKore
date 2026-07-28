import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'
import { listUpsPendingPickups } from '@/lib/shipping/ups-pickup'
import { getCanadaPostPickupDetails } from '@/lib/shipping/canada-post-pickup'

// UPS GWNStatus codes -> our normalized status (see Pickup.yaml
// PickupCancelResponse_GWNStatus / PendingStatus.GWNStatusCode).
const UPS_STATUS_MAP: Record<string, string> = {
	'003': 'completed',
	'004': 'missed',
	'007': 'cancelled',
	'008': 'cancelled',
}

// UPS has no per-PRN status lookup — only a list of all pending pickups on
// the account — so refresh pulls that list and matches by PRN. Canada Post
// has a proper per-request details endpoint.
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireAdmin(request, 'orders:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const service = createServiceClient()
	const { data: pickup, error: fetchError } = await service.from('pickups').select('*').eq('id', id).maybeSingle()
	if (fetchError || !pickup) return NextResponse.json({ error: 'Pickup not found' }, { status: 404 })
	if (!pickup.carrier_request_id) return NextResponse.json({ error: 'Pickup has no carrier request ID on file' }, { status: 400 })

	try {
		let status: string = pickup.status
		let raw: unknown = pickup.raw_create_response

		if (pickup.carrier === 'ups') {
			const pending = await listUpsPendingPickups('both')
			const match = pending.find((p) => p.prn === pickup.carrier_request_id)
			if (match) {
				status = UPS_STATUS_MAP[match.gwnStatusCode ?? ''] ?? 'scheduled'
				raw = match
			} else if (pickup.status === 'scheduled') {
				// No longer pending and we never marked it cancelled/failed
				// ourselves — most likely the driver completed it.
				status = 'completed'
			}
		} else {
			const details = await getCanadaPostPickupDetails(pickup.carrier_request_id)
			const requestStatus = String(details?.pickupRequestHeader?.requestStatus ?? '').toLowerCase()
			if (requestStatus === 'cancelled') status = 'cancelled'
			else if (requestStatus === 'missed pickup') status = 'missed'
			else if (requestStatus) status = 'scheduled'
			raw = details
		}

		const { data: updated, error } = await service
			.from('pickups')
			.update({ status, raw_create_response: raw, updated_at: new Date().toISOString() })
			.eq('id', id)
			.select()
			.single()
		if (error) return NextResponse.json({ error: error.message }, { status: 500 })
		return NextResponse.json({ pickup: updated })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Pickup status refresh failed'
		return NextResponse.json({ error: message }, { status: 502 })
	}
}
