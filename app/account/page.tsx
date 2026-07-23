'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { User, Package, Heart, LogOut, BadgeDollarSign, MessageCircle, Wrench, Loader2, Truck } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { TableShimmer } from '@/components/shimmer'
import { SellStatusBadge, SellStatusTimeline } from '@/components/sell-status-timeline'
import { ReturnShipmentPayment } from '@/components/return-shipment-payment'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { StoreReviewForm } from '@/components/store-review-form'
import type { OrderRecord, SellPhoneRequest } from '@/lib/types'
import { formatRequestId } from '@/lib/sell-request-contact'

type AccountTab = 'orders' | 'sell' | 'repair'

const TAB_ITEMS: { key: AccountTab; label: string; href: string }[] = [
	{ key: 'orders', label: 'Orders', href: '/account?tab=orders' },
	{ key: 'sell', label: 'Sell Requests', href: '/account?tab=sell' },
	{ key: 'repair', label: 'Repair Requests', href: '/account?tab=repair' },
]

export default function AccountPage() {
	return (
		<Suspense
			fallback={
				<main className="min-h-screen bg-background">
					<Navigation />
					<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
						<TableShimmer />
					</div>
					<Footer />
				</main>
			}
		>
			<AccountPageContent />
		</Suspense>
	)
}

function AccountPageContent() {
	const { user, session, loading: authLoading, signOut } = useAuth()
	const router = useRouter()
	const searchParams = useSearchParams()
	const [orders, setOrders] = useState<OrderRecord[] | null>(null)
	const [sellRequests, setSellRequests] = useState<SellPhoneRequest[] | null>(null)
	const [supportWhatsapp, setSupportWhatsapp] = useState<string | null>(null)

	const activeTab: AccountTab =
		searchParams.get('tab') === 'sell'
			? 'sell'
			: searchParams.get('tab') === 'repair'
				? 'repair'
				: 'orders'

	const loadOrders = useCallback(async (userId: string) => {
		const { data } = await supabase
			.from('orders')
			.select('*, order_items ( id, product_id, quantity, unit_price_at_purchase, products ( name ) )')
			.eq('user_id', userId)
			.order('created_at', { ascending: false })
		setOrders(data ?? [])
	}, [])

	const loadSellRequests = useCallback(async (userId: string) => {
		const { data } = await supabase
			.from('sell_phone_requests')
			.select(
				'id, user_id, device_brand, device_model, condition, description, contact_phone, contact_email, status, offered_price, payout_amount, payout_reference, payout_notes, payout_confirmed_at, shipping_courier, shipping_tracking_number, rejection_reason, submitted_at, updated_at, sell_phone_status_history ( id, request_id, status, note, changed_by, created_at ), sell_phone_return_shipments ( * )'
			)
			.eq('user_id', userId)
			.order('submitted_at', { ascending: false })
			.order('created_at', { referencedTable: 'sell_phone_status_history', ascending: true })
		setSellRequests((data as unknown as SellPhoneRequest[]) ?? [])
	}, [])

	useEffect(() => {
		if (authLoading) return
		if (!user) {
			router.push('/')
			return
		}
		loadOrders(user.id).catch(() => setOrders([]))
		loadSellRequests(user.id).catch(() => setSellRequests([]))
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
	}, [user, authLoading, router, loadOrders, loadSellRequests])

	useEffect(() => {
		if (!user) return
		const channel = supabase
			.channel(`account-sell-${user.id}`)
			.on(
				'postgres_changes',
				{
					event: '*',
					schema: 'public',
					table: 'sell_phone_requests',
					filter: `user_id=eq.${user.id}`,
				},
				() => {
					loadSellRequests(user.id).catch(() => undefined)
				}
			)
			.subscribe()

		return () => {
			supabase.removeChannel(channel)
		}
	}, [user, loadSellRequests])

	if (authLoading || !user) {
		return (
			<main className="min-h-screen bg-background">
				<Navigation />
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<TableShimmer />
				</div>
				<Footer />
			</main>
		)
	}

	return (
		<main className="min-h-screen bg-background">
			<Navigation />

			<section className="bg-primary text-primary-foreground py-10">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<h1 className="text-3xl font-bold tracking-luxury uppercase">My Account</h1>
					<p className="opacity-90 mt-2">Track orders, sell requests, and profile activity</p>
				</div>
			</section>

			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
				<div className="bg-card border border-border rounded-3xl p-7 flex items-center justify-between flex-wrap gap-4">
					<div className="flex items-center gap-4">
						<div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
							<User className="w-6 h-6" />
						</div>
						<div>
							<p className="text-sm font-semibold text-card-foreground">{user.email}</p>
							<p className="text-xs text-muted-foreground mt-0.5">Signed in</p>
						</div>
					</div>
					<button
						onClick={() => signOut()}
						className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-xs font-semibold uppercase tracking-[0.14em] text-foreground/75 hover:border-destructive hover:text-destructive transition-all cursor-pointer"
					>
						<LogOut className="w-3.5 h-3.5" />
						Sign Out
					</button>
				</div>

				<div className="bg-card border border-border rounded-3xl p-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
					{TAB_ITEMS.map((tab) => (
						<Link
							key={tab.key}
							href={tab.href}
							className={`text-center px-4 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.14em] transition-all ${
								activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-muted'
							}`}
						>
							{tab.label}
						</Link>
					))}
					<Link
						href="/wishlist"
						className="text-center px-4 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.14em] transition-all text-foreground/70 hover:bg-muted"
					>
						Wishlist
					</Link>
				</div>

				{activeTab === 'orders' && (
					<div className="bg-card border border-border rounded-3xl p-7">
						<div className="flex items-center gap-2.5 mb-6">
							<Package className="w-4.5 h-4.5 text-primary" />
							<h2 className="text-sm font-bold uppercase tracking-[0.16em] text-card-foreground">Order History</h2>
						</div>

						{orders === null ? (
							<TableShimmer rows={3} />
						) : orders.length === 0 ? (
							<div className="text-center py-10">
								<p className="text-sm text-muted-foreground mb-5">No orders yet.</p>
								<Link
									href="/products?category=iphones"
									className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-[0.16em] hover:opacity-90 transition-all"
								>
									Start Shopping
								</Link>
							</div>
						) : (
							<div className="space-y-3">
								{orders.map((order) => (
									<div key={order.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/40">
										<div>
											<p className="text-sm font-semibold text-card-foreground">{order.reference ?? order.id}</p>
											<p className="text-xs text-muted-foreground mt-0.5">
												{new Date(order.created_at).toLocaleDateString()} · {order.status}
											</p>
										</div>
										<p className="text-sm font-bold text-card-foreground">
											${Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
										</p>
									</div>
								))}
							</div>
						)}
					</div>
				)}

				{activeTab === 'sell' && (
					<div className="bg-card border border-border rounded-3xl p-7 space-y-5">
						<div className="flex items-center justify-between flex-wrap gap-3">
							<div className="flex items-center gap-2.5">
								<BadgeDollarSign className="w-4.5 h-4.5 text-primary" />
								<h2 className="text-sm font-bold uppercase tracking-[0.16em] text-card-foreground">Sell Request Tracking</h2>
							</div>
							<Link href="/sell" className="text-[11px] font-bold uppercase tracking-[0.14em] text-primary hover:opacity-80">
								Create New Request
							</Link>
						</div>

						{sellRequests === null ? (
							<TableShimmer rows={3} />
						) : sellRequests.length === 0 ? (
							<div className="text-center py-10">
								<p className="text-sm text-muted-foreground mb-5">No sell requests yet.</p>
								<Link
									href="/sell"
									className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-[0.16em] hover:opacity-90 transition-all"
								>
									Sell Your Device
								</Link>
							</div>
						) : (
							<div className="space-y-4">
								{sellRequests.map((request) => (
									<SellRequestCard
										key={request.id}
										request={request}
										accessToken={session?.access_token}
										supportWhatsapp={supportWhatsapp}
										onShipmentSubmitted={() => user && loadSellRequests(user.id)}
									/>
								))}
							</div>
						)}
					</div>
				)}

				{activeTab === 'repair' && (
					<div className="bg-card border border-border rounded-3xl p-7">
						<div className="flex items-center gap-2.5 mb-3">
							<Wrench className="w-4.5 h-4.5 text-primary" />
							<h2 className="text-sm font-bold uppercase tracking-[0.16em] text-card-foreground">Repair Requests</h2>
						</div>
						<p className="text-sm text-muted-foreground mb-6">
							Repair workflow tracking tabs are now added. Detailed repair request functionality will be connected next.
						</p>
						<Link
							href="/repair"
							className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-[0.16em] hover:opacity-90 transition-all"
						>
							Open Repair Section
						</Link>
					</div>
				)}

				{/* Leave a Store Review Form at Bottom */}
				<div className="pt-4">
					<StoreReviewForm
						title="Leave a Store Review"
						subtitle="Share your overall shopping, selling, or repair experience with CellKore"
					/>
				</div>
			</div>

			<Footer />
		</main>
	)
}

function SellRequestCard({
	request,
	accessToken,
	supportWhatsapp,
	onShipmentSubmitted,
}: {
	request: SellPhoneRequest
	accessToken: string | undefined
	supportWhatsapp: string | null
	onShipmentSubmitted: () => void
}) {
	const { toast } = useToast()
	const [courier, setCourier] = useState('')
	const [trackingNumber, setTrackingNumber] = useState('')
	const [submitting, setSubmitting] = useState(false)
	const [responding, setResponding] = useState(false)
	const history = request.sell_phone_status_history ?? []

	const respondToOffer = async (decision: 'accept' | 'reject') => {
		if (!accessToken) return
		setResponding(true)
		try {
			const res = await fetch(`/api/sell-requests/${request.id}/respond`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
				body: JSON.stringify({ decision }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: decision === 'accept' ? 'Offer accepted' : 'Offer declined', variant: 'success' })
			onShipmentSubmitted()
		} catch (err) {
			toast({ title: 'Could not submit your response', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setResponding(false)
		}
	}

	const submitShipment = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!accessToken || !courier.trim() || !trackingNumber.trim()) return
		setSubmitting(true)
		try {
			const res = await fetch(`/api/sell-requests/${request.id}/shipment`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
				body: JSON.stringify({ courier: courier.trim(), tracking_number: trackingNumber.trim() }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Shipment details submitted', variant: 'success' })
			onShipmentSubmitted()
		} catch (err) {
			toast({ title: 'Could not submit shipment details', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className="p-5 rounded-2xl border border-border bg-muted/30 space-y-4">
			<div className="flex items-start justify-between gap-4 flex-wrap">
				<div>
					<p className="text-[11px] font-mono font-bold text-primary uppercase mb-1">
						{formatRequestId(request.id)}
					</p>
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
							disabled={responding || !accessToken}
							className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.14em] hover:opacity-90 transition-all cursor-pointer disabled:opacity-60"
						>
							{responding && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
							Accept Offer
						</button>
						<button
							type="button"
							onClick={() => respondToOffer('reject')}
							disabled={responding || !accessToken}
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
						Ship your device to CellKore, then enter your shipping details below so we can track the delivery. Once we receive and inspect it, we&apos;ll process your payment.
					</p>
					<div className="grid sm:grid-cols-2 gap-2.5">
						<input
							value={courier}
							onChange={(e) => setCourier(e.target.value)}
							placeholder="Courier name (e.g. DHL)"
							required
							className="w-full px-3.5 py-2.5 border border-teal-200 rounded-xl bg-white text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all"
						/>
						<input
							value={trackingNumber}
							onChange={(e) => setTrackingNumber(e.target.value)}
							placeholder="Tracking number"
							required
							className="w-full px-3.5 py-2.5 border border-teal-200 rounded-xl bg-white text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all"
						/>
					</div>
					<button
						type="submit"
						disabled={submitting || !accessToken}
						className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.14em] hover:opacity-90 transition-all cursor-pointer disabled:opacity-60"
					>
						{submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
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

			<ReturnShipmentPayment request={request} accessToken={accessToken} onPaid={onShipmentSubmitted} />

			{(request.payout_confirmed_at || request.payout_reference || request.payout_amount != null) && (
				<div className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
					<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-700 mb-2">
						Payment Confirmation
					</p>
					<div className="space-y-1.5 text-xs text-emerald-900/90">
						{request.payout_amount != null && <p>Amount: ${Number(request.payout_amount).toFixed(2)}</p>}
						{request.payout_reference && <p>Reference: {request.payout_reference}</p>}
						{request.payout_confirmed_at && <p>Confirmed: {new Date(request.payout_confirmed_at).toLocaleString()}</p>}
						{request.payout_notes && <p>Note: {request.payout_notes}</p>}
					</div>
				</div>
			)}

			{history.length > 0 && (
				<details className="group">
					<summary className="cursor-pointer text-[11px] font-bold uppercase tracking-[0.14em] text-primary hover:opacity-80 list-none flex items-center gap-1.5">
						<span className="inline-block transition-transform group-open:rotate-90">›</span>
						View Full Progress Timeline
					</summary>
					<div className="mt-4 pl-1">
						<SellStatusTimeline history={history} currentStatus={request.status} />
					</div>
				</details>
			)}

			{supportWhatsapp && (
				<a
					href={`https://wa.me/${supportWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hi, I need an update on my sell request ${formatRequestId(request.id)}.`)}`}
					target="_blank"
					rel="noreferrer"
					className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-primary hover:opacity-80"
				>
					<MessageCircle className="w-3.5 h-3.5" />
					Chat on WhatsApp
				</a>
			)}
		</div>
	)
}
