import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { getUpsPoliticalDivisions } from '@/lib/shipping/ups-pickup'

// Utility route (UPS Pickup Get Political Division1 List) — not wired into
// the schedule-pickup UI, exposed for spec completeness / future use.
export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request, 'orders:read')
	if ('error' in auth) return auth.error
	const { searchParams } = new URL(request.url)
	const countryCode = searchParams.get('countryCode')
	if (!countryCode) return NextResponse.json({ error: 'countryCode is required' }, { status: 400 })

	try {
		const divisions = await getUpsPoliticalDivisions(countryCode)
		return NextResponse.json({ divisions })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Political division lookup failed'
		return NextResponse.json({ error: message }, { status: 502 })
	}
}
