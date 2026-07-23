'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Plus, Trash2, Loader2, Receipt } from 'lucide-react'
import { PageTitle, EmptyState, adminButton, adminInput } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { CountrySelect } from '@/components/ui/country-select'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import { SHIPPING_COUNTRIES } from '@/lib/shipping-countries'
import type { TaxRate } from '@/lib/types'

export default function AdminTaxRatesPage() {
	const { toast, confirm } = useToast()
	const { can } = useAdmin()

	const [rates, setRates] = useState<TaxRate[] | null>(null)
	const [newRateCountry, setNewRateCountry] = useState('')
	const [newRatePercent, setNewRatePercent] = useState('')
	const [savingRate, setSavingRate] = useState(false)

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

	const writable = can('settings:write')

	return (
		<div className="max-w-4xl space-y-6 pb-16">
			<PageTitle title="Tax Rates" subtitle="Configure country-specific tax percentages applied at checkout" />

			<section className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-6 font-sans">
				<div className="flex items-center gap-2.5 pb-4 border-b border-border/80">
					<Receipt className="w-5 h-5 text-primary" />
					<div>
						<h2 className="text-lg font-serif font-bold text-foreground tracking-tight font-sans">Country Tax Configuration</h2>
						<p className="text-xs text-muted-foreground">
							Countries without an explicit active tax rate are charged 0% tax at checkout.
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
		</div>
	)
}
