import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'
import { renderEmailLayout } from '@/lib/email/template'
import { sendMail } from '@/lib/email/mailer'
import { FROM_INFO, REPLY_TO_SUPPORT } from '@/lib/email/addresses'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request, 'newsletter:read')
	if ('error' in auth) return auth.error
	const service = createServiceClient()
	const { data, error } = await service
		.from('newsletter_subscribers')
		.select('*')
		.order('subscribed_at', { ascending: false })
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })

	if (request.nextUrl.searchParams.get('format') === 'csv') {
		const rows = ['email,subscribed_at', ...(data ?? []).map((s) => `${s.email},${s.subscribed_at}`)]
		return new NextResponse(rows.join('\n'), {
			headers: {
				'Content-Type': 'text/csv',
				'Content-Disposition': 'attachment; filename="cellkore-newsletter-subscribers.csv"',
			},
		})
	}
	return NextResponse.json({ subscribers: data })
}

export async function POST(request: NextRequest) {
	const auth = await requireAdmin(request, 'newsletter:write')
	if ('error' in auth) return auth.error

	try {
		const { subject, link, buttonText, message, imageUrl } = await request.json()
		if (!subject || !message) {
			return NextResponse.json({ error: 'Subject and Message Content are required' }, { status: 400 })
		}

		const service = createServiceClient()
		const { data: subscribers, error } = await service.from('newsletter_subscribers').select('email')
		if (error) return NextResponse.json({ error: error.message }, { status: 500 })

		const recipientCount = subscribers?.length || 0

		const formattedParagraphs = message
			.split('\n\n')
			.map((p: string) => `<p style="margin: 0 0 16px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; font-size: 15px; line-height: 1.75; color: #374151; font-weight: 400;">${p.replace(/\n/g, '<br/>')}</p>`)
			.join('')

		const html = renderEmailLayout({
			eyebrow: 'NEWSLETTER & NEW ARRIVALS',
			heading: subject.trim(),
			bodyHtml: formattedParagraphs,
			imageUrl: imageUrl?.trim() || undefined,
			action: link?.trim() ? { label: buttonText?.trim() || 'EXPLORE COLLECTION', url: link.trim() } : undefined,
		})

		// Send email using the shared CellKore branded template to all active subscribers
		if (subscribers && subscribers.length > 0) {
			for (const sub of subscribers) {
				if (sub.email) {
					await sendMail({
						to: sub.email,
						from: FROM_INFO,
						replyTo: REPLY_TO_SUPPORT,
						subject,
						html,
					})
				}
			}
		}

		return NextResponse.json({
			success: true,
			recipientCount,
			message: `Notification broadcast sent successfully to ${recipientCount} active subscriber${recipientCount !== 1 ? 's' : ''}.`,
		})
	} catch (err) {
		return NextResponse.json({ error: err instanceof Error ? err.message : 'Broadcast failed' }, { status: 500 })
	}
}

export async function DELETE(request: NextRequest) {
	const auth = await requireAdmin(request, 'newsletter:write')
	if ('error' in auth) return auth.error

	const id = request.nextUrl.searchParams.get('id')
	if (!id) return NextResponse.json({ error: 'Subscriber ID is required' }, { status: 400 })

	const service = createServiceClient()
	const { error } = await service.from('newsletter_subscribers').delete().eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })

	return NextResponse.json({ success: true })
}

