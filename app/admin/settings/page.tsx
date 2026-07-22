'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { PageTitle, Panel, EmptyState, adminButton, adminButtonGhost, adminInput } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { CountrySelect } from '@/components/ui/country-select'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import { normalizeAddressNewlines } from '@/lib/data'
import { SHIPPING_COUNTRIES } from '@/lib/shipping-countries'
import type { SocialLink, TaxRate } from '@/lib/types'

const TABS = [
	{ id: 'tax', label: 'Tax Rates' },
	{ id: 'social', label: 'Social Links' },
	{ id: 'repair', label: 'Repair Service' },
] as const
type TabId = (typeof TABS)[number]['id']

export default function AdminSettingsPage() {
	const { toast, confirm } = useToast()
	const { can } = useAdmin()
	const [tab, setTab] = useState<TabId>('tax')
	const [links, setLinks] = useState<SocialLink[] | null>(null)
	const [newLink, setNewLink] = useState({ platform: '', url: '' })
	const [saving, setSaving] = useState(false)

	const [rates, setRates] = useState<TaxRate[] | null>(null)
	const [newRateCountry, setNewRateCountry] = useState('')
	const [newRatePercent, setNewRatePercent] = useState('')
	const [savingRate, setSavingRate] = useState(false)

	const [mailInAddress, setMailInAddress] = useState('')
	const [savingRepair, setSavingRepair] = useState(false)

	const loadRepairSettings = useCallback(() => {
		fetch('/api/admin/repair-settings')
			.then((res) => res.json())
			.then((json) => setMailInAddress(normalizeAddressNewlines(json.settings?.mail_in_address ?? '')))
			.catch(() => undefined)
	}, [])

	useEffect(loadRepairSettings, [loadRepairSettings])

	const saveRepairSettings = async () => {
		setSavingRepair(true)
		try {
			const res = await fetch('/api/admin/repair-settings', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ mail_in_address: mailInAddress }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Repair settings saved', variant: 'success' })
		} catch (err) {
			toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSavingRepair(false)
		}
	}

	const load = useCallback(() => {
		fetch('/api/admin/social-links')
			.then((res) => res.json())
			.then((json) => setLinks(json.links ?? []))
			.catch(() => setLinks([]))
	}, [])

	useEffect(load, [load])

	const loadRates = useCallback(() => {
		fetch('/api/admin/tax-rates')
			.then((res) => res.json())
			.then((json) => setRates(json.rates ?? []))
			.catch(() => setRates([]))
	}, [])

	useEffect(loadRates, [loadRates])

	const availableCountries = useMemo(
		() => SHIPPING_COUNTRIES.filter((c) => !(rates ?? []).some((r) => r.country_code === c.code)),
		[rates]
	)

	const addRate = async () => {
		const country = SHIPPING_COUNTRIES.find((c) => c.code === newRateCountry)
		const percent = Number(newRatePercent)
		if (!country || !newRatePercent.trim() || Number.isNaN(percent) || percent < 0) {
			toast({ title: 'Pick a country and a valid tax %', variant: 'error' })
			return
		}
		setSavingRate(true)
		try {
			const res = await fetch('/api/admin/tax-rates', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					country_code: country.code,
					country_name: country.name,
					tax_rate: percent / 100,
					is_active: true,
				}),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Tax rate added', variant: 'success' })
			setNewRateCountry('')
			setNewRatePercent('')
			loadRates()
		} catch (err) {
			toast({ title: 'Add failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSavingRate(false)
		}
	}

	const updateRate = async (rate: TaxRate, patch: Partial<Pick<TaxRate, 'tax_rate' | 'is_active'>>) => {
		const res = await fetch(`/api/admin/tax-rates/${rate.id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(patch),
		})
		if (!res.ok) {
			const json = await res.json()
			toast({ title: 'Update failed', description: json.error, variant: 'error' })
		}
		loadRates()
	}

	const removeRate = async (rate: TaxRate) => {
		const ok = await confirm({
			title: 'Remove tax rate?',
			description: `${rate.country_name} will fall back to 0% tax at checkout.`,
			confirmLabel: 'Remove',
			destructive: true,
		})
		if (!ok) return
		await fetch(`/api/admin/tax-rates/${rate.id}`, { method: 'DELETE' })
		loadRates()
	}

	const add = async () => {
		if (!newLink.platform.trim() || !newLink.url.trim()) return
		setSaving(true)
		try {
			const res = await fetch('/api/admin/social-links', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...newLink, is_active: true }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			setNewLink({ platform: '', url: '' })
			toast({ title: 'Social link added', variant: 'success' })
			load()
		} catch (err) {
			toast({ title: 'Add failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSaving(false)
		}
	}

	const update = async (link: SocialLink) => {
		const res = await fetch('/api/admin/social-links', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(link),
		})
		if (!res.ok) {
			const json = await res.json()
			toast({ title: 'Update failed', description: json.error, variant: 'error' })
		}
		load()
	}

	const remove = async (link: SocialLink) => {
		const ok = await confirm({
			title: 'Remove social link?',
			description: `The ${link.platform} link will be removed from the storefront footer.`,
			confirmLabel: 'Remove',
			destructive: true,
		})
		if (!ok) return
		await fetch(`/api/admin/social-links?id=${link.id}`, { method: 'DELETE' })
		load()
	}

	const writable = can('settings:write')

	return (
		<div>
			<PageTitle title="Settings" subtitle="Tax rates, storefront footer links, and repair service configuration" />

			<div className="flex items-center gap-2 mb-8 border-b border-border">
				{TABS.map((t) => (
					<button
						key={t.id}
						onClick={() => setTab(t.id)}
						className={`px-4 py-2.5 text-xs font-bold uppercase tracking-[0.14em] border-b-2 -mb-px transition-colors cursor-pointer ${
							tab === t.id
								? 'border-primary text-primary'
								: 'border-transparent text-muted-foreground hover:text-foreground'
						}`}
					>
						{t.label}
					</button>
				))}
			</div>

			{tab === 'tax' && (
				<div>
				{writable && (
					<Panel title="Add Country Tax Rate" className="max-w-3xl mb-8">
						<div className="grid sm:grid-cols-3 gap-3 items-center">
							<CountrySelect
								value={newRateCountry}
								onChange={setNewRateCountry}
								countries={availableCountries}
								className={adminInput}
								placeholder="Select country"
							/>
							<input
								type="number"
								step="0.01"
								min={0}
								placeholder="Tax % (e.g. 8.25)"
								value={newRatePercent}
								onChange={(e) => setNewRatePercent(e.target.value)}
								className={adminInput}
							/>
							<button onClick={addRate} disabled={savingRate} className={`${adminButton} justify-center`}>
								{savingRate ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
								Add Rate
							</button>
						</div>
					</Panel>
				)}

				{rates === null ? (
					<TableShimmer />
				) : rates.length === 0 ? (
					<EmptyState message="No tax rates configured. Countries without a rate are charged 0% tax at checkout." />
				) : (
					<div className="border border-border rounded-3xl overflow-hidden bg-card overflow-x-auto max-w-3xl">
						<table className="w-full text-sm min-w-[520px]">
							<thead>
								<tr className="bg-secondary text-left">
									{['Country', 'Tax %', 'Active', ''].map((h) => (
										<th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">{h}</th>
									))}
								</tr>
							</thead>
							<tbody>
								{rates.map((rate) => (
									<tr key={rate.id} className="border-t border-border hover:bg-muted/40 transition-colors">
										<td className="px-5 py-3.5 font-medium text-card-foreground">{rate.country_name}</td>
										<td className="px-5 py-3.5">
											{writable ? (
												<input
													type="number"
													step="0.01"
													min={0}
													defaultValue={(rate.tax_rate * 100).toFixed(2)}
													onBlur={(e) => {
														const percent = Number(e.target.value)
														if (!Number.isNaN(percent) && percent / 100 !== rate.tax_rate) {
															updateRate(rate, { tax_rate: percent / 100 })
														}
													}}
													className={`${adminInput} py-1.5 w-28`}
												/>
											) : (
												<span className="text-foreground/75 text-xs">{(rate.tax_rate * 100).toFixed(2)}%</span>
											)}
										</td>
										<td className="px-5 py-3.5">
											<input
												type="checkbox"
												checked={rate.is_active}
												disabled={!writable}
												onChange={(e) => updateRate(rate, { is_active: e.target.checked })}
												className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
											/>
										</td>
										<td className="px-5 py-3.5">
											{writable && (
												<button
													onClick={() => removeRate(rate)}
													className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
													aria-label="Remove"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
				</div>
			)}

			{tab === 'social' && (
				<div>
				{writable && (
					<Panel title="Add Platform" className="max-w-3xl mb-8">
						<div className="grid sm:grid-cols-3 gap-3">
							<input
								placeholder="Platform (e.g. Instagram)"
								value={newLink.platform}
								onChange={(e) => setNewLink({ ...newLink, platform: e.target.value })}
								className={adminInput}
							/>
							<input
								placeholder="https://instagram.com/cellkore"
								value={newLink.url}
								onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
								className={adminInput}
							/>
							<button onClick={add} disabled={saving} className={`${adminButton} justify-center`}>
								{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
								Add Link
							</button>
						</div>
					</Panel>
				)}

				{links === null ? (
					<TableShimmer />
				) : links.length === 0 ? (
					<EmptyState message="No social links configured." />
				) : (
					<div className="border border-border rounded-3xl overflow-hidden bg-card overflow-x-auto max-w-3xl">
						<table className="w-full text-sm min-w-[520px]">
							<thead>
								<tr className="bg-secondary text-left">
									{['Platform', 'URL', 'Active', ''].map((h) => (
										<th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">{h}</th>
									))}
								</tr>
							</thead>
							<tbody>
								{links.map((link) => (
									<tr key={link.id} className="border-t border-border hover:bg-muted/40 transition-colors">
										<td className="px-5 py-3.5 font-medium text-card-foreground">{link.platform}</td>
										<td className="px-5 py-3.5">
											{writable ? (
												<input
													defaultValue={link.url}
													onBlur={(e) => {
														if (e.target.value !== link.url) update({ ...link, url: e.target.value })
													}}
													className={`${adminInput} py-1.5`}
												/>
											) : (
												<span className="text-foreground/75 text-xs">{link.url}</span>
											)}
										</td>
										<td className="px-5 py-3.5">
											<input
												type="checkbox"
												checked={link.is_active}
												disabled={!writable}
												onChange={(e) => update({ ...link, is_active: e.target.checked })}
												className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
											/>
										</td>
										<td className="px-5 py-3.5">
											{writable && (
												<button
													onClick={() => remove(link)}
													className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
													aria-label="Remove"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											)}
										</td>
									</tr>
								))}
							</tbody>
						</table>
					</div>
				)}
			</div>
			)}

			{tab === 'repair' && (
				<Panel title="Mail-In Repair Address" className="max-w-3xl">
					<p className="text-xs text-muted-foreground mb-4 leading-relaxed">
						Shown to customers who choose the mail-in repair service, so they know where to ship their device.
					</p>
					<textarea
						value={mailInAddress}
						onChange={(e) => setMailInAddress(e.target.value)}
						disabled={!writable}
						rows={5}
						placeholder="CellKore Repair Center&#10;123 Example Street&#10;City, State ZIP&#10;Country"
						className={`${adminInput} resize-none`}
					/>
					{writable && (
						<button onClick={saveRepairSettings} disabled={savingRepair} className={`${adminButton} mt-4`}>
							{savingRepair && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
							Save Address
						</button>
					)}
				</Panel>
			)}
		</div>
	)
}
