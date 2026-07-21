'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { Eye, Search, Loader2 } from 'lucide-react'
import { PageTitle, StatusBadge, EmptyState, Modal, adminButton, adminInput } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import type { SellPhoneRequest, SellPhoneStatus } from '@/lib/types'

const STATUSES: SellPhoneStatus[] = ['submitted', 'reviewed', 'quoted', 'contacted', 'closed']
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
	}

	const save = async () => {
		if (!selected) return
		setSaving(true)
		try {
			const res = await fetch(`/api/admin/sell-requests/${selected.id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					status,
					offered_price: offeredPrice === '' ? null : Number(offeredPrice),
					payout_amount: payoutAmount === '' ? null : Number(payoutAmount),
					payout_reference: payoutReference.trim() || null,
					payout_notes: payoutNotes.trim() || null,
					payout_confirmed_at: paymentConfirmed ? new Date().toISOString() : null,
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
									<td className="px-5 py-3.5"><StatusBadge value={request.status} /></td>
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
								<select
									value={status}
									onChange={(e) => setStatus(e.target.value as SellPhoneStatus)}
									className={`${adminInput} cursor-pointer capitalize`}
									disabled={!writable}
								>
									{STATUSES.map((s) => (
										<option key={s} value={s}>{s}</option>
									))}
								</select>
								<p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-wider">
									submitted → reviewed → quoted → contacted → closed
								</p>
							</div>
							<div className="rounded-2xl border border-border p-4 space-y-4">
								<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-card-foreground">Payment Confirmation</p>
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
