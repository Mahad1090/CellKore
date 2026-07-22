import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { sendNewInquiryAdminAlert } from '@/lib/email/inquiries'

export async function POST(request: NextRequest) {
	const body = await request.json()
	const name = String(body.name ?? '').trim()
	const email = String(body.email ?? '').trim()
	const message = String(body.message ?? '').trim()
	const phone = String(body.phone ?? '').trim() || null
	const country = String(body.country ?? '').trim() || null

	if (!name || !email || !message) {
		return NextResponse.json({ error: 'Name, email and message are required' }, { status: 400 })
	}

	const service = createServiceClient()
	const { error } = await service.from('contact_inquiries').insert({
		name,
		email,
		phone,
		country,
		message,
		status: 'new',
	})
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })

	await sendNewInquiryAdminAlert({ name, email, phone, country, message })

	return NextResponse.json({ success: true })
}
