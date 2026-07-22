'use client'

import { useState } from 'react'
import { CreditCard, PackageCheck, Receipt, Truck } from 'lucide-react'
import { PayPalButton } from '@/components/paypal-button'
import { useToast } from '@/components/ui/toast'
import { formatMoney } from '@/lib/format'
import type { RepairRequest, RepairShippingOption } from '@/lib/types'

/**
 * Shown once a repair quote has been sent: lets the customer review the
 * itemized charges, accept or decline, pick a shipping-back option, and
 * pay (Stripe or PayPal). Shared between the account page and the guest
 * track page.
 */
export function RepairQuotePayment({
	request,
	accessToken,
	contact,
	onUpdated,
}: {
	request: RepairRequest
	accessToken?: string
	contact?: string
	onUpdated: () => void
}) {
	const { toast } = useToast()
	const [selectedOption, setSelectedOption] = useState<RepairShippingOption | null>(
		request.selected_shipping_option ?? request.shipping_options?.[0] ?? null
	)
	const [responding, setResponding] = useState<'accept' | 'reject' | null>(null)
	const [submittingStripe, setSubmittingStripe] = useState(false)

	if (!['quote_sent', 'quote_accepted'].includes(request.status)) return null

	const authHeaders: Record<string, string> = { 'Content-Type': 'application/json' }
	if (accessToken) authHeaders.Authorization = `Bearer ${accessToken}`

	const quoteTotal = Number(request.quote_total ?? 0)

	const respondToQuote = async (action: 'accept' | 'reject') => {
		if (action === 'accept' && !selectedOption) {
			toast({ title: 'Choose a shipping option', variant: 'error' })
			return
		}
		setResponding(action)
		try {
			const res = await fetch(`/api/repair/${request.id}/quote/respond`, {
				method: 'POST',
				headers: authHeaders,
				body: JSON.stringify({ action, selected_shipping_option: selectedOption, contact }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: action === 'accept' ? 'Quote accepted' : 'Quote declined', variant: 'success' })
			onUpdated()
		} catch (err) {
			toast({ title: 'Could not submit response', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setResponding(null)
		}
	}

	const payWithStripe = async () => {
		setSubmittingStripe(true)
		try {
			const res = await fetch(`/api/repair/${request.id}/checkout`, {
				method: 'POST',
				headers: authHeaders,
				body: JSON.stringify({ provider: 'stripe', contact }),
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
		const res = await fetch(`/api/repair/${request.id}/checkout`, {
			method: 'POST',
			headers: authHeaders,
			body: JSON.stringify({ provider: 'paypal', contact }),
		})
		const json = await res.json()
		if (!res.ok) throw new Error(json.error)
		return json.paypalOrderId
	}

	const approvePaypalOrder = async (orderId: string) => {
		try {
			const res = await fetch(`/api/repair/${request.id}/paypal-capture`, {
				method: 'POST',
				headers: authHeaders,
				body: JSON.stringify({ paypalOrderId: orderId, contact }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Payment received', variant: 'success' })
			onUpdated()
		} catch (err) {
			toast({ title: 'Payment failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		}
	}

	const rowClass = 'flex items-center justify-between text-xs text-foreground/85 py-1.5'

	if (request.paid_at) {
		return (
			<div className="rounded-2xl border border-border bg-muted/30 p-4 space-y-2">
				<div className="flex items-center gap-2 text-foreground/85">
					<PackageCheck className="w-3.5 h-3.5" />
					<p className="text-[10px] font-bold uppercase tracking-[0.16em]">Repair Payment Received</p>
				</div>
				<p className="text-xs text-foreground/75">
					Paid {formatMoney(Number(request.grand_total ?? 0), request.quote_currency)} via {request.payment_provider}. We&apos;ll update you once your device ships back.
				</p>
			</div>
		)
	}

	return (
		<div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-4">
			<div className="flex items-center gap-2 text-foreground">
				<Receipt className="w-3.5 h-3.5" />
				<p className="text-[10px] font-bold uppercase tracking-[0.16em]">Repair Charges Receipt</p>
			</div>

			<div className="space-y-1 border-b border-border/60 pb-3">
				{(request.quote_items ?? []).map((item, i) => (
					<div key={i} className={rowClass}>
						<span>{item.label}</span>
						<span className="font-mono font-semibold">{formatMoney(Number(item.amount), request.quote_currency)}</span>
					</div>
				))}
				<div className={`${rowClass} font-bold border-t border-border/60 mt-1 pt-2`}>
					<span>Repair Subtotal</span>
					<span className="font-mono">{formatMoney(quoteTotal, request.quote_currency)}</span>
				</div>
				{request.quote_notes && (
					<p className="text-xs text-muted-foreground pt-1">{request.quote_notes}</p>
				)}
			</div>

			{request.status === 'quote_sent' && (
				<div className="space-y-3">
					<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-foreground/80 flex items-center gap-1.5">
						<Truck className="w-3.5 h-3.5" /> Choose Return Shipping
					</p>
					<div className="space-y-2">
						{(request.shipping_options ?? []).map((option, i) => (
							<label
								key={i}
								className={`flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
									selectedOption?.label === option.label ? 'border-primary bg-primary/10' : 'border-border bg-background'
								}`}
							>
								<span className="flex items-center gap-2 text-xs font-semibold text-foreground">
									<input
										type="radio"
										checked={selectedOption?.label === option.label}
										onChange={() => setSelectedOption(option)}
										className="accent-[var(--primary)] cursor-pointer"
									/>
									{option.label}
								</span>
								<span className="font-mono text-xs font-bold">{formatMoney(Number(option.cost), request.quote_currency)}</span>
							</label>
						))}
					</div>
					{selectedOption && (
						<div className={`${rowClass} font-extrabold text-sm`}>
							<span>Grand Total</span>
							<span className="font-mono">{formatMoney(quoteTotal + Number(selectedOption.cost), request.quote_currency)}</span>
						</div>
					)}
					<div className="flex flex-wrap gap-2.5 pt-1">
						<button
							type="button"
							onClick={() => respondToQuote('accept')}
							disabled={responding !== null}
							className="px-5 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-[0.14em] transition-all cursor-pointer disabled:opacity-60"
						>
							Accept & Continue to Payment
						</button>
						<button
							type="button"
							onClick={() => respondToQuote('reject')}
							disabled={responding !== null}
							className="px-5 py-2 rounded-full border border-border text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/75 hover:border-destructive hover:text-destructive transition-all cursor-pointer disabled:opacity-60"
						>
							Decline Quote
						</button>
					</div>
				</div>
			)}

			{request.status === 'quote_accepted' && (
				<div className="space-y-3">
					<div className={`${rowClass} font-semibold`}>
						<span>Return Shipping: {request.selected_shipping_option?.label}</span>
						<span className="font-mono">{formatMoney(Number(request.shipping_cost ?? 0), request.quote_currency)}</span>
					</div>
					<div className={`${rowClass} font-extrabold text-sm border-t border-border/60 pt-2`}>
						<span>Amount Due</span>
						<span className="font-mono">{formatMoney(Number(request.grand_total ?? 0), request.quote_currency)}</span>
					</div>
					<div className="flex flex-wrap items-center gap-3 pt-1">
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
			)}
		</div>
	)
}
