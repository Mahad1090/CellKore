import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { sendWelcomeNewsletterEmail } from '@/lib/email/newsletter'

export async function POST(request: NextRequest) {
	try {
		const body = await request.json()
		const email = (body.email ?? '').trim().toLowerCase()

		if (!/^\S+@\S+\.\S+$/.test(email)) {
			return NextResponse.json({ error: 'Please enter a valid email address' }, { status: 400 })
		}

		const service = createServiceClient()

		// Check if already subscribed
		const { data: existing } = await service
			.from('newsletter_subscribers')
			.select('id, email')
			.eq('email', email)
			.maybeSingle()

		if (existing) {
			return NextResponse.json({ success: true, alreadySubscribed: true })
		}

		const { error } = await service.from('newsletter_subscribers').insert({ email })
		if (error) {
			if (error.code === '23505') {
				return NextResponse.json({ success: true, alreadySubscribed: true })
			}
			return NextResponse.json({ error: error.message }, { status: 500 })
		}

		// Send Welcome Newsletter Email with Unsubscribe link
		sendWelcomeNewsletterEmail(email).catch((err) => {
			console.error('[newsletter] welcome email error:', err)
		})

		return NextResponse.json({ success: true, alreadySubscribed: false })
	} catch (err) {
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : 'Subscription failed' },
			{ status: 500 }
		)
	}
}
