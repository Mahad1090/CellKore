import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request)
	if ('error' in auth) return auth.error
	const service = createServiceClient()
	const { data, error } = await service.from('country_contact_info').select('*').order('country')
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ contacts: data })
}

export async function PUT(request: NextRequest) {
	const auth = await requireAdmin(request, 'settings:write')
	if ('error' in auth) return auth.error
	const { contacts } = await request.json()
	if (!Array.isArray(contacts)) {
		return NextResponse.json({ error: 'contacts array is required' }, { status: 400 })
	}
	const service = createServiceClient()
	for (const contact of contacts) {
		const { error } = await service
			.from('country_contact_info')
			.upsert(
				{
					country: contact.country,
					whatsapp_number: contact.whatsapp_number || null,
					email: contact.email || null,
					landline: contact.landline || null,
				},
				{ onConflict: 'country' }
			)
		if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	}
	return NextResponse.json({ success: true })
}
