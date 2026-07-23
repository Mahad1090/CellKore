import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const email = (body.email ?? '').trim().toLowerCase()

		if (!email) {
			return NextResponse.json({ error: 'Email parameter missing' }, { status: 400 })
		}

		const service = createServiceClient()
		const { error } = await service.from('newsletter_subscribers').delete().eq('email', email)

		if (error) {
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

		return NextResponse.json({ success: true, email })
	} catch (err) {
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : 'Unsubscribe failed' },
			{ status: 500 }
		)
	}
}
