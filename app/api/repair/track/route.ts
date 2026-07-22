import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { matchesContact, normalizeRequestId } from '@/lib/sell-request-contact'

// Public, unauthenticated lookup for guest repair submissions (no
// account). Requires the exact request ID plus the email/phone used at
// submission time, so a stranger can't browse other people's requests.
export async function POST(request: NextRequest) {
	const body = await request.json()
	const rawInputId = String(body.id ?? '').trim()
	const id = normalizeRequestId(rawInputId)
	const contact = String(body.contact ?? '').trim()
	if (!id || !contact) {
		return NextResponse.json({ error: 'Request ID and contact info are required' }, { status: 400 })
	}

	const service = createServiceClient()
	const { data, error } = await service
		.from('repair_requests')
		.select(
			'*, repair_images ( id, image_url ), repair_status_history ( id, request_id, status, note, changed_by, created_at )'
		)
		.eq('id', id)
		.order('created_at', { referencedTable: 'repair_status_history', ascending: true })
		.maybeSingle()

	if (error || !data || !matchesContact(data, contact)) {
		return NextResponse.json({ error: 'No matching request found. Check your request ID and contact info.' }, { status: 404 })
	}

	return NextResponse.json({ request: data })
}
