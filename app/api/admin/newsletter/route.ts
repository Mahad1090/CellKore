import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

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
