'use client'

import { useState } from 'react'
import { CreditCard, PackageCheck, Truck } from 'lucide-react'
import { PayPalButton } from '@/components/paypal-button'
import { useToast } from '@/components/ui/toast'
import type { SellPhoneRequest } from '@/lib/types'

/**
 * Shown when a sell request was rejected after we already received the
 * device: lets the customer pay the return shipping fee (Stripe or
 * PayPal) and provide an address, then tracks payment/label status.
 * Shared between the account page and the guest track page.
 */
export function ReturnShipmentPayment({
	request,
	accessToken,
	contact,
	onPaid,
}: {
	request: SellPhoneRequest
	accessToken?: string
	contact?: string
	onPaid: () => void
}) {
	const { toast } = useToast()
	const shipment = request.sell_phone_return_shipments
	const [address, setAddress] = useState({
		line1: '',
		line2: '',
		city: '',
		stateProvince: '',
		postalCode: '',
		country: '',
		phone: '',
	})
	const [submittingStripe, setSubmittingStripe] = useState(false)

	if (request.status !== 'rejected' || !shipment) return null

	const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
	if (accessToken) authHeaders.Authorization = `Bearer ${accessToken}`

	const validateAddress = (): boolean => {
		if (!address.line1.trim() || !address.city.trim() || !address.country.trim()) {
			toast({ title: 'Missing address', description: 'Street address, city, and country are required.', variant: 'error' })
			return false
		}
		return true
	}

	const payWithStripe = async () => {
		if (!validateAddress()) return
		setSubmittingStripe(true)
		try {
			const res = await fetch(`/api/sell-requests/${request.id}/return-shipment/checkout`, {
				method: 'POST',
				headers: authHeaders,
				body: JSON.stringify({ provider: 'stripe', address, contact }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			window.location.href = json.url
		} catch (err) {
			toast({ title: 'Could not start payment', description: err instanceof Error ? err.message : undefined, variant: 'error' })
			setSubmittingStripe(false)
		}
	}

	const createPaypalOrder = async (): Promise<string> => {
		if (!validateAddress()) throw new Error('Address incomplete')
		const res = await fetch(`/api/sell-requests/${request.id}/return-shipment/checkout`, {
			method: 'POST',
			headers: authHeaders,
			body: JSON.stringify({ provider: 'paypal', address, contact }),
		})
		const json = await res.json()
		if (!res.ok) throw new Error(json.error)
		return json.paypalOrderId
	}

	const approvePaypalOrder = async (orderId: string) => {
		try {
			const res = await fetch(`/api/sell-requests/${request.id}/return-shipment/paypal-capture`, {
				method: 'POST',
				headers: authHeaders,
				body: JSON.stringify({ paypalOrderId: orderId, contact }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Payment received', variant: 'success' })
			onPaid()
		} catch (err) {
			toast({ title: 'Payment failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		}
	}

	const inputClass =
		'w-full px-3.5 py-2.5 border border-border rounded-xl bg-white text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary transition-all'

	if (shipment.paid_at) {
		return (
			<div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
				<div className="flex items-center gap-2 text-foreground/85">
					<PackageCheck className="w-3.5 h-3.5" />
					<p className="text-[10px] font-bold uppercase tracking-[0.16em]">Return Shipping Paid</p>
				</div>
				{shipment.label_status === 'generated' ? (
					<div className="text-xs text-foreground/75 space-y-1">
						<p>Carrier: <span className="font-semibold">{shipment.carrier}</span></p>
						<p>Tracking #: <span className="font-semibold">{shipment.tracking_number}</span></p>
						{shipment.label_url && (
							<a href={shipment.label_url} target="_blank" rel="noreferrer" className="inline-block text-primary font-semibold hover:underline">
								View Shipping Label
							</a>
						)}
					</div>
				) : (
					<p className="text-xs text-foreground/75">Your return label is being prepared — we&apos;ll update this once it&apos;s ready.</p>
				)}
			</div>
		)
	}

	return (
		<div className="rounded-2xl border border-red-200 bg-red-50/70 p-4 space-y-3">
			<div className="flex items-center gap-2 text-red-800">
				<Truck className="w-3.5 h-3.5" />
				<p className="text-[10px] font-bold uppercase tracking-[0.16em]">
					Return Shipping — ${Number(shipment.fee_amount).toFixed(2)}
				</p>
			</div>
			<p className="text-xs text-red-900/80">
				Since we already have your device, pay the return shipping fee below to get it sent back to you.
			</p>
			<div className="grid sm:grid-cols-2 gap-2.5">
				<input value={address.line1} onChange={(e) => setAddress((a) => ({ ...a, line1: e.target.value }))} placeholder="Street address" className={`${inputClass} sm:col-span-2`} />
				<input value={address.line2} onChange={(e) => setAddress((a) => ({ ...a, line2: e.target.value }))} placeholder="Apt / suite (optional)" className={`${inputClass} sm:col-span-2`} />
				<input value={address.city} onChange={(e) => setAddress((a) => ({ ...a, city: e.target.value }))} placeholder="City" className={inputClass} />
				<input value={address.stateProvince} onChange={(e) => setAddress((a) => ({ ...a, stateProvince: e.target.value }))} placeholder="State / Province" className={inputClass} />
				<input value={address.postalCode} onChange={(e) => setAddress((a) => ({ ...a, postalCode: e.target.value }))} placeholder="Postal code" className={inputClass} />
				<input value={address.country} onChange={(e) => setAddress((a) => ({ ...a, country: e.target.value }))} placeholder="Country" className={inputClass} />
				<input value={address.phone} onChange={(e) => setAddress((a) => ({ ...a, phone: e.target.value }))} placeholder="Phone (optional)" className={`${inputClass} sm:col-span-2`} />
			</div>
			<div className="flex flex-wrap items-center gap-3">
				<button
					type="button"
					onClick={payWithStripe}
					disabled={submittingStripe}
					className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary text-primary-foreground text-[10px] font-bold uppercase tracking-[0.14em] hover:opacity-90 transition-all cursor-pointer disabled:opacity-60"
				>
					<CreditCard className="w-3.5 h-3.5" />
					Pay with Card
				</button>
				<PayPalButton
					createOrder={createPaypalOrder}
					onApprove={approvePaypalOrder}
					onError={(message) => toast({ title: 'PayPal error', description: message, variant: 'error' })}
				/>
			</div>
		</div>
	)
}
