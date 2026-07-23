'use client'

import { useCallback, useEffect, useState } from 'react'
import { MapPin, Truck, Loader2 } from 'lucide-react'
import { PageTitle, adminInput } from '@/components/admin/ui'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import { normalizeAddressNewlines } from '@/lib/data'

export default function AdminAddressesPage() {
	const { toast } = useToast()
	const { can } = useAdmin()

	const [mailInAddress, setMailInAddress] = useState('')
	const [warehouseAddress, setWarehouseAddress] = useState('')
	const [saving, setSaving] = useState(false)

	const loadSettings = useCallback(() => {
		fetch('/api/admin/repair-settings')
			.then((res) => res.json())
			.then((json) => {
				if (json.settings) {
					setMailInAddress(normalizeAddressNewlines(json.settings.mail_in_address ?? ''))
					setWarehouseAddress(normalizeAddressNewlines(json.settings.warehouse_address ?? ''))
				}
			})
			.catch(() => undefined)
	}, [])

	useEffect(loadSettings, [loadSettings])

	const saveAddresses = async () => {
		setSaving(true)
		try {
			const res = await fetch('/api/admin/repair-settings', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					mail_in_address: mailInAddress,
					warehouse_address: warehouseAddress,
				}),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Store addresses saved', variant: 'success' })
		} catch (err) {
			toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSaving(false)
		}
	}

	const writable = can('settings:write')

	return (
		<div className="max-w-4xl space-y-8 pb-16">
			<PageTitle title="Store Addresses" subtitle="Manage repair facility destinations, warehouse return addresses, and shipping locations" />

			{/* Subpanel 1: Mail-In Repair Address */}
			<section className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-5 font-sans">
				<div className="flex items-center gap-2.5 pb-4 border-b border-border/80">
					<MapPin className="w-5 h-5 text-primary" />
					<div>
						<h2 className="text-lg font-serif font-bold text-foreground tracking-tight font-sans">Mail-In Repair Address</h2>
						<p className="text-xs text-muted-foreground font-sans">
							Shown to customers who select mail-in repair service so they know where to send their device.
						</p>
					</div>
				</div>

				<textarea
					value={mailInAddress}
					onChange={(e) => setMailInAddress(e.target.value)}
					disabled={!writable}
					rows={5}
					placeholder="CellKore Repair Center&#10;123 Service Facility Blvd&#10;Suite 400&#10;City, State ZIP&#10;Country"
					className={`${adminInput} resize-none bg-muted/20 border-border/80 leading-relaxed font-sans text-xs`}
				/>
			</section>

			{/* Subpanel 2: Return & Shipping Warehouse Address */}
			<section className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-5 font-sans">
				<div className="flex items-center gap-2.5 pb-4 border-b border-border/80">
					<Truck className="w-5 h-5 text-primary" />
					<div>
						<h2 className="text-lg font-serif font-bold text-foreground tracking-tight font-sans">Return &amp; Shipping Warehouse Address</h2>
						<p className="text-xs text-muted-foreground font-sans">
							Shown on order receipts, return policy documentation, and customer order return instructions.
						</p>
					</div>
				</div>

				<textarea
					value={warehouseAddress}
					onChange={(e) => setWarehouseAddress(e.target.value)}
					disabled={!writable}
					rows={5}
					placeholder="CellKore Fulfillment Center&#10;789 Logistics Hub Way&#10;Dock Door 12&#10;City, State ZIP&#10;Country"
					className={`${adminInput} resize-none bg-muted/20 border-border/80 leading-relaxed font-sans text-xs`}
				/>

				{writable && (
					<div className="pt-2">
						<button
							type="button"
							onClick={saveAddresses}
							disabled={saving}
							className="px-6 py-3.5 bg-[#599161] hover:bg-[#46754e] text-white font-extrabold text-xs uppercase tracking-[0.16em] rounded-2xl transition-all cursor-pointer shadow-sm flex items-center gap-2 disabled:opacity-50"
						>
							{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
							Save All Addresses
						</button>
					</div>
				)}
			</section>
		</div>
	)
}
