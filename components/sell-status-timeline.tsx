import type { SellPhoneStatus, SellPhoneStatusHistoryEntry } from '@/lib/types'

export const SELL_STATUS_META: Record<SellPhoneStatus, { label: string; badgeClass: string; dotClass: string }> = {
	submitted: { label: 'Under Review', badgeClass: 'bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-500/30', dotClass: 'bg-amber-500' },
	approved: { label: 'Offer Sent', badgeClass: 'bg-blue-500/10 text-blue-800 dark:text-blue-300 border border-blue-500/30', dotClass: 'bg-blue-500' },
	offer_accepted: { label: 'Offer Accepted', badgeClass: 'bg-teal-500/10 text-teal-800 dark:text-teal-300 border border-teal-500/30', dotClass: 'bg-teal-500' },
	shipment_submitted: { label: 'Shipment Submitted', badgeClass: 'bg-indigo-500/10 text-indigo-800 dark:text-indigo-300 border border-indigo-500/30', dotClass: 'bg-indigo-500' },
	awaiting_package: { label: 'Awaiting Package', badgeClass: 'bg-sky-500/10 text-sky-800 dark:text-sky-300 border border-sky-500/30', dotClass: 'bg-sky-500' },
	under_inspection: { label: 'Under Inspection', badgeClass: 'bg-orange-500/10 text-orange-800 dark:text-orange-300 border border-orange-500/30', dotClass: 'bg-orange-500' },
	quoted: { label: 'Quote Sent', badgeClass: 'bg-primary/10 text-primary border border-primary/30', dotClass: 'bg-primary' },
	payment_confirmed: { label: 'Payment Confirmed', badgeClass: 'bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30', dotClass: 'bg-emerald-500' },
	rejected: { label: 'Rejected', badgeClass: 'bg-rose-500/10 text-rose-800 dark:text-rose-300 border border-rose-500/30', dotClass: 'bg-rose-500' },
	cancelled: { label: 'Cancelled', badgeClass: 'bg-muted text-muted-foreground border border-border', dotClass: 'bg-muted-foreground' },
}

const CHANGED_BY_LABEL: Record<string, string> = {
	customer: 'Customer',
	admin: 'CellKore Team',
	system: 'System',
}

export function SellStatusBadge({ status }: { status: SellPhoneStatus }) {
	const meta = SELL_STATUS_META[status]
	return (
		<span className={`inline-flex items-center justify-center text-center whitespace-nowrap shrink-0 px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-[0.12em] ${meta.badgeClass}`}>
			{meta.label}
		</span>
	)
}

export function SellStatusTimeline({ history, currentStatus }: { history: SellPhoneStatusHistoryEntry[]; currentStatus: SellPhoneStatus }) {
	if (history.length === 0) return null
	return (
		<div className="space-y-3.5 relative before:absolute before:left-3 before:top-4 before:bottom-4 before:w-0.5 before:bg-border/60">
			{history.map((entry, index) => {
				const meta = SELL_STATUS_META[entry.status] ?? SELL_STATUS_META.submitted
				const isCurrent = index === history.length - 1 && entry.status === currentStatus
				return (
					<div key={entry.id} className="relative pl-8">
						{/* Bullet Node */}
						<span className={`absolute left-[7px] top-4 -translate-x-1/2 w-3.5 h-3.5 rounded-full border-2 border-background ${meta.dotClass} ${isCurrent ? 'ring-4 ring-emerald-500/20' : ''}`} />

						{/* Individual White Card Container */}
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
