import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'
import type { TaxBreakdownLine } from '@/lib/stripe-tax'

interface OrderRow {
	id: string
	reference: string
	subtotal_amount: number | null
	discount_amount: number | null
	tax_amount: number | null
	tax_breakdown: TaxBreakdownLine[] | null
	total_amount: number
	marketplace: 'US' | 'CA'
	created_at: string
	shipping_address: { state_province: string | null; country: string | null } | null
}

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request, 'analytics:read')
	if ('error' in auth) return auth.error
	const service = createServiceClient()

	const { searchParams } = new URL(request.url)
	const from = searchParams.get('from')
	const to = searchParams.get('to')

	let query = service
		.from('orders')
		.select(
			'id, reference, subtotal_amount, discount_amount, tax_amount, tax_breakdown, total_amount, marketplace, created_at, shipping_address:addresses!shipping_address_id(state_province, country)'
		)
		.eq('payment_status', 'paid')
		.order('created_at', { ascending: false })
	if (from) query = query.gte('created_at', from)
	if (to) query = query.lte('created_at', to)

	const { data, error } = await query
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	const orders = (data ?? []) as unknown as OrderRow[]

	const regionMap = new Map<
		string,
		{ region: string; country: string; orderCount: number; subtotal: number; tax: number; total: number }
	>()
	const taxTypeMap = new Map<string, number>()
	const summary = { orderCount: 0, subtotal: 0, tax: 0, total: 0, untaxedOrderCount: 0 }

	for (const order of orders) {
		const country = order.shipping_address?.country ?? 'Unknown'
		const region = order.shipping_address?.state_province ?? 'Unknown'
		const key = `${country}-${region}`
		const existing = regionMap.get(key) ?? { region, country, orderCount: 0, subtotal: 0, tax: 0, total: 0 }
		existing.orderCount += 1
		existing.subtotal += order.subtotal_amount ?? 0
		existing.tax += order.tax_amount ?? 0
		existing.total += order.total_amount ?? 0
		regionMap.set(key, existing)

		summary.orderCount += 1
		summary.subtotal += order.subtotal_amount ?? 0
		summary.tax += order.tax_amount ?? 0
		summary.total += order.total_amount ?? 0
		if (order.tax_amount == null) summary.untaxedOrderCount += 1

		for (const line of order.tax_breakdown ?? []) {
			taxTypeMap.set(line.taxType, (taxTypeMap.get(line.taxType) ?? 0) + line.amount)
		}
	}

	const regions = [...regionMap.values()].sort((a, b) => b.tax - a.tax)
	const byTaxType = [...taxTypeMap.entries()].map(([taxType, amount]) => ({ taxType, amount }))

	return NextResponse.json({ regions, byTaxType, summary })
}
