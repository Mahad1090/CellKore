'use client'

import { useCallback, useEffect, useState } from 'react'
import { Receipt, MapPin } from 'lucide-react'
import { PageTitle, EmptyState, adminButton, adminInput } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'

interface RegionRow {
	region: string
	country: string
	orderCount: number
	subtotal: number
	tax: number
	total: number
}

interface TaxTypeRow {
	taxType: string
	amount: number
}

interface TaxAnalytics {
	regions: RegionRow[]
	byTaxType: TaxTypeRow[]
	summary: { orderCount: number; subtotal: number; tax: number; total: number; untaxedOrderCount: number }
}

const money = (n: number) => `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

export default function AdminTaxPage() {
	const [data, setData] = useState<TaxAnalytics | null>(null)
	const [from, setFrom] = useState('')
	const [to, setTo] = useState('')

	const load = useCallback(() => {
		setData(null)
		const params = new URLSearchParams()
		if (from) params.set('from', from)
		if (to) params.set('to', to)
		fetch(`/api/admin/tax-analytics?${params.toString()}`)
			.then((res) => res.json())
			.then((json) => setData(json.regions ? json : { regions: [], byTaxType: [], summary: { orderCount: 0, subtotal: 0, tax: 0, total: 0, untaxedOrderCount: 0 } }))
			.catch(() => setData({ regions: [], byTaxType: [], summary: { orderCount: 0, subtotal: 0, tax: 0, total: 0, untaxedOrderCount: 0 } }))
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	useEffect(load, [load])

	return (
		<div className="max-w-5xl space-y-6 pb-16">
			<PageTitle
				title="Tax"
				subtitle="Sales and tax collected by province/state, computed automatically via Stripe Tax at checkout"
			/>

			<section className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-6 font-sans">
				<div className="flex items-center gap-2.5 pb-4 border-b border-border/80">
					<Receipt className="w-5 h-5 text-primary" />
					<div>
						<h2 className="text-lg font-serif font-bold text-foreground tracking-tight font-sans">Filter by date</h2>
						<p className="text-xs text-muted-foreground">Leave blank to include every paid order.</p>
					</div>
				</div>

				<div className="grid sm:grid-cols-3 gap-3 items-center">
					<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={adminInput} />
					<input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={adminInput} />
					<button onClick={load} className={`${adminButton} justify-center`}>
						Apply
					</button>
				</div>
			</section>

			{data === null ? (
				<TableShimmer />
			) : (
				<>
					<div className="grid sm:grid-cols-4 gap-3.5">
						<div className="p-4 rounded-2xl bg-card border border-border/80 shadow-3xs space-y-1">
							<p className="text-[10px] uppercase font-extrabold tracking-wider text-muted-foreground">Paid Orders</p>
							<p className="text-xl font-extrabold text-foreground font-mono">{data.summary.orderCount}</p>
						</div>
						<div className="p-4 rounded-2xl bg-card border border-border/80 shadow-3xs space-y-1">
							<p className="text-[10px] uppercase font-extrabold tracking-wider text-muted-foreground">Taxable Sales</p>
							<p className="text-xl font-extrabold text-foreground font-mono">{money(data.summary.subtotal)}</p>
						</div>
						<div className="p-4 rounded-2xl bg-card border border-primary/30 shadow-3xs space-y-1">
							<p className="text-[10px] uppercase font-extrabold tracking-wider text-primary">Tax Collected</p>
							<p className="text-xl font-extrabold text-primary font-mono">{money(data.summary.tax)}</p>
						</div>
						<div className="p-4 rounded-2xl bg-card border border-border/80 shadow-3xs space-y-1">
							<p className="text-[10px] uppercase font-extrabold tracking-wider text-muted-foreground">Total Revenue</p>
							<p className="text-xl font-extrabold text-foreground font-mono">{money(data.summary.total)}</p>
						</div>
					</div>

					{data.summary.untaxedOrderCount > 0 && (
						<p className="text-xs text-muted-foreground bg-muted/30 border border-border/70 rounded-2xl px-4 py-3">
							{data.summary.untaxedOrderCount} order{data.summary.untaxedOrderCount === 1 ? '' : 's'} in this range predate
							the Stripe Tax integration and have no recorded tax breakdown.
						</p>
					)}

					{data.byTaxType.length > 0 && (
						<div className="flex flex-wrap gap-2">
							{data.byTaxType.map((t) => (
								<span
									key={t.taxType}
									className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-muted/40 border border-border/70 text-xs font-semibold text-foreground/80"
								>
									{t.taxType.toUpperCase()}: {money(t.amount)}
								</span>
							))}
						</div>
					)}

					<section className="bg-card border border-border/80 rounded-3xl overflow-hidden shadow-sm">
						<div className="flex items-center gap-2.5 px-6 py-4 border-b border-border/80">
							<MapPin className="w-4.5 h-4.5 text-primary" />
							<h2 className="text-lg font-serif font-bold text-foreground tracking-tight font-sans">By province / state</h2>
						</div>

						{data.regions.length === 0 ? (
							<div className="p-6">
								<EmptyState message="No paid orders in this range." />
							</div>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-sm min-w-[560px]">
									<thead>
										<tr className="bg-muted/40 text-left border-b border-border/80">
											{['Region', 'Country', 'Orders', 'Subtotal', 'Tax Collected', 'Total'].map((h) => (
												<th key={h} className="px-5 py-3 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
													{h}
												</th>
											))}
										</tr>
									</thead>
									<tbody>
										{data.regions.map((r) => (
											<tr key={`${r.country}-${r.region}`} className="border-t border-border/60 hover:bg-muted/30 transition-colors">
												<td className="px-5 py-3.5 font-medium text-foreground">{r.region}</td>
												<td className="px-5 py-3.5 text-foreground/75">{r.country}</td>
												<td className="px-5 py-3.5 text-foreground/75">{r.orderCount}</td>
												<td className="px-5 py-3.5 font-mono text-foreground/75">{money(r.subtotal)}</td>
												<td className="px-5 py-3.5 font-mono font-semibold text-primary">{money(r.tax)}</td>
												<td className="px-5 py-3.5 font-mono font-semibold text-foreground">{money(r.total)}</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</section>
				</>
			)}
		</div>
	)
}
