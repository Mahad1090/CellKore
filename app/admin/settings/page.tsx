'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { Plus, Trash2, Loader2, Globe, ExternalLink, Copy, Receipt, MapPin } from 'lucide-react'
import { PageTitle, EmptyState, adminButton, adminInput } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { CountrySelect } from '@/components/ui/country-select'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import { normalizeAddressNewlines } from '@/lib/data'
import { SHIPPING_COUNTRIES } from '@/lib/shipping-countries'
import type { SocialLink, TaxRate } from '@/lib/types'

function renderPlatformIcon(platform: string) {
	const p = platform.toLowerCase()
	if (p.includes('amazon')) return <img src="/amazon.svg" alt="Amazon" className="w-4 h-4 object-contain" />
	if (p.includes('facebook')) return <img src="/facebook.svg" alt="Facebook" className="w-4 h-4 object-contain" />
	if (p.includes('instagram')) return <img src="/instagram.svg" alt="Instagram" className="w-4 h-4 object-contain" />
	if (p.includes('tiktok')) return <img src="/tiktok.svg" alt="TikTok" className="w-4 h-4 object-contain" />
	if (p.includes('whatsapp')) return <img src="/whatsapp.svg" alt="WhatsApp" className="w-4 h-4 object-contain" />
	if (p.includes('ebay')) return <img src="/ebay.svg" alt="eBay" className="w-4 h-4 object-contain" />
	return <Globe className="w-4 h-4 text-muted-foreground" />
}

const TABS = [
	{ id: 'tax', label: 'TAX RATES' },
	{ id: 'social', label: 'STORE LINKS' },
	{ id: 'repair', label: 'REPAIR SERVICE' },
] as const
type TabId = (typeof TABS)[number]['id']

export default function AdminSettingsPage() {
	const searchParams = useSearchParams()
	const tabQuery = searchParams.get('tab') as TabId | null
	const { toast, confirm } = useToast()
	const { can } = useAdmin()

	const [tab, setTab] = useState<TabId>('tax')

	useEffect(() => {
		if (tabQuery && ['tax', 'social', 'repair'].includes(tabQuery)) {
			setTab(tabQuery)
		}
	}, [tabQuery])
	const [links, setLinks] = useState<SocialLink[] | null>(null)

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
		<div className="max-w-4xl space-y-6 pb-16">
			<PageTitle title="Settings" subtitle="Tax rates, storefront footer links, and repair service configuration" />

			{/* Navigation Tabs Header */}
			<div className="flex items-center gap-2 border-b border-border/80 font-sans">
				{TABS.map((t) => (
					<button
						key={t.id}
						type="button"
						onClick={() => setTab(t.id)}
						className={`px-5 py-3 text-xs font-extrabold tracking-[0.16em] uppercase border-b-2 -mb-px transition-all cursor-pointer ${
							tab === t.id
								? 'border-[#599161] text-[#599161]'
								: 'border-transparent text-muted-foreground hover:text-foreground'
						}`}
					>
						{t.label}
					</button>
				))}
			</div>

			{/* TAB 1: TAX RATES */}
			{tab === 'tax' && (
				<section className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-6 font-sans">
					<div className="flex items-center gap-2.5 pb-4 border-b border-border/80">
						<Receipt className="w-5 h-5 text-primary" />
						<div>
							<h2 className="text-lg font-serif font-bold text-foreground tracking-tight">Tax Rates</h2>
							<p className="text-xs text-muted-foreground">
								Configure country-specific tax percentages applied during customer checkout.
							</p>
						</div>
					</div>

					{writable && (
						<div className="bg-muted/30 border border-border/70 rounded-2xl p-4">
							<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-3">
								Add Country Tax Rate
							</p>
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
						</div>
					)}

					{rates === null ? (
						<TableShimmer />
					) : rates.length === 0 ? (
						<EmptyState message="No tax rates configured. Countries without a rate are charged 0% tax at checkout." />
					) : (
						<div className="border border-border/80 rounded-2xl overflow-hidden bg-card overflow-x-auto">
							<table className="w-full text-sm min-w-[520px]">
								<thead>
									<tr className="bg-muted/40 text-left border-b border-border/80">
										{['Country', 'Tax %', 'Active', ''].map((h) => (
											<th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
												{h}
											</th>
										))}
									</tr>
								</thead>
								<tbody>
									{rates.map((rate) => (
										<tr key={rate.id} className="border-t border-border/60 hover:bg-muted/30 transition-colors">
											<td className="px-5 py-3.5 font-medium text-foreground">{rate.country_name}</td>
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
													className="w-4 h-4 accent-[#599161] cursor-pointer"
												/>
											</td>
											<td className="px-5 py-3.5 text-right">
												{writable && (
													<button
														onClick={() => removeRate(rate)}
														className="p-2 rounded-full text-muted-foreground hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
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
				</section>
			)}

			{/* TAB 2: SOCIAL LINKS / STORE SETTINGS */}
			{tab === 'social' && (
				<section className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-6 font-sans">
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
						<div className="flex items-center gap-2.5">
							<Globe className="w-5 h-5 text-primary" />
							<div>
								<h2 className="text-lg font-serif font-bold text-foreground tracking-tight">Store Settings</h2>
								<p className="text-xs text-muted-foreground">
									These links appear in the website header, footer, and contact sections.
								</p>
							</div>
						</div>

						{writable && (
							<div className="flex items-center gap-2.5">
								<span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground whitespace-nowrap">
									ADD PLATFORM:
								</span>
								<select
									onChange={async (e) => {
										const val = e.target.value
										if (!val) return
										try {
											const res = await fetch('/api/admin/social-links', {
												method: 'POST',
												headers: { 'Content-Type': 'application/json' },
												body: JSON.stringify({ platform: val, url: '', is_active: true }),
											})
											const json = await res.json()
											if (!res.ok) throw new Error(json.error || 'Failed to add platform')
											toast({ title: 'Platform added', description: `${val} added to store settings.`, variant: 'success' })
											load()
										} catch (err) {
											toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error', variant: 'error' })
										}
										e.target.value = ''
									}}
									className="px-3.5 py-2 bg-muted/30 border border-border/80 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-primary cursor-pointer"
								>
									<option value="">Choose platform...</option>
									<option value="Amazon Store">Amazon Store</option>
									<option value="Facebook">Facebook</option>
									<option value="Instagram">Instagram</option>
									<option value="TikTok">TikTok</option>
									<option value="WhatsApp Canada Number">WhatsApp Canada Number</option>
									<option value="WhatsApp Group Invite Link">WhatsApp Group Invite Link</option>
									<option value="WhatsApp US Number">WhatsApp US Number</option>
									<option value="eBay Store">eBay Store</option>
									<option value="Google Business">Google Business</option>
								</select>
							</div>
						)}
					</div>

					{links === null ? (
						<TableShimmer />
					) : links.length === 0 ? (
						<EmptyState message="No store platforms configured. Choose a platform above to get started." />
					) : (
						<div className="space-y-3.5">
							{links.map((link) => {
								const isWhatsapp = link.platform.toLowerCase().includes('whatsapp')
								return (
									<div
										key={link.id}
										className="bg-card border border-border/80 rounded-2xl p-4.5 hover:border-primary/40 transition-all shadow-3xs group"
									>
										<div className="flex items-center justify-between gap-3 mb-2.5">
											<div className="flex items-center gap-2">
												{renderPlatformIcon(link.platform)}
												<span className="text-[11px] font-bold uppercase tracking-[0.16em] text-foreground font-sans">
													{link.platform}
												</span>
											</div>

											{writable && (
												<button
													type="button"
													onClick={() => remove(link)}
													className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
												>
													<Trash2 className="w-3.5 h-3.5" />
													Remove Link
												</button>
											)}
										</div>

										<div className="flex items-center gap-2">
											<input
												defaultValue={link.url}
												placeholder={
													isWhatsapp
														? 'e.g. +1 (206) 841-2427'
														: `https://www.${link.platform.toLowerCase().replace(/[^a-z0-9]/g, '')}.com/...`
												}
												onBlur={(e) => {
													if (e.target.value !== link.url) {
														update({ ...link, url: e.target.value })
													}
												}}
												disabled={!writable}
												className={`${adminInput} bg-muted/20 border-border/80 text-xs font-medium flex-1`}
											/>

											{link.url.trim() && (
												<>
													<a
														href={
															link.url.startsWith('http')
																? link.url
																: isWhatsapp
																? `https://wa.me/${link.url.replace(/\D/g, '')}`
																: `https://${link.url}`
														}
														target="_blank"
														rel="noopener noreferrer"
														className="p-2.5 rounded-xl border border-border/80 bg-secondary hover:bg-muted text-foreground transition-all cursor-pointer"
														title="Open Link in New Tab"
													>
														<ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
													</a>
													<button
														type="button"
														onClick={() => {
															navigator.clipboard.writeText(link.url)
															toast({ title: 'Copied to clipboard', variant: 'success' })
														}}
														className="p-2.5 rounded-xl border border-border/80 bg-secondary hover:bg-muted text-foreground transition-all cursor-pointer"
														title="Copy to Clipboard"
													>
														<Copy className="w-3.5 h-3.5 text-muted-foreground" />
													</button>
												</>
											)}
										</div>
									</div>
								)
							})}
						</div>
					)}
				</section>
			)}

			{/* TAB 3: REPAIR SERVICE ADDRESS */}
			{tab === 'repair' && (
				<section className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-5 font-sans">
					<div className="flex items-center gap-2.5 pb-4 border-b border-border/80">
						<MapPin className="w-5 h-5 text-primary" />
						<div>
							<h2 className="text-lg font-serif font-bold text-foreground tracking-tight">Mail-In Repair Address</h2>
							<p className="text-xs text-muted-foreground">
								Shown to customers who choose the mail-in repair service, so they know where to ship their device.
							</p>
						</div>
					</div>

					<textarea
						value={mailInAddress}
						onChange={(e) => setMailInAddress(e.target.value)}
						disabled={!writable}
						rows={5}
						placeholder="CellKore Repair Center&#10;123 Example Street&#10;City, State ZIP&#10;Country"
						className={`${adminInput} resize-none bg-muted/20 border-border/80 leading-relaxed font-sans text-xs`}
					/>

					{writable && (
						<button
							type="button"
							onClick={saveRepairSettings}
							disabled={savingRepair}
							className="px-6 py-3.5 bg-[#599161] hover:bg-[#46754e] text-white font-extrabold text-xs uppercase tracking-[0.16em] rounded-2xl transition-all cursor-pointer shadow-sm flex items-center gap-2 disabled:opacity-50"
						>
							{savingRepair && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
							Save Address
						</button>
					)}
				</section>
			)}
		</div>
	)
}
