'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { PageTitle, StatusBadge, EmptyState, adminInput } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import type { OrderRecord, OrderStatus, PaymentStatus } from '@/lib/types'

const ORDER_STATUSES: OrderStatus[] = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']
const PAYMENT_STATUSES: PaymentStatus[] = ['unpaid', 'paid', 'refunded', 'failed']

export default function AdminOrdersPage() {
	const { toast } = useToast()
	const { can } = useAdmin()
	const [orders, setOrders] = useState<OrderRecord[] | null>(null)
	const [expanded, setExpanded] = useState<string | null>(null)

	const load = useCallback(() => {
		fetch('/api/admin/orders')
			.then((res) => res.json())
			.then((json) => setOrders(json.orders ?? []))
			.catch(() => setOrders([]))
	}, [])

	useEffect(load, [load])

	const patch = async (id: string, body: Record<string, string>) => {
		const res = await fetch(`/api/admin/orders/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		})
		if (res.ok) {
			load()
		} else {
			const json = await res.json()
			toast({ title: 'Update failed', description: json.error, variant: 'error' })
		}
	}

	const writable = can('orders:write')

	return (
		<div>
			<PageTitle title="Orders" subtitle="Order and payment status monitor" />

			{orders === null ? (
				<TableShimmer />
			) : orders.length === 0 ? (
				<EmptyState message="No orders yet." />
			) : (
				<div className="border border-border rounded-3xl overflow-hidden bg-card overflow-x-auto">
					<table className="w-full text-sm min-w-[820px]">
						<thead>
							<tr className="bg-secondary text-left">
								{['Reference', 'Marketplace', 'Total', 'Placed', 'Order Status', 'Payment', ''].map((h) => (
									<th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">{h}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{orders.map((order) => (
								<OrderRow
									key={order.id}
									order={order}
									expanded={expanded === order.id}
									onToggle={() => setExpanded(expanded === order.id ? null : order.id)}
									writable={writable}
									onPatch={patch}
								/>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	)
}

function OrderRow({
	order,
	expanded,
	onToggle,
	writable,
	onPatch,
}: {
	order: OrderRecord
	expanded: boolean
	onToggle: () => void
	writable: boolean
	onPatch: (id: string, body: Record<string, string>) => void
}) {
	return (
		<>
			<tr className="border-t border-border hover:bg-muted/40 transition-colors">
				<td className="px-5 py-3.5 font-mono text-xs font-semibold text-card-foreground">
					{order.reference ?? '—'}
				</td>
				<td className="px-5 py-3.5 text-foreground/75">{order.marketplace}</td>
				<td className="px-5 py-3.5 font-semibold text-card-foreground">
					${Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
				</td>
				<td className="px-5 py-3.5 text-foreground/75 text-xs">
					{new Date(order.created_at).toLocaleDateString()}
				</td>
				<td className="px-5 py-3.5">
					{writable ? (
						<select
							value={order.status}
							onChange={(e) => onPatch(order.id, { status: e.target.value })}
							className={`${adminInput} py-1.5 w-36 cursor-pointer capitalize`}
						>
							{ORDER_STATUSES.map((s) => (
								<option key={s} value={s}>{s}</option>
							))}
						</select>
					) : (
						<StatusBadge value={order.status} />
					)}
				</td>
				<td className="px-5 py-3.5">
					{writable ? (
						<select
							value={order.payment_status}
							onChange={(e) => onPatch(order.id, { payment_status: e.target.value })}
							className={`${adminInput} py-1.5 w-32 cursor-pointer capitalize`}
						>
							{PAYMENT_STATUSES.map((s) => (
								<option key={s} value={s}>{s}</option>
							))}
						</select>
					) : (
						<StatusBadge value={order.payment_status} />
					)}
				</td>
				<td className="px-5 py-3.5">
					<button
						onClick={onToggle}
						className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-all cursor-pointer"
						aria-label="Toggle order items"
					>
						{expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
					</button>
				</td>
			</tr>
			{expanded && (
				<tr className="border-t border-border bg-muted/30">
					<td colSpan={7} className="px-8 py-4">
						<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-3">Items</p>
						<div className="space-y-2">
							{(order.order_items ?? []).map((item) => (
								<div key={item.id} className="flex justify-between text-xs">
									<span className="text-foreground/80">
										{item.products?.name ?? 'Deleted product'} × {item.quantity}
									</span>
									<span className="font-semibold text-card-foreground">
										${(Number(item.unit_price_at_purchase) * item.quantity).toFixed(2)}
									</span>
								</div>
							))}
							{(order.order_items ?? []).length === 0 && (
								<p className="text-xs text-muted-foreground">No line items recorded.</p>
							)}
						</div>
					</td>
				</tr>
			)}
		</>
	)
}
