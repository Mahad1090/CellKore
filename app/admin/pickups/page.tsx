'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, RefreshCw, X, ExternalLink } from 'lucide-react'
import { PageTitle, StatusBadge, EmptyState, Modal, adminButton, adminButtonGhost } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import { PickupScheduleModal } from '@/components/admin/pickup-schedule-modal'

const CARRIER_LABELS: Record<string, string> = { ups: 'UPS', canada_post: 'Canada Post' }

export default function AdminPickupsPage() {
	const [pickups, setPickups] = useState<any[] | null>(null)
	const [carrierFilter, setCarrierFilter] = useState('all')
	const [statusFilter, setStatusFilter] = useState('all')
	const [scheduleOpen, setScheduleOpen] = useState(false)
	const [detail, setDetail] = useState<any | null>(null)
	const [busyId, setBusyId] = useState<string | null>(null)
	const [syncing, setSyncing] = useState(false)
	const { can } = useAdmin()
	const { toast } = useToast()

	const load = useCallback(() => {
		const params = new URLSearchParams()
		if (carrierFilter !== 'all') params.set('carrier', carrierFilter)
		if (statusFilter !== 'all') params.set('status', statusFilter)
		fetch(`/api/admin/pickups?${params.toString()}`)
			.then((res) => res.json())
			.then((json) => setPickups(json.pickups ?? []))
			.catch(() => setPickups([]))
	}, [carrierFilter, statusFilter])

	useEffect(load, [load])

	const writable = can('orders:write')

	const refreshOne = async (id: string) => {
		setBusyId(id)
		try {
			const res = await fetch(`/api/admin/pickups/${id}/refresh`, { method: 'POST' })
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Status refreshed', variant: 'success' })
			load()
		} catch (err) {
			toast({ title: 'Refresh failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setBusyId(null)
		}
	}

	const cancelOne = async (id: string) => {
		if (!confirm('Cancel this pickup with the carrier?')) return
		setBusyId(id)
		try {
			const res = await fetch(`/api/admin/pickups/${id}`, { method: 'DELETE' })
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Pickup cancelled', variant: 'success' })
			load()
		} catch (err) {
			toast({ title: 'Cancellation failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setBusyId(null)
		}
	}

	const syncFromCarrier = async () => {
		setSyncing(true)
		try {
			const res = await fetch('/api/admin/pickups/sync', { method: 'POST' })
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({
				title: `Synced — ${json.inserted} pickup${json.inserted === 1 ? '' : 's'} imported`,
				description: json.errors?.ups || json.errors?.canada_post ? 'One carrier failed to sync — see admin logs' : undefined,
				variant: 'success',
			})
			load()
		} catch (err) {
			toast({ title: 'Sync failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSyncing(false)
		}
	}

	return (
		<div className="space-y-6">
			<PageTitle
				title="Pickups"
				subtitle="Schedule and track UPS / Canada Post driver pickups from the warehouse"
				actions={
					writable ? (
						<>
							<button type="button" onClick={syncFromCarrier} disabled={syncing} className={adminButtonGhost}>
								{syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
								Sync from Carrier
							</button>
							<button type="button" onClick={() => setScheduleOpen(true)} className={adminButton}>
								Schedule Pickup
							</button>
						</>
					) : undefined
				}
			/>

			<div className="flex flex-wrap gap-3">
				<select value={carrierFilter} onChange={(e) => setCarrierFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-background text-xs">
					<option value="all">All Carriers</option>
					<option value="ups">UPS</option>
					<option value="canada_post">Canada Post</option>
				</select>
				<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-border bg-background text-xs">
					<option value="all">All Statuses</option>
					<option value="scheduled">Scheduled</option>
					<option value="completed">Completed</option>
					<option value="cancelled">Cancelled</option>
					<option value="missed">Missed</option>
					<option value="failed">Failed</option>
				</select>
			</div>

			{pickups === null ? (
				<TableShimmer />
			) : pickups.length === 0 ? (
				<EmptyState message="No pickups scheduled yet." />
			) : (
				<div className="bg-card border border-border rounded-3xl overflow-hidden">
					<table className="w-full text-sm">
						<thead className="bg-secondary/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
							<tr>
								<td className="px-5 py-3">Date</td>
								<td className="px-5 py-3">Carrier</td>
								<td className="px-5 py-3">Order</td>
								<td className="px-5 py-3">Pieces</td>
								<td className="px-5 py-3">Carrier ID</td>
								<td className="px-5 py-3">Status</td>
								<td className="px-5 py-3 text-right">Actions</td>
							</tr>
						</thead>
						<tbody className="divide-y divide-border">
							{pickups.map((p) => (
								<tr key={p.id} className="hover:bg-secondary/20 transition-colors">
									<td className="px-5 py-3 font-mono text-xs">{p.pickup_date}</td>
									<td className="px-5 py-3">{CARRIER_LABELS[p.carrier] ?? p.carrier}</td>
									<td className="px-5 py-3 text-xs text-muted-foreground">{p.orders?.reference ?? '—'}</td>
									<td className="px-5 py-3 text-xs">{p.piece_count}</td>
									<td className="px-5 py-3 font-mono text-xs">{p.carrier_request_id || '—'}</td>
									<td className="px-5 py-3">
										<StatusBadge value={p.status} />
									</td>
									<td className="px-5 py-3">
										<div className="flex items-center justify-end gap-2">
											<button type="button" onClick={() => setDetail(p)} className="text-xs font-semibold text-primary hover:underline cursor-pointer">
												View
											</button>
											{writable && p.status === 'scheduled' && (
												<>
													<button
														type="button"
														onClick={() => refreshOne(p.id)}
														disabled={busyId === p.id}
														className="text-xs font-semibold text-foreground/70 hover:text-foreground cursor-pointer disabled:opacity-50"
													>
														Refresh
													</button>
													<button
														type="button"
														onClick={() => cancelOne(p.id)}
														disabled={busyId === p.id}
														className="text-xs font-semibold text-destructive hover:underline cursor-pointer disabled:opacity-50"
													>
														Cancel
													</button>
												</>
											)}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			<PickupScheduleModal open={scheduleOpen} onClose={() => setScheduleOpen(false)} onScheduled={load} />

			<Modal open={!!detail} onClose={() => setDetail(null)} title="Pickup Details" wide>
				{detail && (
					<div className="space-y-3 text-sm">
						<div className="grid grid-cols-2 gap-3">
							<div>
								<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Carrier</p>
								<p>{CARRIER_LABELS[detail.carrier] ?? detail.carrier}</p>
							</div>
							<div>
								<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Status</p>
								<StatusBadge value={detail.status} />
							</div>
							<div>
								<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Carrier Request ID</p>
								<p className="font-mono text-xs">{detail.carrier_request_id || '—'}</p>
							</div>
							<div>
								<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Order</p>
								<p>{detail.orders?.reference ?? '—'}</p>
							</div>
							<div>
								<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Estimated Cost</p>
								<p>{detail.estimated_cost != null ? `${detail.estimated_cost} ${detail.currency ?? ''}` : '—'}</p>
							</div>
							<div>
								<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Special Instruction</p>
								<p>{detail.special_instruction || '—'}</p>
							</div>
						</div>
						<div>
							<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mb-1">Raw Carrier Response</p>
							<pre className="bg-secondary/40 rounded-xl p-3 text-[10px] overflow-x-auto max-h-64 overflow-y-auto">
								{JSON.stringify(detail.raw_create_response ?? {}, null, 2)}
							</pre>
						</div>
					</div>
				)}
			</Modal>
		</div>
	)
}
