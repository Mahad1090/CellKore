'use client'

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { BadgeDollarSign, Loader2, MessageCircle, Search, Truck } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { SellStatusBadge, SellStatusTimeline } from '@/components/sell-status-timeline'
import { ReturnShipmentPayment } from '@/components/return-shipment-payment'
import { useToast } from '@/components/ui/toast'
import { supabase } from '@/lib/supabase'
import type { SellPhoneRequest } from '@/lib/types'
import { formatRequestId } from '@/lib/sell-request-contact'

export default function SellTrackPage() {
	return (
		<Suspense
			fallback={
				<main className="min-h-screen bg-background">
					<Navigation />
					<Footer />
				</main>
			}
		>
			<SellTrackPageContent />
		</Suspense>
	)
}

function SellTrackPageContent() {
	const { toast } = useToast()
	const searchParams = useSearchParams()
	const [id, setId] = useState(searchParams.get('id') ?? '')
	const [contact, setContact] = useState('')
	const [loading, setLoading] = useState(false)
	const [request, setRequest] = useState<SellPhoneRequest | null>(null)
	const [supportWhatsapp, setSupportWhatsapp] = useState<string | null>(null)
	const [courier, setCourier] = useState('')
	const [trackingNumber, setTrackingNumber] = useState('')
	const [submittingShipment, setSubmittingShipment] = useState(false)
	const [responding, setResponding] = useState(false)

	const refetch = async () => {
		if (!request) return
		const refreshed = await fetch('/api/sell-requests/track', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ id: request.id, contact: contact.trim() }),
		}).then((r) => r.json())
		setRequest(refreshed.request ?? null)
	}

	const respondToOffer = async (decision: 'accept' | 'reject') => {
		if (!request) return
		setResponding(true)
		try {
			const res = await fetch(`/api/sell-requests/${request.id}/respond`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ decision, contact: contact.trim() }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: decision === 'accept' ? 'Offer accepted' : 'Offer declined', variant: 'success' })
			await refetch()
		} catch (err) {
			toast({ title: 'Could not submit your response', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setResponding(false)
		}
	}

	const lookup = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!id.trim() || !contact.trim()) return
		setLoading(true)
		setRequest(null)
		try {
			const res = await fetch('/api/sell-requests/track', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: id.trim(), contact: contact.trim() }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			setRequest(json.request)
			supabase
				.from('country_contact_info')
				.select('whatsapp_number')
				.not('whatsapp_number', 'is', null)
				.limit(1)
				.maybeSingle()
				.then(
					({ data }) => setSupportWhatsapp(data?.whatsapp_number ?? null),
					() => setSupportWhatsapp(null)
				)
		} catch (err) {
			toast({ title: 'Request not found', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setLoading(false)
		}
	}

	const submitShipment = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!request || !courier.trim() || !trackingNumber.trim()) return
		setSubmittingShipment(true)
		try {
			const res = await fetch(`/api/sell-requests/${request.id}/shipment`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ courier: courier.trim(), tracking_number: trackingNumber.trim(), contact: contact.trim() }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Shipment details submitted', variant: 'success' })
			await refetch()
		} catch (err) {
			toast({ title: 'Could not submit shipment details', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSubmittingShipment(false)
		}
	}

	const inputClass =
		'w-full px-4 py-3 border border-border rounded-xl bg-background text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-all'

	return (
		<main className="min-h-screen bg-background">
			<Navigation />

			<section className="bg-primary text-primary-foreground py-10">
				<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
					<h1 className="text-3xl font-bold tracking-luxury uppercase">Track Your Sell Request</h1>
					<p className="opacity-90 mt-2 text-sm">No account needed — look up your request with its ID and your contact info.</p>
				</div>
			</section>

			<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
				<form onSubmit={lookup} className="bg-card border border-border rounded-3xl p-7 space-y-4">
					<div>
						<label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block">Request ID</label>
						<input required value={id} onChange={(e) => setId(e.target.value)} placeholder="e.g. CK-AD2ADFAB-..." className={inputClass} />
					</div>
					<div>
						<label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block">Email or Phone Used</label>
						<input required value={contact} onChange={(e) => setContact(e.target.value)} placeholder="you@example.com or your phone number" className={inputClass} />
					</div>
					<button
						type="submit"
						disabled={loading}
						className="w-full flex items-center justify-center gap-2 py-3.5 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-[0.18em] hover:opacity-90 transition-all cursor-pointer disabled:opacity-60"
					>
						{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
						{loading ? 'Looking up...' : 'Find My Request'}
					</button>
				</form>

				{request && (
					<div className="space-y-4">
						{/* Main Device Header Card */}
						<div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
							<div className="flex items-start justify-between gap-4 flex-wrap">
								<div>
									<div className="flex items-center gap-2 mb-1">
										<p className="text-[11px] font-mono font-extrabold text-primary uppercase">
											{formatRequestId(request.id)}
										</p>
									</div>
									<h3 className="text-base font-extrabold text-card-foreground">
										{request.device_brand} {request.device_model}
									</h3>
									<p className="text-xs text-muted-foreground mt-0.5 font-medium">
										Submitted {new Date(request.submitted_at).toLocaleDateString()} at {new Date(request.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
									</p>
								</div>
								<SellStatusBadge status={request.status} />
							</div>

							{request.offered_price != null && (
								<div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs">
									<span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Offered Price</span>
									<span className="font-mono font-extrabold text-emerald-600 text-sm">${Number(request.offered_price).toFixed(2)}</span>
								</div>
							)}

							{(request.shipping_courier || request.shipping_tracking_number) && request.status !== 'approved' && request.status !== 'offer_accepted' && (
								<div className="pt-3 border-t border-border/60 flex items-center justify-between text-xs text-foreground/80">
									<span className="text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">Inbound Courier</span>
									<span className="font-semibold">{request.shipping_courier ?? '—'} · <span className="font-mono">{request.shipping_tracking_number ?? '—'}</span></span>
								</div>
							)}
						</div>

						{/* Active Action / Offer Cards */}
						{request.status === 'approved' && (
							<div className="bg-card border border-blue-500/30 rounded-3xl p-6 shadow-sm space-y-3">
								<div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
									<BadgeDollarSign className="w-4 h-4" />
									<p className="text-xs font-extrabold uppercase tracking-[0.16em]">
										We&apos;ve sent you an offer{request.offered_price != null ? ` of $${Number(request.offered_price).toFixed(2)}` : ''}
									</p>
								</div>
								<p className="text-xs text-muted-foreground leading-relaxed font-medium">
									Accept to get shipping instructions for sending us your device, or decline if you&apos;d rather not proceed.
								</p>
								<div className="flex flex-wrap gap-2.5 pt-1">
									<button
										type="button"
										onClick={() => respondToOffer('accept')}
										disabled={responding}
										className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-extrabold uppercase tracking-[0.14em] hover:opacity-90 transition-all cursor-pointer disabled:opacity-60 shadow-sm"
									>
										{responding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
										Accept Offer
									</button>
									<button
										type="button"
										onClick={() => respondToOffer('reject')}
										disabled={responding}
										className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full border border-border text-foreground text-xs font-extrabold uppercase tracking-[0.14em] hover:bg-muted transition-all cursor-pointer disabled:opacity-60"
									>
										Decline
									</button>
								</div>
							</div>
						)}

						{request.status === 'offer_accepted' && (
							<form onSubmit={submitShipment} className="bg-card border border-teal-500/30 rounded-3xl p-6 shadow-sm space-y-4">
								<div className="flex items-center gap-2 text-teal-700 dark:text-teal-300">
									<Truck className="w-4 h-4" />
									<p className="text-xs font-extrabold uppercase tracking-[0.16em]">Offer accepted — please send us your device</p>
								</div>
								<p className="text-xs text-muted-foreground leading-relaxed font-medium">
									Ship your device to CellKore, then enter your shipping details below. Once we receive and inspect it, we&apos;ll process your payment.
								</p>
								<div className="grid sm:grid-cols-2 gap-3">
									<input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="Courier name (e.g. DHL)" required className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all font-medium" />
									<input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Tracking number" required className="w-full px-4 py-2.5 border border-border rounded-xl bg-background text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all font-mono font-bold" />
								</div>
								<button
									type="submit"
									disabled={submittingShipment}
									className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground text-xs font-extrabold uppercase tracking-[0.14em] hover:opacity-90 transition-all cursor-pointer disabled:opacity-60 shadow-sm"
								>
									{submittingShipment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
									Submit Shipment Details
								</button>
							</form>
						)}

						{request.status === 'rejected' && request.rejection_reason && (
							<div className="bg-card border border-rose-500/30 rounded-3xl p-6 shadow-sm space-y-2">
								<p className="text-xs font-extrabold uppercase tracking-[0.16em] text-rose-600 dark:text-rose-400">Request Rejected</p>
								<p className="text-xs text-foreground/90 leading-relaxed font-medium">{request.rejection_reason}</p>
							</div>
						)}

						<ReturnShipmentPayment request={request} contact={contact.trim()} onPaid={refetch} />

						{(request.payout_confirmed_at || request.payout_reference || request.payout_amount != null) && (
							<div className="bg-card border border-emerald-500/30 rounded-3xl p-6 shadow-sm space-y-3">
								<p className="text-xs font-extrabold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">Payment Confirmation</p>
								<div className="space-y-2 text-xs text-foreground font-medium">
									{request.payout_amount != null && <p className="flex justify-between border-b border-border/50 pb-1.5"><span className="text-muted-foreground">Transfer Amount:</span> <span className="font-mono font-extrabold text-emerald-600">${Number(request.payout_amount).toFixed(2)}</span></p>}
									{request.payout_reference && <p className="flex justify-between border-b border-border/50 pb-1.5"><span className="text-muted-foreground">Reference / TXID:</span> <span className="font-mono font-bold">{request.payout_reference}</span></p>}
									{request.payout_confirmed_at && <p className="flex justify-between border-b border-border/50 pb-1.5"><span className="text-muted-foreground">Confirmed On:</span> <span>{new Date(request.payout_confirmed_at).toLocaleString()}</span></p>}
									{request.payout_notes && <p className="pt-1 text-muted-foreground italic">Note: {request.payout_notes}</p>}
								</div>
							</div>
						)}

						{/* Progress Timeline Card */}
						{(request.sell_phone_status_history ?? []).length > 0 && (
							<div className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-4">
								<div className="flex items-center justify-between border-b border-border/70 pb-3">
									<h4 className="text-xs font-extrabold uppercase tracking-[0.18em] text-foreground/90">
										PROGRESS TIMELINE HISTORY
									</h4>
									<span className="inline-flex items-center justify-center text-center whitespace-nowrap shrink-0 px-3 py-1 rounded-full text-[10.5px] font-extrabold uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
										{(request.sell_phone_status_history ?? []).length} UPDATES
									</span>
								</div>
								<SellStatusTimeline history={request.sell_phone_status_history!} currentStatus={request.status} />
							</div>
						)}

						{supportWhatsapp && (
							<div className="pt-2 flex justify-center">
								<a
									href={`https://wa.me/${supportWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I need an update on my sell request ${formatRequestId(request.id)}.`)}`}
									target="_blank"
									rel="noreferrer"
									className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border bg-card hover:bg-muted text-xs font-extrabold uppercase tracking-[0.14em] text-primary transition-all shadow-xs cursor-pointer"
								>
									<MessageCircle className="w-4 h-4 text-emerald-600" />
									Need Help? Chat on WhatsApp
								</a>
							</div>
						)}
					</div>
				)}
			</div>

			<Footer />
		</main>
	)
}
