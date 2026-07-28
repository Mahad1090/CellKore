'use client'

import { useEffect, useState } from 'react'
import { Loader2, Info } from 'lucide-react'
import { Modal, adminButton, adminButtonGhost, adminInput } from '@/components/admin/ui'
import { useToast } from '@/components/ui/toast'

interface ShipFromSummary {
	name: string
	line1: string
	city: string
	stateProvince: string
	postalCode: string
	country: string
}

interface PickupScheduleModalProps {
	open: boolean
	onClose: () => void
	orderId?: string
	orderReference?: string
	defaultCarrier?: 'ups' | 'canada_post' | null
	onScheduled?: () => void
}

// Shared by the standalone Pickups page (no order context — admin enters a
// piece count for whatever's ready) and the order detail modal (prefills
// the order reference). A pickup always originates from CellKore's
// ship-from/warehouse address (repair_settings.ship_from_*), shown
// read-only here — fixed via Admin -> Store Addresses if wrong.
export function PickupScheduleModal({ open, onClose, orderId, orderReference, defaultCarrier, onScheduled }: PickupScheduleModalProps) {
	const { toast } = useToast()

	const [carrier, setCarrier] = useState<'ups' | 'canada_post'>('ups')
	const [pickupMethod, setPickupMethod] = useState<'standard' | 'smart'>('standard')
	const [date, setDate] = useState('')
	const [readyTime, setReadyTime] = useState('09:00')
	const [closeTime, setCloseTime] = useState('17:00')
	const [pieceCount, setPieceCount] = useState('1')
	const [totalWeightKg, setTotalWeightKg] = useState('')
	const [specialInstruction, setSpecialInstruction] = useState('')
	const [contactEmail, setContactEmail] = useState('')

	const [shipFrom, setShipFrom] = useState<ShipFromSummary | null>(null)
	const [availability, setAvailability] = useState<{ onDemandCutoff?: string; onDemandTour?: boolean } | null>(null)
	const [rate, setRate] = useState<{ cost: number; currency: string } | null>(null)
	const [loadingRate, setLoadingRate] = useState(false)
	const [submitting, setSubmitting] = useState(false)

	const isSmart = carrier === 'ups' && pickupMethod === 'smart'

	useEffect(() => {
		if (!open) return
		setCarrier(defaultCarrier === 'canada_post' ? 'canada_post' : 'ups')
		setPickupMethod('standard')
		const tomorrow = new Date()
		tomorrow.setDate(tomorrow.getDate() + 1)
		setDate(tomorrow.toISOString().slice(0, 10))
		setReadyTime('09:00')
		setCloseTime('17:00')
		setPieceCount('1')
		setTotalWeightKg('')
		setSpecialInstruction(orderReference ? `Order ${orderReference}` : '')
		setContactEmail('')
		setRate(null)
		setAvailability(null)

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
				})
			})
			.catch(() => undefined)
	}, [open, defaultCarrier, orderReference])

	useEffect(() => {
		if (!open || carrier !== 'canada_post' || !shipFrom?.postalCode) {
			setAvailability(null)
			return
		}
		let cancelled = false
		fetch(`/api/admin/pickups/availability?postalCode=${encodeURIComponent(shipFrom.postalCode)}`)
			.then((res) => (res.ok ? res.json() : null))
			.then((json) => {
				if (!cancelled && json) setAvailability(json)
			})
			.catch(() => undefined)
		return () => {
			cancelled = true
		}
	}, [open, carrier, shipFrom?.postalCode])

	if (!open) return null

	const previewCost = async () => {
		if (!date) return
		setLoadingRate(true)
		setRate(null)
		try {
			const res = await fetch('/api/admin/pickups/rate', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ carrier, pickup_date: date, ready_time: readyTime, close_time: closeTime }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			setRate({ cost: json.cost, currency: json.currency })
		} catch (err) {
			toast({ title: 'Could not fetch a cost estimate', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setLoadingRate(false)
		}
	}

	const schedule = async () => {
		if (!isSmart && !date) {
			toast({ title: 'Pickup date is required', variant: 'error' })
			return
		}
		if (carrier === 'canada_post' && !contactEmail.trim()) {
			toast({ title: 'Contact email is required for Canada Post pickups', variant: 'error' })
			return
		}
		setSubmitting(true)
		try {
			const res = await fetch('/api/admin/pickups', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					order_id: orderId,
					carrier,
					pickup_method: carrier === 'ups' ? pickupMethod : undefined,
					pickup_date: date,
					ready_time: readyTime,
					close_time: closeTime,
					piece_count: Number(pieceCount) || 1,
					total_weight_kg: totalWeightKg ? Number(totalWeightKg) : undefined,
					special_instruction: specialInstruction || undefined,
					contact_email: carrier === 'canada_post' ? contactEmail.trim() : undefined,
				}),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Pickup scheduled', variant: 'success' })
			onScheduled?.()
			onClose()
		} catch (err) {
			toast({ title: 'Pickup scheduling failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSubmitting(false)
		}
	}

	return (
		<Modal open={open} onClose={onClose} title="Schedule Pickup" wide>
			<div className="space-y-5">
				<div>
					<p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-2">Carrier</p>
					<div className="flex gap-2">
						{(['ups', 'canada_post'] as const).map((c) => (
							<button
								key={c}
								type="button"
								onClick={() => setCarrier(c)}
								className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all cursor-pointer ${
									carrier === c ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground/70 hover:border-primary'
								}`}
							>
								{c === 'ups' ? 'UPS' : 'Canada Post'}
							</button>
						))}
					</div>
				</div>

				{carrier === 'ups' && (
					<div>
						<p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-2">Pickup Type</p>
						<div className="flex gap-2">
							{(['standard', 'smart'] as const).map((m) => (
								<button
									key={m}
									type="button"
									onClick={() => setPickupMethod(m)}
									className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wide border transition-all cursor-pointer ${
										pickupMethod === m ? 'bg-primary text-primary-foreground border-primary' : 'border-border text-foreground/70 hover:border-primary'
									}`}
								>
									{m === 'standard' ? 'Standard' : 'Smart Pickup'}
								</button>
							))}
						</div>
						{isSmart && (
							<p className="flex items-start gap-1.5 text-[11px] text-muted-foreground mt-2">
								<Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
								UPS picks up at the account&apos;s pre-configured address on the next available day — no address or piece details needed.
							</p>
						)}
					</div>
				)}

				{shipFrom && (
					<div className="text-xs text-muted-foreground bg-secondary/40 rounded-xl p-3">
						<span className="font-bold text-foreground/80">Pickup address (ship-from): </span>
						{shipFrom.name}, {shipFrom.line1}, {shipFrom.city}, {shipFrom.stateProvince} {shipFrom.postalCode}
					</div>
				)}

				{carrier === 'canada_post' && availability && (
					<div className="text-xs rounded-xl p-3 border border-border">
						{availability.onDemandTour ? (
							<span className="text-foreground/80">On-demand pickup available for this postal code — cutoff {availability.onDemandCutoff || 'n/a'} local time.</span>
						) : (
							<span className="text-destructive">On-demand pickup is not available for this postal code.</span>
						)}
					</div>
				)}

				{!isSmart && (
					<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<label className="block">
							<span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Pickup Date</span>
							<input type="date" value={date} onChange={(e) => setDate(e.target.value)} className={`${adminInput} mt-1.5`} />
						</label>
						<label className="block">
							<span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Ready Time</span>
							<input type="time" value={readyTime} onChange={(e) => setReadyTime(e.target.value)} className={`${adminInput} mt-1.5`} />
						</label>
						<label className="block">
							<span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Close Time</span>
							<input type="time" value={closeTime} onChange={(e) => setCloseTime(e.target.value)} className={`${adminInput} mt-1.5`} />
						</label>
					</div>
				)}

				{!isSmart && (
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
						<label className="block">
							<span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Pieces Ready</span>
							<input
								type="number"
								min={1}
								value={pieceCount}
								onChange={(e) => setPieceCount(e.target.value)}
								className={`${adminInput} mt-1.5`}
							/>
						</label>
						<label className="block">
							<span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Total Weight (kg, optional)</span>
							<input
								type="number"
								min={0}
								step="0.1"
								value={totalWeightKg}
								onChange={(e) => setTotalWeightKg(e.target.value)}
								className={`${adminInput} mt-1.5`}
							/>
						</label>
					</div>
				)}

				{carrier === 'canada_post' && (
					<label className="block">
						<span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Contact Email</span>
						<input
							type="email"
							value={contactEmail}
							onChange={(e) => setContactEmail(e.target.value)}
							placeholder="warehouse@cellkore.com"
							className={`${adminInput} mt-1.5`}
						/>
					</label>
				)}

				<label className="block">
					<span className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
						{carrier === 'canada_post' ? 'Pickup Instructions' : 'Special Instruction'}
					</span>
					<input
						type="text"
						value={specialInstruction}
						onChange={(e) => setSpecialInstruction(e.target.value)}
						placeholder="e.g. Ready at front desk"
						className={`${adminInput} mt-1.5`}
					/>
				</label>

				{!isSmart && (
					<div className="flex items-center gap-3">
						<button type="button" onClick={previewCost} disabled={loadingRate || !date} className={adminButtonGhost}>
							{loadingRate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
							Preview Cost
						</button>
						{rate && (
							<span className="text-xs font-bold text-foreground">
								Estimated: {rate.cost.toFixed(2)} {rate.currency}
							</span>
						)}
					</div>
				)}

				<div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
					<button type="button" onClick={onClose} className={adminButtonGhost}>
						Cancel
					</button>
					<button type="button" onClick={schedule} disabled={submitting} className={adminButton}>
						{submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
						Confirm &amp; Schedule
					</button>
				</div>
			</div>
		</Modal>
	)
}
