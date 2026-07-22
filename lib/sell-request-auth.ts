import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { matchesContact } from '@/lib/sell-request-contact'

/**
 * Shared dual-auth check for customer-facing sell-request actions: a
 * signed-in customer must own the request (JWT), a guest submitter must
 * supply the matching contact info. Returns an error response to return
 * immediately, or null if authorized.
 */
export async function authorizeSellRequestCustomer(
	request: NextRequest,
	body: Record<string, unknown>,
	existing: { user_id: string | null; contact_email: string | null; contact_phone: string | null }
): Promise<NextResponse | null> {
	const token = (request.headers.get('authorization') ?? '').replace(/^Bearer\s+/i, '')
	if (existing.user_id) {
		if (!token) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
		const anon = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
		const { data: userData, error: userError } = await anon.auth.getUser(token)
		if (userError || !userData.user || userData.user.id !== existing.user_id) {
			return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
		}
		return null
	}
	const contact = String(body.contact ?? '').trim()
	if (!contact || !matchesContact(existing, contact)) {
		return NextResponse.json({ error: 'Request ID and contact info do not match' }, { status: 403 })
	}
	return null
}
