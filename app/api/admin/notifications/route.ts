import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export interface RealNotificationItem {
	id: string
	title: string
	desc: string
	time: string
	link: string
	type: 'order' | 'tradein' | 'alert'
	read: boolean
	timestamp: string
}

function timeAgo(dateString: string): string {
	const date = new Date(dateString)
	const now = new Date()
	const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

	if (seconds < 60) return 'Just now'
	const minutes = Math.floor(seconds / 60)
	if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''} ago`
	const hours = Math.floor(minutes / 60)
	if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`
	const days = Math.floor(hours / 24)
	return `${days} day${days > 1 ? 's' : ''} ago`
}

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request)
	if ('error' in auth) return auth.error

	try {
		const service = createServiceClient()
		const items: RealNotificationItem[] = []

		// 1. Fetch recent trade-in requests
		const { data: sellRequests } = await service
			.from('sell_requests')
			.select('id, brand, model_name, created_at, status')
			.order('created_at', { ascending: false })
			.limit(4)

		if (sellRequests) {
			sellRequests.forEach((sr) => {
				items.push({
					id: `tradein-${sr.id}`,
					title: 'New Trade-in Request',
					desc: `Customer submitted a ${sr.brand || ''} ${sr.model_name || 'device'} offer.`,
					time: timeAgo(sr.created_at),
					link: '/admin/sell-requests',
					type: 'tradein',
					read: sr.status !== 'pending',
					timestamp: sr.created_at,
				})
			})
		}

		// 2. Fetch recent orders
		const { data: orders } = await service
			.from('orders')
			.select('id, total_amount, created_at, status, user_id')
			.order('created_at', { ascending: false })
			.limit(4)

		if (orders) {
			orders.forEach((o) => {
				const isPaid = o.status?.toLowerCase() === 'paid'
				items.push({
					id: `order-${o.id}`,
					title: isPaid ? 'Order Payment Confirmed' : 'New Order Placed',
					desc: `Order #${o.id.slice(0, 8)} (${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(o.total_amount || 0)}).`,
					time: timeAgo(o.created_at),
					link: '/admin/orders',
					type: 'order',
					read: false,
					timestamp: o.created_at,
				})
			})
		}

		// 3. Fetch recent customer contact inquiries
		const { data: inquiries } = await service
			.from('contact_inquiries')
			.select('id, name, email, subject, submitted_at, status')
			.order('submitted_at', { ascending: false })
			.limit(4)

		if (inquiries) {
			inquiries.forEach((inq) => {
				items.push({
					id: `inquiry-${inq.id}`,
					title: 'New Customer Inquiry',
					desc: `${inq.subject || 'Inquiry'} from ${inq.name || inq.email || 'Customer'}.`,
					time: timeAgo(inq.submitted_at),
					link: '/admin/inquiries',
					type: 'tradein',
					read: inq.status !== 'new',
					timestamp: inq.submitted_at,
				})
			})
		}

		// 4. Fetch low stock items
		const { data: lowStockProducts } = await service
			.from('products')
			.select('id, title, inventory_quantity, updated_at')
			.lte('inventory_quantity', 5)
			.order('inventory_quantity', { ascending: true })
			.limit(3)

		if (lowStockProducts) {
			lowStockProducts.forEach((p) => {
				items.push({
					id: `stock-${p.id}`,
					title: 'Low Stock Discrepancy',
					desc: `${p.title} has only ${p.inventory_quantity} units remaining!`,
					time: timeAgo(p.updated_at || new Date().toISOString()),
					link: '/admin/products',
					type: 'alert',
					read: false,
					timestamp: p.updated_at || new Date().toISOString(),
				})
			})
		}

		// Sort all real notifications by timestamp descending
		items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

		return NextResponse.json({ notifications: items.slice(0, 10) })
	} catch (err) {
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : 'Failed to fetch notifications' },
			{ status: 500 }
		)
	}
}
