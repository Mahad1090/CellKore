'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, Search, Loader2, ChevronDown } from 'lucide-react'
import { PageTitle, EmptyState, Modal, adminButton, adminInput } from '@/components/admin/ui'
import { SellStatusBadge, SellStatusTimeline } from '@/components/sell-status-timeline'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import type { SellPhoneRequest, SellPhoneStatus } from '@/lib/types'

const STATUSES: SellPhoneStatus[] = [
	'submitted',
	'approved',
	'offer_accepted',
	'shipment_submitted',
	'awaiting_package',
	'under_inspection',
	'quoted',
	'payment_confirmed',
	'rejected',
	'cancelled',
]

const STATUS_INFO: Record<SellPhoneStatus, string> = {
	submitted: 'New submission — review the details, then approve with an offer or reject it.',
	approved: 'Offer sent — waiting for the customer to accept or decline it.',
	offer_accepted: 'Customer accepted the offer — waiting for them to ship the device.',
	shipment_submitted: 'Customer says it\'s on the way. Mark it received once it arrives.',
	awaiting_package: 'Tracking confirmed — waiting for the physical package to arrive.',
	under_inspection: 'Device received. Inspect it, then approve payment or reject it.',
	quoted: 'Legacy status from the old flow — not used going forward.',
	payment_confirmed: 'Complete — payment has been sent to the customer.',
	rejected: 'Rejected.',
	cancelled: 'Cancelled.',
}

type ActionTone = 'primary' | 'danger' | 'neutral'

function nextActionsFor(current: SellPhoneStatus): { label: string; target: SellPhoneStatus; tone: ActionTone }[] {
	switch (current) {
		case 'submitted':
			return [
				{ label: 'Approve & Send Offer', target: 'approved', tone: 'primary' },
				{ label: 'Reject Request', target: 'rejected', tone: 'danger' },
			]
		case 'approved':
			return [
				{ label: 'Mark Offer Accepted', target: 'offer_accepted', tone: 'primary' },
				{ label: 'Cancel Request', target: 'cancelled', tone: 'neutral' },
			]
		case 'offer_accepted':
			return [
				{ label: 'Mark Shipment Submitted', target: 'shipment_submitted', tone: 'primary' },
				{ label: 'Cancel Request', target: 'cancelled', tone: 'neutral' },
			]
		case 'shipment_submitted':
			return [
				{ label: 'Mark Awaiting Package', target: 'awaiting_package', tone: 'primary' },
				{ label: 'Skip to Under Inspection', target: 'under_inspection', tone: 'neutral' },
			]
		case 'awaiting_package':
			return [{ label: 'Mark Under Inspection', target: 'under_inspection', tone: 'primary' }]
		case 'under_inspection':
			return [
				{ label: 'Approve & Confirm Payment', target: 'payment_confirmed', tone: 'primary' },
				{ label: 'Reject Device', target: 'rejected', tone: 'danger' },
			]
		default:
			return []
	}
}

const ACTION_BUTTON_CLASS: Record<ActionTone, string> = {
	primary: 'bg-primary text-primary-foreground hover:opacity-90',
	danger: 'border border-red-300 text-red-700 hover:bg-red-50',
	neutral: 'border border-border text-foreground/75 hover:border-primary hover:text-foreground',
}

const WORKFLOW_TABS = [
	{ href: '/admin/sell-requests', label: 'Sell Queue' },
	{ href: '/admin/repair-requests', label: 'Repair Queue' },
	{ href: '/admin/repair-workflow', label: 'Repair Workflow' },
	{ href: '/admin/repair-payments', label: 'Repair Payments' },
]

export default function AdminSellRequestsPage() {
	const { toast } = useToast()
	const { can } = useAdmin()
	const [requests, setRequests] = useState<SellPhoneRequest[] | null>(null)
	const [search, setSearch] = useState('')
	const [selected, setSelected] = useState<SellPhoneRequest | null>(null)
	const [offeredPrice, setOfferedPrice] = useState('')
	const [payoutAmount, setPayoutAmount] = useState('')
	const [payoutReference, setPayoutReference] = useState('')
	const [payoutNotes, setPayoutNotes] = useState('')
	const [paymentConfirmed, setPaymentConfirmed] = useState(false)
	const [status, setStatus] = useState<SellPhoneStatus>('submitted')
	const [rejectionReason, setRejectionReason] = useState('')
	const [note, setNote] = useState('')
	const [returnShippingFee, setReturnShippingFee] = useState('')
	const [labelCarrier, setLabelCarrier] = useState('')
	const [labelTracking, setLabelTracking] = useState('')
	const [labelUrl, setLabelUrl] = useState('')
	const [savingLabel, setSavingLabel] = useState(false)
	const [saving, setSaving] = useState(false)

	const load = useCallback(() => {
		fetch('/api/admin/sell-requests')
			.then((res) => res.json())
			.then((json) => setRequests(json.requests ?? []))
			.catch(() => setRequests([]))
	}, [])

	useEffect(load, [load])

	const openDetail = (request: SellPhoneRequest) => {
		setSelected(request)
		setOfferedPrice(request.offered_price != null ? String(request.offered_price) : '')
		setPayoutAmount(request.payout_amount != null ? String(request.payout_amount) : '')
		setPayoutReference(request.payout_reference ?? '')
		setPayoutNotes(request.payout_notes ?? '')
		setPaymentConfirmed(Boolean(request.payout_confirmed_at))
		setStatus(request.status)
		setRejectionReason(request.rejection_reason ?? '')
		setNote('')
		setReturnShippingFee(request.sell_phone_return_shipments?.fee_amount != null ? String(request.sell_phone_return_shipments.fee_amount) : '')
		setLabelCarrier(request.sell_phone_return_shipments?.carrier ?? '')
		setLabelTracking(request.sell_phone_return_shipments?.tracking_number ?? '')
		setLabelUrl(request.sell_phone_return_shipments?.label_url ?? '')
	}

	const showReturnFeeField =
		status === 'rejected' && (selected?.status === 'under_inspection' || Boolean(selected?.sell_phone_return_shipments))

	const save = async () => {
		if (!selected) return
		if (status === 'rejected' && !rejectionReason.trim()) {
			toast({ title: 'Rejection reason required', description: 'Tell the customer why the request was rejected.', variant: 'error' })
			return
		}
		setSaving(true)
		try {
			const res = await fetch(`/api/admin/sell-requests/${selected.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status,
					rejection_reason: status === 'rejected' ? rejectionReason.trim() : null,
					note: note.trim() || undefined,
					offered_price: offeredPrice === '' ? null : Number(offeredPrice),
					payout_amount: payoutAmount === '' ? null : Number(payoutAmount),
					payout_reference: payoutReference.trim() || null,
					payout_notes: payoutNotes.trim() || null,
					payout_confirmed_at: paymentConfirmed ? new Date().toISOString() : null,
					return_shipping_fee: showReturnFeeField && returnShippingFee !== '' ? Number(returnShippingFee) : undefined,
				}),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Request updated', variant: 'success' })
			setSelected(null)
			load()
		} catch (err) {
			toast({ title: 'Update failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSaving(false)
		}
	}

	const saveLabel = async () => {
		if (!selected) return
		if (!labelCarrier.trim() || !labelTracking.trim() || !labelUrl.trim()) {
			toast({ title: 'Missing details', description: 'Carrier, tracking number, and label URL are all required.', variant: 'error' })
			return
		}
		setSavingLabel(true)
		try {
			const res = await fetch(`/api/admin/sell-requests/${selected.id}/return-shipment`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ carrier: labelCarrier.trim(), tracking_number: labelTracking.trim(), label_url: labelUrl.trim() }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Return label saved', variant: 'success' })
			setSelected(null)
			load()
		} catch (err) {
			toast({ title: 'Could not save label', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSavingLabel(false)
		}
	}

	const filtered = (requests ?? []).filter(
		(r) =>
			!search.trim() ||
			`${r.device_brand} ${r.device_model} ${r.contact_email ?? ''} ${r.contact_phone ?? ''}`
				.toLowerCase()
				.includes(search.toLowerCase())
	)

	const writable = can('sell-requests:write')
	const label = 'text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block'

	return (
		<div>
			<PageTitle title="Sell Phone Requests" subtitle="Customer device quote queue" />

			<div className="mb-6 flex flex-wrap gap-2">
				{WORKFLOW_TABS.map((tab) => (
					<Link
						key={tab.href}
						href={tab.href}
						className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.14em] border transition-all ${
							tab.href === '/admin/sell-requests'
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
				<EmptyState message="No sell requests found." />
			) : (
				<div className="border border-border rounded-3xl overflow-hidden bg-card overflow-x-auto">
					<table className="w-full text-sm min-w-[720px]">
						<thead>
							<tr className="bg-secondary text-left">
								{['Device', 'Condition', 'Contact', 'Submitted', 'Offered Price', 'Status', ''].map((h) => (
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
									<td className="px-5 py-3.5 text-foreground/75 capitalize">{request.condition}</td>
									<td className="px-5 py-3.5 text-foreground/75 text-xs">
										{request.contact_email ?? request.contact_phone ?? '—'}
									</td>
									<td className="px-5 py-3.5 text-foreground/75 text-xs">
										{new Date(request.submitted_at).toLocaleDateString()}
									</td>
									<td className="px-5 py-3.5 font-semibold text-card-foreground">
										{request.offered_price != null ? `$${Number(request.offered_price).toFixed(2)}` : '—'}
									</td>
									<td className="px-5 py-3.5"><SellStatusBadge status={request.status} /></td>
									<td className="px-5 py-3.5">
										<button
											onClick={() => openDetail(request)}
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
				<Modal open onClose={() => setSelected(null)} title="Sell Request Details" wide>
					<div className="grid md:grid-cols-2 gap-8">
						<div className="space-y-5">
							<div>
								<p className={label}>Device</p>
								<p className="text-sm font-semibold text-card-foreground">
									{selected.device_brand} {selected.device_model}
								</p>
								<p className="text-xs text-muted-foreground capitalize mt-1">Condition: {selected.condition}</p>
							</div>
							{selected.description && (
								<div>
									<p className={label}>Details & Damage Notes</p>
									<p className="text-xs text-foreground/75 whitespace-pre-line leading-relaxed bg-secondary rounded-2xl p-4">
										{selected.description}
									</p>
								</div>
							)}
							<div>
								<p className={label}>Contact</p>
								<p className="text-xs text-foreground/85">{selected.contact_email ?? '—'}</p>
								<p className="text-xs text-foreground/85 mt-0.5">{selected.contact_phone ?? '—'}</p>
								{selected.contact_phone && (
									<a
										href={`https://wa.me/${selected.contact_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, this is CellKore regarding your sell request ${selected.id}.`)}`}
										target="_blank"
										rel="noreferrer"
										className="inline-block mt-2 text-[10px] font-bold uppercase tracking-[0.14em] text-primary hover:opacity-80"
									>
										Open WhatsApp Chat
									</a>
								)}
							</div>
							{(selected.shipping_courier || selected.shipping_tracking_number) && (
								<div>
									<p className={label}>Shipment Details (Inbound)</p>
									<p className="text-xs text-foreground/85">Courier: {selected.shipping_courier ?? '—'}</p>
									<p className="text-xs text-foreground/85 mt-0.5">Tracking #: {selected.shipping_tracking_number ?? '—'}</p>
								</div>
							)}
							{selected.sell_phone_return_shipments && (
								<div>
									<p className={label}>Return Shipment (Device Sent Back)</p>
									<div className="text-xs text-foreground/85 bg-secondary rounded-2xl p-4 space-y-1.5">
										<p>Fee: ${Number(selected.sell_phone_return_shipments.fee_amount).toFixed(2)}</p>
										<p>
											Payment:{' '}
											{selected.sell_phone_return_shipments.paid_at
												? `Paid via ${selected.sell_phone_return_shipments.payment_provider} on ${new Date(selected.sell_phone_return_shipments.paid_at).toLocaleDateString()}`
												: 'Awaiting customer payment'}
										</p>
										{selected.sell_phone_return_shipments.address_line1 && (
											<p>
												Ship to: {selected.sell_phone_return_shipments.address_line1}, {selected.sell_phone_return_shipments.city},{' '}
												{selected.sell_phone_return_shipments.country}
											</p>
										)}
										<p>
											Label:{' '}
											{selected.sell_phone_return_shipments.label_status === 'generated'
												? `${selected.sell_phone_return_shipments.carrier} · ${selected.sell_phone_return_shipments.tracking_number}`
												: 'Not yet generated'}
										</p>
										{selected.sell_phone_return_shipments.label_url && (
											<a href={selected.sell_phone_return_shipments.label_url} target="_blank" rel="noreferrer" className="text-primary font-semibold hover:underline">
												View Label
											</a>
										)}
									</div>
									{writable && selected.sell_phone_return_shipments.paid_at && selected.sell_phone_return_shipments.label_status !== 'generated' && (
										<div className="mt-3 rounded-2xl border border-border p-4 space-y-3">
											<p className="text-[10px] font-bold uppercase tracking-[0.14em] text-card-foreground">
												Attach Label Manually
											</p>
											<p className="text-[10.5px] text-muted-foreground -mt-1.5">
												No carrier API is connected yet — buy the label yourself and paste the details here.
											</p>
											<input value={labelCarrier} onChange={(e) => setLabelCarrier(e.target.value)} placeholder="Carrier (e.g. USPS)" className={adminInput} />
											<input value={labelTracking} onChange={(e) => setLabelTracking(e.target.value)} placeholder="Tracking number" className={adminInput} />
											<input value={labelUrl} onChange={(e) => setLabelUrl(e.target.value)} placeholder="Label URL (PDF link)" className={adminInput} />
											<button onClick={saveLabel} disabled={savingLabel} className={`${adminButton} w-full justify-center`}>
												{savingLabel && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
												Save Label
											</button>
										</div>
									)}
								</div>
							)}
							{(selected.sell_phone_images ?? []).length > 0 && (
								<div>
									<p className={label}>Submitted Photos</p>
									<div className="grid grid-cols-3 gap-2.5">
										{selected.sell_phone_images!.map((image) => (
											<a key={image.id} href={image.image_url} target="_blank" rel="noreferrer" className="block aspect-square rounded-xl overflow-hidden bg-muted border border-border hover:opacity-80 transition-opacity">
												<img src={image.image_url} alt="Device" className="w-full h-full object-cover" />
											</a>
										))}
									</div>
								</div>
							)}
							{(selected.sell_phone_status_history ?? []).length > 0 && (
								<div>
									<p className={label}>Case History</p>
									<div className="bg-secondary/50 rounded-2xl p-4">
										<SellStatusTimeline history={selected.sell_phone_status_history!} currentStatus={selected.status} />
									</div>
								</div>
							)}
						</div>

						<div className="space-y-5">
							<div>
								<label className={label}>Offered Price (USD)</label>
								<input
									type="number"
									step="0.01"
									value={offeredPrice}
									onChange={(e) => setOfferedPrice(e.target.value)}
									className={adminInput}
									placeholder="0.00"
									disabled={!writable}
								/>
							</div>
							<div>
								<label className={label}>Status</label>
								<div className="flex items-center gap-2 mb-3">
									<SellStatusBadge status={selected.status} />
									{status !== selected.status && (
										<span className="text-[10px] text-muted-foreground">
											→ changing to <span className="font-semibold capitalize">{status.replace(/_/g, ' ')}</span>
										</span>
									)}
								</div>
								<p className="text-xs text-foreground/75 mb-3">{STATUS_INFO[selected.status]}</p>

								{writable && nextActionsFor(selected.status).length > 0 && (
									<div className="flex flex-wrap gap-2 mb-3">
										{nextActionsFor(selected.status).map((action) => (
											<button
												key={action.target}
												type="button"
												onClick={() => setStatus(action.target)}
												className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.12em] transition-all cursor-pointer ${ACTION_BUTTON_CLASS[action.tone]} ${
													status === action.target ? 'ring-2 ring-offset-2 ring-offset-card ring-primary/50' : ''
												}`}
											>
												{action.label}
											</button>
										))}
									</div>
								)}

								<details className="group">
									<summary className="cursor-pointer text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground list-none flex items-center gap-1.5">
										<ChevronDown className="w-3 h-3 transition-transform group-open:rotate-180" />
										Advanced: Set Status Manually
									</summary>
									<select
										value={status}
										onChange={(e) => setStatus(e.target.value as SellPhoneStatus)}
										className={`${adminInput} cursor-pointer mt-2`}
										disabled={!writable}
									>
										{STATUSES.map((s) => (
											<option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
										))}
									</select>
									<p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
										For corrections or edge cases the buttons above don&apos;t cover. Offer accepted/rejected is normally set by the customer themselves.
									</p>
								</details>
							</div>
							{status === 'rejected' ? (
								<div className="space-y-4">
									<div>
										<label className={label}>Rejection Reason (shown to customer)</label>
										<textarea
											value={rejectionReason}
											onChange={(e) => setRejectionReason(e.target.value)}
											className={adminInput}
											disabled={!writable}
											rows={3}
											placeholder="e.g. Device arrived with undisclosed water damage"
										/>
									</div>
									{showReturnFeeField && (
										<div>
											<label className={label}>Return Shipping Fee (USD)</label>
											<input
												type="number"
												step="0.01"
												value={returnShippingFee}
												onChange={(e) => setReturnShippingFee(e.target.value)}
												className={adminInput}
												disabled={!writable}
												placeholder="0.00"
											/>
											<p className="text-[10px] text-muted-foreground mt-2 leading-relaxed">
												Device was already received — the customer will be asked to pay this to get it shipped back.
											</p>
										</div>
									)}
								</div>
							) : (
								<div>
									<label className={label}>Update Note (optional, shown on timeline)</label>
									<textarea
										value={note}
										onChange={(e) => setNote(e.target.value)}
										className={adminInput}
										disabled={!writable}
										rows={2}
										placeholder="Add context for this status change"
									/>
								</div>
							)}
							{status === 'payment_confirmed' && (
								<div className="rounded-2xl border border-border p-4 space-y-4">
									<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-card-foreground">Payment Confirmation</p>
									<p className="text-[10.5px] text-muted-foreground -mt-2">
										Fill this in once the device has been inspected, approved, and the transfer has been sent to the customer.
									</p>
									<div>
										<label className={label}>Transfer Amount (USD)</label>
										<input
											type="number"
											step="0.01"
											value={payoutAmount}
											onChange={(e) => setPayoutAmount(e.target.value)}
											className={adminInput}
											disabled={!writable}
											placeholder="0.00"
										/>
									</div>
									<div>
										<label className={label}>Transfer Reference</label>
										<input
											value={payoutReference}
											onChange={(e) => setPayoutReference(e.target.value)}
											className={adminInput}
											disabled={!writable}
											placeholder="Transaction ID / receipt code"
										/>
									</div>
									<div>
										<label className={label}>Receipt Notes</label>
										<textarea
											value={payoutNotes}
											onChange={(e) => setPayoutNotes(e.target.value)}
											className={adminInput}
											disabled={!writable}
											rows={3}
											placeholder="Bank / transfer confirmation details"
										/>
									</div>
									<label className="flex items-center gap-2 text-xs text-foreground/80">
										<input
											type="checkbox"
											checked={paymentConfirmed}
											onChange={(e) => setPaymentConfirmed(e.target.checked)}
											disabled={!writable}
											className="accent-[var(--primary)]"
										/>
										Payment transfer confirmed
									</label>
								</div>
							)}
							{writable && (
								<button onClick={save} disabled={saving} className={`${adminButton} w-full justify-center`}>
									{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
									Save Changes
								</button>
							)}
						</div>
					</div>
				</Modal>
			)}
		</div>
	)
}
