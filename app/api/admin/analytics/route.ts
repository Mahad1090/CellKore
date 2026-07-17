import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request, 'analytics:read')
	if ('error' in auth) return auth.error
	const service = createServiceClient()

	const [ordersRes, subsRes, itemsRes] = await Promise.all([
		service.from('orders').select('id, status, payment_status, total_amount, created_at'),
		service.from('newsletter_subscribers').select('id', { count: 'exact', head: true }),
		service
			.from('order_items')
			.select('quantity, unit_price_at_purchase, products ( name, categories ( name ) )'),
	])

	if (ordersRes.error) return NextResponse.json({ error: ordersRes.error.message }, { status: 500 })

	const orders = ordersRes.data ?? []

	// Monthly revenue from paid orders (last 12 months)
	const monthly: Record<string, number> = {}
	const now = new Date()
	for (let i = 11; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
		monthly[`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`] = 0
	}
	for (const order of orders) {
		if (order.payment_status !== 'paid') continue
		const key = order.created_at.slice(0, 7)
		if (key in monthly) monthly[key] += Number(order.total_amount)
	}

	// Top selling categories by revenue
	const categoryRevenue: Record<string, number> = {}
	for (const item of itemsRes.data ?? []) {
		const product = item.products as unknown as { name: string; categories: { name: string } | null } | null
		const category = product?.categories?.name ?? 'Uncategorized'
		categoryRevenue[category] =
			(categoryRevenue[category] ?? 0) + Number(item.unit_price_at_purchase) * item.quantity
	}

	const countBy = (key: 'status' | 'payment_status') =>
		orders.reduce<Record<string, number>>((acc, o) => {
			acc[o[key]] = (acc[o[key]] ?? 0) + 1
			return acc
		}, {})

	return NextResponse.json({
		monthlyRevenue: Object.entries(monthly).map(([month, revenue]) => ({
			month,
			revenue: Math.round(revenue * 100) / 100,
		})),
		topCategories: Object.entries(categoryRevenue)
			.map(([name, revenue]) => ({ name, revenue: Math.round(revenue * 100) / 100 }))
			.sort((a, b) => b.revenue - a.revenue)
			.slice(0, 8),
		orderStatusBreakdown: countBy('status'),
		paymentStatusBreakdown: countBy('payment_status'),
		totalSubscribers: subsRes.count ?? 0,
	})
}
