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

	const [
		activeListings,
		categories,
		ordersCount,
		wholesaleLots,
		sellRequestsCount,
		pendingSellCount,
		pendingInquiries,
		repairCount,
		subscribersCount,
		recentSellRes,
		recentOrdersRes,
		ordersPaidRes,
		sellPayoutsRes,
		lowStockProductsRes,
		adminLogsRes,
		statusHistoryRes,
	] = await Promise.all([
		count('products', (q) => q.eq('is_active', true).eq('is_wholesale', false)),
		count('categories'),
		count('orders'),
		count('products', (q) => q.eq('is_wholesale', true)),
		count('sell_phone_requests'),
		count('sell_phone_requests', (q) => q.eq('status', 'submitted')),
		count('contact_inquiries', (q) => q.eq('status', 'new')),
		Promise.resolve(count('repair_requests')).catch(() => 0),
		Promise.resolve(count('newsletter_subscribers')).catch(() => 0),
		service.from('sell_phone_requests').select('id, device_brand, device_model, condition, status, offered_price, submitted_at').order('submitted_at', { ascending: false }).limit(5),
		service.from('orders').select('id, order_number, status, payment_status, total_amount, created_at, customer_name, contact_email').order('created_at', { ascending: false }).limit(5),
		service.from('orders').select('total_amount').eq('payment_status', 'paid'),
		service.from('sell_phone_requests').select('payout_amount').not('payout_amount', 'is', null),
		service.from('products').select('id, name, sku, stock, base_price, is_wholesale').eq('is_active', true).lt('stock', 15).order('stock', { ascending: true }).limit(5),
		Promise.resolve(service.from('admin_logs').select('id, level, source, message, created_at').order('created_at', { ascending: false }).limit(5)).catch(() => ({ data: [] })),
		Promise.resolve(service.from('sell_phone_status_history').select('id, status, note, changed_by, created_at, sell_phone_requests(device_brand, device_model)').order('created_at', { ascending: false }).limit(5)).catch(() => ({ data: [] })),
	])

	let totalGrossSales = 0
	for (const o of ordersPaidRes.data ?? []) {
		totalGrossSales += Number(o.total_amount ?? 0)
	}

	let totalTradeInPayouts = 0
	for (const s of sellPayoutsRes.data ?? []) {
		totalTradeInPayouts += Number(s.payout_amount ?? 0)
	}

	return NextResponse.json({
		metrics: {
			activeListings,
			categories,
			orders: ordersCount,
			wholesaleLots,
			sellRequests: sellRequestsCount,
			pendingSellRequests: pendingSellCount,
			pendingInquiries,
			repairRequests: repairCount,
			subscribers: subscribersCount,
			totalGrossSales: Math.round(totalGrossSales * 100) / 100,
			totalTradeInPayouts: Math.round(totalTradeInPayouts * 100) / 100,
		},
		recentSellRequests: recentSellRes.data ?? [],
		recentOrders: recentOrdersRes.data ?? [],
		lowStockProducts: lowStockProductsRes.data ?? [],
		systemLogs: adminLogsRes?.data ?? [],
		workflowLogs: statusHistoryRes?.data ?? [],
	})
}
