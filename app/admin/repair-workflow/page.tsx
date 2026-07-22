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

const WORKFLOW_STATUSES = [
	'quote_sent',
	'quote_accepted',
	'payment_confirmed',
	'awaiting_device',
	'device_shipped',
	'device_received',
	'in_repair',
	'repaired',
	'shipped_back',
	'completed',
]

export default function AdminRepairWorkflowPage() {
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

	const workflow = (requests ?? []).filter((r) => WORKFLOW_STATUSES.includes(r.status))
	const filtered = workflow.filter(
		(r) =>
			!search.trim() ||
			`${r.device_brand} ${r.device_model} ${r.contact_name ?? ''} ${r.contact_email ?? ''}`
				.toLowerCase()
				.includes(search.toLowerCase())
	)

	return (
		<div>
			<PageTitle title="Repair Workflow" subtitle="Track devices through payment, receipt, repair, and return shipping" />

			<div className="mb-6 flex flex-wrap gap-2">
				{WORKFLOW_TABS.map((tab) => (
					<Link
						key={tab.href}
						href={tab.href}
						className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.14em] border transition-all ${
							tab.href === '/admin/repair-workflow'
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
				<EmptyState message="No repair requests in the active workflow." />
			) : (
				<div className="border border-border rounded-3xl overflow-hidden bg-card overflow-x-auto">
					<table className="w-full text-sm min-w-[720px]">
						<thead>
							<tr className="bg-secondary text-left">
								{['Device', 'Contact', 'Quote Total', 'Status', ''].map((h) => (
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
									<td className="px-5 py-3.5 font-semibold text-card-foreground">
										{request.grand_total != null
										? formatMoney(Number(request.grand_total), request.quote_currency)
										: request.quote_total != null
											? formatMoney(Number(request.quote_total), request.quote_currency)
											: '—'}
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
					focusTab="shipment"
				/>
			)}
		</div>
	)
}
