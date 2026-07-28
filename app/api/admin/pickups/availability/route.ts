import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { getCanadaPostPickupAvailability } from '@/lib/shipping/canada-post-pickup'

// Canada Post only — UPS's Pickup API has no availability/cutoff lookup.
export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request, 'orders:read')
	if ('error' in auth) return auth.error
	const { searchParams } = new URL(request.url)
	const postalCode = searchParams.get('postalCode')
	if (!postalCode) return NextResponse.json({ error: 'postalCode is required' }, { status: 400 })

	try {
		const availability = await getCanadaPostPickupAvailability(postalCode)
		return NextResponse.json(availability)
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Availability lookup failed'
		return NextResponse.json({ error: message }, { status: 502 })
	}
}
