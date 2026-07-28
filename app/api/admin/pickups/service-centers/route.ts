import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { getUpsServiceCenterFacilities } from '@/lib/shipping/ups-pickup'

// Utility route (UPS Pickup Get Service Center Facilities) — UPS
// Freight/WWEF pallet drop points, not applicable to CellKore's parcel
// shipments. Not wired into the schedule-pickup UI; exposed for spec
// completeness / future use.
export async function POST(request: NextRequest) {
	const auth = await requireAdmin(request, 'orders:read')
	if ('error' in auth) return auth.error
	const body = await request.json().catch(() => ({}))

	try {
		const result = await getUpsServiceCenterFacilities(body)
		return NextResponse.json(result)
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Service center lookup failed'
		return NextResponse.json({ error: message }, { status: 502 })
	}
}
