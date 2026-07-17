import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request)
	if ('error' in auth) return auth.error
	const service = createServiceClient()

	const count = async (table: string, filter?: (q: any) => any) => {
		let query = service.from(table).select('id', { count: 'exact', head: true })
		if (filter) query = filter(query)
		const { count: c } = await query
		return c ?? 0
	}

	const [activeListings, categories, orders, wholesaleLots, sellRequests, pendingInquiries] =
		await Promise.all([
			count('products', (q) => q.eq('is_active', true).eq('is_wholesale', false)),
			count('categories'),
			count('orders'),
			count('products', (q) => q.eq('is_wholesale', true)),
			count('sell_phone_requests'),
			count('contact_inquiries', (q) => q.eq('status', 'new')),
		])

	return NextResponse.json({
		metrics: { activeListings, categories, orders, wholesaleLots, sellRequests, pendingInquiries },
	})
}
