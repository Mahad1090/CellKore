'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
	Package, Tag, ShoppingBag, Boxes, Phone, Users, Plus, ListOrdered,
	DollarSign, TrendingUp, Smartphone, Wrench, ShieldCheck, ArrowRight, RefreshCw, AlertCircle, Clock, Eye, Lock,
	Layers, Activity, Info
} from 'lucide-react'
import { PageTitle, Panel } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { formatRequestId } from '@/lib/sell-request-contact'
import { SellStatusBadge } from '@/components/sell-status-timeline'

interface DashboardMetrics {
	activeListings: number
	categories: number
	orders: number
	wholesaleLots: number
	sellRequests: number
	pendingSellRequests: number
	pendingInquiries: number
	repairRequests: number
	subscribers: number
	totalGrossSales: number
	totalTradeInPayouts: number
}

interface RecentSellRequest {
	id: string
	device_brand: string
	device_model: string
	condition: string
	status: any
	offered_price: number | null
	submitted_at: string
}

interface RecentOrder {
	id: string
	order_number: string
	status: string
	payment_status: string
	total_amount: number
	created_at: string
	customer_name: string | null
}

interface LowStockProduct {
	id: string
	name: string
	sku: string
	stock: number
	base_price: number
}

interface SystemLog {
	id: string
	level: string
	source: string
	message: string
	created_at: string
}

interface WorkflowLog {
	id: string
	status: string
	note: string | null
	changed_by: string
	created_at: string
	sell_phone_requests: {
		device_brand: string
		device_model: string
	} | null
}

interface DashboardData {
	metrics: DashboardMetrics
	recentSellRequests: RecentSellRequest[]
	recentOrders: RecentOrder[]
	lowStockProducts: LowStockProduct[]
	systemLogs: SystemLog[]
	workflowLogs: WorkflowLog[]
}

export default function AdminDashboardPage() {
	const [data, setData] = useState<DashboardData | null>(null)

	const loadDashboard = () => {
		setData(null)
		fetch('/api/admin/dashboard')
			.then((res) => res.json())
			.then((json) => setData(json.metrics ? json : null))
			.catch(() => setData(null))
	}

	useEffect(() => {
		loadDashboard()
	}, [])

	if (!data) {
		return (
			<div className="space-y-6 font-sans p-2">
				<div className="h-6 w-72 bg-muted rounded-md animate-pulse" />
				<TableShimmer rows={8} />
			</div>
		)
	}

	const m = data.metrics

	return (
		<div className="space-y-8 font-sans pb-12 text-[#111111] max-w-7xl mx-auto">
			


			{/* 2. Apple-Style Large Hero Header Panel - Dark Forest Green Background with White Text */}
			<div className="relative overflow-hidden rounded-2xl border border-[#599161]/30 bg-[#599161] text-white p-8 lg:p-10 flex flex-col md:flex-row items-center justify-between gap-8 shadow-md">
				<div className="space-y-4 max-w-xl text-left">
					<span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest bg-white/15 text-white border border-white/20">
						Operations Center
					</span>
					<h1 className="text-3xl lg:text-4xl font-extrabold tracking-tight text-white">
						CellKore Operations
					</h1>
					<p className="text-xs lg:text-sm text-slate-100 leading-relaxed font-sans font-medium">
						Manage your store, inventory, trade-ins, wholesale and customer orders from one intelligent workspace.
					</p>
					<div className="pt-2 flex items-center gap-2 text-slate-200/90 text-[10px] font-semibold font-mono">
						<Clock className="w-3.5 h-3.5 text-white" />
						<span>Last synced: {new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
					</div>
				</div>

				{/* Hero Device Mockup Image Showcase (Serving from public directory, no crash) */}
				<div className="relative w-64 h-40 md:w-80 md:h-48 shrink-0 overflow-hidden rounded-xl bg-white border border-[#E9ECEA] shadow-2xs">
					<img
						src="/dashboard_hero_devices.png"
						alt="CellKore Hardware Showcase"
						className="w-full h-full object-cover rounded-xl"
					/>
				</div>
			</div>

			{/* 3. Redesigned Premium Stat KPI Cards (22px rounded corners) */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
				
				{/* KPI 1: Trade-in Submissions */}
				<Link href="/admin/sell-requests" className="group block">
					<div className="p-6 rounded-[22px] bg-white border border-[#E9ECEA] hover:border-[#599161] hover:shadow-2xs transition-all duration-300 space-y-4">
						<div className="flex items-center justify-between">
							<div className="w-8 h-8 rounded-lg bg-[#EEF7F0] flex items-center justify-center text-[#599161]">
								<Phone className="w-4 h-4" />
							</div>
							<span className="text-[10px] font-bold uppercase tracking-wider text-[#599161] bg-[#EEF7F0] px-2 py-0.5 rounded-md font-mono">
								Trade-Ins
							</span>
						</div>
						<div>
							<p className="text-3xl font-extrabold text-[#111111] font-mono">{m.sellRequests}</p>
							<p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-1">
								Trade-in Submissions
							</p>
						</div>
						<div className="flex items-center justify-between text-[10px] font-bold text-[#599161] pt-1">
							<span>{m.pendingSellRequests} Pending Review</span>
							<ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
						</div>
					</div>
				</Link>

				{/* KPI 2: Sales Orders */}
				<Link href="/admin/orders" className="group block">
					<div className="p-6 rounded-[22px] bg-white border border-[#E9ECEA] hover:border-[#599161] hover:shadow-2xs transition-all duration-300 space-y-4">
						<div className="flex items-center justify-between">
							<div className="w-8 h-8 rounded-lg bg-[#EEF7F0] flex items-center justify-center text-[#599161]">
								<ShoppingBag className="w-4 h-4" />
							</div>
							<span className="text-[10px] font-bold uppercase tracking-wider text-[#599161] bg-[#EEF7F0] px-2 py-0.5 rounded-md font-mono">
								Store Sales
							</span>
						</div>
						<div>
							<p className="text-3xl font-extrabold text-[#111111] font-mono">{m.orders}</p>
							<p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-1">
								Sales Orders
							</p>
						</div>
						<div className="flex items-center justify-between text-[10px] font-bold text-[#599161] pt-1">
							<span>${m.totalGrossSales.toLocaleString(undefined, { minimumFractionDigits: 2 })} Revenue</span>
							<ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
						</div>
					</div>
				</Link>

				{/* KPI 3: Wholesale Lots */}
				<Link href="/admin/wholesale" className="group block">
					<div className="p-6 rounded-[22px] bg-white border border-[#E9ECEA] hover:border-[#599161] hover:shadow-2xs transition-all duration-300 space-y-4">
						<div className="flex items-center justify-between">
							<div className="w-8 h-8 rounded-lg bg-[#EEF7F0] flex items-center justify-center text-[#599161]">
								<Boxes className="w-4 h-4" />
							</div>
							<span className="text-[10px] font-bold uppercase tracking-wider text-[#599161] bg-[#EEF7F0] px-2 py-0.5 rounded-md font-mono">
								Wholesale
							</span>
						</div>
						<div>
							<p className="text-3xl font-extrabold text-[#111111] font-mono">{m.wholesaleLots}</p>
							<p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-1">
								Wholesale Listings
							</p>
						</div>
						<div className="flex items-center justify-between text-[10px] font-bold text-[#599161] pt-1">
							<span>Bulk Lots</span>
							<ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
						</div>
					</div>
				</Link>

				{/* KPI 4: Active Store Products */}
				<Link href="/admin/products" className="group block">
					<div className="p-6 rounded-[22px] bg-white border border-[#E9ECEA] hover:border-[#599161] hover:shadow-2xs transition-all duration-300 space-y-4">
						<div className="flex items-center justify-between">
							<div className="w-8 h-8 rounded-lg bg-[#EEF7F0] flex items-center justify-center text-[#599161]">
								<Package className="w-4 h-4" />
							</div>
							<span className="text-[10px] font-bold uppercase tracking-wider text-[#599161] bg-[#EEF7F0] px-2 py-0.5 rounded-md font-mono">
								Inventory
							</span>
						</div>
						<div>
							<p className="text-3xl font-extrabold text-[#111111] font-mono">{m.activeListings}</p>
							<p className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mt-1">
								Store Products
							</p>
						</div>
						<div className="flex items-center justify-between text-[10px] font-bold text-[#599161] pt-1">
							<span>{m.categories} Categories</span>
							<ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
						</div>
					</div>
				</Link>
			</div>

			{/* 4. Three Custom Management Panels */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				
				{/* Panel A: Recent Orders */}
				<div className="bg-white border border-[#E9ECEA] rounded-xl p-5 space-y-4 shadow-3xs">
					<div className="flex items-center justify-between border-b border-[#E9ECEA] pb-3">
						<h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
							<ShoppingBag className="w-4 h-4 text-[#599161]" />
							Recent Orders
						</h3>
						<Link href="/admin/orders" className="text-[10px] font-bold text-[#599161] hover:underline uppercase tracking-wider">
							View All
						</Link>
					</div>

					{data.recentOrders.length === 0 ? (
						<p className="text-xs text-muted-foreground py-6 text-center">No orders recorded</p>
					) : (
						<div className="divide-y divide-[#E9ECEA]">
							{data.recentOrders.map((ord) => (
								<div key={ord.id} className="py-2.5 flex items-center justify-between text-xs">
									<div className="min-w-0">
										<p className="font-bold text-[#111111]">#{ord.order_number || ord.id.slice(0, 8)}</p>
										<p className="text-[10px] text-muted-foreground mt-0.5 truncate">{ord.customer_name || 'Guest Checkout'}</p>
									</div>
									<div className="text-right">
										<span className="font-extrabold text-[#111111] block font-mono">${Number(ord.total_amount ?? 0).toFixed(2)}</span>
										<span className="text-[9px] uppercase font-bold text-[#599161] bg-[#EEF7F0] px-1.5 py-0.5 rounded mt-0.5 inline-block">
											{ord.payment_status}
										</span>
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Panel B: Recent Trade-ins */}
				<div className="bg-white border border-[#E9ECEA] rounded-xl p-5 space-y-4 shadow-3xs">
					<div className="flex items-center justify-between border-b border-[#E9ECEA] pb-3">
						<h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
							<Phone className="w-4 h-4 text-[#599161]" />
							Recent Trade-ins
						</h3>
						<Link href="/admin/sell-requests" className="text-[10px] font-bold text-[#599161] hover:underline uppercase tracking-wider">
							View All
						</Link>
					</div>

					{data.recentSellRequests.length === 0 ? (
						<p className="text-xs text-muted-foreground py-6 text-center">No submissions recorded</p>
					) : (
						<div className="divide-y divide-[#E9ECEA]">
							{data.recentSellRequests.map((req) => (
								<div key={req.id} className="py-2.5 flex items-center justify-between text-xs">
									<div>
										<p className="font-bold text-[#111111]">{req.device_brand} {req.device_model}</p>
										<p className="text-[10px] text-muted-foreground mt-0.5 uppercase">Condition: {req.condition}</p>
									</div>
									<div>
										<SellStatusBadge status={req.status} />
									</div>
								</div>
							))}
						</div>
					)}
				</div>

				{/* Panel C: Inventory Alerts */}
				<div className="bg-white border border-[#E9ECEA] rounded-xl p-5 space-y-4 shadow-3xs">
					<div className="flex items-center justify-between border-b border-[#E9ECEA] pb-3">
						<h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
							<AlertCircle className="w-4 h-4 text-red-500" />
							Inventory Alert
						</h3>
						<Link href="/admin/products" className="text-[10px] font-bold text-[#599161] hover:underline uppercase tracking-wider">
							View All
						</Link>
					</div>

					{data.lowStockProducts.length === 0 ? (
						<p className="text-xs text-muted-foreground py-6 text-center">All product stock counts are optimal.</p>
					) : (
						<div className="divide-y divide-[#E9ECEA]">
							{data.lowStockProducts.map((p) => (
								<div key={p.id} className="py-2.5 flex items-center justify-between text-xs">
									<div className="min-w-0">
										<p className="font-bold text-[#111111] truncate">{p.name}</p>
										<p className="text-[10px] text-muted-foreground mt-0.5 font-mono">SKU: {p.sku || '—'}</p>
									</div>
									<div className="text-right shrink-0">
										<span className="inline-block text-[10px] font-extrabold font-mono text-red-600 bg-red-50 dark:bg-red-950/20 px-2.5 py-0.5 rounded border border-red-200/50">
											{p.stock} left
										</span>
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>

			{/* 5. Bottom Section: Separated Admin & System Telemetry Activity Logs */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
				{/* Admin Operations & Workflow Log */}
				<div className="bg-white border border-[#E9ECEA] rounded-xl p-5 space-y-4 shadow-3xs">
					<div className="flex items-center justify-between border-b border-[#E9ECEA] pb-3">
						<h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5 font-sans">
							<ShieldCheck className="w-4 h-4 text-[#599161]" />
							Admin Operations Log
						</h3>
						<span className="text-[9px] font-mono text-muted-foreground uppercase font-bold">Workflow Actions</span>
					</div>
					{data.workflowLogs.length === 0 ? (
						<p className="text-xs text-muted-foreground py-8 text-center font-mono">[ NO RECENT WORKFLOW TRANSITIONS ]</p>
					) : (
						<div className="space-y-3 max-h-64 overflow-y-auto pr-1">
							{data.workflowLogs.map((log) => (
								<div key={log.id} className="p-3 bg-[#F7F7F5] border border-[#E9ECEA] rounded-lg text-xs space-y-1">
									<div className="flex items-center justify-between gap-2">
										<span className="font-extrabold uppercase text-[9px] tracking-wider font-mono text-[#599161]">
											{log.changed_by.toUpperCase()} ACTION
										</span>
										<span className="text-[9px] text-muted-foreground font-mono">
											{new Date(log.created_at).toLocaleDateString()} at {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										</span>
									</div>
									<p className="text-muted-foreground">
										Updated status to <span className="font-bold text-[#111111] uppercase font-mono">{log.status}</span>
										{log.sell_phone_requests && (
											<span> for <span className="font-semibold text-[#111111]">{log.sell_phone_requests.device_brand} {log.sell_phone_requests.device_model}</span></span>
										)}
									</p>
									{log.note && (
										<p className="text-[11px] text-[#111111] italic bg-white p-1.5 rounded border border-[#E9ECEA] mt-1.5 leading-snug">
											"{log.note}"
										</p>
									)}
								</div>
							))}
						</div>
					)}
				</div>

				{/* System Telemetry & Incidents Log */}
				<div className="bg-white border border-[#E9ECEA] rounded-xl p-5 space-y-4 shadow-3xs">
					<div className="flex items-center justify-between border-b border-[#E9ECEA] pb-3">
						<h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5 font-sans">
							<Activity className="w-4 h-4 text-[#599161]" />
							System Telemetry Log
						</h3>
						<span className="text-[9px] font-mono text-muted-foreground uppercase font-bold">API & Webhooks</span>
					</div>
					{data.systemLogs.length === 0 ? (
						<div className="p-4 bg-[#EEF7F0] border border-[#599161]/20 rounded-lg text-xs text-center space-y-2 py-8">
							<p className="font-extrabold text-[#599161] uppercase text-[9px] tracking-wider font-mono">SYSTEMS INITIATED</p>
							<p className="text-muted-foreground">Database pipelines, Stripe payment webhooks, and catalog APIs are fully synchronized. No incident reports logs detected.</p>
							<span className="text-[9px] font-mono text-muted-foreground/80 block">All systems operational</span>
						</div>
					) : (
						<div className="space-y-3 max-h-64 overflow-y-auto pr-1">
							{data.systemLogs.map((log) => (
								<div key={log.id} className="p-3 bg-[#F7F7F5] border border-[#E9ECEA] rounded-lg text-xs space-y-1">
									<div className="flex items-center justify-between gap-2">
										<span className="font-extrabold uppercase text-[9px] tracking-wider font-mono text-red-600 bg-red-50 dark:bg-red-950/20 px-2 py-0.5 rounded border border-red-200/50">
											{log.level.toUpperCase()}
										</span>
										<span className="text-[9px] text-muted-foreground font-mono">
											{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
										</span>
									</div>
									<p className="font-bold text-[#111111] font-mono text-[10px]">Source: {log.source}</p>
									<p className="text-muted-foreground leading-relaxed font-sans">{log.message}</p>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
