'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Gift, Loader2, Lock, Tag, User, MapPin, ShoppingBag, ShieldCheck } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { FormShimmer } from '@/components/shimmer'
import { CountrySelect } from '@/components/ui/country-select'
import { useToast } from '@/components/ui/toast'
import { useAuth } from '@/contexts/auth-context'
import { useMarketplace } from '@/contexts/marketplace-context'
import { supabase } from '@/lib/supabase'
import { loadCartItems, clearLocalCart, type LocalCartItem } from '@/lib/cart'
import { fetchProductById, fetchTaxRates } from '@/lib/data'
import { taxRateForCountry, isValidPostalCode, isValidPhone, US_STATE_TAX, CA_PROVINCE_TAX } from '@/lib/tax'
import { primaryImage, type Product, type ProductVariant, type TaxRate } from '@/lib/types'

const DRAFT_KEY = 'cellkore_checkout_draft'
const FINAL_SALE_NOTICE = 'Returns and Exchanges are not supported. All checkout items are final.'
const GIFT_CARD_FEE = 5
const GIFT_WRAP_FEE = 10

interface CheckoutForm {
	firstName: string
	lastName: string
	email: string
	phone: string
	line1: string
	line2: string
	city: string
	stateProvince: string
	postalCode: string
	country: string
	deliveryNotes: string
	isGift: boolean
	giftRecipientName: string
	giftRecipientPhone: string
	giftMessage: string
	giftCard: boolean
	giftWrapping: boolean
	promoCode: string
}

const EMPTY_FORM: CheckoutForm = {
	firstName: '',
	lastName: '',
	email: '',
	phone: '',
	line1: '',
	line2: '',
	city: '',
	stateProvince: '',
	postalCode: '',
	country: 'US',
	deliveryNotes: '',
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
	const [taxRates, setTaxRates] = useState<TaxRate[]>([])
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
			const userFullName = (user as any).full_name || user.user_metadata?.full_name || user.user_metadata?.name || ''
			const nameParts = userFullName.split(' ')
			const userFirst = nameParts[0] || ''
			const userLast = nameParts.slice(1).join(' ') || ''

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
						const addrName = (data.full_name || data.name || '').split(' ')
						const fn = addrName[0] || userFirst
						const ln = addrName.slice(1).join(' ') || userLast

						setForm((f) => ({
							...f,
							firstName: f.firstName || fn,
							lastName: f.lastName || ln,
							email: f.email || user.email || '',
							line1: f.line1 || data.line1,
							line2: f.line2 || data.line2 || '',
							city: f.city || data.city,
							stateProvince: f.stateProvince || data.state_province || '',
							postalCode: f.postalCode || data.postal_code || '',
							country: data.country || 'US',
						}))
					} else {
						setForm((f) => ({
							...f,
							firstName: f.firstName || userFirst,
							lastName: f.lastName || userLast,
							email: f.email || user.email || '',
						}))
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

	// ---- Load active tax rates ----
	useEffect(() => {
		fetchTaxRates().then(setTaxRates).catch(() => setTaxRates([]))
	}, [])

	// ---- Load cart in parallel ----
	useEffect(() => {
		if (authLoading) return
		let active = true
		;(async () => {
			try {
				const raw = await loadCartItems(user?.id ?? null)
				const hydrated = await Promise.all(
					raw.map(async (item) => {
						const product = await fetchProductById(item.productId)
						return product ? { ...item, product } : null
					})
				)
				if (active) {
					setItems(hydrated.filter(Boolean) as HydratedItem[])
				}
			} catch {
				if (active) setItems([])
			}
		})()
		return () => {
			active = false
		}
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
	const taxRate = taxRateForCountry(taxRates, form.country)
	const tax = Math.max(0, (subtotal - discount) * taxRate)
	const giftFees = form.isGift ? (form.giftCard ? GIFT_CARD_FEE : 0) + (form.giftWrapping ? GIFT_WRAP_FEE : 0) : 0
	const total = Math.max(0, subtotal - discount) + tax + giftFees

	const validate = (): string | null => {
		if (!form.firstName.trim()) return 'First name is required.'
		if (!form.lastName.trim()) return 'Last name is required.'
		if (!form.email.trim() || !/^\S+@\S+\.\S+$/.test(form.email)) return 'A valid email address is required.'
		if (!form.phone.trim() || !isValidPhone(form.phone)) return 'A valid phone number (10–15 digits) is required.'
		if (!form.line1.trim()) return 'Street address is required.'
		if (!form.city.trim()) return 'City is required.'
		if (!form.stateProvince.trim())
			return form.country === 'CA' ? 'Province is required.' : form.country === 'US' ? 'State is required.' : 'State/Province/Region is required.'
		if (!isValidPostalCode(form.country, form.postalCode))
			return form.country === 'CA'
				? 'Enter a valid Canadian postal code (e.g. A1A 1A1).'
				: form.country === 'US'
				? 'Enter a valid US ZIP code (e.g. 90210).'
				: 'Enter a valid postal code.'
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
			fullName: `${form.firstName} ${form.lastName}`.trim(),
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
		'w-full px-4 py-3.5 border border-[#CFD6D0] rounded-2xl bg-white text-sm font-semibold text-[#0f172a] placeholder:text-muted-foreground/70 placeholder:font-normal focus:outline-none focus:border-[#599161] focus:ring-2 focus:ring-[#599161]/25 shadow-2xs transition-all'

	const regions = form.country === 'CA' ? CA_PROVINCE_TAX : form.country === 'US' ? US_STATE_TAX : []

	return (
		<main className="min-h-screen bg-[#F6F8F6]">
			<Navigation />

			<div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
				<h1 className="text-3xl font-extrabold text-[#0f172a] tracking-luxury uppercase mb-6">Secure Checkout</h1>

				{/* No-returns warning banner */}
				<div className="flex items-start gap-3 p-4 bg-white border border-[#DDE4DE] rounded-2xl mb-10 shadow-2xs">
					<AlertTriangle className="w-4.5 h-4.5 text-[#599161] shrink-0 mt-0.5" />
					<p className="text-xs text-[#0f172a]/80 font-medium leading-relaxed">{FINAL_SALE_NOTICE}</p>
				</div>

				{items === null ? (
					<FormShimmer />
				) : items.length === 0 ? (
					<div className="text-center py-24 border border-dashed border-[#DDE4DE] rounded-3xl bg-white shadow-xs">
						<p className="text-muted-foreground text-sm font-medium mb-6">There is nothing to check out yet.</p>
						<Link
							href="/products?category=iphones"
							className="inline-block px-8 py-3.5 bg-[#599161] text-white rounded-full text-xs font-extrabold uppercase tracking-[0.18em] hover:bg-[#46754e] transition-all shadow-md"
						>
							Browse Products
						</Link>
					</div>
				) : (
					<div className="grid lg:grid-cols-5 gap-8 lg:gap-10">
						{/* Form */}
						<div className="lg:col-span-3 space-y-8">
							<div className="bg-white border border-[#DDE4DE] rounded-3xl p-6 sm:p-8 shadow-xs">
								<h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#0f172a] mb-6 flex items-center gap-2 border-b border-[#E0E6E1] pb-3.5">
									<User className="w-4.5 h-4.5 text-[#599161]" />
									Contact Information
								</h2>
								<div className="grid sm:grid-cols-2 gap-4">
									<input type="email" placeholder="Email address" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass} />
									<input type="tel" placeholder="Phone number" value={form.phone} onChange={(e) => set('phone', e.target.value)} className={inputClass} />
								</div>
							</div>

							<div className="bg-white border border-[#DDE4DE] rounded-3xl p-6 sm:p-8 shadow-xs">
								<h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#0f172a] mb-6 flex items-center gap-2 border-b border-[#E0E6E1] pb-3.5">
									<MapPin className="w-4.5 h-4.5 text-[#599161]" />
									Shipping Address
								</h2>
								<div className="grid sm:grid-cols-2 gap-4">
									<input placeholder="First name" value={form.firstName} onChange={(e) => set('firstName', e.target.value)} className={inputClass} />
									<input placeholder="Last name" value={form.lastName} onChange={(e) => set('lastName', e.target.value)} className={inputClass} />
									<CountrySelect
										value={form.country}
										onChange={(code) => {
											set('country', code)
											set('stateProvince', '')
										}}
										className={inputClass}
									/>
									{regions.length > 0 ? (
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
									) : (
										<input
											placeholder="State / Province / Region"
											value={form.stateProvince}
											onChange={(e) => set('stateProvince', e.target.value)}
											className={inputClass}
										/>
									)}
									<input placeholder="Street address" value={form.line1} onChange={(e) => set('line1', e.target.value)} className={`${inputClass} sm:col-span-2`} />
									<input placeholder="Apartment, suite (optional)" value={form.line2} onChange={(e) => set('line2', e.target.value)} className={`${inputClass} sm:col-span-2`} />
									<input placeholder="City" value={form.city} onChange={(e) => set('city', e.target.value)} className={inputClass} />
									<input
										placeholder={
											form.country === 'CA' ? 'Postal code (A1A 1A1)' : form.country === 'US' ? 'ZIP code (90210)' : 'Postal code'
										}
										value={form.postalCode}
										onChange={(e) => set('postalCode', e.target.value)}
										className={inputClass}
									/>
									<textarea
										placeholder="Special delivery instructions (optional - e.g. gate code, leave at porch, ring doorbell)"
										value={form.deliveryNotes}
										onChange={(e) => set('deliveryNotes', e.target.value)}
										rows={2}
										className={`${inputClass} sm:col-span-2 resize-none`}
									/>
								</div>
							</div>

							{/* Gift options */}
							<div className="bg-white border border-[#DDE4DE] rounded-3xl p-6 sm:p-8 shadow-xs">
								<label className="flex items-center gap-3 cursor-pointer">
									<input
										type="checkbox"
										checked={form.isGift}
										onChange={(e) => set('isGift', e.target.checked)}
										className="w-4 h-4 accent-[#599161] cursor-pointer"
									/>
									<Gift className="w-4.5 h-4.5 text-[#599161]" />
									<span className="text-sm font-extrabold text-[#0f172a]">This order is a gift</span>
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
											<label className="flex items-center gap-2.5 px-4 py-2.5 border border-[#CFD6D0] rounded-full cursor-pointer hover:border-[#599161] transition-colors font-semibold text-xs text-[#0f172a]">
												<input
													type="checkbox"
													checked={form.giftCard}
													onChange={(e) => set('giftCard', e.target.checked)}
													className="w-3.5 h-3.5 accent-[#599161] cursor-pointer"
												/>
												<span>Gift Card (+${GIFT_CARD_FEE})</span>
											</label>
											<label className="flex items-center gap-2.5 px-4 py-2.5 border border-[#CFD6D0] rounded-full cursor-pointer hover:border-[#599161] transition-colors font-semibold text-xs text-[#0f172a]">
												<input
													type="checkbox"
													checked={form.giftWrapping}
													onChange={(e) => set('giftWrapping', e.target.checked)}
													className="w-3.5 h-3.5 accent-[#599161] cursor-pointer"
												/>
												<span>Gift Wrapping (+${GIFT_WRAP_FEE})</span>
											</label>
										</div>
									</div>
								)}
							</div>
						</div>

						{/* Summary + payment */}
						<div className="lg:col-span-2">
							<div className="bg-white border border-[#DDE4DE] rounded-3xl p-6 sm:p-8 shadow-sm">
								<h2 className="text-sm font-black uppercase tracking-[0.2em] text-[#0f172a] mb-6 flex items-center gap-2 border-b border-[#E0E6E1] pb-3.5">
									<ShoppingBag className="w-4.5 h-4.5 text-[#599161]" />
									Order Summary
								</h2>

								<div className="space-y-3 mb-6">
									{items.map((item) => {
										const imgSrc = primaryImage(item.product)
										const variant = item.product.product_variants?.find((v: ProductVariant) => v.id === item.variantId)
										const variantLabel = variant ? [variant.storage, variant.color, variant.condition].filter(Boolean).join(' • ') : null
										return (
											<div key={`${item.productId}-${item.variantId}`} className="flex items-center gap-3 bg-[#F8FAF8] p-2.5 rounded-2xl border border-[#E0E6E1]/80">
												<div className="w-12 h-12 rounded-xl bg-white border border-[#E0E6E1] shrink-0 p-1 flex items-center justify-center overflow-hidden shadow-2xs">
													{imgSrc ? (
														<img src={imgSrc} alt={item.product.name} className="w-full h-full object-contain" />
													) : (
														<ShoppingBag className="w-5 h-5 text-muted-foreground/40" />
													)}
												</div>
												<div className="flex-1 min-w-0">
													<p className="text-[#0f172a] font-bold truncate text-xs leading-snug">{item.product.name}</p>
													{variantLabel && (
														<p className="text-[10px] text-muted-foreground font-medium truncate mt-0.5">{variantLabel}</p>
													)}
													<p className="text-[11px] text-[#599161] font-extrabold mt-0.5">
														${unitPrice(item).toFixed(2)} <span className="text-muted-foreground font-semibold">× {item.quantity}</span>
													</p>
												</div>
												<span className="font-black text-[#0f172a] text-xs sm:text-sm shrink-0">
													${(unitPrice(item) * item.quantity).toFixed(2)}
												</span>
											</div>
										)
									})}
								</div>

								<div className="space-y-3 text-sm border-t border-[#E0E6E1] pt-4">
									<div className="flex justify-between text-[#0f172a]/80 font-semibold text-xs">
										<span>Subtotal</span>
										<span className="font-bold text-[#0f172a]">${subtotal.toFixed(2)}</span>
									</div>
									{discount > 0 && (
										<div className="flex justify-between text-[#599161] font-bold text-xs">
											<span>Discount ({promo?.code})</span>
											<span>-${discount.toFixed(2)}</span>
										</div>
									)}
									<div className="flex justify-between text-[#0f172a]/80 font-semibold text-xs">
										<span>Tax {form.country ? `(${form.country})` : ''}</span>
										<span className="font-bold text-[#0f172a]">${tax.toFixed(2)}</span>
									</div>
									{giftFees > 0 && (
										<div className="flex justify-between text-[#0f172a]/80 font-semibold text-xs">
											<span>Gift options</span>
											<span className="font-bold text-[#0f172a]">${giftFees.toFixed(2)}</span>
										</div>
									)}
									<div className="flex justify-between text-base font-black text-[#0f172a] border-t border-[#E0E6E1] pt-3.5">
										<span>Total</span>
										<span className="text-lg text-[#599161]">${total.toFixed(2)}</span>
									</div>
								</div>

								<div className="space-y-3 mt-6">
									<button
										onClick={handleStripe}
										disabled={placing}
										className="w-full flex items-center justify-center gap-2.5 py-4 bg-[#599161] hover:bg-[#46754e] text-white rounded-full text-xs font-black uppercase tracking-[0.2em] hover:scale-[1.01] active:scale-95 transition-all cursor-pointer shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
									>
										{placing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
										{placing ? 'Redirecting...' : 'Pay with Card'}
									</button>

									{paypalClientId ? (
										<div className="pt-1">
											<div className="flex items-center gap-3 my-3">
												<div className="flex-1 h-px bg-[#E0E6E1]" />
												<span className="text-[10px] uppercase font-bold tracking-[0.2em] text-muted-foreground">or</span>
												<div className="flex-1 h-px bg-[#E0E6E1]" />
											</div>
											<div ref={paypalRef} />
										</div>
									) : (
										<button
											type="button"
											onClick={() =>
												toast({
													variant: 'info',
													title: 'PayPal Option Placed',
													description: 'PayPal checkout option is configured and ready. Connect your PayPal Client ID in environment settings to process live payments.',
												})
											}
											className="w-full flex items-center justify-center gap-2.5 py-3.5 bg-[#FFC439] hover:bg-[#F2BA31] text-[#003087] rounded-full text-xs font-black uppercase tracking-[0.14em] transition-all cursor-pointer shadow-md hover:scale-[1.01] active:scale-95 border border-[#E0B130]"
										>
											<img src="/paypal.svg?v=3" alt="PayPal Logo" className="h-5 w-auto object-contain" />
											<span>Pay with PayPal</span>
										</button>
									)}
								</div>

								<p className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground mt-5 uppercase font-bold tracking-[0.14em]">
									<Lock className="w-3 h-3 text-[#599161]" />
									Secure Encrypted Checkout
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
