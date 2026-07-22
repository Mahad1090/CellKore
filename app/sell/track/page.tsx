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
						<input required value={id} onChange={(e) => setId(e.target.value)} placeholder="Paste the ID from your confirmation" className={inputClass} />
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
					<div className="bg-card border border-border rounded-3xl p-7 space-y-5">
						<div className="flex items-start justify-between gap-4 flex-wrap">
							<div>
								<p className="text-sm font-semibold text-card-foreground">
									{request.device_brand} {request.device_model}
								</p>
								<p className="text-xs text-muted-foreground mt-0.5">
									Submitted {new Date(request.submitted_at).toLocaleString()}
								</p>
							</div>
							<SellStatusBadge status={request.status} />
						</div>

						{request.offered_price != null && (
							<div className="text-xs text-foreground/80">
								Offer: <span className="font-semibold text-card-foreground">${Number(request.offered_price).toFixed(2)}</span>
							</div>
						)}

						{request.status === 'approved' && (
							<div className="rounded-2xl border border-blue-200 bg-blue-50/60 p-4 space-y-3">
								<div className="flex items-center gap-2 text-blue-800">
									<BadgeDollarSign className="w-3.5 h-3.5" />
									<p className="text-[10px] font-bold uppercase tracking-[0.16em]">
										We&apos;ve sent you an offer{request.offered_price != null ? ` of $${Number(request.offered_price).toFixed(2)}` : ''}
									</p>
								</div>
								<p className="text-xs text-blue-900/80">
									Accept to get shipping instructions for sending us your device, or decline if you&apos;d rather not proceed.
								</p>
								<div className="flex flex-wrap gap-2.5">
									<button
										type="button"
										onClick={() => respondToOffer('accept')}
										disabled={responding}
										className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.14em] hover:opacity-90 transition-all cursor-pointer disabled:opacity-60"
									>
										{responding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
										Accept Offer
									</button>
									<button
										type="button"
										onClick={() => respondToOffer('reject')}
										disabled={responding}
										className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-blue-300 text-blue-800 text-[10px] font-bold uppercase tracking-[0.14em] hover:bg-blue-100 transition-all cursor-pointer disabled:opacity-60"
									>
										Decline
									</button>
								</div>
							</div>
						)}

						{request.status === 'offer_accepted' && (
							<form onSubmit={submitShipment} className="rounded-2xl border border-teal-200 bg-teal-50/60 p-4 space-y-3">
								<div className="flex items-center gap-2 text-teal-800">
									<Truck className="w-3.5 h-3.5" />
									<p className="text-[10px] font-bold uppercase tracking-[0.16em]">Offer accepted — please send us your device</p>
								</div>
								<p className="text-xs text-teal-900/80">
									Ship your device to CellKore, then enter your shipping details below. Once we receive and inspect it, we&apos;ll process your payment.
								</p>
								<div className="grid sm:grid-cols-2 gap-2.5">
									<input value={courier} onChange={(e) => setCourier(e.target.value)} placeholder="Courier name (e.g. DHL)" required className="w-full px-3.5 py-2.5 border border-teal-200 rounded-xl bg-white text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all" />
									<input value={trackingNumber} onChange={(e) => setTrackingNumber(e.target.value)} placeholder="Tracking number" required className="w-full px-3.5 py-2.5 border border-teal-200 rounded-xl bg-white text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all" />
								</div>
								<button
									type="submit"
									disabled={submittingShipment}
									className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.14em] hover:opacity-90 transition-all cursor-pointer disabled:opacity-60"
								>
									{submittingShipment && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
									Submit Shipment Details
								</button>
							</form>
						)}

						{(request.shipping_courier || request.shipping_tracking_number) && request.status !== 'approved' && request.status !== 'offer_accepted' && (
							<div className="text-xs text-foreground/75">
								Shipped via <span className="font-semibold">{request.shipping_courier}</span> · Tracking #: <span className="font-semibold">{request.shipping_tracking_number}</span>
							</div>
						)}

						{request.status === 'rejected' && request.rejection_reason && (
							<div className="rounded-2xl border border-red-200 bg-red-50/70 p-4">
								<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-red-700 mb-1.5">Request Rejected</p>
								<p className="text-xs text-red-900/90">{request.rejection_reason}</p>
							</div>
						)}

						<ReturnShipmentPayment request={request} contact={contact.trim()} onPaid={refetch} />

						{(request.payout_confirmed_at || request.payout_reference || request.payout_amount != null) && (
							<div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
								<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 mb-2">Payment Confirmation</p>
								<div className="space-y-1.5 text-xs text-emerald-900/90">
									{request.payout_amount != null && <p>Amount: ${Number(request.payout_amount).toFixed(2)}</p>}
									{request.payout_reference && <p>Reference: {request.payout_reference}</p>}
									{request.payout_confirmed_at && <p>Confirmed: {new Date(request.payout_confirmed_at).toLocaleString()}</p>}
									{request.payout_notes && <p>Note: {request.payout_notes}</p>}
								</div>
							</div>
						)}

						{(request.sell_phone_status_history ?? []).length > 0 && (
							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-card-foreground mb-3">Progress Timeline</p>
								<SellStatusTimeline history={request.sell_phone_status_history!} currentStatus={request.status} />
							</div>
						)}

						{supportWhatsapp && (
							<a
								href={`https://wa.me/${supportWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I need an update on my sell request ${request.id}.`)}`}
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary hover:opacity-80"
							>
								<MessageCircle className="w-3.5 h-3.5" />
								Chat on WhatsApp
							</a>
						)}
					</div>
				)}
			</div>

			<Footer />
		</main>
	)
}
