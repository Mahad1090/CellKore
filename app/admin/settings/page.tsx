'use client'

import { useCallback, useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Trash2, Loader2, Globe, ExternalLink, Copy, MapPin, Truck, Flag } from 'lucide-react'
import { PageTitle, EmptyState, adminInput } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import { normalizeAddressNewlines } from '@/lib/data'
import type { SocialLink } from '@/lib/types'

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
	{ id: 'social', label: 'STORE LINKS' },
	{ id: 'repair', label: 'REPAIR SERVICE' },
	{ id: 'shipping', label: 'SHIPPING CARRIERS' },
] as const
type TabId = (typeof TABS)[number]['id']

interface CarrierSettingsState {
	canadaPostCa: boolean
	canadaPostUs: boolean
	upsCa: boolean
	upsUs: boolean
	stallionCa: boolean
	stallionUs: boolean
}

const EMPTY_CARRIER_SETTINGS: CarrierSettingsState = {
	canadaPostCa: true,
	canadaPostUs: true,
	upsCa: true,
	upsUs: true,
	stallionCa: true,
	stallionUs: true,
}

function AdminSettingsContent() {
	const searchParams = useSearchParams()
	const tabQuery = searchParams.get('tab') as TabId | null
	const { toast, confirm } = useToast()
	const { can } = useAdmin()

	const [tab, setTab] = useState<TabId>('social')

	useEffect(() => {
		if (tabQuery && ['social', 'repair', 'shipping'].includes(tabQuery)) {
			setTab(tabQuery)
		}
	}, [tabQuery])
	const [links, setLinks] = useState<SocialLink[] | null>(null)

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

	const [carrierSettings, setCarrierSettings] = useState<CarrierSettingsState>(EMPTY_CARRIER_SETTINGS)
	const [carrierSettingsOriginal, setCarrierSettingsOriginal] = useState<CarrierSettingsState>(EMPTY_CARRIER_SETTINGS)
	const [loadingCarrierSettings, setLoadingCarrierSettings] = useState(true)
	const [savingCarrierSettings, setSavingCarrierSettings] = useState(false)

	const loadCarrierSettings = useCallback(() => {
		setLoadingCarrierSettings(true)
		fetch('/api/admin/shipping-carrier-settings')
			.then((res) => res.json())
			.then((json) => {
				const loaded: CarrierSettingsState = {
					canadaPostCa: json.canadaPostCa !== false,
					canadaPostUs: json.canadaPostUs !== false,
					upsCa: json.upsCa !== false,
					upsUs: json.upsUs !== false,
					stallionCa: json.stallionCa !== false,
					stallionUs: json.stallionUs !== false,
				}
				setCarrierSettings(loaded)
				setCarrierSettingsOriginal(loaded)
			})
			.catch(() => undefined)
			.finally(() => setLoadingCarrierSettings(false))
	}, [])

	useEffect(loadCarrierSettings, [loadCarrierSettings])

	const carrierSettingsDirty = JSON.stringify(carrierSettings) !== JSON.stringify(carrierSettingsOriginal)

	const saveCarrierSettings = async () => {
		setSavingCarrierSettings(true)
		try {
			const res = await fetch('/api/admin/shipping-carrier-settings', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(carrierSettings),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Shipping carrier settings saved', variant: 'success' })
			setCarrierSettingsOriginal(carrierSettings)
		} catch (err) {
			toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSavingCarrierSettings(false)
		}
	}

	const load = useCallback(() => {
		fetch('/api/admin/social-links')
			.then((res) => res.json())
			.then((json) => setLinks(json.links ?? []))
			.catch(() => setLinks([]))
	}, [])

	useEffect(load, [load])

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
			<PageTitle title="Settings" subtitle="Storefront footer links and repair service configuration" />

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

			{/* TAB 1: SOCIAL LINKS / STORE SETTINGS */}
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

			{/* TAB 2: REPAIR SERVICE ADDRESS */}
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

			{/* TAB 3: SHIPPING CARRIERS */}
			{tab === 'shipping' && (
				<section className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-6 font-sans">
					<div className="flex items-center gap-2.5 pb-4 border-b border-border/80">
						<Truck className="w-5 h-5 text-primary" />
						<div>
							<h2 className="text-lg font-serif font-bold text-foreground tracking-tight">Shipping Carriers</h2>
							<p className="text-xs text-muted-foreground">
								Turn carrier rate + label sources on or off, independently for Canada (domestic) and US/International destinations.
							</p>
						</div>
					</div>

					{loadingCarrierSettings ? (
						<div className="py-12 flex flex-col items-center justify-center text-muted-foreground gap-2">
							<Loader2 className="w-6 h-6 animate-spin text-muted-foreground/60" />
							<p className="text-xs">Loading shipping carrier settings...</p>
						</div>
					) : (
						<>
							<div className="text-[11px] text-muted-foreground bg-secondary/40 border border-border/60 rounded-xl p-3.5 leading-relaxed">
								A disabled carrier stops appearing at checkout within about a minute, and is rejected server-side even if
								a stale request still names it.
							</div>

							<div className="grid sm:grid-cols-2 gap-5">
								{/* Canada (domestic) */}
								<div className="space-y-2.5">
									<p className="text-[10px] uppercase font-extrabold tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
										<Flag className="w-3.5 h-3.5" />
										Canada (Domestic)
									</p>
									<CarrierToggle
										label="Canada Post"
										checked={carrierSettings.canadaPostCa}
										disabled={!writable}
										onChange={(v) => setCarrierSettings((p) => ({ ...p, canadaPostCa: v }))}
									/>
									<CarrierToggle
										label="UPS"
										checked={carrierSettings.upsCa}
										disabled={!writable}
										onChange={(v) => setCarrierSettings((p) => ({ ...p, upsCa: v }))}
									/>
									<CarrierToggle
										label="Stallion Express"
										checked={carrierSettings.stallionCa}
										disabled={!writable}
										onChange={(v) => setCarrierSettings((p) => ({ ...p, stallionCa: v }))}
									/>
								</div>

								{/* US / International */}
								<div className="space-y-2.5">
									<p className="text-[10px] uppercase font-extrabold tracking-[0.16em] text-muted-foreground flex items-center gap-1.5">
										<Globe className="w-3.5 h-3.5" />
										US / International
									</p>
									<CarrierToggle
										label="Canada Post"
										checked={carrierSettings.canadaPostUs}
										disabled={!writable}
										onChange={(v) => setCarrierSettings((p) => ({ ...p, canadaPostUs: v }))}
									/>
									<CarrierToggle
										label="UPS"
										checked={carrierSettings.upsUs}
										disabled={!writable}
										onChange={(v) => setCarrierSettings((p) => ({ ...p, upsUs: v }))}
									/>
									<CarrierToggle
										label="Stallion Express"
										checked={carrierSettings.stallionUs}
										disabled={!writable}
										onChange={(v) => setCarrierSettings((p) => ({ ...p, stallionUs: v }))}
									/>
								</div>
							</div>

							{writable && (
								<button
									type="button"
									onClick={saveCarrierSettings}
									disabled={!carrierSettingsDirty || savingCarrierSettings}
									className="px-6 py-3.5 bg-[#599161] hover:bg-[#46754e] text-white font-extrabold text-xs uppercase tracking-[0.16em] rounded-2xl transition-all cursor-pointer shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
								>
									{savingCarrierSettings && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
									Save Shipping Carrier Settings
								</button>
							)}
						</>
					)}
				</section>
			)}
		</div>
	)
}

function CarrierToggle({
	label,
	checked,
	disabled,
	onChange,
}: {
	label: string
	checked: boolean
	disabled?: boolean
	onChange: (v: boolean) => void
}) {
	return (
		<label className={`flex items-center justify-between gap-3 border border-border/70 rounded-xl p-3.5 ${disabled ? '' : 'cursor-pointer hover:border-primary/50'} transition-colors select-none`}>
			<span className="text-xs font-semibold text-foreground">{label}</span>
			<input
				type="checkbox"
				checked={checked}
				disabled={disabled}
				onChange={(e) => onChange(e.target.checked)}
				className="w-4 h-4 accent-[#599161] cursor-pointer disabled:cursor-not-allowed"
			/>
		</label>
	)
}

export default function AdminSettingsPage() {
	return (
		<Suspense fallback={<TableShimmer rows={5} />}>
			<AdminSettingsContent />
		</Suspense>
	)
}
