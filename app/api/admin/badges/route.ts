import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export interface AdminBadgesCount {
	sellRequests: number
	orders: number
	inquiries: number
	repairs: number
	reviews: number
}

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request)
	if ('error' in auth) return auth.error

	try {
		const service = createServiceClient()

		const count = async (table: string, filter?: (q: any) => any) => {
			try {
				let query = service.from(table).select('id', { count: 'exact', head: true })
				if (filter) query = filter(query)
				const { count: c } = await query
				return c ?? 0
			} catch {
				return 0
			}
		}

		const [
			sellRequests,
			orders,
			inquiries,
			repairs,
			storeReviews,
			productReviews,
		] = await Promise.all([
			// 1. Pending Sell Requests
			count('sell_phone_requests', (q) => q.or('status.eq.submitted,status.eq.pending')),
			// 2. Pending Orders
			count('orders', (q) => q.or('status.eq.pending,payment_status.eq.unpaid')),
			// 3. New Inquiries
			count('contact_inquiries', (q) => q.eq('status', 'new')),
			// 4. Pending Repair Requests
			count('repair_requests', (q) => q.or('status.eq.submitted,status.eq.pending,status.eq.quote_pending')),
			// 5. Pending Testimonials & Product Reviews
			count('store_testimonials', (q) => q.eq('status', 'pending')),
			count('product_reviews', (q) => q.eq('status', 'pending')),
		])

		const badges: AdminBadgesCount = {
			sellRequests,
			orders,
			inquiries,
			repairs,
			reviews: storeReviews + productReviews,
		}

		return NextResponse.json({ counts: badges })
	} catch (err) {
		return NextResponse.json({ error: 'Failed to fetch badges' }, { status: 500 })
	}
}
