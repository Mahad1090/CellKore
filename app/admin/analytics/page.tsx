'use client'

import { useEffect, useState } from 'react'
import {
	DollarSign, TrendingUp, Smartphone, Wrench, Package, Users, Mail, Layers,
	ShoppingCart, CheckCircle2, AlertTriangle, ShieldCheck, ArrowUpRight, Award, PieChart as PieIcon, RefreshCw, Box, Tag, BarChart3, Activity, FileText
} from 'lucide-react'
import {
	ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
	PieChart, Pie, Cell, Legend
} from 'recharts'
import { PageTitle, Panel, EmptyState } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'

export type AnalyticsTab = 'executive' | 'sales' | 'tradeIn' | 'repair' | 'inventory' | 'customer'

interface SummaryData {
	totalGrossSales: number
	totalOrders: number
	averageOrderValue: number
	totalTradeInPayouts: number
	totalTradeInRequests: number
	totalRepairRequests: number
	totalSubscribers: number
	totalProducts: number
	totalInquiries: number
}

interface SalesData {
	monthlyRevenue: { month: string; revenue: number; orders: number }[]
	topCategories: { name: string; revenue: number; units: number }[]
	topProducts: { name: string; revenue: number; units: number }[]
	orderStatusBreakdown: Record<string, number>
	paymentStatusBreakdown: Record<string, number>
	paymentProviderBreakdown: Record<string, number>
}

interface TradeInData {
	totalSubmitted: number
	totalApprovedPayouts: number
	averageValuation: number
	statusBreakdown: Record<string, number>
	topBrands: { brand: string; count: number; totalValue: number }[]
	topModels: { model: string; count: number; totalValue: number }[]
	conditionBreakdown: Record<string, number>
}

interface RepairData {
	totalRequests: number
	totalEstimatedCost: number
	statusBreakdown: Record<string, number>
	topBrandsRepaired: { brand: string; count: number }[]
}

interface WholesaleLotItem {
	id: string
	name: string
	sku: string
	category: string
	lotQuantity: string
	basePrice: number
	status: string
	tiersCount: number
}

interface InventoryData {
	totalProducts: number
	activeListings: number
	wholesaleLotsCount: number
	wholesaleValuationTotal: number
	wholesaleDevicesTotal: number
	wholesaleLotsList: WholesaleLotItem[]
	totalInventoryValue: number
	stockStatus: { inStock: number; lowStock: number; outOfStock: number }
	categoryStock: { category: string; count: number }[]
}

interface CustomerData {
	totalSubscribers: number
	recentSubscribersCount: number
	totalInquiries: number
	inquiryStatusBreakdown: Record<string, number>
	customerTypeBreakdown: { registered: number; guest: number }
}

interface ComprehensiveAnalytics {
	summary: SummaryData
	sales: SalesData
	tradeIn: TradeInData
	repair: RepairData
	inventory: InventoryData
	customer: CustomerData
}

const PIE_COLORS = ['#599161', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#64748b', '#06b6d4']

export default function AdminAnalyticsPage() {
	const [activeTab, setActiveTab] = useState<AnalyticsTab>('executive')
	const [data, setData] = useState<ComprehensiveAnalytics | null | undefined>(undefined)

	const loadAnalytics = () => {
		setData(undefined)
		fetch('/api/admin/analytics')
			.then((res) => res.json())
			.then((json) => setData(json.summary ? json : null))
			.catch(() => setData(null))
	}

	useEffect(() => {
		loadAnalytics()
	}, [])

	if (data === undefined) {
		return (
			<div className="space-y-6">
				<PageTitle title="Analytics & Business Intelligence" subtitle="Live performance insights across sales, trade-ins, repairs, inventory, and audience" />
				<TableShimmer rows={8} />
			</div>
		)
	}

	if (data === null) {
		return (
			<div className="space-y-6">
				<PageTitle title="Analytics & Business Intelligence" subtitle="Live performance insights across sales, trade-ins, repairs, inventory, and audience" />
				<EmptyState message="Analytics data could not be loaded." />
			</div>
		)
	}

	const toPieArray = (breakdown: Record<string, number>) =>
		Object.entries(breakdown).map(([name, value]) => ({
			name: name.replace(/_/g, ' ').toUpperCase(),
			value,
		}))

	const channelPie = [
		{ name: 'E-COMMERCE SALES', value: data.summary.totalGrossSales || 10 },
		{ name: 'TRADE-IN PAYOUTS', value: data.summary.totalTradeInPayouts || 5 },
		{ name: 'WHOLESALE VALUATION', value: data.inventory.wholesaleValuationTotal || 15 },
		{ name: 'REPAIR PIPELINE', value: data.repair.totalEstimatedCost || 5 },
	]

	return (
		<div className="space-y-6 font-sans pb-12">
			{/* Page Header */}
			<div className="flex flex-wrap items-center justify-between gap-4">
				<PageTitle title="Analytics & Business Intelligence" subtitle="Real-time multi-channel analytics for E-Commerce, Trade-In, Repairs & Inventory" />
				<button
					type="button"
					onClick={loadAnalytics}
					className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-[#E9ECEA] bg-white hover:bg-[#EEF7F0] text-xs font-bold uppercase tracking-wider text-[#111111] shadow-2xs transition-all cursor-pointer"
				>
					<RefreshCw className="w-3.5 h-3.5 text-[#599161]" />
					Refresh Live Data
				</button>
			</div>

			{/* Executive Summary Stats Bar */}
			<div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
				<div className="p-4 rounded-2xl bg-white border border-[#E9ECEA] shadow-3xs space-y-1">
					<div className="flex items-center justify-between text-muted-foreground text-[10px] uppercase font-extrabold tracking-wider">
						<span>Gross E-Commerce</span>
						<DollarSign className="w-4 h-4 text-emerald-600" />
					</div>
					<p className="text-xl font-extrabold text-[#111111] font-mono">
						${data.summary.totalGrossSales.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
					</p>
					<p className="text-[10px] text-muted-foreground font-medium">{data.summary.totalOrders} Total Orders</p>
				</div>

				<div className="p-4 rounded-2xl bg-white border border-[#E9ECEA] shadow-3xs space-y-1">
					<div className="flex items-center justify-between text-muted-foreground text-[10px] uppercase font-extrabold tracking-wider">
						<span>Trade-In Payouts</span>
						<Smartphone className="w-4 h-4 text-sky-600" />
					</div>
					<p className="text-xl font-extrabold text-[#111111] font-mono">
						${data.summary.totalTradeInPayouts.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
					</p>
					<p className="text-[10px] text-muted-foreground font-medium">{data.summary.totalTradeInRequests} Trade-In Submissions</p>
				</div>

				<div className="p-4 rounded-2xl bg-white border border-[#E9ECEA] shadow-3xs space-y-1">
					<div className="flex items-center justify-between text-muted-foreground text-[10px] uppercase font-extrabold tracking-wider">
						<span>Wholesale Valuation</span>
						<Box className="w-4 h-4 text-purple-600" />
					</div>
					<p className="text-xl font-extrabold text-[#111111] font-mono">
						${(data.inventory.wholesaleValuationTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
					</p>
					<p className="text-[10px] text-muted-foreground font-medium">{data.inventory.wholesaleLotsCount} Bulk Wholesale Lots</p>
				</div>

				<div className="p-4 rounded-2xl bg-white border border-[#E9ECEA] shadow-3xs space-y-1">
					<div className="flex items-center justify-between text-muted-foreground text-[10px] uppercase font-extrabold tracking-wider">
						<span>Total Inventory</span>
						<Package className="w-4 h-4 text-amber-600" />
					</div>
					<p className="text-xl font-extrabold text-[#111111] font-mono">
						${data.inventory.totalInventoryValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
					</p>
					<p className="text-[10px] text-muted-foreground font-medium">{data.summary.totalProducts} Catalog Items</p>
				</div>

				<div className="col-span-2 md:col-span-1 p-4 rounded-2xl bg-white border border-[#E9ECEA] shadow-3xs space-y-1">
					<div className="flex items-center justify-between text-muted-foreground text-[10px] uppercase font-extrabold tracking-wider">
						<span>Newsletter Audience</span>
						<Users className="w-4 h-4 text-purple-600" />
					</div>
					<p className="text-xl font-extrabold text-[#111111] font-mono">{data.summary.totalSubscribers}</p>
					<p className="text-[10px] text-muted-foreground font-medium">Active Subscribers</p>
				</div>
			</div>

			{/* Sleek Horizontal Sub-Tabs Navigation Bar */}
			<div className="border-b border-[#E9ECEA] flex items-center gap-6 overflow-x-auto no-scrollbar">
				<button
					type="button"
					onClick={() => setActiveTab('executive')}
					className={`flex items-center gap-2 py-3 px-1 text-xs font-extrabold uppercase tracking-[0.14em] cursor-pointer transition-all border-b-2 -mb-px whitespace-nowrap ${
						activeTab === 'executive'
							? 'border-[#599161] text-[#599161]'
							: 'border-transparent text-muted-foreground hover:text-foreground'
					}`}
				>
					<BarChart3 className="w-4 h-4" />
					Executive Dashboard
				</button>

				<button
					type="button"
					onClick={() => setActiveTab('sales')}
					className={`flex items-center gap-2 py-3 px-1 text-xs font-extrabold uppercase tracking-[0.14em] cursor-pointer transition-all border-b-2 -mb-px whitespace-nowrap ${
						activeTab === 'sales'
							? 'border-[#599161] text-[#599161]'
							: 'border-transparent text-muted-foreground hover:text-foreground'
					}`}
				>
					<TrendingUp className="w-4 h-4" />
					Sales Analytics
				</button>

				<button
					type="button"
					onClick={() => setActiveTab('tradeIn')}
					className={`flex items-center gap-2 py-3 px-1 text-xs font-extrabold uppercase tracking-[0.14em] cursor-pointer transition-all border-b-2 -mb-px whitespace-nowrap ${
						activeTab === 'tradeIn'
							? 'border-[#599161] text-[#599161]'
							: 'border-transparent text-muted-foreground hover:text-foreground'
					}`}
				>
					<Smartphone className="w-4 h-4" />
					Device Trade-In
				</button>

				<button
					type="button"
					onClick={() => setActiveTab('repair')}
					className={`flex items-center gap-2 py-3 px-1 text-xs font-extrabold uppercase tracking-[0.14em] cursor-pointer transition-all border-b-2 -mb-px whitespace-nowrap ${
						activeTab === 'repair'
							? 'border-[#599161] text-[#599161]'
							: 'border-transparent text-muted-foreground hover:text-foreground'
					}`}
				>
					<Wrench className="w-4 h-4" />
					Repair Analytics
				</button>

				<button
					type="button"
					onClick={() => setActiveTab('inventory')}
					className={`flex items-center gap-2 py-3 px-1 text-xs font-extrabold uppercase tracking-[0.14em] cursor-pointer transition-all border-b-2 -mb-px whitespace-nowrap ${
						activeTab === 'inventory'
							? 'border-[#599161] text-[#599161]'
							: 'border-transparent text-muted-foreground hover:text-foreground'
					}`}
				>
					<Package className="w-4 h-4" />
					Wholesale & Inventory
				</button>

				<button
					type="button"
					onClick={() => setActiveTab('customer')}
					className={`flex items-center gap-2 py-3 px-1 text-xs font-extrabold uppercase tracking-[0.14em] cursor-pointer transition-all border-b-2 -mb-px whitespace-nowrap ${
						activeTab === 'customer'
							? 'border-[#599161] text-[#599161]'
							: 'border-transparent text-muted-foreground hover:text-foreground'
					}`}
				>
					<Users className="w-4 h-4" />
					Customer & Growth
				</button>
			</div>

			{/* TAB 0: EXECUTIVE DASHBOARD OVERVIEW */}
			{activeTab === 'executive' && (
				<div className="space-y-6">
					<div className="grid lg:grid-cols-3 gap-6">
						<Panel title="Executive Revenue Trend (E-Commerce vs Payouts)" className="lg:col-span-2">
							<div className="h-72 pt-2">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={data.sales.monthlyRevenue}>
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
											formatter={(val) => [`$${Number(val ?? 0).toLocaleString()}`, 'Revenue']}
										/>
										<Bar dataKey="revenue" fill="#599161" radius={[6, 6, 0, 0]} />
									</BarChart>
								</ResponsiveContainer>
							</div>
						</Panel>

						<Panel title="Platform Channel Revenue Mix">
							<div className="h-72">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie data={channelPie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={4}>
											{channelPie.map((_, idx) => (
												<Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
											))}
										</Pie>
										<Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
										<Legend wrapperStyle={{ fontSize: 11 }} />
									</PieChart>
								</ResponsiveContainer>
							</div>
						</Panel>
					</div>

					<div className="grid md:grid-cols-3 gap-4">
						<div className="p-5 rounded-2xl bg-white border border-[#599161]/30 shadow-3xs space-y-2">
							<p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#599161]">AVERAGE ORDER VALUE</p>
							<p className="text-3xl font-extrabold text-[#599161] font-mono">${data.summary.averageOrderValue.toFixed(2)}</p>
							<p className="text-xs text-muted-foreground">Per Paid Customer Checkout</p>
						</div>
						<div className="p-5 rounded-2xl bg-white border border-sky-500/30 shadow-3xs space-y-2">
							<p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">BUYBACK TRADE-IN RATIO</p>
							<p className="text-3xl font-extrabold text-[#111111] font-mono">{data.summary.totalTradeInRequests} Submissions</p>
							<p className="text-xs text-muted-foreground font-mono">${data.summary.totalTradeInPayouts.toLocaleString()} Total Payouts</p>
						</div>
						<div className="p-5 rounded-2xl bg-white border border-purple-500/30 shadow-3xs space-y-2">
							<p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-purple-700 dark:text-purple-300">AUDIENCE LEAD CONVERSION</p>
							<p className="text-3xl font-extrabold text-purple-600 font-mono">{data.summary.totalSubscribers} Email Subs</p>
							<p className="text-xs text-muted-foreground">{data.summary.totalInquiries} Customer Inquiries</p>
						</div>
					</div>
				</div>
			)}

			{/* TAB 1: SALES & E-COMMERCE */}
			{activeTab === 'sales' && (
				<div className="space-y-6">
					<div className="grid lg:grid-cols-3 gap-6">
						<Panel title="Monthly E-Commerce Sales Revenue ($ USD)" className="lg:col-span-2">
							<div className="h-72 pt-2">
								<ResponsiveContainer width="100%" height="100%">
									<BarChart data={data.sales.monthlyRevenue}>
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
											formatter={(val) => [`$${Number(val ?? 0).toLocaleString()}`, 'Gross Revenue']}
										/>
										<Bar dataKey="revenue" fill="#599161" radius={[6, 6, 0, 0]} />
									</BarChart>
								</ResponsiveContainer>
							</div>
						</Panel>

						<Panel title="Top Product Categories">
							{data.sales.topCategories.length === 0 ? (
								<p className="text-xs text-muted-foreground py-10 text-center">No sales data recorded yet.</p>
							) : (
								<div className="space-y-3 pt-2">
									{data.sales.topCategories.map((cat) => {
										const max = data.sales.topCategories[0].revenue || 1
										return (
											<div key={cat.name}>
												<div className="flex justify-between text-xs mb-1.5">
													<span className="text-[#111111] font-bold">{cat.name}</span>
													<span className="text-muted-foreground font-mono font-semibold">${cat.revenue.toLocaleString()} ({cat.units} units)</span>
												</div>
												<div className="h-2 rounded-full bg-secondary overflow-hidden">
													<div
														className="h-full bg-[#599161] rounded-full transition-all duration-700"
														style={{ width: `${Math.max(6, (cat.revenue / max) * 100)}%` }}
													/>
												</div>
											</div>
										)
									})}
								</div>
							)}
						</Panel>
					</div>

					{/* BEST SELLING PRODUCTS & PAYMENT METHOD CHANNELS */}
					<div className="grid lg:grid-cols-3 gap-6">
						<Panel title="Best Selling Products (By Revenue)" className="lg:col-span-2">
							{data.sales.topProducts.length === 0 ? (
								<p className="text-xs text-muted-foreground py-10 text-center">No transactions recorded.</p>
							) : (
								<div className="overflow-x-auto pt-2">
									<table className="w-full text-left text-xs">
										<thead className="bg-[#EEF7F0]/50 text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground border-b border-[#E9ECEA]">
											<tr>
												<th className="py-2.5 px-3">Product Name</th>
												<th className="py-2.5 px-3 text-right">Units Sold</th>
												<th className="py-2.5 px-3 text-right">Gross Revenue</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-[#E9ECEA]">
											{data.sales.topProducts.map((p) => (
												<tr key={p.name} className="hover:bg-[#EEF7F0]/20 transition-colors">
													<td className="py-3 px-3 font-extrabold text-[#111111]">{p.name}</td>
													<td className="py-3 px-3 text-right font-mono font-bold text-muted-foreground">{p.units}</td>
													<td className="py-3 px-3 text-right font-mono font-extrabold text-[#599161]">${p.revenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</Panel>

						<Panel title="Payment Gateway Provider Distribution">
							{Object.keys(data.sales.paymentProviderBreakdown).length === 0 ? (
								<p className="text-xs text-muted-foreground py-10 text-center">No metrics logged.</p>
							) : (
								<div className="h-64">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie data={toPieArray(data.sales.paymentProviderBreakdown)} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
												{toPieArray(data.sales.paymentProviderBreakdown).map((_, idx) => (
													<Cell key={idx} fill={PIE_COLORS[(idx + 4) % PIE_COLORS.length]} />
												))}
											</Pie>
											<Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
											<Legend wrapperStyle={{ fontSize: 11 }} />
										</PieChart>
									</ResponsiveContainer>
								</div>
							)}
						</Panel>
					</div>

					<div className="grid md:grid-cols-2 gap-6">
						<Panel title="Order Fulfillment Breakdown">
							{Object.keys(data.sales.orderStatusBreakdown).length === 0 ? (
								<p className="text-xs text-muted-foreground py-10 text-center">No orders recorded yet.</p>
							) : (
								<div className="h-64">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie data={toPieArray(data.sales.orderStatusBreakdown)} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
												{toPieArray(data.sales.orderStatusBreakdown).map((_, idx) => (
													<Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
												))}
											</Pie>
											<Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
											<Legend wrapperStyle={{ fontSize: 11 }} />
										</PieChart>
									</ResponsiveContainer>
								</div>
							)}
						</Panel>

						<Panel title="Payment Status Breakdown">
							{Object.keys(data.sales.paymentStatusBreakdown).length === 0 ? (
								<p className="text-xs text-muted-foreground py-10 text-center">No payment data recorded yet.</p>
							) : (
								<div className="h-64">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie data={toPieArray(data.sales.paymentStatusBreakdown)} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
												{toPieArray(data.sales.paymentStatusBreakdown).map((_, idx) => (
													<Cell key={idx} fill={PIE_COLORS[(idx + 2) % PIE_COLORS.length]} />
												))}
											</Pie>
											<Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
											<Legend wrapperStyle={{ fontSize: 11 }} />
										</PieChart>
									</ResponsiveContainer>
								</div>
							)}
						</Panel>
					</div>
				</div>
			)}

			{/* TAB 2: DEVICE TRADE-IN & BUYBACK */}
			{activeTab === 'tradeIn' && (
				<div className="space-y-6">
					<div className="grid sm:grid-cols-3 gap-4">
						<div className="p-5 rounded-2xl bg-white border border-sky-500/30 shadow-3xs space-y-1.5">
							<p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">TOTAL TRADE-IN REQUESTS</p>
							<p className="text-2xl font-extrabold text-[#111111] font-mono">{data.tradeIn.totalSubmitted}</p>
							<p className="text-xs text-muted-foreground font-medium">Customer Submissions</p>
						</div>
						<div className="p-5 rounded-2xl bg-white border border-[#599161]/30 shadow-3xs space-y-1.5">
							<p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#599161]">TOTAL PAYOUTS CONFIRMED</p>
							<p className="text-2xl font-extrabold text-[#599161] font-mono">${data.tradeIn.totalApprovedPayouts.toLocaleString()}</p>
							<p className="text-xs text-muted-foreground font-medium">Paid out to customers</p>
						</div>
						<div className="p-5 rounded-2xl bg-white border border-indigo-500/30 shadow-3xs space-y-1.5">
							<p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">AVERAGE OFFER VALUATION</p>
							<p className="text-2xl font-extrabold text-[#111111] font-mono">${data.tradeIn.averageValuation.toLocaleString()}</p>
							<p className="text-xs text-muted-foreground font-medium">Per Device Submission</p>
						</div>
					</div>

					{/* TRADED BRANDS AND DEVICE CONDITION DISTRIBUTION */}
					<div className="grid lg:grid-cols-2 gap-6">
						<Panel title="Device Brand Valuation Performance">
							{data.tradeIn.topBrands.length === 0 ? (
								<p className="text-xs text-muted-foreground py-10 text-center">No brands traded yet.</p>
							) : (
								<div className="space-y-3 pt-2">
									{data.tradeIn.topBrands.map((b) => {
										const max = data.tradeIn.topBrands[0].count || 1
										return (
											<div key={b.brand}>
												<div className="flex justify-between text-xs mb-1.5">
													<span className="text-[#111111] font-extrabold">{b.brand}</span>
													<span className="text-muted-foreground font-mono font-semibold">{b.count} requests (${b.totalValue.toLocaleString()})</span>
												</div>
												<div className="h-2 rounded-full bg-secondary overflow-hidden">
													<div
														className="h-full bg-[#599161] rounded-full transition-all duration-700"
														style={{ width: `${Math.max(6, (b.count / max) * 100)}%` }}
													/>
												</div>
											</div>
										)
									})}
								</div>
							)}
						</Panel>

						<Panel title="Traded Device Condition Distribution">
							{Object.keys(data.tradeIn.conditionBreakdown).length === 0 ? (
								<p className="text-xs text-muted-foreground py-10 text-center">No condition metrics logged.</p>
							) : (
								<div className="h-64">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie data={toPieArray(data.tradeIn.conditionBreakdown)} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
												{toPieArray(data.tradeIn.conditionBreakdown).map((_, idx) => (
													<Cell key={idx} fill={PIE_COLORS[(idx + 2) % PIE_COLORS.length]} />
												))}
											</Pie>
											<Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
											<Legend wrapperStyle={{ fontSize: 11 }} />
										</PieChart>
									</ResponsiveContainer>
								</div>
							)}
						</Panel>
					</div>

					<div className="grid lg:grid-cols-2 gap-6">
						<Panel title="Trade-In Workflow Status Distribution">
							{Object.keys(data.tradeIn.statusBreakdown).length === 0 ? (
								<p className="text-xs text-muted-foreground py-10 text-center">No trade-in submissions yet.</p>
							) : (
								<div className="h-64">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie data={toPieArray(data.tradeIn.statusBreakdown)} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
												{toPieArray(data.tradeIn.statusBreakdown).map((_, idx) => (
													<Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
												))}
											</Pie>
											<Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
											<Legend wrapperStyle={{ fontSize: 11 }} />
										</PieChart>
									</ResponsiveContainer>
								</div>
							)}
						</Panel>

						<Panel title="Top Device Models Traded">
							{data.tradeIn.topModels.length === 0 ? (
								<p className="text-xs text-muted-foreground py-10 text-center">No models recorded yet.</p>
							) : (
								<div className="space-y-3 pt-2">
									{data.tradeIn.topModels.map((mod) => {
										const max = data.tradeIn.topModels[0].count || 1
										return (
											<div key={mod.model}>
												<div className="flex justify-between text-xs mb-1.5">
													<span className="text-[#111111] font-extrabold">{mod.model}</span>
													<span className="text-muted-foreground font-mono">{mod.count} submissions (${mod.totalValue.toLocaleString()})</span>
												</div>
												<div className="h-2 rounded-full bg-secondary overflow-hidden">
													<div
														className="h-full bg-sky-600 rounded-full transition-all duration-700"
														style={{ width: `${Math.max(8, (mod.count / max) * 100)}%` }}
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
			)}

			{/* TAB 3: REPAIR SERVICES */}
			{activeTab === 'repair' && (
				<div className="space-y-6">
					<div className="grid sm:grid-cols-3 gap-4">
						<div className="p-5 rounded-2xl bg-white border border-indigo-500/30 shadow-3xs space-y-1.5">
							<p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-indigo-700 dark:text-indigo-300">TOTAL REPAIR INQUIRIES</p>
							<p className="text-2xl font-extrabold text-[#111111] font-mono">{data.repair.totalRequests}</p>
							<p className="text-xs text-muted-foreground font-medium">Customer Service Requests</p>
						</div>
						<div className="p-5 rounded-2xl bg-white border border-[#599161]/30 shadow-3xs space-y-1.5">
							<p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#599161]">ESTIMATED REPAIR VALUE</p>
							<p className="text-2xl font-extrabold text-[#599161] font-mono">${data.repair.totalEstimatedCost.toLocaleString()}</p>
							<p className="text-xs text-muted-foreground font-medium">Pipeline Repair Quotes</p>
						</div>
						<div className="p-5 rounded-2xl bg-white border border-amber-500/30 shadow-3xs space-y-1.5">
							<p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">ACTIVE BRANDS REPAIRED</p>
							<p className="text-2xl font-extrabold text-[#111111] font-mono">{data.repair.topBrandsRepaired.length}</p>
							<p className="text-xs text-muted-foreground font-medium">Device Brand Categories</p>
						</div>
					</div>

					<div className="grid lg:grid-cols-2 gap-6">
						<Panel title="Repair Request Status Breakdown">
							{Object.keys(data.repair.statusBreakdown).length === 0 ? (
								<p className="text-xs text-muted-foreground py-10 text-center">No repair requests recorded yet.</p>
							) : (
								<div className="h-64">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie data={toPieArray(data.repair.statusBreakdown)} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
												{toPieArray(data.repair.statusBreakdown).map((_, idx) => (
													<Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
												))}
											</Pie>
											<Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
											<Legend wrapperStyle={{ fontSize: 11 }} />
										</PieChart>
									</ResponsiveContainer>
								</div>
							)}
						</Panel>

						<Panel title="Top Device Brands Serviced">
							{data.repair.topBrandsRepaired.length === 0 ? (
								<p className="text-xs text-muted-foreground py-10 text-center">No brand repair metrics recorded.</p>
							) : (
								<div className="space-y-3 pt-2">
									{data.repair.topBrandsRepaired.map((b) => {
										const max = data.repair.topBrandsRepaired[0].count || 1
										return (
											<div key={b.brand}>
												<div className="flex justify-between text-xs mb-1.5">
													<span className="text-[#111111] font-extrabold">{b.brand}</span>
													<span className="text-muted-foreground font-mono font-semibold">{b.count} requests</span>
												</div>
												<div className="h-2 rounded-full bg-secondary overflow-hidden">
													<div
														className="h-full bg-indigo-600 rounded-full transition-all duration-700"
														style={{ width: `${Math.max(6, (b.count / max) * 100)}%` }}
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
			)}

			{/* TAB 4: WHOLESALE & INVENTORY */}
			{activeTab === 'inventory' && (
				<div className="space-y-6">
					<div className="grid sm:grid-cols-4 gap-4">
						<div className="p-5 rounded-2xl bg-white border border-purple-500/30 shadow-3xs space-y-1.5">
							<p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-purple-700 dark:text-purple-300">TOTAL WHOLESALE LOTS</p>
							<p className="text-2xl font-extrabold text-purple-600 font-mono">{data.inventory.wholesaleLotsCount}</p>
							<p className="text-xs text-muted-foreground font-medium">Bulk wholesale catalog lots</p>
						</div>

						<div className="p-5 rounded-2xl bg-white border border-[#599161]/30 shadow-3xs space-y-1.5">
							<p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#599161]">WHOLESALE VALUATION</p>
							<p className="text-2xl font-extrabold text-[#599161] font-mono">
								${(data.inventory.wholesaleValuationTotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
							</p>
							<p className="text-xs text-muted-foreground font-medium">Base price lot valuation</p>
						</div>

						<div className="p-5 rounded-2xl bg-white border border-sky-500/30 shadow-3xs space-y-1.5">
							<p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">BULK DEVICE UNITS</p>
							<p className="text-2xl font-extrabold text-[#111111] font-mono">{data.inventory.wholesaleDevicesTotal || 0}</p>
							<p className="text-xs text-muted-foreground font-medium">Devices across lots</p>
						</div>

						<div className="p-5 rounded-2xl bg-white border border-[#E9ECEA] shadow-3xs space-y-1.5">
							<p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground">STANDARD INVENTORY VALUE</p>
							<p className="text-2xl font-extrabold text-[#111111] font-mono">${data.inventory.totalInventoryValue.toLocaleString()}</p>
							<p className="text-xs text-muted-foreground font-medium">{data.inventory.activeListings} Active standard listings</p>
						</div>
					</div>

					{/* LIVE WHOLESALE LOTS BREAKDOWN TABLE */}
					<Panel title="Live Bulk Wholesale Lots Inventory">
						{data.inventory.wholesaleLotsList.length === 0 ? (
							<p className="text-xs text-muted-foreground py-10 text-center">No wholesale lots created yet.</p>
						) : (
							<div className="overflow-x-auto">
								<table className="w-full text-left text-xs">
									<thead className="bg-[#EEF7F0]/50 text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground border-b border-[#E9ECEA]">
										<tr>
											<th className="py-3 px-4">Lot Name</th>
											<th className="py-3 px-4">SKU</th>
											<th className="py-3 px-4">Category</th>
											<th className="py-3 px-4">Lot Qty</th>
											<th className="py-3 px-4">Base Price</th>
											<th className="py-3 px-4">Status</th>
											<th className="py-3 px-4">Price Tiers</th>
										</tr>
									</thead>
									<tbody className="divide-y divide-[#E9ECEA]">
										{data.inventory.wholesaleLotsList.map((lot) => (
											<tr key={lot.id} className="hover:bg-[#EEF7F0]/20 transition-colors">
												<td className="py-3.5 px-4 font-extrabold text-[#111111]">{lot.name}</td>
												<td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground">{lot.sku}</td>
												<td className="py-3.5 px-4 font-semibold">
													<span className="px-2.5 py-1 rounded-full bg-[#EEF7F0] text-[#599161] text-[10px] font-bold">
														{lot.category}
													</span>
												</td>
												<td className="py-3.5 px-4 font-bold text-[#111111]">{lot.lotQuantity}</td>
												<td className="py-3.5 px-4 font-mono font-extrabold text-emerald-600">
													${lot.basePrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
												</td>
												<td className="py-3.5 px-4">
													<span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
														lot.status === 'Active'
															? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/25'
															: 'bg-amber-500/10 text-amber-600 border border-amber-500/25'
													}`}>
														{lot.status}
													</span>
												</td>
												<td className="py-3.5 px-4">
													<span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-500/10 text-purple-600 text-[10px] font-bold border border-purple-500/20">
														<Tag className="w-3 h-3" />
														{lot.tiersCount > 0 ? `${lot.tiersCount} Price Tiers` : 'Tiers Set'}
													</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						)}
					</Panel>

					<Panel title="Standard Inventory Category Breakdown">
						{data.inventory.categoryStock.length === 0 ? (
							<p className="text-xs text-muted-foreground py-10 text-center">No categories recorded yet.</p>
						) : (
							<div className="space-y-3 pt-2">
								{data.inventory.categoryStock.map((cat) => {
									const max = data.inventory.categoryStock[0].count || 1
									return (
										<div key={cat.category}>
											<div className="flex justify-between text-xs mb-1.5">
												<span className="text-[#111111] font-extrabold">{cat.category}</span>
												<span className="text-muted-foreground font-mono">{cat.count} listings</span>
											</div>
											<div className="h-2 rounded-full bg-secondary overflow-hidden">
												<div
													className="h-full bg-amber-600 rounded-full transition-all duration-700"
													style={{ width: `${Math.max(6, (cat.count / max) * 100)}%` }}
												/>
											</div>
										</div>
									)
								})}
							</div>
						)}
					</Panel>
				</div>
			)}

			{/* TAB 5: CUSTOMER & GROWTH */}
			{activeTab === 'customer' && (
				<div className="space-y-6">
					<div className="grid sm:grid-cols-3 gap-4">
						<div className="p-5 rounded-2xl bg-white border border-purple-500/30 shadow-3xs space-y-1.5">
							<p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-purple-700 dark:text-purple-300">NEWSLETTER SUBSCRIBERS</p>
							<p className="text-2xl font-extrabold text-purple-600 font-mono">{data.customer.totalSubscribers}</p>
							<p className="text-xs text-muted-foreground font-medium">Opted-in email subscribers</p>
						</div>
						<div className="p-5 rounded-2xl bg-white border border-sky-500/30 shadow-3xs space-y-1.5">
							<p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-sky-700 dark:text-sky-300">CONTACT INQUIRIES</p>
							<p className="text-2xl font-extrabold text-[#111111] font-mono">{data.customer.totalInquiries}</p>
							<p className="text-xs text-muted-foreground font-medium">Customer Messages</p>
						</div>
						<div className="p-5 rounded-2xl bg-white border border-emerald-500/30 shadow-3xs space-y-1.5">
							<p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-emerald-700 dark:text-emerald-300">CHECKOUT USER TYPE</p>
							<p className="text-lg font-extrabold text-[#599161] font-mono">
								{data.customer.customerTypeBreakdown.registered} Registered / {data.customer.customerTypeBreakdown.guest} Guest
							</p>
							<p className="text-xs text-muted-foreground font-medium">Account checkout ratio</p>
						</div>
					</div>

					<div className="grid lg:grid-cols-2 gap-6">
						<Panel title="Contact Inquiry Resolution Status">
							{Object.keys(data.customer.inquiryStatusBreakdown).length === 0 ? (
								<p className="text-xs text-muted-foreground py-10 text-center">No inquiries recorded yet.</p>
							) : (
								<div className="h-64">
									<ResponsiveContainer width="100%" height="100%">
										<PieChart>
											<Pie data={toPieArray(data.customer.inquiryStatusBreakdown)} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={3}>
												{toPieArray(data.customer.inquiryStatusBreakdown).map((_, idx) => (
													<Cell key={idx} fill={PIE_COLORS[(idx + 1) % PIE_COLORS.length]} />
												))}
											</Pie>
											<Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
											<Legend wrapperStyle={{ fontSize: 11 }} />
										</PieChart>
									</ResponsiveContainer>
								</div>
							)}
						</Panel>

						<Panel title="Checkout Account Type Ratio">
							<div className="h-64">
								<ResponsiveContainer width="100%" height="100%">
									<PieChart>
										<Pie 
											data={[
												{ name: 'REGISTERED CHECKOUTS', value: data.customer.customerTypeBreakdown.registered },
												{ name: 'GUEST CHECKOUTS', value: data.customer.customerTypeBreakdown.guest }
											]} 
											dataKey="value" 
											nameKey="name" 
											innerRadius={45} 
											outerRadius={80} 
											paddingAngle={3}
										>
											<Cell fill="#599161" />
											<Cell fill="#64748b" />
										</Pie>
										<Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, fontSize: 12 }} />
										<Legend wrapperStyle={{ fontSize: 11 }} />
									</PieChart>
								</ResponsiveContainer>
							</div>
						</Panel>
					</div>
				</div>
			)}
		</div>
	)
}
