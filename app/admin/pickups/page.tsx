'use client'

import { useCallback, useEffect, useState } from 'react'
import { Loader2, MapPin, DollarSign, PackageCheck, Inbox, Info, RefreshCw } from 'lucide-react'
import { StatusBadge, EmptyState, Modal, adminInput } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'

const CARD = 'p-5 rounded-2xl bg-white border border-[#E9ECEA] space-y-4 shadow-3xs'
const CARD_HEADER = 'flex items-center gap-2 border-b border-[#E9ECEA] pb-2'
const CARD_TITLE = 'text-xs font-bold uppercase tracking-wider text-[#111111]'
const CARD_SUBTITLE = 'text-[10px] text-muted-foreground'
const LABEL = 'text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground'
const PRIMARY_BTN =
	'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#599161] text-white text-[11px] font-bold uppercase tracking-[0.14em] hover:bg-[#48784f] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
const GHOST_BTN =
	'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full border border-[#E9ECEA] text-[11px] font-bold uppercase tracking-[0.14em] text-foreground/75 hover:border-[#599161] hover:text-[#111111] transition-all cursor-pointer disabled:opacity-50'

interface ShipFromSummary {
	name: string
	line1: string
	city: string
	stateProvince: string
	postalCode: string
	country: string
	phone: string
}

function CardHeader({ icon, title, subtitle }: { icon: React.ReactNode; title: string; subtitle: string }) {
	return (
		<div className={CARD_HEADER}>
			<div className="w-7 h-7 rounded-lg bg-[#EEF7F0] flex items-center justify-center text-[#599161] shrink-0">{icon}</div>
			<div>
				<p className={CARD_TITLE}>{title}</p>
				<p className={CARD_SUBTITLE}>{subtitle}</p>
			</div>
		</div>
	)
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<label className="block">
			<span className={LABEL}>{label}</span>
			<div className="mt-1.5">{children}</div>
		</label>
	)
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
	return (
		<label className="flex items-center gap-2 text-xs text-foreground/80 cursor-pointer select-none">
			<input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="w-3.5 h-3.5 accent-[#599161]" />
			{label}
		</label>
	)
}

export default function AdminPickupsPage() {
	const [carrier, setCarrier] = useState<'canada_post' | 'ups'>('canada_post')
	const [shipFrom, setShipFrom] = useState<ShipFromSummary | null>(null)
	const [listVersion, setListVersion] = useState(0)
	const { can } = useAdmin()
	const writable = can('orders:write')

	useEffect(() => {
		fetch('/api/admin/repair-settings')
			.then((res) => res.json())
			.then((json) => {
				if (!json?.settings) return
				setShipFrom({
					name: json.settings.ship_from_name ?? '',
					line1: json.settings.ship_from_line1 ?? '',
					city: json.settings.ship_from_city ?? '',
					stateProvince: json.settings.ship_from_state_province ?? '',
					postalCode: json.settings.ship_from_postal_code ?? '',
					country: json.settings.ship_from_country ?? '',
					phone: json.settings.ship_from_phone ?? '',
				})
			})
			.catch(() => undefined)
	}, [])

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-2xl font-bold text-foreground tracking-wide">Pickups</h1>
				<p className="text-xs text-muted-foreground mt-1.5">Schedule and manage on-demand courier pickup requests.</p>
			</div>

			<div className="flex border-b border-[#E9ECEA] gap-6 text-xs font-bold uppercase tracking-wider text-muted-foreground">
				{(['canada_post', 'ups'] as const).map((c) => (
					<button
						key={c}
						onClick={() => setCarrier(c)}
						className={`py-2.5 border-b-2 cursor-pointer transition-colors ${
							carrier === c ? 'border-[#599161] text-[#111111]' : 'border-transparent hover:text-[#111111]'
						}`}
					>
						{c === 'canada_post' ? 'Canada Post' : 'UPS'}
					</button>
				))}
			</div>

			{carrier === 'canada_post' ? (
				<CanadaPostPanel shipFrom={shipFrom} writable={writable} onScheduled={() => setListVersion((v) => v + 1)} />
			) : (
				<UpsPanel shipFrom={shipFrom} writable={writable} onScheduled={() => setListVersion((v) => v + 1)} />
			)}

			<OpenPickupRequests carrier={carrier} writable={writable} version={listVersion} />
		</div>
	)
}

function CanadaPostPanel({
	shipFrom,
	writable,
	onScheduled,
}: {
	shipFrom: ShipFromSummary | null
	writable: boolean
	onScheduled: () => void
}) {
	const { toast } = useToast()

	// Availability
	const [availPostal, setAvailPostal] = useState('')
	const [availability, setAvailability] = useState<{ onDemandCutoff?: string; onDemandTour?: boolean } | null>(null)
	const [checkingAvail, setCheckingAvail] = useState(false)

	// Price quote
	const [quoteDate, setQuoteDate] = useState('')
	const [quoteContractId, setQuoteContractId] = useState('')
	const [quoteAltPostal, setQuoteAltPostal] = useState('')
	const [quotePriority, setQuotePriority] = useState(false)
	const [quoting, setQuoting] = useState(false)
	const [quoteResult, setQuoteResult] = useState<{ cost: number; currency: string } | null>(null)

	// Schedule form
	const [businessAddress, setBusinessAddress] = useState(true)
	const [contactName, setContactName] = useState('')
	const [email, setEmail] = useState('')
	const [phone, setPhone] = useState('')
	const [telephoneExt, setTelephoneExt] = useState('')
	const [receiveUpdates, setReceiveUpdates] = useState(false)
	const [instructions, setInstructions] = useState('')
	const [fiveTon, setFiveTon] = useState(false)
	const [loadingDock, setLoadingDock] = useState(false)
	const [priority, setPriority] = useState(false)
	const [returns, setReturns] = useState(false)
	const [heavyItem, setHeavyItem] = useState(false)
	const [pickupVolume, setPickupVolume] = useState('')
	const [pickupDate, setPickupDate] = useState('')
	const [preferredTime, setPreferredTime] = useState('13:00')
	const [closingTime, setClosingTime] = useState('15:00')
	const [contractId, setContractId] = useState('')
	const [methodOfPayment, setMethodOfPayment] = useState('')
	const [submitting, setSubmitting] = useState(false)

	useEffect(() => {
		if (!shipFrom) return
		setAvailPostal(shipFrom.postalCode)
		setContactName((v) => v || shipFrom.name)
		setPhone((v) => v || shipFrom.phone)
	}, [shipFrom])

	const checkAvailability = async () => {
		if (!availPostal.trim()) return
		setCheckingAvail(true)
		setAvailability(null)
		try {
			const res = await fetch(`/api/admin/pickups/availability?postalCode=${encodeURIComponent(availPostal.trim())}`)
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			setAvailability(json)
		} catch (err) {
			toast({ title: 'Availability check failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setCheckingAvail(false)
		}
	}

	const getPrice = async () => {
		if (!quoteDate) {
			toast({ title: 'Pick a date first', variant: 'error' })
			return
		}
		setQuoting(true)
		setQuoteResult(null)
		try {
			const res = await fetch('/api/admin/pickups/rate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					carrier: 'canada_post',
					pickup_date: quoteDate,
					contract_id: quoteContractId || undefined,
					priority_flag: quotePriority,
					alternate_address_postal_code: quoteAltPostal || undefined,
				}),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			setQuoteResult({ cost: json.cost, currency: json.currency })
		} catch (err) {
			toast({ title: 'Could not fetch a price', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setQuoting(false)
		}
	}

	const schedule = async () => {
		if (!pickupDate) return toast({ title: 'Pickup date is required', variant: 'error' })
		if (!email.trim()) return toast({ title: 'Email is required', variant: 'error' })
		if (!instructions.trim()) return toast({ title: 'Pickup instructions are required', variant: 'error' })
		if (!pickupVolume.trim()) return toast({ title: 'Pickup volume is required', variant: 'error' })
		setSubmitting(true)
		try {
			const res = await fetch('/api/admin/pickups', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					carrier: 'canada_post',
					business_address_flag: businessAddress,
					contact_name: contactName,
					phone,
					telephone_ext: telephoneExt || undefined,
					contact_email: email,
					receive_email_updates_flag: receiveUpdates,
					special_instruction: instructions,
					five_ton_flag: fiveTon,
					loading_dock_flag: loadingDock,
					priority_flag: priority,
					returns_flag: returns,
					heavy_item_flag: heavyItem,
					pickup_volume: pickupVolume,
					piece_count: 1,
					pickup_date: pickupDate,
					ready_time: preferredTime,
					close_time: closingTime,
					contract_id: contractId || undefined,
					method_of_payment: methodOfPayment || undefined,
				}),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Pickup scheduled', variant: 'success' })
			setInstructions('')
			setPickupVolume('')
			onScheduled()
		} catch (err) {
			toast({ title: 'Pickup scheduling failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className="space-y-6">
			<div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
				<div className={CARD}>
					<CardHeader icon={<MapPin className="w-3.5 h-3.5" />} title="Pickup Availability" subtitle="Check the on-demand cut-off time for a postal code" />
					<div className="flex gap-2">
						<input value={availPostal} onChange={(e) => setAvailPostal(e.target.value)} placeholder="A1A1A1" className={`${adminInput} flex-1`} />
						<button onClick={checkAvailability} disabled={checkingAvail} className={PRIMARY_BTN}>
							{checkingAvail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
							Check
						</button>
					</div>
					{availability && (
						<div className="text-xs rounded-xl p-3 border border-[#E9ECEA]">
							{availability.onDemandTour ? (
								<span className="text-foreground/80">Available — cutoff {availability.onDemandCutoff || 'n/a'} local time.</span>
							) : (
								<span className="text-destructive">On-demand pickup is not available for this postal code.</span>
							)}
						</div>
					)}
				</div>

				<div className={CARD}>
					<CardHeader icon={<DollarSign className="w-3.5 h-3.5" />} title="Price Quote" subtitle="Estimate the cost of a pickup on a given date" />
					<div className="grid grid-cols-2 gap-3">
						<Field label="Date *">
							<input type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} className={adminInput} />
						</Field>
						<Field label="Parcels Agreement # (not your customer number)">
							<input value={quoteContractId} onChange={(e) => setQuoteContractId(e.target.value)} placeholder="Leave blank if you don't have a contract" className={adminInput} />
						</Field>
						<Field label="Alternate Postal Code">
							<input value={quoteAltPostal} onChange={(e) => setQuoteAltPostal(e.target.value)} className={adminInput} />
						</Field>
						<div className="flex items-end pb-2.5">
							<Checkbox checked={quotePriority} onChange={setQuotePriority} label="Priority items" />
						</div>
					</div>
					<div className="flex items-center gap-3">
						<button onClick={getPrice} disabled={quoting} className={PRIMARY_BTN}>
							{quoting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
							Get Price
						</button>
						{quoteResult && (
							<span className="text-xs font-bold text-foreground">
								{quoteResult.cost.toFixed(2)} {quoteResult.currency}
							</span>
						)}
					</div>
				</div>
			</div>

			<div className={CARD}>
				<CardHeader icon={<PackageCheck className="w-3.5 h-3.5" />} title="Schedule a Pickup" subtitle="Request an on-demand Canada Post pickup" />

				<div>
					<p className={`${LABEL} mb-2`}>Pickup Location</p>
					<div className="flex gap-5">
						<label className="flex items-center gap-2 text-xs cursor-pointer">
							<input type="radio" checked={businessAddress} onChange={() => setBusinessAddress(true)} className="accent-[#599161]" />
							Business address on file
						</label>
						<label className="flex items-center gap-2 text-xs cursor-pointer">
							<input type="radio" checked={!businessAddress} onChange={() => setBusinessAddress(false)} className="accent-[#599161]" />
							Alternate / third-party address
						</label>
					</div>
					{!businessAddress && shipFrom && (
						<p className="text-[11px] text-muted-foreground mt-2 bg-secondary/40 rounded-lg p-2.5">
							{shipFrom.name}, {shipFrom.line1}, {shipFrom.city}, {shipFrom.stateProvince} {shipFrom.postalCode}
						</p>
					)}
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<Field label="Contact Name *">
						<input value={contactName} onChange={(e) => setContactName(e.target.value)} className={adminInput} />
					</Field>
					<Field label="Email *">
						<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={adminInput} />
					</Field>
					<Field label="Phone * (999-999-9999)">
						<input value={phone} onChange={(e) => setPhone(e.target.value)} className={adminInput} />
					</Field>
					<Field label="Extension">
						<input value={telephoneExt} onChange={(e) => setTelephoneExt(e.target.value)} className={adminInput} />
					</Field>
				</div>
				<Checkbox checked={receiveUpdates} onChange={setReceiveUpdates} label="Receive email status updates" />

				<Field label={`Pickup Instructions * (${instructions.length}/40)`}>
					<input value={instructions} onChange={(e) => setInstructions(e.target.value.slice(0, 40))} placeholder="e.g. Use side entrance" className={adminInput} />
				</Field>

				<div className="flex flex-wrap gap-4">
					<Checkbox checked={fiveTon} onChange={setFiveTon} label="5-ton truck needed" />
					<Checkbox checked={loadingDock} onChange={setLoadingDock} label="Loading dock available" />
					<Checkbox checked={priority} onChange={setPriority} label="Priority items" />
					<Checkbox checked={returns} onChange={setReturns} label="Returns" />
					<Checkbox checked={heavyItem} onChange={setHeavyItem} label="Heavy items (>23kg)" />
				</div>

				<Field label="Pickup Volume (e.g. '50 parcels')">
					<input value={pickupVolume} onChange={(e) => setPickupVolume(e.target.value.slice(0, 40))} className={adminInput} />
				</Field>

				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<Field label="Pickup Date *">
						<input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className={adminInput} />
					</Field>
					<Field label="Preferred Time *">
						<input type="time" value={preferredTime} onChange={(e) => setPreferredTime(e.target.value)} className={adminInput} />
					</Field>
					<Field label="Closing Time *">
						<input type="time" value={closingTime} onChange={(e) => setClosingTime(e.target.value)} className={adminInput} />
					</Field>
				</div>

				<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
					<Field label="Parcels Agreement # (not your customer number)">
						<input value={contractId} onChange={(e) => setContractId(e.target.value)} placeholder="Leave blank if you don't have a contract" className={adminInput} />
					</Field>
					<Field label="Method of Payment (optional)">
						<input value={methodOfPayment} onChange={(e) => setMethodOfPayment(e.target.value)} placeholder="Defaults to CreditCard" className={adminInput} />
					</Field>
				</div>

				{writable && (
					<button onClick={schedule} disabled={submitting} className={PRIMARY_BTN}>
						{submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
						Schedule Pickup
					</button>
				)}
			</div>
		</div>
	)
}

function UpsPanel({ shipFrom, writable, onScheduled }: { shipFrom: ShipFromSummary | null; writable: boolean; onScheduled: () => void }) {
	const { toast } = useToast()

	const [pickupMethod, setPickupMethod] = useState<'standard' | 'smart'>('standard')

	// Price quote
	const [quoteDate, setQuoteDate] = useState('')
	const [quoteReady, setQuoteReady] = useState('09:00')
	const [quoteClose, setQuoteClose] = useState('17:00')
	const [quoting, setQuoting] = useState(false)
	const [quoteResult, setQuoteResult] = useState<{ cost: number; currency: string } | null>(null)

	// Schedule form
	const [contactName, setContactName] = useState('')
	const [phone, setPhone] = useState('')
	const [instructions, setInstructions] = useState('')
	const [referenceNumber, setReferenceNumber] = useState('')
	const [pieceCount, setPieceCount] = useState('1')
	const [totalWeightKg, setTotalWeightKg] = useState('')
	const [paymentMethod, setPaymentMethod] = useState('01')
	const [pickupDate, setPickupDate] = useState('')
	const [readyTime, setReadyTime] = useState('09:00')
	const [closeTime, setCloseTime] = useState('17:00')
	const [serviceDateOption, setServiceDateOption] = useState<'01' | '02'>('01')
	const [submitting, setSubmitting] = useState(false)

	useEffect(() => {
		if (!shipFrom) return
		setContactName((v) => v || shipFrom.name)
		setPhone((v) => v || shipFrom.phone)
	}, [shipFrom])

	const isSmart = pickupMethod === 'smart'

	const getRate = async () => {
		if (!quoteDate) {
			toast({ title: 'Pick a date first', variant: 'error' })
			return
		}
		setQuoting(true)
		setQuoteResult(null)
		try {
			const res = await fetch('/api/admin/pickups/rate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ carrier: 'ups', pickup_date: quoteDate, ready_time: quoteReady, close_time: quoteClose }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			setQuoteResult({ cost: json.cost, currency: json.currency })
		} catch (err) {
			toast({ title: 'Could not fetch a rate', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setQuoting(false)
		}
	}

	const schedule = async () => {
		if (!isSmart && !pickupDate) return toast({ title: 'Pickup date is required', variant: 'error' })
		setSubmitting(true)
		try {
			const res = await fetch('/api/admin/pickups', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					carrier: 'ups',
					pickup_method: pickupMethod,
					service_date_option: serviceDateOption,
					contact_name: contactName,
					phone,
					special_instruction: instructions || undefined,
					reference_number: referenceNumber || undefined,
					piece_count: Number(pieceCount) || 1,
					total_weight_kg: totalWeightKg ? Number(totalWeightKg) : undefined,
					payment_method: paymentMethod,
					pickup_date: pickupDate,
					ready_time: readyTime,
					close_time: closeTime,
				}),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Pickup scheduled', variant: 'success' })
			setInstructions('')
			onScheduled()
		} catch (err) {
			toast({ title: 'Pickup scheduling failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<div className="space-y-6">
			<div className={CARD}>
				<CardHeader icon={<DollarSign className="w-3.5 h-3.5" />} title="Pickup Rate" subtitle="Estimate the cost of an on-call pickup on a given date" />
				<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
					<Field label="Date *">
						<input type="date" value={quoteDate} onChange={(e) => setQuoteDate(e.target.value)} className={adminInput} />
					</Field>
					<Field label="Ready Time">
						<input type="time" value={quoteReady} onChange={(e) => setQuoteReady(e.target.value)} className={adminInput} />
					</Field>
					<Field label="Close Time">
						<input type="time" value={quoteClose} onChange={(e) => setQuoteClose(e.target.value)} className={adminInput} />
					</Field>
				</div>
				<div className="flex items-center gap-3">
					<button onClick={getRate} disabled={quoting} className={PRIMARY_BTN}>
						{quoting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
						Get Rate
					</button>
					{quoteResult && (
						<span className="text-xs font-bold text-foreground">
							{quoteResult.cost.toFixed(2)} {quoteResult.currency}
						</span>
					)}
				</div>
			</div>

			<div className={CARD}>
				<CardHeader icon={<PackageCheck className="w-3.5 h-3.5" />} title="Schedule a Pickup" subtitle="Request a UPS on-call or Smart Pickup" />

				<div>
					<p className={`${LABEL} mb-2`}>Pickup Type</p>
					<div className="flex gap-5">
						<label className="flex items-center gap-2 text-xs cursor-pointer">
							<input type="radio" checked={pickupMethod === 'standard'} onChange={() => setPickupMethod('standard')} className="accent-[#599161]" />
							Standard
						</label>
						<label className="flex items-center gap-2 text-xs cursor-pointer">
							<input type="radio" checked={pickupMethod === 'smart'} onChange={() => setPickupMethod('smart')} className="accent-[#599161]" />
							Smart Pickup
						</label>
					</div>
				</div>

				{isSmart ? (
					<>
						<p className="flex items-start gap-1.5 text-[11px] text-muted-foreground">
							<Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
							UPS picks up at the account&apos;s pre-configured address on the next available day — no address or piece details needed.
						</p>
						<Field label="Service Date">
							<div className="flex gap-5">
								<label className="flex items-center gap-2 text-xs cursor-pointer">
									<input type="radio" checked={serviceDateOption === '01'} onChange={() => setServiceDateOption('01')} className="accent-[#599161]" />
									Same Day
								</label>
								<label className="flex items-center gap-2 text-xs cursor-pointer">
									<input type="radio" checked={serviceDateOption === '02'} onChange={() => setServiceDateOption('02')} className="accent-[#599161]" />
									Next Business Day
								</label>
							</div>
						</Field>
					</>
				) : (
					<>
						{shipFrom && (
							<p className="text-[11px] text-muted-foreground bg-secondary/40 rounded-lg p-2.5">
								Pickup address (ship-from): {shipFrom.name}, {shipFrom.line1}, {shipFrom.city}, {shipFrom.stateProvince} {shipFrom.postalCode}
							</p>
						)}
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<Field label="Contact Name">
								<input value={contactName} onChange={(e) => setContactName(e.target.value)} className={adminInput} />
							</Field>
							<Field label="Phone">
								<input value={phone} onChange={(e) => setPhone(e.target.value)} className={adminInput} />
							</Field>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<Field label="Special Instruction">
								<input value={instructions} onChange={(e) => setInstructions(e.target.value.slice(0, 57))} placeholder="e.g. Ready at front desk" className={adminInput} />
							</Field>
							<Field label="Reference Number (optional)">
								<input value={referenceNumber} onChange={(e) => setReferenceNumber(e.target.value.slice(0, 35))} className={adminInput} />
							</Field>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
							<Field label="Pieces Ready">
								<input type="number" min={1} value={pieceCount} onChange={(e) => setPieceCount(e.target.value)} className={adminInput} />
							</Field>
							<Field label="Total Weight (kg, optional)">
								<input type="number" min={0} step="0.1" value={totalWeightKg} onChange={(e) => setTotalWeightKg(e.target.value)} className={adminInput} />
							</Field>
						</div>
						<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
							<Field label="Pickup Date *">
								<input type="date" value={pickupDate} onChange={(e) => setPickupDate(e.target.value)} className={adminInput} />
							</Field>
							<Field label="Ready Time">
								<input type="time" value={readyTime} onChange={(e) => setReadyTime(e.target.value)} className={adminInput} />
							</Field>
							<Field label="Close Time">
								<input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className={adminInput} />
							</Field>
						</div>
						<Field label="Payment Method">
							<select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={adminInput}>
								<option value="01">Pay by shipper account</option>
								<option value="04">Pay by 1Z tracking number</option>
								<option value="05">Pay by check or money order</option>
							</select>
						</Field>
					</>
				)}

				{writable && (
					<button onClick={schedule} disabled={submitting} className={PRIMARY_BTN}>
						{submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
						Schedule Pickup
					</button>
				)}
			</div>
		</div>
	)
}

function OpenPickupRequests({ carrier, writable, version }: { carrier: 'canada_post' | 'ups'; writable: boolean; version: number }) {
	const { toast } = useToast()
	const [pickups, setPickups] = useState<any[] | null>(null)
	const [detail, setDetail] = useState<any | null>(null)
	const [busyId, setBusyId] = useState<string | null>(null)
	const [syncing, setSyncing] = useState(false)

	const load = useCallback(() => {
		setPickups(null)
		fetch(`/api/admin/pickups?carrier=${carrier}`)
			.then((res) => res.json())
			.then((json) => setPickups(json.pickups ?? []))
			.catch(() => setPickups([]))
	}, [carrier])

	useEffect(load, [load, version])

	const refreshOne = async (id: string) => {
		setBusyId(id)
		try {
			const res = await fetch(`/api/admin/pickups/${id}/refresh`, { method: 'POST' })
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Status refreshed', variant: 'success' })
			load()
		} catch (err) {
			toast({ title: 'Refresh failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setBusyId(null)
		}
	}

	const cancelOne = async (id: string) => {
		if (!confirm('Cancel this pickup with the carrier?')) return
		setBusyId(id)
		try {
			const res = await fetch(`/api/admin/pickups/${id}`, { method: 'DELETE' })
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Pickup cancelled', variant: 'success' })
			load()
		} catch (err) {
			toast({ title: 'Cancellation failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setBusyId(null)
		}
	}

	const syncFromCarrier = async () => {
		setSyncing(true)
		try {
			const res = await fetch('/api/admin/pickups/sync', { method: 'POST' })
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: `Synced — ${json.inserted} pickup${json.inserted === 1 ? '' : 's'} imported`, variant: 'success' })
			load()
		} catch (err) {
			toast({ title: 'Sync failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSyncing(false)
		}
	}

	return (
		<div className={CARD}>
			<div className="flex items-start justify-between gap-3 border-b border-[#E9ECEA] pb-2">
				<div className="flex items-center gap-2">
					<div className="w-7 h-7 rounded-lg bg-[#EEF7F0] flex items-center justify-center text-[#599161] shrink-0">
						<Inbox className="w-3.5 h-3.5" />
					</div>
					<div>
						<p className={CARD_TITLE}>Open Pickup Requests</p>
						<p className={CARD_SUBTITLE}>All currently scheduled on-demand pickups</p>
					</div>
				</div>
				{writable && (
					<button onClick={syncFromCarrier} disabled={syncing} className={`${GHOST_BTN} !py-1.5 !px-3 shrink-0`}>
						{syncing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
						Sync
					</button>
				)}
			</div>

			{pickups === null ? (
				<TableShimmer rows={3} />
			) : pickups.length === 0 ? (
				<EmptyState message="No pickups scheduled yet." />
			) : (
				<div className="overflow-x-auto -mx-5">
					<table className="w-full text-sm">
						<thead className="bg-secondary/40 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
							<tr>
								<td className="px-5 py-2.5">Date</td>
								<td className="px-5 py-2.5">Order</td>
								<td className="px-5 py-2.5">Pieces</td>
								<td className="px-5 py-2.5">Carrier ID</td>
								<td className="px-5 py-2.5">Status</td>
								<td className="px-5 py-2.5 text-right">Actions</td>
							</tr>
						</thead>
						<tbody className="divide-y divide-[#E9ECEA]">
							{pickups.map((p) => (
								<tr key={p.id} className="hover:bg-secondary/20 transition-colors">
									<td className="px-5 py-2.5 font-mono text-xs">{p.pickup_date}</td>
									<td className="px-5 py-2.5 text-xs text-muted-foreground">{p.orders?.reference ?? '—'}</td>
									<td className="px-5 py-2.5 text-xs">{p.piece_count}</td>
									<td className="px-5 py-2.5 font-mono text-xs">{p.carrier_request_id || '—'}</td>
									<td className="px-5 py-2.5">
										<StatusBadge value={p.status} />
									</td>
									<td className="px-5 py-2.5">
										<div className="flex items-center justify-end gap-2">
											<button onClick={() => setDetail(p)} className="text-xs font-semibold text-[#599161] hover:underline cursor-pointer">
												View
											</button>
											{writable && p.status === 'scheduled' && (
												<>
													<button
														onClick={() => refreshOne(p.id)}
														disabled={busyId === p.id}
														className="text-xs font-semibold text-foreground/70 hover:text-foreground cursor-pointer disabled:opacity-50"
													>
														Refresh
													</button>
													<button
														onClick={() => cancelOne(p.id)}
														disabled={busyId === p.id}
														className="text-xs font-semibold text-destructive hover:underline cursor-pointer disabled:opacity-50"
													>
														Cancel
													</button>
												</>
											)}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			<Modal open={!!detail} onClose={() => setDetail(null)} title="Pickup Details" wide>
				{detail && (
					<div className="space-y-3 text-sm">
						<div className="grid grid-cols-2 gap-3">
							<div>
								<p className={LABEL}>Status</p>
								<StatusBadge value={detail.status} />
							</div>
							<div>
								<p className={LABEL}>Carrier Request ID</p>
								<p className="font-mono text-xs">{detail.carrier_request_id || '—'}</p>
							</div>
							<div>
								<p className={LABEL}>Order</p>
								<p>{detail.orders?.reference ?? '—'}</p>
							</div>
							<div>
								<p className={LABEL}>Estimated Cost</p>
								<p>{detail.estimated_cost != null ? `${detail.estimated_cost} ${detail.currency ?? ''}` : '—'}</p>
							</div>
							<div className="col-span-2">
								<p className={LABEL}>Special Instruction</p>
								<p>{detail.special_instruction || '—'}</p>
							</div>
						</div>
						<div>
							<p className={`${LABEL} mb-1`}>Raw Carrier Response</p>
							<pre className="bg-secondary/40 rounded-xl p-3 text-[10px] overflow-x-auto max-h-64 overflow-y-auto">
								{JSON.stringify(detail.raw_create_response ?? {}, null, 2)}
							</pre>
						</div>
					</div>
				)}
			</Modal>
		</div>
	)
}
