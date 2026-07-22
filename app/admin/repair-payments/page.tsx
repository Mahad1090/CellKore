'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, Search } from 'lucide-react'
import { PageTitle, EmptyState, adminInput } from '@/components/admin/ui'
import { RepairRequestModal } from '@/components/admin/repair-request-modal'
import { RepairStatusBadge } from '@/components/repair-status-timeline'
import { TableShimmer } from '@/components/shimmer'
import { formatMoney } from '@/lib/format'
import type { RepairRequest } from '@/lib/types'

const WORKFLOW_TABS = [
	{ href: '/admin/repair-requests', label: 'Repair Queue' },
	{ href: '/admin/repair-workflow', label: 'Repair Workflow' },
	{ href: '/admin/repair-payments', label: 'Repair Payments' },
]

export default function AdminRepairPaymentsPage() {
	const [requests, setRequests] = useState<RepairRequest[] | null>(null)
	const [search, setSearch] = useState('')
	const [selected, setSelected] = useState<RepairRequest | null>(null)

	const load = useCallback(() => {
		fetch('/api/admin/repair-requests')
			.then((res) => res.json())
			.then((json) => setRequests(json.requests ?? []))
			.catch(() => setRequests([]))
	}, [])

	useEffect(load, [load])

	const billed = (requests ?? []).filter((r) => r.quote_sent_at != null)
	const filtered = billed.filter(
		(r) =>
			!search.trim() ||
			`${r.device_brand} ${r.device_model} ${r.contact_name ?? ''} ${r.contact_email ?? ''}`
				.toLowerCase()
				.includes(search.toLowerCase())
	)

	return (
		<div>
			<PageTitle title="Repair Payments" subtitle="Quote totals, shipping costs, and payment status for every billed repair" />

			<div className="mb-6 flex flex-wrap gap-2">
				{WORKFLOW_TABS.map((tab) => (
					<Link
						key={tab.href}
						href={tab.href}
						className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.14em] border transition-all ${
							tab.href === '/admin/repair-payments'
								? 'bg-primary text-primary-foreground border-primary'
								: 'border-border text-foreground/70 hover:border-primary hover:text-foreground'
						}`}
					>
						{tab.label}
					</Link>
				))}
			</div>

			<div className="relative mb-6 max-w-sm">
				<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
				<input
					placeholder="Search device or contact..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className={`${adminInput} pl-11`}
				/>
			</div>

			{requests === null ? (
				<TableShimmer />
			) : filtered.length === 0 ? (
				<EmptyState message="No billed repair requests yet." />
			) : (
				<div className="border border-border rounded-3xl overflow-hidden bg-card overflow-x-auto">
					<table className="w-full text-sm min-w-[880px]">
						<thead>
							<tr className="bg-secondary text-left">
								{['Device', 'Contact', 'Quote', 'Shipping', 'Grand Total', 'Payment', 'Status', ''].map((h) => (
									<th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">{h}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{filtered.map((request) => (
								<tr key={request.id} className="border-t border-border hover:bg-muted/40 transition-colors">
									<td className="px-5 py-3.5 font-medium text-card-foreground">
										{request.device_brand} {request.device_model}
									</td>
									<td className="px-5 py-3.5 text-foreground/75 text-xs">
										{request.contact_email ?? request.contact_phone ?? '—'}
									</td>
									<td className="px-5 py-3.5 text-foreground/80 text-xs font-mono">
										{request.quote_total != null ? formatMoney(Number(request.quote_total), request.quote_currency) : '—'}
									</td>
									<td className="px-5 py-3.5 text-foreground/80 text-xs font-mono">
										{request.shipping_cost != null ? formatMoney(Number(request.shipping_cost), request.quote_currency) : '—'}
									</td>
									<td className="px-5 py-3.5 font-semibold text-card-foreground text-xs font-mono">
										{request.grand_total != null ? formatMoney(Number(request.grand_total), request.quote_currency) : '—'}
									</td>
									<td className="px-5 py-3.5 text-xs">
										{request.paid_at ? (
											<span className="text-emerald-700 dark:text-emerald-300 font-bold">
												Paid via {request.payment_provider}
											</span>
										) : (
											<span className="text-muted-foreground">Unpaid</span>
										)}
									</td>
									<td className="px-5 py-3.5"><RepairStatusBadge status={request.status} /></td>
									<td className="px-5 py-3.5">
										<button
											onClick={() => setSelected(request)}
											className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-all cursor-pointer"
											aria-label="View details"
										>
											<Eye className="w-4 h-4" />
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{selected && (
				<RepairRequestModal
					request={selected}
					onClose={() => setSelected(null)}
					onSaved={load}
					focusTab="quote"
				/>
			)}
		</div>
	)
}
