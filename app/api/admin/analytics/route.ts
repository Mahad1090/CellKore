import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request, 'analytics:read')
	if ('error' in auth) return auth.error
	const service = createServiceClient()

	// Execute queries safely in parallel
	const [ordersRes, itemsRes, sellRes, productsRes, subsRes, inquiriesRes, repairRes] = await Promise.all([
		service.from('orders').select('id, status, payment_status, payment_provider, total_amount, customer_email, user_id, created_at'),
		service.from('order_items').select('quantity, unit_price_at_purchase, products(id, name, categories(name))'),
		service.from('sell_phone_requests').select('id, device_brand, device_model, condition, status, offered_price, payout_amount, submitted_at, user_id'),
		service.from('products').select('id, name, sku, price, base_price, stock_quantity, lot_quantity, is_active, is_wholesale, created_at, categories(name), wholesale_price_tiers(id, min_quantity, price_per_unit)'),
		service.from('newsletter_subscribers').select('id, email, created_at'),
		service.from('contact_inquiries').select('id, status, submitted_at'),
		service.from('repair_requests').select('id, device_brand, device_model, status, estimated_cost, created_at'),
	])

	const orders = ordersRes.data ?? []
	const items = itemsRes.data ?? []
	const sellRequests = sellRes.data ?? []
	const products = productsRes.data ?? []
	const subscribers = subsRes.data ?? []
	const inquiries = inquiriesRes.data ?? []
	const repairRequests = (repairRes as any)?.data ?? []

	// 1. Sales & E-Commerce Analytics
	let totalGrossSales = 0
	let totalPaidOrders = 0
	const orderStatusMap: Record<string, number> = {}
	const paymentStatusMap: Record<string, number> = {}
	const paymentProviderMap: Record<string, number> = {}

	const monthlySalesMap: Record<string, { revenue: number; orders: number }> = {}
	const now = new Date()
	for (let i = 11; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
		const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
		monthlySalesMap[key] = { revenue: 0, orders: 0 }
	}

	let registeredOrders = 0
	let guestOrders = 0

	for (const order of orders) {
		const st = order.status ?? 'pending'
		const pst = order.payment_status ?? 'unpaid'
		const provider = order.payment_provider ?? 'card'

		orderStatusMap[st] = (orderStatusMap[st] ?? 0) + 1
		paymentStatusMap[pst] = (paymentStatusMap[pst] ?? 0) + 1
		paymentProviderMap[provider] = (paymentProviderMap[provider] ?? 0) + 1

		if (order.user_id) registeredOrders++
		else guestOrders++

		if (pst === 'paid') {
			const amt = Number(order.total_amount ?? 0)
			totalGrossSales += amt
			totalPaidOrders++

			const key = order.created_at ? order.created_at.slice(0, 7) : ''
			if (key in monthlySalesMap) {
				monthlySalesMap[key].revenue += amt
				monthlySalesMap[key].orders += 1
			}
		}
	}

	const averageOrderValue = totalPaidOrders > 0 ? totalGrossSales / totalPaidOrders : 0

	// Category & Product Revenue
	const categorySalesMap: Record<string, { revenue: number; units: number }> = {}
	const productSalesMap: Record<string, { revenue: number; units: number }> = {}

	for (const item of items) {
		const prod = item.products as unknown as { name: string; categories: { name: string } | null } | null
		const catName = prod?.categories?.name ?? 'General Accessories'
		const prodName = prod?.name ?? 'Product Item'
		const rev = Number(item.unit_price_at_purchase ?? 0) * (item.quantity ?? 1)
		const qty = item.quantity ?? 1

		if (!categorySalesMap[catName]) categorySalesMap[catName] = { revenue: 0, units: 0 }
		categorySalesMap[catName].revenue += rev
		categorySalesMap[catName].units += qty

		if (!productSalesMap[prodName]) productSalesMap[prodName] = { revenue: 0, units: 0 }
		productSalesMap[prodName].revenue += rev
		productSalesMap[prodName].units += qty
	}

	// 2. Device Trade-in & Buyback Analytics
	let totalTradeInPayouts = 0
	let totalApprovedValuations = 0
	let totalApprovedCount = 0
	const sellStatusMap: Record<string, number> = {}
	const sellConditionMap: Record<string, number> = {}
	const sellBrandMap: Record<string, { count: number; totalValue: number }> = {}
	const sellModelMap: Record<string, { count: number; totalValue: number }> = {}

	for (const req of sellRequests) {
		const statusKey = req.status ?? 'submitted'
		const condKey = req.condition ?? 'good'
		const brandKey = req.device_brand ? req.device_brand.trim() : 'Unknown'
		const modelKey = req.device_model ? req.device_model.trim() : 'Unknown Model'

		sellStatusMap[statusKey] = (sellStatusMap[statusKey] ?? 0) + 1
		sellConditionMap[condKey] = (sellConditionMap[condKey] ?? 0) + 1

		const val = Number(req.offered_price ?? req.payout_amount ?? 0)
		if (req.payout_amount != null) totalTradeInPayouts += Number(req.payout_amount)
		if (req.offered_price != null) {
			totalApprovedValuations += Number(req.offered_price)
			totalApprovedCount++
		}

		if (!sellBrandMap[brandKey]) sellBrandMap[brandKey] = { count: 0, totalValue: 0 }
		sellBrandMap[brandKey].count += 1
		sellBrandMap[brandKey].totalValue += val

		if (!sellModelMap[modelKey]) sellModelMap[modelKey] = { count: 0, totalValue: 0 }
		sellModelMap[modelKey].count += 1
		sellModelMap[modelKey].totalValue += val
	}

	const averageTradeInValuation = totalApprovedCount > 0 ? totalApprovedValuations / totalApprovedCount : 0

	// 3. Repair Services Analytics
	let totalRepairCost = 0
	const repairStatusMap: Record<string, number> = {}
	const repairBrandMap: Record<string, number> = {}

	for (const rep of repairRequests) {
		const st = rep.status ?? 'submitted'
		const brand = rep.device_brand ?? 'Generic'
		repairStatusMap[st] = (repairStatusMap[st] ?? 0) + 1
		repairBrandMap[brand] = (repairBrandMap[brand] ?? 0) + 1
		if (rep.estimated_cost != null) totalRepairCost += Number(rep.estimated_cost)
	}

	// 4. Wholesale & Inventory Analytics
	let activeListingsCount = 0
	let wholesaleLotsCount = 0
	let wholesaleValuationTotal = 0
	let wholesaleDevicesTotal = 0
	let totalInventoryValue = 0
	let inStockCount = 0
	let lowStockCount = 0
	let outOfStockCount = 0
	const categoryStockMap: Record<string, number> = {}

	const wholesaleLotsList: any[] = []

	for (const prod of products) {
		const price = Number(prod.base_price ?? prod.price ?? 0)
		const qty = Number(prod.stock_quantity ?? 0)
		const cat = (prod.categories as any)?.name ?? 'Uncategorized'

		if (prod.is_wholesale) {
			wholesaleLotsCount++
			const lotQtyStr = prod.lot_quantity ?? '1 device'
			const lotQtyNum = parseInt(lotQtyStr) || 1
			wholesaleValuationTotal += price
			wholesaleDevicesTotal += lotQtyNum

			wholesaleLotsList.push({
				id: prod.id,
				name: prod.name,
				sku: prod.sku || '—',
				category: cat,
				lotQuantity: lotQtyStr,
				basePrice: Math.round(price * 100) / 100,
				status: prod.is_active ? 'Active' : 'Draft',
				tiersCount: Array.isArray((prod as any).wholesale_price_tiers) ? (prod as any).wholesale_price_tiers.length : 0,
			})
		} else {
			if (prod.is_active) activeListingsCount++
			totalInventoryValue += price * qty

			if (qty <= 0) outOfStockCount++
			else if (qty <= 5) lowStockCount++
			else inStockCount++
		}

		categoryStockMap[cat] = (categoryStockMap[cat] ?? 0) + 1
	}

	// 5. Customer & Audience Analytics
	const inquiryStatusMap: Record<string, number> = {}
	for (const inq of inquiries) {
		const st = inq.status ?? 'new'
		inquiryStatusMap[st] = (inquiryStatusMap[st] ?? 0) + 1
	}

	return NextResponse.json({
		summary: {
			totalGrossSales: Math.round(totalGrossSales * 100) / 100,
			totalOrders: orders.length,
			averageOrderValue: Math.round(averageOrderValue * 100) / 100,
			totalTradeInPayouts: Math.round(totalTradeInPayouts * 100) / 100,
			totalTradeInRequests: sellRequests.length,
			totalRepairRequests: repairRequests.length,
			totalSubscribers: subscribers.length,
			totalProducts: products.length,
			totalInquiries: inquiries.length,
		},
		sales: {
			monthlyRevenue: Object.entries(monthlySalesMap).map(([month, data]) => ({
				month,
				revenue: Math.round(data.revenue * 100) / 100,
				orders: data.orders,
			})),
			topCategories: Object.entries(categorySalesMap)
				.map(([name, data]) => ({ name, revenue: Math.round(data.revenue * 100) / 100, units: data.units }))
				.sort((a, b) => b.revenue - a.revenue)
				.slice(0, 8),
			topProducts: Object.entries(productSalesMap)
				.map(([name, data]) => ({ name, revenue: Math.round(data.revenue * 100) / 100, units: data.units }))
				.sort((a, b) => b.revenue - a.revenue)
				.slice(0, 8),
			orderStatusBreakdown: orderStatusMap,
			paymentStatusBreakdown: paymentStatusMap,
			paymentProviderBreakdown: paymentProviderMap,
		},
		tradeIn: {
			totalSubmitted: sellRequests.length,
			totalApprovedPayouts: Math.round(totalTradeInPayouts * 100) / 100,
			averageValuation: Math.round(averageTradeInValuation * 100) / 100,
			statusBreakdown: sellStatusMap,
			topBrands: Object.entries(sellBrandMap)
				.map(([brand, data]) => ({ brand, count: data.count, totalValue: Math.round(data.totalValue * 100) / 100 }))
				.sort((a, b) => b.count - a.count),
			topModels: Object.entries(sellModelMap)
				.map(([model, data]) => ({ model, count: data.count, totalValue: Math.round(data.totalValue * 100) / 100 }))
				.sort((a, b) => b.count - a.count)
				.slice(0, 8),
			conditionBreakdown: sellConditionMap,
		},
		repair: {
			totalRequests: repairRequests.length,
			totalEstimatedCost: Math.round(totalRepairCost * 100) / 100,
			statusBreakdown: repairStatusMap,
			topBrandsRepaired: Object.entries(repairBrandMap)
				.map(([brand, count]) => ({ brand, count }))
				.sort((a, b) => b.count - a.count),
		},
		inventory: {
			totalProducts: products.length,
			activeListings: activeListingsCount,
			wholesaleLotsCount: wholesaleLotsCount,
			wholesaleValuationTotal: Math.round(wholesaleValuationTotal * 100) / 100,
			wholesaleDevicesTotal: wholesaleDevicesTotal,
			wholesaleLotsList: wholesaleLotsList,
			totalInventoryValue: Math.round(totalInventoryValue * 100) / 100,
			stockStatus: { inStock: inStockCount, lowStock: lowStockCount, outOfStock: outOfStockCount },
			categoryStock: Object.entries(categoryStockMap).map(([category, count]) => ({ category, count })),
		},
		customer: {
			totalSubscribers: subscribers.length,
			recentSubscribersCount: subscribers.length,
			totalInquiries: inquiries.length,
			inquiryStatusBreakdown: inquiryStatusMap,
			customerTypeBreakdown: { registered: registeredOrders, guest: guestOrders },
		},
	})
}
