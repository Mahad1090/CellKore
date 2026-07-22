'use client'

import { useEffect, useState } from 'react'
import {
	Calendar,
	Check,
	Copy,
	DollarSign,
	Eye,
	FileText,
	History,
	ImageIcon,
	Loader2,
	Mail,
	MapPin,
	Phone,
	Plus,
	Receipt,
	ShieldCheck,
	Smartphone,
	Trash2,
	Truck,
	User,
} from 'lucide-react'
import { Modal, adminButton, adminInput } from '@/components/admin/ui'
import { RepairStatusBadge, RepairStatusTimeline } from '@/components/repair-status-timeline'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import type { RepairCurrency, RepairQuoteItem, RepairRequest, RepairStatus } from '@/lib/types'
import { formatRequestId } from '@/lib/sell-request-contact'
import { formatMoney } from '@/lib/format'

const CURRENCIES: RepairCurrency[] = ['USD', 'CAD']

type ModalTab = 'overview' | 'quote' | 'shipment' | 'timeline'

type ActionTone = 'primary' | 'danger' | 'neutral'

function nextActionsFor(status: RepairStatus): { label: string; target: RepairStatus; tone: ActionTone }[] {
	switch (status) {
		case 'device_shipped':
			return [{ label: 'Mark Device Received', target: 'device_received', tone: 'primary' }]
		case 'device_received':
			return [{ label: 'Start Repair', target: 'in_repair', tone: 'primary' }]
		case 'in_repair':
			return [{ label: 'Mark Repaired', target: 'repaired', tone: 'primary' }]
		case 'shipped_back':
			return [{ label: 'Mark Completed', target: 'completed', tone: 'primary' }]
		default:
			return []
	}
}

const ACTION_BUTTON_CLASS: Record<ActionTone, string> = {
	primary: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold',
	danger: 'bg-rose-600 hover:bg-rose-700 text-white font-bold',
	neutral: 'bg-slate-700 hover:bg-slate-800 text-white font-bold',
}

export function RepairRequestModal({
	request,
	onClose,
	onSaved,
	focusTab = 'overview',
}: {
	request: RepairRequest
	onClose: () => void
	onSaved: () => void
	focusTab?: ModalTab
}) {
	const { toast } = useToast()
	const { can } = useAdmin()
	const writable = can('repair-requests:write')
	const [modalTab, setModalTab] = useState<ModalTab>(focusTab)
	const [copiedId, setCopiedId] = useState(false)
	const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

	const [quoteItems, setQuoteItems] = useState<RepairQuoteItem[]>(request.quote_items ?? [{ label: '', amount: 0 }])
	const [quoteCurrency, setQuoteCurrency] = useState<RepairCurrency>(request.quote_currency ?? 'USD')
	const [quoteNotes, setQuoteNotes] = useState(request.quote_notes ?? '')
	const [rejectionReason, setRejectionReason] = useState(request.rejection_reason ?? '')
	const [note, setNote] = useState('')
	const [saving, setSaving] = useState(false)

	const [outboundCarrier, setOutboundCarrier] = useState(request.outbound_carrier ?? '')
	const [outboundTracking, setOutboundTracking] = useState(request.outbound_tracking_number ?? '')
	const [outboundLabelUrl, setOutboundLabelUrl] = useState(request.outbound_label_url ?? '')
	const [savingOutbound, setSavingOutbound] = useState(false)

	useEffect(() => setModalTab(focusTab), [focusTab, request.id])

	const handleCopyId = () => {
		const formatted = formatRequestId(request.id)
		navigator.clipboard.writeText(formatted)
		setCopiedId(true)
		toast({ title: 'Request ID copied', description: formatted, variant: 'success' })
		setTimeout(() => setCopiedId(false), 2000)
	}

	const patch = async (body: Record<string, unknown>) => {
		setSaving(true)
		try {
			const res = await fetch(`/api/admin/repair-requests/${request.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Request updated', variant: 'success' })
			onSaved()
			onClose()
		} catch (err) {
			toast({ title: 'Update failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSaving(false)
		}
	}

	const sendQuote = async () => {
		const cleanItems = quoteItems.filter((i) => i.label.trim() && Number(i.amount) > 0)
		if (cleanItems.length === 0) {
			toast({ title: 'Add at least one charge line', variant: 'error' })
			return
		}
		await patch({ status: 'quote_sent', quote_items: cleanItems, quote_currency: quoteCurrency, quote_notes: quoteNotes.trim() || undefined })
	}

	const rejectRequest = async () => {
		if (!rejectionReason.trim()) {
			toast({ title: 'Rejection reason required', variant: 'error' })
			return
		}
		await patch({ status: 'rejected', rejection_reason: rejectionReason.trim() })
	}

	const advanceStatus = async (target: RepairStatus) => {
		await patch({ status: target, note: note.trim() || undefined })
	}

	const saveOutboundShipment = async () => {
		if (!outboundCarrier.trim() || !outboundTracking.trim() || !outboundLabelUrl.trim()) {
			toast({ title: 'Missing details', description: 'Carrier, tracking number, and label URL are all required.', variant: 'error' })
			return
		}
		setSavingOutbound(true)
		try {
			const res = await fetch(`/api/admin/repair-requests/${request.id}/outbound-shipment`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ carrier: outboundCarrier.trim(), tracking_number: outboundTracking.trim(), label_url: outboundLabelUrl.trim() }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Outbound shipment saved', variant: 'success' })
			onSaved()
			onClose()
		} catch (err) {
			toast({ title: 'Could not save shipment', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSavingOutbound(false)
		}
	}

	const actions = nextActionsFor(request.status)

	return (
		<Modal open onClose={onClose} title="Repair Request Management" extraWide>
			<div className="space-y-5 font-sans">
				{/* Header Summary Bar */}
				<div className="flex flex-wrap items-center justify-between gap-4 p-4.5 rounded-2xl bg-card border border-border/80 shadow-sm">
					<div className="flex items-center gap-3.5">
						<div className="w-11 h-11 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold shadow-sm">
							<Smartphone className="w-5 h-5" />
						</div>
						<div>
							<div className="flex items-center gap-2">
								<span className="text-base font-extrabold tracking-tight text-foreground">
									{request.device_brand} {request.device_model}
								</span>
								<button
									type="button"
									onClick={handleCopyId}
									className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-mono font-bold text-primary hover:bg-primary/20 transition-all cursor-pointer"
								>
									{copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
									{formatRequestId(request.id)}
								</button>
							</div>
							<div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 font-medium">
								<span className="flex items-center gap-1.5">
									<Calendar className="w-3.5 h-3.5" />
									Submitted {new Date(request.created_at).toLocaleDateString()}
								</span>
								<span>·</span>
								<span className="font-semibold text-foreground/80">{request.user_id ? 'Registered Account' : 'Guest Submission'}</span>
							</div>
						</div>
					</div>
					<RepairStatusBadge status={request.status} />
				</div>

				{/* Sub-Tabs */}
				<div className="border-b border-border/80 flex items-center gap-6 overflow-x-auto no-scrollbar">
					{[
						{ id: 'overview' as const, label: 'Device & Contact', icon: Smartphone, color: 'text-emerald-600' },
						{ id: 'quote' as const, label: 'Quote Builder', icon: Receipt, color: 'text-amber-600' },
						{ id: 'shipment' as const, label: 'Outbound Shipment', icon: Truck, color: 'text-sky-600' },
						{ id: 'timeline' as const, label: 'Case Timeline', icon: History, color: 'text-indigo-600' },
					].map((tab) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => setModalTab(tab.id)}
							className={`flex items-center gap-2 py-3 px-1 text-xs font-extrabold uppercase tracking-[0.14em] cursor-pointer transition-all border-b-2 -mb-px whitespace-nowrap ${
								modalTab === tab.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
							}`}
						>
							<tab.icon className={`w-4 h-4 ${tab.color}`} />
							{tab.label}
						</button>
					))}
				</div>

				<div className="grid lg:grid-cols-12 gap-5">
					{/* Left Column */}
					<div className="lg:col-span-5 space-y-5">
						{modalTab === 'overview' && (
							<div className="space-y-5">
								<div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-4">
									<div className="flex items-center justify-between border-b border-border/70 pb-3">
										<div className="flex items-center gap-2">
											<Smartphone className="w-4 h-4 text-emerald-600" />
											<h4 className="text-xs font-extrabold uppercase tracking-[0.18em] text-foreground/90">DEVICE OVERVIEW</h4>
										</div>
										<span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30">
											{request.device_category === 'other' ? request.device_category_other : request.device_category}
										</span>
									</div>
									<div className="grid gap-2 text-xs text-foreground">
										<p><span className="text-muted-foreground">Serial/IMEI:</span> <span className="font-mono font-semibold">{request.serial_number ?? '—'}</span></p>
										<p><span className="text-muted-foreground">Service Method:</span> <span className="font-semibold">{request.service_method === 'mail_in' ? 'Mail-in' : 'Store Drop-off'}</span></p>
									</div>
									<div className="rounded-xl bg-muted/50 border border-border/70 p-4 space-y-2">
										<p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
											<FileText className="w-3.5 h-3.5" /> ISSUES REPORTED
										</p>
										<p className="text-xs text-foreground/90 leading-relaxed">
											{(request.issues ?? []).join(', ') || '—'}
										</p>
										{request.description && (
											<p className="text-xs text-foreground/80 whitespace-pre-line pt-2 border-t border-border/60">{request.description}</p>
										)}
									</div>
									<div className="rounded-xl bg-muted/50 border border-border/70 p-4 space-y-3">
										<div className="flex items-center justify-between border-b border-border/60 pb-2">
											<div className="flex items-center gap-1.5 text-foreground font-extrabold text-xs">
												<ImageIcon className="w-4 h-4 text-purple-600" />
												<span className="uppercase tracking-wider">DAMAGE PHOTOS</span>
											</div>
											<span className="text-[10px] font-extrabold uppercase text-purple-700 dark:text-purple-300">
												{(request.repair_images ?? []).length} ATTACHED
											</span>
										</div>
										{(request.repair_images ?? []).length === 0 ? (
											<p className="text-xs text-muted-foreground py-3 text-center">No photos attached.</p>
										) : (
											<div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
												{request.repair_images!.map((image, idx) => (
													<button
														key={image.id}
														type="button"
														onClick={() => setPreviewImageUrl(image.image_url)}
														className="group relative aspect-square rounded-xl overflow-hidden bg-background border border-border/80 hover:ring-2 hover:ring-emerald-500 transition-all"
													>
														<img src={image.image_url} alt={`Device photo ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" />
														<div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
															<Eye className="w-4 h-4 text-white" />
														</div>
													</button>
												))}
											</div>
										)}
									</div>
								</div>

								<div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-4">
									<div className="flex items-center gap-2 border-b border-border/70 pb-3">
										<User className="w-4 h-4 text-sky-600" />
										<h4 className="text-xs font-extrabold uppercase tracking-[0.18em] text-foreground/90">CUSTOMER & ADDRESS</h4>
									</div>
									<div className="grid gap-3 text-xs text-foreground">
										<div className="flex items-center gap-3 bg-muted/50 border border-border/70 p-3 rounded-xl">
											<User className="w-4 h-4 text-sky-600 shrink-0" />
											<span className="font-semibold">{request.contact_name ?? '—'}</span>
										</div>
										{request.contact_email && (
											<div className="flex items-center gap-3 bg-muted/50 border border-border/70 p-3 rounded-xl">
												<Mail className="w-4 h-4 text-sky-600 shrink-0" />
												<a href={`mailto:${request.contact_email}`} className="font-semibold hover:text-primary hover:underline">{request.contact_email}</a>
											</div>
										)}
										{request.contact_phone && (
											<div className="flex items-center gap-3 bg-muted/50 border border-border/70 p-3 rounded-xl">
												<Phone className="w-4 h-4 text-sky-600 shrink-0" />
												<span className="font-mono font-extrabold tracking-wide">{request.contact_phone}</span>
											</div>
										)}
										<div className="flex items-start gap-3 bg-muted/50 border border-border/70 p-3 rounded-xl">
											<MapPin className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
											<span className="leading-relaxed">
												{request.address_line1}{request.address_line2 ? `, ${request.address_line2}` : ''}<br />
												{request.city}{request.state_province ? `, ${request.state_province}` : ''} {request.postal_code}<br />
												{request.country}
											</span>
										</div>
									</div>
								</div>
							</div>
						)}

						{modalTab === 'quote' && (
							<div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-4">
								<div className="flex items-center justify-between border-b border-border/70 pb-3">
									<div className="flex items-center gap-2">
										<Receipt className="w-4 h-4 text-amber-600" />
										<h4 className="text-xs font-extrabold uppercase tracking-[0.18em] text-foreground/90">REPAIR CHARGES QUOTE</h4>
									</div>
									{request.quote_total != null && (
										<span className="text-[10.5px] font-extrabold font-mono uppercase text-amber-700 dark:text-amber-300">
											{formatMoney(Number(request.quote_total), request.quote_currency)}
										</span>
									)}
								</div>

								{request.status === 'submitted' ? (
									<>
										<div className="flex items-center gap-2">
											<span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">Currency</span>
											<div className="flex rounded-full border border-border overflow-hidden">
												{CURRENCIES.map((c) => (
													<button
														key={c}
														type="button"
														onClick={() => setQuoteCurrency(c)}
														disabled={!writable}
														className={`px-3.5 py-1.5 text-[10.5px] font-extrabold uppercase tracking-wider cursor-pointer transition-all disabled:cursor-not-allowed ${
															quoteCurrency === c ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground/70 hover:bg-muted'
														}`}
													>
														{c}
													</button>
												))}
											</div>
										</div>
										<div className="space-y-2.5">
											{quoteItems.map((item, i) => (
												<div key={i} className="flex items-center gap-2">
													<input
														placeholder="e.g. Battery Replacement"
														value={item.label}
														onChange={(e) => setQuoteItems((items) => items.map((it, idx) => idx === i ? { ...it, label: e.target.value } : it))}
														className={`${adminInput.replace('w-full', 'flex-1 min-w-0')}`}
														disabled={!writable}
													/>
													<input
														type="number"
														step="0.01"
														placeholder="0.00"
														value={item.amount || ''}
														onChange={(e) => setQuoteItems((items) => items.map((it, idx) => idx === i ? { ...it, amount: Number(e.target.value) } : it))}
														className={`${adminInput.replace('w-full', 'w-28 shrink-0')} font-mono`}
														disabled={!writable}
													/>
													<button
														type="button"
														onClick={() => setQuoteItems((items) => items.filter((_, idx) => idx !== i))}
														className="p-2 text-muted-foreground hover:text-destructive cursor-pointer"
														aria-label="Remove line"
													>
														<Trash2 className="w-4 h-4" />
													</button>
												</div>
											))}
											{writable && (
												<button
													type="button"
													onClick={() => setQuoteItems((items) => [...items, { label: '', amount: 0 }])}
													className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
												>
													<Plus className="w-3.5 h-3.5" /> Add line item
												</button>
											)}
										</div>
										<textarea
											value={quoteNotes}
											onChange={(e) => setQuoteNotes(e.target.value)}
											placeholder="Quote notes (optional, shown to customer)"
											rows={2}
											className={`${adminInput} resize-none`}
											disabled={!writable}
										/>
										{writable && (
											<button onClick={sendQuote} disabled={saving} className={`${adminButton} w-full justify-center`}>
												{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
												Send Quote to Customer
											</button>
										)}
									</>
								) : (
									<div className="space-y-2">
										{(request.quote_items ?? []).map((item, i) => (
											<div key={i} className="flex items-center justify-between text-xs bg-muted/50 border border-border/70 p-3 rounded-xl">
												<span className="font-semibold text-foreground">{item.label}</span>
												<span className="font-mono font-bold">{formatMoney(Number(item.amount), request.quote_currency)}</span>
											</div>
										))}
										{request.quote_notes && <p className="text-xs text-muted-foreground italic pt-1">{request.quote_notes}</p>}
										{request.selected_shipping_option && (
											<div className="flex items-center justify-between text-xs bg-sky-500/5 border border-sky-500/30 p-3 rounded-xl">
												<span className="font-semibold text-foreground">Shipping: {request.selected_shipping_option.label}</span>
												<span className="font-mono font-bold">{formatMoney(Number(request.shipping_cost ?? 0), request.quote_currency)}</span>
											</div>
										)}
										{request.grand_total != null && (
											<div className="flex items-center justify-between text-sm font-extrabold pt-2 border-t border-border/60">
												<span>Grand Total</span>
												<span className="font-mono">{formatMoney(Number(request.grand_total), request.quote_currency)}</span>
											</div>
										)}
										{request.paid_at && (
											<p className="text-xs text-emerald-700 dark:text-emerald-300 font-bold flex items-center gap-1.5 pt-2">
												<ShieldCheck className="w-3.5 h-3.5" /> Paid via {request.payment_provider} on {new Date(request.paid_at).toLocaleDateString()}
											</p>
										)}
									</div>
								)}
							</div>
						)}

						{modalTab === 'shipment' && (
							<div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-3.5">
								<div className="flex items-center justify-between border-b border-border/70 pb-3">
									<div className="flex items-center gap-2">
										<Truck className="w-4 h-4 text-sky-600" />
										<h4 className="text-xs font-extrabold uppercase tracking-[0.18em] text-foreground/90">INBOUND SHIPMENT</h4>
									</div>
									<span className="text-[10.5px] font-extrabold uppercase text-sky-700 dark:text-sky-300">
										{request.inbound_carrier ?? 'NOT SHIPPED YET'}
									</span>
								</div>
								<div className="grid sm:grid-cols-2 gap-3 text-xs">
									<div className="bg-muted/50 border border-border/70 p-3 rounded-xl">
										<span className="text-muted-foreground text-[10px] uppercase font-extrabold block">Courier</span>
										<span className="font-extrabold text-foreground">{request.inbound_carrier ?? '—'}</span>
									</div>
									<div className="bg-muted/50 border border-border/70 p-3 rounded-xl">
										<span className="text-muted-foreground text-[10px] uppercase font-extrabold block">Tracking #</span>
										<span className="font-mono font-extrabold text-foreground">{request.inbound_tracking_number ?? '—'}</span>
									</div>
								</div>

								<div className="pt-3 border-t border-border/70 space-y-2.5">
									<p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-foreground">OUTBOUND SHIPMENT (SHIP BACK TO CUSTOMER)</p>
									{request.outbound_label_status === 'generated' ? (
										<div className="text-xs space-y-1.5">
											<p><span className="text-muted-foreground">Carrier:</span> <span className="font-semibold">{request.outbound_carrier}</span></p>
											<p><span className="text-muted-foreground">Tracking #:</span> <span className="font-mono font-bold">{request.outbound_tracking_number}</span></p>
											{request.outbound_label_url && (
												<a href={request.outbound_label_url} target="_blank" rel="noreferrer" className="text-primary font-semibold hover:underline inline-block">View Label</a>
											)}
										</div>
									) : (
										<>
											<input value={outboundCarrier} onChange={(e) => setOutboundCarrier(e.target.value)} placeholder="Carrier (e.g. USPS)" className={adminInput} disabled={!writable} />
											<input value={outboundTracking} onChange={(e) => setOutboundTracking(e.target.value)} placeholder="Tracking number" className={adminInput} disabled={!writable} />
											<input value={outboundLabelUrl} onChange={(e) => setOutboundLabelUrl(e.target.value)} placeholder="Label URL (PDF link)" className={adminInput} disabled={!writable} />
											{writable && (
												<button onClick={saveOutboundShipment} disabled={savingOutbound} className={`${adminButton} w-full justify-center mt-2`}>
													{savingOutbound && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
													Save & Mark Shipped Back
												</button>
											)}
										</>
									)}
								</div>
							</div>
						)}

						{modalTab === 'timeline' && (
							<div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-3.5">
								<div className="flex items-center justify-between border-b border-border/70 pb-3">
									<div className="flex items-center gap-2">
										<History className="w-4 h-4 text-indigo-600" />
										<h4 className="text-xs font-extrabold uppercase tracking-[0.18em] text-foreground/90">CASE TIMELINE</h4>
									</div>
									<span className="text-[10.5px] font-extrabold uppercase text-indigo-700 dark:text-indigo-300">
										{(request.repair_status_history ?? []).length} LOGGED
									</span>
								</div>
								{(request.repair_status_history ?? []).length === 0 ? (
									<p className="text-xs text-muted-foreground py-6 text-center">No history recorded yet.</p>
								) : (
									<RepairStatusTimeline history={request.repair_status_history!} currentStatus={request.status} />
								)}
							</div>
						)}
					</div>

					{/* Right Column: Status & Workflow Action */}
					<div className="lg:col-span-7">
						<div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-4 sticky top-4">
							<div className="flex items-center justify-between border-b border-border/70 pb-3">
								<div className="flex items-center gap-2">
									<ShieldCheck className="w-4 h-4 text-indigo-600" />
									<h4 className="text-xs font-extrabold uppercase tracking-[0.18em] text-foreground/90">STATUS & WORKFLOW ACTION</h4>
								</div>
								<RepairStatusBadge status={request.status} />
							</div>

							{writable && actions.length > 0 && (
								<div className="space-y-2.5">
									<p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">RECOMMENDED ACTIONS</p>
									<textarea
										value={note}
										onChange={(e) => setNote(e.target.value)}
										placeholder="Optional note for this update..."
										rows={2}
										className={`${adminInput} resize-none mb-1`}
									/>
									<div className="flex flex-wrap gap-2.5">
										{actions.map((action) => (
											<button
												key={action.target}
												type="button"
												onClick={() => advanceStatus(action.target)}
												disabled={saving}
												className={`px-5 py-2.5 rounded-full text-[11px] font-extrabold uppercase tracking-[0.14em] transition-all cursor-pointer disabled:opacity-60 ${ACTION_BUTTON_CLASS[action.tone]}`}
											>
												{action.label}
											</button>
										))}
									</div>
								</div>
							)}

							{writable && request.status === 'submitted' && (
								<div className="pt-3 border-t border-rose-500/20 space-y-3">
									<label className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground mb-1 block">
										REJECT THIS REQUEST (SHOWN TO CUSTOMER)
									</label>
									<textarea
										value={rejectionReason}
										onChange={(e) => setRejectionReason(e.target.value)}
										className={adminInput}
										rows={2}
										placeholder="e.g. This device model is not supported for repair"
									/>
									<button onClick={rejectRequest} disabled={saving} className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-extrabold uppercase tracking-[0.14em] transition-all cursor-pointer disabled:opacity-60">
										Reject Request
									</button>
								</div>
							)}

							{!writable && actions.length === 0 && request.status === 'submitted' && (
								<p className="text-xs text-muted-foreground">Switch to Quote Builder to send charges, or view-only access applies.</p>
							)}

							{['quote_sent', 'quote_accepted', 'payment_confirmed', 'awaiting_device', 'device_shipped'].includes(request.status) && actions.length === 0 && (
								<p className="text-xs text-muted-foreground pt-2">
									{request.status === 'quote_sent' && 'Waiting for the customer to accept or decline the quote.'}
									{request.status === 'quote_accepted' && 'Waiting for the customer to pay.'}
									{(request.status === 'payment_confirmed' || request.status === 'awaiting_device') && 'Waiting for the customer to ship their device.'}
								</p>
							)}
						</div>
					</div>
				</div>
			</div>

			{previewImageUrl && (
				<Modal open={!!previewImageUrl} onClose={() => setPreviewImageUrl(null)} title="DEVICE PHOTO PREVIEW">
					<div className="flex flex-col items-center justify-center p-2 space-y-4">
						<div className="relative max-h-[72vh] w-full overflow-hidden rounded-2xl border border-border shadow-xl bg-slate-950 flex items-center justify-center p-2">
							<img src={previewImageUrl} alt="Full device preview" className="max-h-[70vh] w-auto object-contain rounded-xl shadow-md" />
						</div>
						<div className="flex items-center justify-end w-full pt-1">
							<button
								type="button"
								onClick={() => setPreviewImageUrl(null)}
								className="px-6 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold uppercase tracking-[0.14em] transition-all cursor-pointer shadow-sm"
							>
								Close Photo Preview
							</button>
						</div>
					</div>
				</Modal>
			)}
		</Modal>
	)
}
