import type { SellPhoneStatus, SellPhoneStatusHistoryEntry } from '@/lib/types'

export const SELL_STATUS_META: Record<SellPhoneStatus, { label: string; badgeClass: string; dotClass: string }> = {
	submitted: { label: 'Under Review', badgeClass: 'bg-amber-100 text-amber-800', dotClass: 'bg-amber-400' },
	approved: { label: 'Offer Sent', badgeClass: 'bg-blue-100 text-blue-800', dotClass: 'bg-blue-400' },
	offer_accepted: { label: 'Offer Accepted', badgeClass: 'bg-teal-100 text-teal-800', dotClass: 'bg-teal-400' },
	shipment_submitted: { label: 'Shipment Submitted', badgeClass: 'bg-indigo-100 text-indigo-800', dotClass: 'bg-indigo-400' },
	awaiting_package: { label: 'Awaiting Package', badgeClass: 'bg-sky-100 text-sky-800', dotClass: 'bg-sky-400' },
	under_inspection: { label: 'Under Inspection', badgeClass: 'bg-orange-100 text-orange-800', dotClass: 'bg-orange-400' },
	quoted: { label: 'Quote Sent', badgeClass: 'bg-primary/10 text-primary', dotClass: 'bg-primary' },
	payment_confirmed: { label: 'Payment Confirmed', badgeClass: 'bg-emerald-100 text-emerald-800', dotClass: 'bg-emerald-500' },
	rejected: { label: 'Rejected', badgeClass: 'bg-red-100 text-red-800', dotClass: 'bg-red-500' },
	cancelled: { label: 'Cancelled', badgeClass: 'bg-secondary text-foreground/60', dotClass: 'bg-muted-foreground' },
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
		<div className="space-y-0">
			{history.map((entry, index) => {
				const meta = SELL_STATUS_META[entry.status] ?? SELL_STATUS_META.submitted
				const isCurrent = index === history.length - 1 && entry.status === currentStatus
				return (
					<div key={entry.id} className="relative pl-6 pb-5 last:pb-0">
						{index !== history.length - 1 && <span className="absolute left-[5px] top-3 bottom-0 w-px bg-border" />}
						<span className={`absolute left-0 top-1.5 w-2.5 h-2.5 rounded-full ${meta.dotClass} ${isCurrent ? 'ring-2 ring-offset-2 ring-offset-card ring-primary/40' : ''}`} />
						<div className="flex items-start justify-between gap-3 flex-wrap">
							<div className="flex items-center gap-2 flex-wrap">
								<span className={`inline-block px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-[0.1em] ${meta.badgeClass}`}>
									{meta.label}
								</span>
								{isCurrent && (
									<span className="inline-block px-2 py-0.5 rounded-full text-[9.5px] font-bold uppercase tracking-[0.1em] bg-primary text-primary-foreground">
										Current
									</span>
								)}
							</div>
							<span className="text-[10px] text-muted-foreground">{new Date(entry.created_at).toLocaleString()}</span>
						</div>
						<p className="text-[10.5px] text-muted-foreground mt-1">
							Updated by: <span className="font-semibold">{CHANGED_BY_LABEL[entry.changed_by] ?? entry.changed_by}</span>
						</p>
						{entry.note && <p className="text-xs text-foreground/75 italic mt-1">{entry.note}</p>}
					</div>
				)
			})}
		</div>
	)
}
