'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Gift, Loader2, Lock, Tag } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { FormShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/contexts/auth-context'
import { useMarketplace } from '@/contexts/marketplace-context'
import { supabase } from '@/lib/supabase'
import { loadCartItems, clearLocalCart, type LocalCartItem } from '@/lib/cart'
import { fetchProductById } from '@/lib/data'
import { getTaxRate, isValidPostalCode, isValidPhone, US_STATE_TAX, CA_PROVINCE_TAX } from '@/lib/tax'
import type { Product } from '@/lib/types'

const DRAFT_KEY = 'cellkore_checkout_draft'
const FINAL_SALE_NOTICE = 'Returns and Exchanges are not supported. All checkout items are final.'
const GIFT_CARD_FEE = 5
const GIFT_WRAP_FEE = 10

interface CheckoutForm {
	email: string
	phone: string
	line1: string
	line2: string
	city: string
	stateProvince: string
	postalCode: string
	country: 'US' | 'CA'
	isGift: boolean
	giftRecipientName: string
	giftRecipientPhone: string
	giftMessage: string
	giftCard: boolean
	giftWrapping: boolean
	promoCode: string
}

const EMPTY_FORM: CheckoutForm = {
	email: '',
	phone: '',
	line1: '',
	line2: '',
	city: '',
	stateProvince: '',
	postalCode: '',
	country: 'US',
	isGift: false,
	giftRecipientName: '',
	giftRecipientPhone: '',
	giftMessage: '',
	giftCard: false,
	giftWrapping: false,
	promoCode: '',
}

interface HydratedItem extends LocalCartItem {
	product: Product
}

declare global {
	interface Window {
		paypal?: any
	}
}

export default function CheckoutPage() {
	const router = useRouter()
	const { toast } = useToast()
	const { user, loading: authLoading } = useAuth()
	const { marketplace, detectedCountry } = useMarketplace()

	const [form, setForm] = useState<CheckoutForm>(EMPTY_FORM)
	const [items, setItems] = useState<HydratedItem[] | null>(null)
	const [placing, setPlacing] = useState(false)
	const [promo, setPromo] = useState<{ code: string; discountAmount: number } | null>(null)
	const [checkingPromo, setCheckingPromo] = useState(false)
	const prefillStage = useRef(0)
	const paypalRendered = useRef(false)
	const paypalRef = useRef<HTMLDivElement>(null)

	// ---- Prefill sequence: draft -> user DB address -> geolocated country ----
	useEffect(() => {
		try {
			const draft = localStorage.getItem(DRAFT_KEY)
			if (draft) {
				setForm({ ...EMPTY_FORM, ...JSON.parse(draft) })
				prefillStage.current = 2
				return
			}
		} catch {
			// corrupted draft — ignore
		}
		prefillStage.current = 1
	}, [])

	useEffect(() => {
		if (authLoading || prefillStage.current >= 2) return
		if (user) {
			prefillStage.current = 2
			supabase
				.from('addresses')
				.select('*')
				.eq('user_id', user.id)
				.eq('type', 'shipping')
				.order('created_at', { ascending: false })
				.limit(1)
				.maybeSingle()
				.then(({ data }) => {
					if (data) {
						setForm((f) => ({
							...f,
							email: f.email || user.email || '',
							line1: f.line1 || data.line1,
							line2: f.line2 || data.line2 || '',
							city: f.city || data.city,
							stateProvince: f.stateProvince || data.state_province || '',
							postalCode: f.postalCode || data.postal_code || '',
							country: (data.country === 'CA' ? 'CA' : 'US') as 'US' | 'CA',
						}))
					} else {
						setForm((f) => ({ ...f, email: f.email || user.email || '' }))
					}
				})
		}
	}, [user, authLoading])

	useEffect(() => {
		if (prefillStage.current >= 2 || !detectedCountry) return
		if (detectedCountry === 'US' || detectedCountry === 'CA') {
			setForm((f) => (f.country ? { ...f, country: detectedCountry } : f))
		}
	}, [detectedCountry])

	// ---- Draft autosave (prevents data loss on refresh) ----
	useEffect(() => {
		const timer = setTimeout(() => {
			try {
				localStorage.setItem(DRAFT_KEY, JSON.stringify(form))
			} catch {
				// storage full — non-fatal
			}
		}, 400)
		return () => clearTimeout(timer)
	}, [form])

	// ---- Load cart ----
	useEffect(() => {
		if (authLoading) return
		;(async () => {
			try {
				const raw = await loadCartItems(user?.id ?? null)
				const hydrated: HydratedItem[] = []
				for (const item of raw) {
					const product = await fetchProductById(item.productId)
					if (!product) continue
					hydrated.push({ ...item, product })
				}
				setItems(hydrated)
			} catch {
				setItems([])
			}
		})()
	}, [user, authLoading])

	const set = <K extends keyof CheckoutForm>(field: K, value: CheckoutForm[K]) =>
		setForm((f) => ({ ...f, [field]: value }))

	const unitPrice = (item: HydratedItem) => {
		const variant = (item.product.product_variants ?? []).find((v) => v.id === item.variantId)
		return Number(item.product.base_price) + Number(variant?.price_adjustment ?? 0)
	}

	const subtotal = useMemo(
		() => (items ?? []).reduce((sum, i) => sum + unitPrice(i) * i.quantity, 0),
		[items]
	)
	const discount = promo?.discountAmount ?? 0
	const taxRate = getTaxRate(form.country, form.stateProvince)
	const tax = Math.max(0, (subtotal - discount) * taxRate)
	const giftFees = form.isGift ? (form.giftCard ? GIFT_CARD_FEE : 0) + (form.giftWrapping ? GIFT_WRAP_FEE : 0) : 0
	const total = Math.max(0, subtotal - discount) + tax + giftFees

	const validate = (): string | null => {
		if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) return 'A valid email address is required.'
		if (!form.phone.trim() || !isValidPhone(form.phone)) return 'A valid phone number (10–15 digits) is required.'
		if (!form.line1.trim()) return 'Street address is required.'
		if (!form.city.trim()) return 'City is required.'
		if (!form.stateProvince.trim()) return form.country === 'CA' ? 'Province is required.' : 'State is required.'
		if (!isValidPostalCode(form.country, form.postalCode))
			return form.country === 'CA' ? 'Enter a valid Canadian postal code (e.g. A1A 1A1).' : 'Enter a valid US ZIP code (e.g. 90210).'
		return null
	}

	const applyPromo = async () => {
		if (!form.promoCode.trim()) return
		setCheckingPromo(true)
		try {
			const res = await fetch('/api/promotions/auto', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					subtotal,
					cartItems: (items ?? []).map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
					country: form.country,
					userEmail: form.email,
					promoCode: form.promoCode.trim(),
				}),
			})
			const json = await res.json()
			if (json.valid) {
				setPromo({ code: form.promoCode.trim(), discountAmount: json.discountAmount })
				toast({ title: 'Promo applied', description: `You saved $${json.discountAmount.toFixed(2)}.`, variant: 'success' })
			} else {
				setPromo(null)
				toast({ title: 'Promo not applied', description: json.message ?? 'Code invalid or expired', variant: 'error' })
			}
		} catch {
			toast({ title: 'Promo check failed', description: 'Please try again.', variant: 'error' })
		} finally {
			setCheckingPromo(false)
		}
	}

	const checkoutPayload = () => ({
		cartItems: (items ?? []).map((i) => ({ productId: i.productId, variantId: i.variantId, quantity: i.quantity })),
		shippingAddress: {
			line1: form.line1,
			line2: form.line2 || undefined,
			city: form.city,
			stateProvince: form.stateProvince,
			postalCode: form.postalCode,
			country: form.country,
		},
		gift: form.isGift
			? {
					isGift: true,
					recipientName: form.giftRecipientName,
					recipientPhone: form.giftRecipientPhone,
					message: form.giftMessage,
					giftCard: form.giftCard,
					giftWrapping: form.giftWrapping,
			  }
			: null,
		promoCode: promo?.code,
		userId: user?.id ?? null,
		userEmail: form.email,
		marketplace: form.country === 'CA' ? 'CA' : marketplace === 'CA' ? 'CA' : 'US',
	})

	const handleStripe = async () => {
		const error = validate()
		if (error) {
			toast({ title: 'Check your details', description: error, variant: 'error' })
			return
		}
		setPlacing(true)
		try {
			const res = await fetch('/api/checkout/stripe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(checkoutPayload()),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error ?? 'Checkout failed')
			window.location.href = json.url
		} catch (err) {
			toast({
				title: 'Unable to start payment',
				description: err instanceof Error ? err.message : 'Please try again.',
				variant: 'error',
			})
			setPlacing(false)
		}
	}

	// ---- PayPal smart buttons ----
	const paypalClientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
	useEffect(() => {
		if (!paypalClientId || !items || items.length === 0 || paypalRendered.current) return
		const renderButtons = () => {
			if (paypalRendered.current || !paypalRef.current || !window.paypal) return
			paypalRendered.current = true
			let pendingCheckout: any = null
			window.paypal
				.Buttons({
					style: { layout: 'horizontal', shape: 'pill', tagline: false, height: 44 },
					createOrder: async () => {
						const error = validate()
						if (error) {
							toast({ title: 'Check your details', description: error, variant: 'error' })
							throw new Error(error)
						}
						const res = await fetch('/api/checkout/paypal', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify(checkoutPayload()),
						})
						const json = await res.json()
						if (!res.ok) {
							toast({ title: 'Unable to start PayPal', description: json.error, variant: 'error' })
							throw new Error(json.error)
						}
						pendingCheckout = json
						return json.paypalOrderId
					},
					onApprove: async (data: { orderID: string }) => {
						const res = await fetch('/api/checkout/paypal/capture', {
							method: 'POST',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								paypalOrderId: data.orderID,
								orderReference: pendingCheckout?.orderReference,
								checkout: pendingCheckout?.checkout,
							}),
						})
						const json = await res.json()
						if (json.success) {
							clearLocalCart()
							localStorage.removeItem(DRAFT_KEY)
							router.push(`/checkout/success?ref=${json.orderReference}`)
						} else {
							toast({ title: 'Payment failed', description: json.error ?? 'PayPal capture failed', variant: 'error' })
						}
					},
					onError: () => {
						toast({ title: 'PayPal error', description: 'The PayPal flow was interrupted.', variant: 'error' })
					},
				})
				.render(paypalRef.current)
		}

		if (window.paypal) {
			renderButtons()
			return
		}
		const script = document.createElement('script')
		script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(paypalClientId)}&currency=USD&intent=capture`
		script.onload = renderButtons
		document.body.appendChild(script)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [paypalClientId, items])

	const inputClass =
		'w-full px-4 py-3 border border-border rounded-xl bg-background text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-all'

	const regions = form.country === 'CA' ? CA_PROVINCE_TAX : US_STATE_TAX

	return (
		<main className="min-h-screen bg-background">
			<Navigation />

			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
				<h1 className="text-3xl font-bold text-foreground tracking-luxury uppercase mb-4">Checkout</h1>

				{/* No-returns warning banner */}
				<div className="flex items-start gap-3 p-4 bg-secondary border border-border rounded-2xl mb-10">
					<AlertTriangle className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" />
					<p className="text-xs text-foreground/75 leading-relaxed">{FINAL_SALE_NOTICE}</p>
				</div>

				{items === null ? (
					<FormShimmer />
				) : items.length === 0 ? (
					<div className="text-center py-24 border border-dashed border-border rounded-3xl">
						<p className="text-muted-foreground text-sm mb-6">There is nothing to check out yet.</p>
						<Link
							href="/products"
							className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-[0.18em] hover:opacity-90 transition-all"
						>
							Browse Products
						</Link>
					</div>
				) : (
					<div className="grid lg:grid-cols-5 gap-10">
						{/* Form */}
						<div className="lg:col-span-3 space-y-8">
							<div className="bg-card border border-border rounded-3xl p-7">
								<h2 className="text-sm font-bold uppercase tracking-[0.18em] text-card-foreground mb-6">Contact</h2>
								<div className="grid sm:grid-cols-2 gap-4">
									<input type="email" placeholder="Email address" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />
									<input type="tel" placeholder="Phone number" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} />
								</div>
							</div>

							<div className="bg-card border border-border rounded-3xl p-7">
								<h2 className="text-sm font-bold uppercase tracking-[0.18em] text-card-foreground mb-6">Shipping Address</h2>
								<div className="grid sm:grid-cols-2 gap-4">
									<select
										value={form.country}
										onChange={(e) => set('country', e.target.value as 'US' | 'CA')}
										className={`${inputClass} cursor-pointer`}
									>
										<option value="US">United States</option>
										<option value="CA">Canada</option>
									</select>
									<select
										value={form.stateProvince}
										onChange={(e) => set('stateProvince', e.target.value)}
										className={`${inputClass} cursor-pointer`}
									>
										<option value="">{form.country === 'CA' ? 'Select province' : 'Select state'}</option>
										{regions.map((r) => (
											<option key={r.code} value={r.code}>{r.name}</option>
										))}
									</select>
									<input placeholder="Street address" value={form.line1} onChange={(e) => set('line1', e.target.value)} className={`${inputClass} sm:col-span-2`} />
									<input placeholder="Apartment, suite (optional)" value={form.line2} onChange={(e) => set('line2', e.target.value)} className={`${inputClass} sm:col-span-2`} />
									<input placeholder="City" value={form.city} onChange={(e) => set('city', e.target.value)} className={inputClass} />
									<input
										placeholder={form.country === 'CA' ? 'Postal code (A1A 1A1)' : 'ZIP code (90210)'}
										value={form.postalCode}
										onChange={(e) => set('postalCode', e.target.value)}
										className={inputClass}
									/>
								</div>
							</div>

							{/* Gift options */}
							<div className="bg-card border border-border rounded-3xl p-7">
								<label className="flex items-center gap-3 cursor-pointer">
									<input
										type="checkbox"
										checked={form.isGift}
										onChange={(e) => set('isGift', e.target.checked)}
										className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
									/>
									<Gift className="w-4 h-4 text-primary" />
									<span className="text-sm font-semibold text-card-foreground">This order is a gift</span>
								</label>
								{form.isGift && (
									<div className="mt-6 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
										<div className="grid sm:grid-cols-2 gap-4">
											<input placeholder="Recipient name" value={form.giftRecipientName} onChange={(e) => set('giftRecipientName', e.target.value)} className={inputClass} />
											<input placeholder="Recipient phone" value={form.giftRecipientPhone} onChange={(e) => set('giftRecipientPhone', e.target.value)} className={inputClass} />
										</div>
										<textarea
											placeholder="Gift message"
											value={form.giftMessage}
											onChange={(e) => set('giftMessage', e.target.value)}
											rows={2}
											className={`${inputClass} resize-none`}
										/>
										<div className="flex flex-wrap gap-4">
											<label className="flex items-center gap-2.5 px-4 py-2.5 border border-border rounded-full cursor-pointer hover:border-primary transition-colors">
												<input
													type="checkbox"
													checked={form.giftCard}
													onChange={(e) => set('giftCard', e.target.checked)}
													className="w-3.5 h-3.5 accent-[var(--primary)] cursor-pointer"
												/>
												<span className="text-xs text-foreground">Gift Card (+${GIFT_CARD_FEE})</span>
											</label>
											<label className="flex items-center gap-2.5 px-4 py-2.5 border border-border rounded-full cursor-pointer hover:border-primary transition-colors">
												<input
													type="checkbox"
													checked={form.giftWrapping}
													onChange={(e) => set('giftWrapping', e.target.checked)}
													className="w-3.5 h-3.5 accent-[var(--primary)] cursor-pointer"
												/>
												<span className="text-xs text-foreground">Gift Wrapping (+${GIFT_WRAP_FEE})</span>
											</label>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Summary + payment */}
						<div className="lg:col-span-2">
							<div className="bg-card border border-border rounded-3xl p-7 sticky top-32">
								<h2 className="text-sm font-bold uppercase tracking-[0.18em] text-card-foreground mb-6">Order Summary</h2>

								<div className="space-y-3 max-h-56 overflow-y-auto no-scrollbar mb-5">
									{items.map((item) => (
										<div key={`${item.productId}-${item.variantId}`} className="flex justify-between gap-3 text-xs">
											<span className="text-foreground/75 line-clamp-1">
												{item.product.name} × {item.quantity}
											</span>
											<span className="font-medium text-card-foreground shrink-0">
												${(unitPrice(item) * item.quantity).toFixed(2)}
											</span>
										</div>
									))}
								</div>

								{/* Promo code */}
								<div className="flex gap-2 mb-5">
									<div className="relative flex-1">
										<Tag className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
										<input
											placeholder="Promo code"
											value={form.promoCode}
											onChange={(e) => set('promoCode', e.target.value)}
											className={`${inputClass} pl-9`}
										/>
									</div>
									<button
										onClick={applyPromo}
										disabled={checkingPromo}
										className="px-4 py-2 rounded-xl border border-border text-xs font-semibold uppercase tracking-wider hover:border-primary hover:text-primary transition-all cursor-pointer disabled:opacity-50"
									>
										{checkingPromo ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
									</button>
								</div>

								<div className="space-y-2.5 text-sm border-t border-border pt-4">
									<div className="flex justify-between text-foreground/75">
										<span>Subtotal</span>
										<span className="font-medium text-card-foreground">${subtotal.toFixed(2)}</span>
									</div>
									{discount > 0 && (
										<div className="flex justify-between text-primary">
											<span>Discount ({promo?.code})</span>
											<span>-${discount.toFixed(2)}</span>
										</div>
									)}
									<div className="flex justify-between text-foreground/75">
										<span>Tax {form.stateProvince ? `(${form.stateProvince})` : ''}</span>
										<span className="font-medium text-card-foreground">${tax.toFixed(2)}</span>
									</div>
									{giftFees > 0 && (
										<div className="flex justify-between text-foreground/75">
											<span>Gift options</span>
											<span className="font-medium text-card-foreground">${giftFees.toFixed(2)}</span>
										</div>
									)}
									<div className="flex justify-between text-base font-bold text-card-foreground border-t border-border pt-3">
										<span>Total</span>
										<span>${total.toFixed(2)}</span>
									</div>
								</div>

								<button
									onClick={handleStripe}
									disabled={placing}
									className="mt-6 w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:opacity-90 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
								>
									{placing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
									{placing ? 'Redirecting...' : 'Pay with Card'}
								</button>

								{paypalClientId && (
									<>
										<div className="flex items-center gap-3 my-4">
											<div className="flex-1 h-px bg-border" />
											<span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">or</span>
											<div className="flex-1 h-px bg-border" />
										</div>
										<div ref={paypalRef} />
									</>
								)}

								<p className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground mt-5 uppercase tracking-[0.14em]">
									<Lock className="w-3 h-3" />
									Secure encrypted payment
								</p>
							</div>
						</div>
					</div>
				)}
			</div>

			<Footer />
		</main>
	)
}
