'use client'

import { useCallback, useEffect, useState } from 'react'
import {
	Eye,
	Search,
	Loader2,
	ChevronDown,
	Smartphone,
	User,
	Mail,
	Phone,
	MessageCircle,
	Truck,
	Copy,
	Check,
	DollarSign,
	Calendar,
	History,
	ImageIcon,
	ExternalLink,
	ShieldCheck,
	FileText,
	AlertTriangle,
} from 'lucide-react'
import { PageTitle, EmptyState, Modal, adminButton, adminInput } from '@/components/admin/ui'
import { SellStatusBadge, SellStatusTimeline } from '@/components/sell-status-timeline'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import type { SellPhoneRequest, SellPhoneStatus } from '@/lib/types'
import { formatRequestId } from '@/lib/sell-request-contact'

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
	primary: 'bg-emerald-600 hover:bg-emerald-700 text-white font-bold',
	danger: 'bg-rose-600 hover:bg-rose-700 text-white font-bold',
	neutral: 'bg-slate-700 hover:bg-slate-800 text-white font-bold',
}

export default function AdminSellRequestsPage() {
	const { toast } = useToast()
	const { can } = useAdmin()
	type ModalTab = 'overview' | 'actions' | 'shipment' | 'payment' | 'timeline'
	const [modalTab, setModalTab] = useState<ModalTab>('overview')
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
	const [copiedId, setCopiedId] = useState(false)
	const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

	const handleCopyId = (id: string) => {
		const formatted = formatRequestId(id)
		navigator.clipboard.writeText(formatted)
		setCopiedId(true)
		toast({ title: 'Request ID copied', description: formatted, variant: 'success' })
		setTimeout(() => setCopiedId(false), 2000)
	}

	const load = useCallback(() => {
		fetch('/api/admin/sell-requests')
			.then((res) => res.json())
			.then((json) => setRequests(json.requests ?? []))
			.catch(() => setRequests([]))
	}, [])

	useEffect(load, [load])

	const openDetail = (request: SellPhoneRequest) => {
		setSelected(request)
		setModalTab('overview')
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
				<Modal open onClose={() => setSelected(null)} title={`Sell Request Management`} extraWide>
					<div className="space-y-5 font-sans">
						{/* Top Header Summary Bar */}
						<div className="flex flex-wrap items-center justify-between gap-4 p-4.5 rounded-2xl bg-card border border-border/80 shadow-sm">
							<div className="flex items-center gap-3.5">
								<div className="w-11 h-11 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold shadow-sm">
									<Smartphone className="w-5 h-5" />
								</div>
								<div>
									<div className="flex items-center gap-2">
										<span className="text-base font-extrabold tracking-tight text-foreground">
											{selected.device_brand} {selected.device_model}
										</span>
										<button
											type="button"
											onClick={() => handleCopyId(selected.id)}
											className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[11px] font-mono font-bold text-primary hover:bg-primary/20 transition-all cursor-pointer"
											title="Click to copy Request ID"
										>
											{copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
											{formatRequestId(selected.id)}
										</button>
									</div>
									<div className="flex items-center gap-3 text-xs text-muted-foreground mt-1 font-medium">
										<span className="flex items-center gap-1.5">
											<Calendar className="w-3.5 h-3.5 text-muted-foreground" />
											Submitted {new Date(selected.submitted_at).toLocaleDateString()} at {new Date(selected.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										</span>
										<span>·</span>
										<span className="font-semibold text-foreground/80">{selected.user_id ? 'Registered Account' : 'Guest Submission'}</span>
									</div>
								</div>
							</div>

							{/* Consistent Top-Right Header Actions & Step Controls */}
							<div className="flex flex-wrap items-center justify-end gap-2.5 ml-auto">
								<SellStatusBadge status={selected.status} />

								<div className="flex items-center gap-2 border-l border-border/80 pl-3">
									{modalTab !== 'overview' && (
										<button
											type="button"
											onClick={() => {
												if (modalTab === 'actions') setModalTab('overview')
												if (modalTab === 'shipment') setModalTab('actions')
												if (modalTab === 'payment') setModalTab('shipment')
												if (modalTab === 'timeline') setModalTab('payment')
											}}
											className="px-3.5 py-1.5 rounded-full border border-border text-[11px] font-extrabold hover:bg-muted transition-all cursor-pointer"
										>
											Previous Step
										</button>
									)}
									{modalTab !== 'timeline' && (
										<button
											type="button"
											onClick={() => {
												if (modalTab === 'overview') setModalTab('actions')
												if (modalTab === 'actions') setModalTab('shipment')
												if (modalTab === 'shipment') setModalTab('payment')
												if (modalTab === 'payment') setModalTab('timeline')
											}}
											className="px-3.5 py-1.5 rounded-full bg-secondary border border-border text-[11px] font-extrabold text-foreground hover:bg-muted transition-all cursor-pointer"
										>
											Next Step
										</button>
									)}
								</div>

								{writable && (
									<button onClick={save} disabled={saving} className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-[11px] font-extrabold uppercase tracking-[0.16em] shadow-sm hover:shadow-md transition-all cursor-pointer disabled:opacity-60">
										{saving && <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1.5" />}
										{saving ? 'Saving...' : 'Save & Update Request'}
									</button>
								)}
							</div>
						</div>

						{/* Horizontal Sub-Tabs Navigation Bar */}
						<div className="border-b border-border/80 flex items-center gap-6 overflow-x-auto no-scrollbar">
							<button
								type="button"
								onClick={() => setModalTab('overview')}
								className={`flex items-center gap-2 py-3 px-1 text-xs font-extrabold uppercase tracking-[0.14em] cursor-pointer transition-all border-b-2 -mb-px whitespace-nowrap ${
									modalTab === 'overview'
										? 'border-foreground text-foreground'
										: 'border-transparent text-muted-foreground hover:text-foreground'
								}`}
							>
								<Smartphone className="w-4 h-4 text-emerald-600" />
								Device & Contact
							</button>

							<button
								type="button"
								onClick={() => setModalTab('actions')}
								className={`flex items-center gap-2 py-3 px-1 text-xs font-extrabold uppercase tracking-[0.14em] cursor-pointer transition-all border-b-2 -mb-px whitespace-nowrap ${
									modalTab === 'actions'
										? 'border-foreground text-foreground'
										: 'border-transparent text-muted-foreground hover:text-foreground'
								}`}
							>
								<DollarSign className="w-4 h-4 text-emerald-600" />
								Valuation & Offer
							</button>

							<button
								type="button"
								onClick={() => setModalTab('shipment')}
								className={`flex items-center gap-2 py-3 px-1 text-xs font-extrabold uppercase tracking-[0.14em] cursor-pointer transition-all border-b-2 -mb-px whitespace-nowrap ${
									modalTab === 'shipment'
										? 'border-foreground text-foreground'
										: 'border-transparent text-muted-foreground hover:text-foreground'
								}`}
							>
								<Truck className="w-4 h-4 text-sky-600" />
								Inbound Shipment
							</button>

							<button
								type="button"
								onClick={() => setModalTab('payment')}
								className={`flex items-center gap-2 py-3 px-1 text-xs font-extrabold uppercase tracking-[0.14em] cursor-pointer transition-all border-b-2 -mb-px whitespace-nowrap ${
									modalTab === 'payment'
										? 'border-foreground text-foreground'
										: 'border-transparent text-muted-foreground hover:text-foreground'
								}`}
							>
								<ShieldCheck className="w-4 h-4 text-emerald-600" />
								Payout Confirmation
							</button>

							<button
								type="button"
								onClick={() => setModalTab('timeline')}
								className={`flex items-center gap-2 py-3 px-1 text-xs font-extrabold uppercase tracking-[0.14em] cursor-pointer transition-all border-b-2 -mb-px whitespace-nowrap ${
									modalTab === 'timeline'
										? 'border-foreground text-foreground'
										: 'border-transparent text-muted-foreground hover:text-foreground'
								}`}
							>
								<History className="w-4 h-4 text-indigo-600" />
								Case Timeline
							</button>
						</div>

						{/* 2-Column Split: Narrower Sub-Tab Content on Left (5 cols), Wider Status Action Card on Right (7 cols) */}
						<div className="grid lg:grid-cols-12 gap-5">
							{/* Left Column (5 cols): Rest of cards (Narrower) */}
							<div className="lg:col-span-5 space-y-5">
								{/* Step 1 Content: Device & Contact */}
								{modalTab === 'overview' && (
									<div className="space-y-5">
										{/* Device Card */}
										<div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-4">
											<div className="flex items-center justify-between border-b border-border/70 pb-3">
												<div className="flex items-center gap-2">
													<Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
													<h4 className="text-xs font-extrabold uppercase tracking-[0.18em] text-foreground/90">DEVICE OVERVIEW</h4>
												</div>
												<span className={`inline-flex items-center justify-center text-center whitespace-nowrap shrink-0 px-3 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider ${
													selected.condition === 'excellent' ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30' :
													selected.condition === 'good' ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30' :
													selected.condition === 'fair' ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30' :
													'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/30'
												}`}>
													CONDITION: {selected.condition}
												</span>
											</div>

											{selected.description && (
												<div className="rounded-xl bg-muted/50 border border-border/70 p-4 space-y-2">
													<p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
														<FileText className="w-3.5 h-3.5 text-foreground" />
														SUBMISSION NOTES & DAMAGE DETAILS
													</p>
													<p className="text-xs text-foreground/90 whitespace-pre-line leading-relaxed font-sans font-medium">
														{selected.description}
													</p>
												</div>
											)}

											{/* Customer Submitted Photos */}
											<div className="rounded-xl bg-muted/50 border border-border/70 p-4 space-y-3">
												<div className="flex items-center justify-between border-b border-border/60 pb-2">
													<div className="flex items-center gap-1.5 text-foreground font-extrabold text-xs">
														<ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
														<span className="uppercase tracking-wider">ATTACHED DEVICE PHOTOS</span>
													</div>
													<span className="inline-flex items-center justify-center text-center whitespace-nowrap shrink-0 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30">
														{(selected.sell_phone_images ?? []).length} ATTACHED
													</span>
												</div>
												{(selected.sell_phone_images ?? []).length === 0 ? (
													<p className="text-xs text-muted-foreground py-3 text-center font-medium">No customer photos attached to this submission.</p>
												) : (
													<div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
														{selected.sell_phone_images!.map((image, idx) => (
															<button
																key={image.id}
																type="button"
																onClick={() => setPreviewImageUrl(image.image_url)}
																className="group relative aspect-square rounded-xl overflow-hidden bg-background border border-border/80 hover:ring-2 hover:ring-emerald-500 transition-all block shadow-xs cursor-pointer text-left"
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

										{/* Contact Card */}
										<div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-4">
											<div className="flex items-center justify-between border-b border-border/70 pb-3">
												<div className="flex items-center gap-2">
													<User className="w-4 h-4 text-sky-600 dark:text-sky-400" />
													<h4 className="text-xs font-extrabold uppercase tracking-[0.18em] text-foreground/90">CUSTOMER CONTACT</h4>
												</div>
												<span className="inline-flex items-center justify-center text-center whitespace-nowrap shrink-0 px-3 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30">
													{selected.user_id ? 'REGISTERED ACCOUNT' : 'GUEST SUBMISSION'}
												</span>
											</div>
											<div className="grid gap-3 text-xs text-foreground">
												{selected.contact_email && (
													<div className="flex items-center gap-3 bg-muted/50 border border-border/70 p-3 rounded-xl">
														<Mail className="w-4 h-4 text-sky-600 shrink-0" />
														<a href={`mailto:${selected.contact_email}`} className="text-foreground font-semibold hover:text-primary hover:underline">{selected.contact_email}</a>
													</div>
												)}
												{selected.contact_phone && (
													<div className="flex items-center gap-3 bg-muted/50 border border-border/70 p-3 rounded-xl">
														<Phone className="w-4 h-4 text-sky-600 shrink-0" />
														<span className="font-mono font-extrabold text-foreground tracking-wide">{selected.contact_phone}</span>
													</div>
												)}
											</div>
											{selected.contact_phone && (
												<a
													href={`https://wa.me/${selected.contact_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, this is CellKore regarding your sell request ${formatRequestId(selected.id)}.`)}`}
													target="_blank"
													rel="noreferrer"
													className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold uppercase tracking-[0.16em] transition-all shadow-sm cursor-pointer"
												>
													<MessageCircle className="w-4 h-4" />
													Open WhatsApp Chat
												</a>
											)}
										</div>
									</div>
								)}

								{/* Step 2 Content: Valuation */}
								{modalTab === 'actions' && (
									<div className="space-y-5">
										{/* Pricing Card */}
										<div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-4">
											<div className="flex items-center justify-between border-b border-border/70 pb-3">
												<div className="flex items-center gap-2">
													<DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
													<h4 className="text-xs font-extrabold uppercase tracking-[0.18em] text-foreground/90">OFFERED PRICE VALUATION</h4>
												</div>
												<span className="inline-flex items-center justify-center text-center whitespace-nowrap shrink-0 px-3 py-1 rounded-full text-[10.5px] font-extrabold font-mono uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
													{offeredPrice ? `$${Number(offeredPrice).toFixed(2)}` : 'VALUATION PENDING'}
												</span>
											</div>
											<div className="relative">
												<span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-extrabold text-emerald-600 dark:text-emerald-400">$</span>
												<input
													type="number"
													step="0.01"
													value={offeredPrice}
													onChange={(e) => setOfferedPrice(e.target.value)}
													className={`${adminInput} pl-8 font-mono font-extrabold text-base border-emerald-500/30 focus:border-emerald-500`}
													placeholder="0.00"
													disabled={!writable}
												/>
											</div>
											<p className="text-[11px] text-muted-foreground leading-relaxed font-medium">
												Official valuation amount submitted to the customer for approval.
											</p>
										</div>
									</div>
								)}

								{/* Step 3 Content: Inbound Shipment & Photos */}
								{modalTab === 'shipment' && (
									<div className="space-y-5">
										{/* Inbound Shipment Card */}
										<div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-3.5">
											<div className="flex items-center justify-between border-b border-border/70 pb-3">
												<div className="flex items-center gap-2">
													<Truck className="w-4 h-4 text-sky-600 dark:text-sky-400" />
													<h4 className="text-xs font-extrabold uppercase tracking-[0.18em] text-foreground/90">INBOUND SHIPMENT</h4>
												</div>
												<span className="inline-flex items-center justify-center text-center whitespace-nowrap shrink-0 px-3 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30">
													{selected.shipping_courier ?? 'AWAITING PACKAGE'}
												</span>
											</div>
											<div className="grid sm:grid-cols-2 gap-3 text-xs">
												<div className="bg-muted/50 border border-border/70 p-3 rounded-xl">
													<span className="text-muted-foreground text-[10px] uppercase font-extrabold tracking-wider block">Courier</span>
													<span className="font-extrabold text-foreground">{selected.shipping_courier ?? '—'}</span>
												</div>
												<div className="bg-muted/50 border border-border/70 p-3 rounded-xl">
													<span className="text-muted-foreground text-[10px] uppercase font-extrabold tracking-wider block">Tracking #</span>
													<span className="font-mono font-extrabold text-foreground">{selected.shipping_tracking_number ?? '—'}</span>
												</div>
											</div>
										</div>

										{/* Submitted Photos */}
										<div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-3.5">
											<div className="flex items-center justify-between border-b border-border/70 pb-3">
												<div className="flex items-center gap-2">
													<ImageIcon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
													<h4 className="text-xs font-extrabold uppercase tracking-[0.18em] text-foreground/90">
														SUBMITTED PHOTOS
													</h4>
												</div>
												<span className="inline-flex items-center justify-center text-center whitespace-nowrap shrink-0 px-3 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30">
													{(selected.sell_phone_images ?? []).length} ATTACHED
												</span>
											</div>
											{(selected.sell_phone_images ?? []).length === 0 ? (
												<p className="text-xs text-muted-foreground py-6 text-center font-medium">No photos attached to this request.</p>
											) : (
												<div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
													{selected.sell_phone_images!.map((image, idx) => (
														<button
															key={image.id}
															type="button"
															onClick={() => setPreviewImageUrl(image.image_url)}
															className="group relative aspect-square rounded-xl overflow-hidden bg-muted border border-border/80 hover:ring-2 hover:ring-emerald-500 transition-all block shadow-sm cursor-pointer text-left"
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

										{/* Return Shipment Card */}
										{selected.sell_phone_return_shipments && (
											<div className="p-5 rounded-2xl border border-amber-500/30 bg-card shadow-sm space-y-3.5">
												<div className="flex items-center justify-between border-b border-amber-500/20 pb-3">
													<div className="flex items-center gap-2">
														<Truck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
														<h4 className="text-xs font-extrabold uppercase tracking-[0.18em] text-foreground/90">RETURN SHIPMENT</h4>
													</div>
													<span className="inline-flex items-center justify-center text-center whitespace-nowrap shrink-0 text-xs font-extrabold text-amber-800 dark:text-amber-300 bg-amber-500/15 px-3 py-1 rounded-full border border-amber-500/30 font-mono">
														${Number(selected.sell_phone_return_shipments.fee_amount).toFixed(2)} FEE
													</span>
												</div>
												<div className="text-xs space-y-2 text-foreground">
													<p className="flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
														<ShieldCheck className="w-4 h-4" />
														<span>
															{selected.sell_phone_return_shipments.paid_at
																? `Paid via ${selected.sell_phone_return_shipments.payment_provider} on ${new Date(selected.sell_phone_return_shipments.paid_at).toLocaleDateString()}`
																: 'Awaiting customer return shipping payment'}
														</span>
													</p>
													{selected.sell_phone_return_shipments.address_line1 && (
														<p className="text-muted-foreground font-medium">
															Ship to: {selected.sell_phone_return_shipments.address_line1}, {selected.sell_phone_return_shipments.city}, {selected.sell_phone_return_shipments.country}
														</p>
													)}
													<div className="flex items-center justify-between pt-1">
														<span className="text-[11px] font-bold text-foreground">
															Label: {selected.sell_phone_return_shipments.label_status === 'generated'
																? `${selected.sell_phone_return_shipments.carrier} · ${selected.sell_phone_return_shipments.tracking_number}`
																: 'Not generated'}
														</span>
														{selected.sell_phone_return_shipments.label_url && (
															<a href={selected.sell_phone_return_shipments.label_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:underline">
																View Label <ExternalLink className="w-3 h-3" />
															</a>
														)}
													</div>
												</div>

												{writable && selected.sell_phone_return_shipments.paid_at && selected.sell_phone_return_shipments.label_status !== 'generated' && (
													<div className="mt-3 pt-3 border-t border-amber-500/20 space-y-2.5">
														<p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-foreground">Attach Label Details</p>
														<input value={labelCarrier} onChange={(e) => setLabelCarrier(e.target.value)} placeholder="Carrier (e.g. USPS)" className={adminInput} />
														<input value={labelTracking} onChange={(e) => setLabelTracking(e.target.value)} placeholder="Tracking number" className={adminInput} />
														<input value={labelUrl} onChange={(e) => setLabelUrl(e.target.value)} placeholder="Label URL (PDF link)" className={adminInput} />
														<button onClick={saveLabel} disabled={savingLabel} className={`${adminButton} w-full justify-center mt-2`}>
															{savingLabel && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
															Save Label
														</button>
													</div>
												)}
											</div>
										)}
									</div>
								)}

								{/* Step 4 Content: Payout Payment */}
								{modalTab === 'payment' && (
									<div className="space-y-5">
										{/* Payment Confirmation Card */}
										<div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 shadow-sm space-y-4">
											<div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
												<div className="flex items-center gap-2">
													<DollarSign className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
													<h4 className="text-xs font-extrabold uppercase tracking-[0.18em] text-emerald-900 dark:text-emerald-300">
														PAYOUT PAYMENT CONFIRMATION
													</h4>
												</div>
												<span className="inline-flex items-center justify-center text-center whitespace-nowrap shrink-0 px-3 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider bg-emerald-500/15 text-emerald-800 dark:text-emerald-300 border border-emerald-500/30">
													{paymentConfirmed ? 'PAYMENT FINALIZED' : 'AWAITING PAYOUT'}
												</span>
											</div>
											<p className="text-[11px] text-muted-foreground -mt-1 leading-relaxed font-medium">
												Fill this in once the device has been inspected, approved, and payment transfer sent to customer.
											</p>
											<div className="space-y-3">
												<div>
													<label className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-foreground mb-1 block">TRANSFER AMOUNT (USD)</label>
													<input
														type="number"
														step="0.01"
														value={payoutAmount}
														onChange={(e) => setPayoutAmount(e.target.value)}
														className={`${adminInput} font-mono font-extrabold border-emerald-500/30 focus:border-emerald-500`}
														disabled={!writable}
														placeholder="0.00"
													/>
												</div>
												<div>
													<label className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-foreground mb-1 block">TRANSFER REFERENCE / TXID</label>
													<input
														value={payoutReference}
														onChange={(e) => setPayoutReference(e.target.value)}
														className={`${adminInput} border-emerald-500/30 focus:border-emerald-500`}
														disabled={!writable}
														placeholder="Transaction ID / receipt reference"
													/>
												</div>
												<div>
													<label className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-foreground mb-1 block">RECEIPT / BANK NOTES</label>
													<textarea
														value={payoutNotes}
														onChange={(e) => setPayoutNotes(e.target.value)}
														className={`${adminInput} border-emerald-500/30 focus:border-emerald-500`}
														disabled={!writable}
														rows={2}
														placeholder="Bank transfer or payment service notes"
													/>
												</div>
												<label className="flex items-center gap-2.5 pt-1.5 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs font-bold text-emerald-900 dark:text-emerald-200 cursor-pointer">
													<input
														type="checkbox"
														checked={paymentConfirmed}
														onChange={(e) => setPaymentConfirmed(e.target.checked)}
														disabled={!writable}
														className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
													/>
													Payment transfer officially confirmed & finalized
												</label>
											</div>
										</div>
									</div>
								)}

								{/* Step 5 Content: Dedicated Case Timeline Audit Log */}
								{modalTab === 'timeline' && (
									<div className="space-y-5">
										<div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-3.5">
											<div className="flex items-center justify-between border-b border-border/70 pb-3">
												<div className="flex items-center gap-2">
													<History className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
													<h4 className="text-xs font-extrabold uppercase tracking-[0.18em] text-foreground/90">CASE TIMELINE AUDIT LOG</h4>
												</div>
												<span className="inline-flex items-center justify-center text-center whitespace-nowrap shrink-0 px-3 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
													{(selected.sell_phone_status_history ?? []).length} LOGGED
												</span>
											</div>
											<div className="pt-1">
												{(selected.sell_phone_status_history ?? []).length === 0 ? (
													<p className="text-xs text-muted-foreground py-6 text-center font-medium">No history recorded yet.</p>
												) : (
													<SellStatusTimeline history={selected.sell_phone_status_history!} currentStatus={selected.status} />
												)}
											</div>
										</div>
									</div>
								)}
							</div>

							{/* Right Column (7 cols): Persistent STATUS & WORKFLOW ACTION Card across EVERY tab (Wider & Prominent) */}
							<div className="lg:col-span-7">
								<div className="p-5 rounded-2xl border border-border/80 bg-card shadow-sm space-y-4 sticky top-4">
									<div className="flex items-center justify-between border-b border-border/70 pb-3">
										<div className="flex items-center gap-2">
											<ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
											<h4 className="text-xs font-extrabold uppercase tracking-[0.18em] text-foreground/90">STATUS & WORKFLOW ACTION</h4>
										</div>
										<SellStatusBadge status={selected.status} />
									</div>

									{status !== selected.status && (
										<div className="flex items-center gap-2 p-3 rounded-xl bg-muted/70 border border-border text-xs text-foreground font-extrabold">
											<span>Next status:</span>
											<span className="uppercase tracking-wide text-emerald-600 font-mono">{status.replace(/_/g, ' ')}</span>
										</div>
									)}

									<p className="text-xs text-muted-foreground leading-relaxed font-medium">
										{STATUS_INFO[selected.status]}
									</p>

									{writable && nextActionsFor(selected.status).length > 0 && (
										<div className="space-y-2.5 pt-1">
											<p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">RECOMMENDED ACTIONS</p>
											<div className="flex flex-wrap gap-2.5">
												{nextActionsFor(selected.status).map((action) => (
													<button
														key={action.target}
														type="button"
														onClick={() => setStatus(action.target)}
														className={`px-5 py-2.5 rounded-full text-[11px] font-extrabold uppercase tracking-[0.14em] transition-all cursor-pointer ${ACTION_BUTTON_CLASS[action.tone]} ${
															status === action.target ? 'ring-2 ring-offset-2 ring-offset-card ring-emerald-600' : ''
														}`}
													>
														{action.label}
													</button>
												))}
											</div>
										</div>
									)}

									{status === 'rejected' ? (
										<div className="pt-3 border-t border-rose-500/20 space-y-3">
											<div className="flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-extrabold text-xs">
												<AlertTriangle className="w-4 h-4" />
												<span>REJECTION SETUP</span>
											</div>
											<div>
												<label className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground mb-1 block">
													REJECTION REASON (SHOWN TO CUSTOMER)
												</label>
												<textarea
													value={rejectionReason}
													onChange={(e) => setRejectionReason(e.target.value)}
													className={adminInput}
													disabled={!writable}
													rows={2}
													placeholder="e.g. Device arrived with undisclosed water damage"
												/>
											</div>
											{showReturnFeeField && (
												<div>
													<label className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground mb-1 block">
														RETURN SHIPPING FEE (USD)
													</label>
													<input
														type="number"
														step="0.01"
														value={returnShippingFee}
														onChange={(e) => setReturnShippingFee(e.target.value)}
														className={adminInput}
														disabled={!writable}
														placeholder="0.00"
													/>
												</div>
											)}
										</div>
									) : (
										<div className="pt-3 border-t border-border/70 space-y-2">
											<label className="text-xs font-extrabold uppercase tracking-[0.16em] text-foreground/90 block">
												TIMELINE UPDATE NOTE (OPTIONAL)
											</label>
											<textarea
												value={note}
												onChange={(e) => setNote(e.target.value)}
												className={adminInput}
												disabled={!writable}
												rows={2}
												placeholder="Add context for this status update..."
											/>
										</div>
									)}

									<details className="group pt-2 border-t border-border/70">
										<summary className="cursor-pointer text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground hover:text-foreground list-none flex items-center gap-1.5 py-1">
											<ChevronDown className="w-3.5 h-3.5 transition-transform group-open:rotate-180 text-foreground" />
											ADVANCED: SET STATUS MANUALLY
										</summary>
										<div className="mt-3 space-y-2">
											<select
												value={status}
												onChange={(e) => setStatus(e.target.value as SellPhoneStatus)}
												className={`${adminInput} cursor-pointer font-bold`}
												disabled={!writable}
											>
												{STATUSES.map((s) => (
													<option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
												))}
											</select>
										</div>
									</details>
								</div>
							</div>
						</div>

					</div>
				</Modal>
			)}

			{/* In-App Photo Lightbox Modal (No external URL leakage) */}
			{previewImageUrl && (
				<Modal open={!!previewImageUrl} onClose={() => setPreviewImageUrl(null)} title="ATTACHED DEVICE PHOTO PREVIEW">
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
		</div>
	)
}
