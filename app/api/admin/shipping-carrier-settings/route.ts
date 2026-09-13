import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'
import { getCarrierSettings, invalidateCarrierSettingsCache } from '@/lib/shipping/carrier-settings'

const BOOLEAN_FIELDS = [
	'canadaPostCa',
	'canadaPostUs',
	'upsCa',
	'upsUs',
	'stallionCa',
	'stallionUs',
] as const

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request)
	if ('error' in auth) return auth.error

	// Goes through the same fail-open helper the aggregator uses, so this
	// page never breaks (e.g. before the migration creating the table has
	// been run) — it just shows everything enabled, matching what the
	// storefront is actually doing in that case.
	const settings = await getCarrierSettings()
	return NextResponse.json({
		canadaPostCa: settings.canadaPost.ca,
		canadaPostUs: settings.canadaPost.us,
		upsCa: settings.ups.ca,
		upsUs: settings.ups.us,
		stallionCa: settings.stallion.ca,
		stallionUs: settings.stallion.us,
	})
}

export async function PUT(request: NextRequest) {
	const auth = await requireAdmin(request, 'settings:write')
	if ('error' in auth) return auth.error

	const body = await request.json().catch(() => null)
	if (!body) return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })

	for (const field of BOOLEAN_FIELDS) {
		if (typeof body[field] !== 'boolean') {
			return NextResponse.json({ error: `${field} must be a boolean` }, { status: 400 })
		}
	}

	const service = createServiceClient()
	const { error } = await service.from('shipping_carrier_settings').upsert({
		id: true,
		canada_post_ca_enabled: body.canadaPostCa,
		canada_post_us_enabled: body.canadaPostUs,
		ups_ca_enabled: body.upsCa,
		ups_us_enabled: body.upsUs,
		stallion_ca_enabled: body.stallionCa,
		stallion_us_enabled: body.stallionUs,
		updated_at: new Date().toISOString(),
	})
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })

	// Take effect immediately instead of waiting out the aggregator's cache TTL.
	invalidateCarrierSettingsCache()

	return NextResponse.json({ success: true })
}
