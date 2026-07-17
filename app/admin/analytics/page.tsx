'use client'

import { useEffect, useState } from 'react'
import { Users } from 'lucide-react'
import {
	ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
	PieChart, Pie, Cell, Legend,
} from 'recharts'
import { PageTitle, Panel, EmptyState } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'

interface Analytics {
	monthlyRevenue: { month: string; revenue: number }[]
	topCategories: { name: string; revenue: number }[]
	orderStatusBreakdown: Record<string, number>
	paymentStatusBreakdown: Record<string, number>
	totalSubscribers: number
}

const PIE_COLORS = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)', 'var(--chart-5)', 'var(--muted-foreground)']

export default function AdminAnalyticsPage() {
	const [data, setData] = useState<Analytics | null | undefined>(undefined)

	useEffect(() => {
		fetch('/api/admin/analytics')
			.then((res) => res.json())
			.then((json) => setData(json.monthlyRevenue ? json : null))
			.catch(() => setData(null))
	}, [])

	if (data === undefined) {
		return (
			<div>
				<PageTitle title="Analytics" subtitle="Revenue and performance metrics" />
				<TableShimmer rows={8} />
			</div>
		)
	}

	if (data === null) {
		return (
			<div>
				<PageTitle title="Analytics" subtitle="Revenue and performance metrics" />
				<EmptyState message="Analytics could not be loaded." />
			</div>
		)
	}

	const toPie = (breakdown: Record<string, number>) =>
		Object.entries(breakdown).map(([name, value]) => ({ name, value }))

	const orderPie = toPie(data.orderStatusBreakdown)
	const paymentPie = toPie(data.paymentStatusBreakdown)

	return (
		<div>
			<PageTitle title="Analytics" subtitle="Revenue and performance metrics" />

			<div className="grid lg:grid-cols-3 gap-6 mb-6">
				<Panel title="Monthly Revenue (Paid Orders)" className="lg:col-span-2">
					<div className="h-72">
						<ResponsiveContainer width="100%" height="100%">
							<BarChart data={data.monthlyRevenue}>
								<CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
								<XAxis dataKey="month" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
								<YAxis tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} />
								<Tooltip
									contentStyle={{
										backgroundColor: 'var(--card)',
										border: '1px solid var(--border)',
										borderRadius: 12,
										fontSize: 12,
									}}
									formatter={(value) => [`$${Number(value ?? 0).toLocaleString()}`, 'Revenue']}
								/>
								<Bar dataKey="revenue" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
							</BarChart>
						</ResponsiveContainer>
					</div>
				</Panel>

				<div className="space-y-6">
					<Panel title="Newsletter Subscribers">
						<div className="flex items-center gap-4">
							<div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center">
								<Users className="w-5 h-5 text-primary" />
							</div>
							<div>
								<p className="text-3xl font-bold text-card-foreground">{data.totalSubscribers}</p>
								<p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-1">Total Subscribers</p>
							</div>
						</div>
					</Panel>

					<Panel title="Top Selling Categories">
						{data.topCategories.length === 0 ? (
							<p className="text-xs text-muted-foreground">No sales data yet.</p>
						) : (
							<div className="space-y-3">
								{data.topCategories.map((category) => {
									const max = data.topCategories[0].revenue || 1
									return (
										<div key={category.name}>
											<div className="flex justify-between text-xs mb-1.5">
												<span className="text-foreground/80 font-medium">{category.name}</span>
												<span className="text-muted-foreground">${category.revenue.toLocaleString()}</span>
											</div>
											<div className="h-2 rounded-full bg-secondary overflow-hidden">
												<div
													className="h-full bg-primary rounded-full transition-all duration-700"
													style={{ width: `${Math.max(4, (category.revenue / max) * 100)}%` }}
												/>
											</div>
										</div>
									)
								})}
							</div>
						)}
					</Panel>
				</div>
			</div>

			<div className="grid md:grid-cols-2 gap-6">
				{[
					{ title: 'Order Status Breakdown', data: orderPie },
					{ title: 'Payment Status Breakdown', data: paymentPie },
				].map((chart) => (
					<Panel key={chart.title} title={chart.title}>
						{chart.data.length === 0 ? (
							<p className="text-xs text-muted-foreground">No orders yet.</p>
						) : (
							<div className="h-64">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie data={chart.data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
											{chart.data.map((_, index) => (
												<Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
											))}
										</Pie>
										<Tooltip
											contentStyle={{
												backgroundColor: 'var(--card)',
												border: '1px solid var(--border)',
												borderRadius: 12,
												fontSize: 12,
											}}
										/>
										<Legend wrapperStyle={{ fontSize: 11 }} />
									</PieChart>
								</ResponsiveContainer>
							</div>
						)}
					</Panel>
				))}
			</div>
		</div>
	)
}
