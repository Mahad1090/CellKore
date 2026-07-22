import type { RepairStatus, RepairStatusHistoryEntry } from '@/lib/types'

export const REPAIR_STATUS_META: Record<RepairStatus, { label: string; badgeClass: string; dotClass: string }> = {
	submitted: { label: 'Under Review', badgeClass: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30', dotClass: 'bg-amber-500' },
	quote_sent: { label: 'Quote Sent', badgeClass: 'bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-500/30', dotClass: 'bg-blue-500' },
	quote_accepted: { label: 'Quote Accepted', badgeClass: 'bg-teal-500/10 text-teal-800 dark:text-teal-300 border border-teal-500/30', dotClass: 'bg-teal-500' },
	payment_confirmed: { label: 'Payment Confirmed', badgeClass: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30', dotClass: 'bg-emerald-500' },
	awaiting_device: { label: 'Awaiting Your Device', badgeClass: 'bg-sky-500/10 text-sky-800 dark:text-sky-300 border border-sky-500/30', dotClass: 'bg-sky-500' },
	device_shipped: { label: 'Device Shipped', badgeClass: 'bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30', dotClass: 'bg-indigo-500' },
	device_received: { label: 'Device Received', badgeClass: 'bg-violet-500/10 text-violet-800 dark:text-violet-300 border border-violet-500/30', dotClass: 'bg-violet-500' },
	in_repair: { label: 'In Repair', badgeClass: 'bg-orange-500/10 text-orange-800 dark:text-orange-300 border border-orange-500/30', dotClass: 'bg-orange-500' },
	repaired: { label: 'Repaired', badgeClass: 'bg-primary/10 text-primary border border-primary/30', dotClass: 'bg-primary' },
	shipped_back: { label: 'Shipped Back', badgeClass: 'bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30', dotClass: 'bg-indigo-500' },
	completed: { label: 'Completed', badgeClass: 'bg-emerald-600/10 text-emerald-800 dark:text-emerald-300 border border-emerald-600/30', dotClass: 'bg-emerald-600' },
	rejected: { label: 'Rejected', badgeClass: 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/30', dotClass: 'bg-rose-500' },
	cancelled: { label: 'Cancelled', badgeClass: 'bg-muted text-muted-foreground border border-border', dotClass: 'bg-muted-foreground' },
}

const CHANGED_BY_LABEL: Record<string, string> = {
	customer: 'Customer',
	admin: 'CellKore Team',
	system: 'System',
}

export function RepairStatusBadge({ status }: { status: RepairStatus }) {
	const meta = REPAIR_STATUS_META[status]
	return (
		<span className={`inline-flex items-center justify-center text-center whitespace-nowrap shrink-0 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-[0.12em] ${meta.badgeClass}`}>
			{meta.label}
		</span>
	)
}

export function RepairStatusTimeline({ history, currentStatus }: { history: RepairStatusHistoryEntry[]; currentStatus: RepairStatus }) {
	if (history.length === 0) return null
	return (
		<div className="space-y-3.5 relative before:absolute before:left-3 before:top-4 before:bottom-4 before:w-0.5 before:bg-border/60">
			{history.map((entry, index) => {
				const meta = REPAIR_STATUS_META[entry.status] ?? REPAIR_STATUS_META.submitted
				const isCurrent = index === history.length - 1 && entry.status === currentStatus
				return (
					<div key={entry.id} className="relative pl-8">
						<span className={`absolute left-[7px] top-4 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-background ${meta.dotClass} ${isCurrent ? 'ring-4 ring-emerald-500/20' : ''}`} />
						<div className={`p-4 rounded-2xl bg-card border shadow-sm transition-all space-y-2.5 ${
							isCurrent ? 'border-emerald-500/40 ring-1 ring-emerald-500/20' : 'border-border/80'
						}`}>
							<div className="flex items-center justify-between gap-3 flex-wrap">
								<div className="flex items-center gap-2 flex-wrap">
									<span className={`inline-flex items-center justify-center text-center whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-[0.12em] ${meta.badgeClass}`}>
										{meta.label}
									</span>
									{isCurrent && (
										<span className="inline-flex items-center justify-center text-center whitespace-nowrap px-2.5 py-0.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-[0.12em] bg-emerald-600 text-white shadow-xs">
											Current Status
										</span>
									)}
								</div>
								<span className="text-[11px] font-mono text-muted-foreground font-medium">
									{new Date(entry.created_at).toLocaleDateString()} at {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
								</span>
							</div>

							<div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/50">
								<span className="font-semibold text-foreground/80">
									Updated by: <span className="text-foreground font-extrabold">{CHANGED_BY_LABEL[entry.changed_by] ?? entry.changed_by}</span>
								</span>
							</div>

							{entry.note && (
								<div className="p-3 rounded-xl bg-muted/50 border border-border/60 text-xs text-foreground/90 font-medium leading-relaxed">
									{entry.note}
								</div>
							)}
						</div>
					</div>
				)
			})}
		</div>
	)
}
