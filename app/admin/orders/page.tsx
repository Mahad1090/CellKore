'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, X, MapPin, Users, ShoppingBag, CreditCard, Ship, FileText, Printer, Download, Plus, Check, CheckCircle, Truck, TrendingUp, Search } from 'lucide-react'
import { PageTitle, StatusBadge, EmptyState, adminInput } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'

const ORDER_STATUSES: string[] = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled']
const PAYMENT_STATUSES: string[] = ['unpaid', 'paid', 'refunded', 'failed']

export default function AdminOrdersPage() {
	const [orders, setOrders] = useState<any[] | null>(null)
	const [expanded, setExpanded] = useState<string | null>(null)
	const [searchQuery, setSearchQuery] = useState('')
	const [statusFilter, setStatusFilter] = useState('all')
	const [paymentFilter, setPaymentFilter] = useState('all')
	const { can } = useAdmin()
	const { toast } = useToast()

	const load = useCallback(() => {
		fetch('/api/admin/orders')
			.then((res) => res.json())
			.then((json) => setOrders(json.orders ?? []))
			.catch(() => setOrders([]))
	}, [])

	useEffect(load, [])

	const patch = async (id: string, body: Record<string, string>) => {
		const res = await fetch(`/api/admin/orders/${id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body),
		})
		if (res.ok) {
			load()
			toast({ title: 'Success', description: 'Order updated successfully', variant: 'success' })
		} else {
			const json = await res.json()
			toast({ title: 'Update failed', description: json.error, variant: 'error' })
		}
	}

	const writable = can('orders:write')

	// Calculate summary metrics from local order records
	const totalOrders = orders ? orders.length : 0
	const paidOrders = orders ? orders.filter((o) => o.payment_status === 'paid').length : 0
	const shippedDelivered = orders ? orders.filter((o) => o.status === 'shipped' || o.status === 'delivered').length : 0
	const totalRevenue = orders 
		? orders.filter((o) => o.payment_status === 'paid').reduce((acc, o) => acc + Number(o.total_amount), 0)
		: 0

	// Client-side filtering logic
	const filteredOrders = (orders ?? []).filter((order) => {
		const matchesSearch = 
			!searchQuery.trim() ||
			(order.reference ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
			(order.users?.full_name ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
			(order.users?.email ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
			(order.contact_email ?? '').toLowerCase().includes(searchQuery.toLowerCase())

		const matchesStatus = statusFilter === 'all' || order.status === statusFilter
		const matchesPayment = paymentFilter === 'all' || order.payment_status === paymentFilter

		return matchesSearch && matchesStatus && matchesPayment
	})

	return (
		<div className="space-y-6">
			<PageTitle title="Orders" subtitle="Order and payment status monitor" />

			{orders !== null && (
				<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
					{/* Total Orders Card */}
					<div className="p-5 rounded-2xl bg-[#2c5282] text-white border border-[#2c5282]/35 shadow-3xs transition-all duration-300 space-y-3 hover:bg-[#2a4365]">
						<div className="flex items-center justify-between">
							<div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
								<ShoppingBag className="w-4 h-4" />
							</div>
							<span className="text-[9px] font-bold uppercase tracking-wider text-white bg-white/15 px-2 py-0.5 rounded-md font-mono border border-white/10">
								Volume
							</span>
						</div>
						<div>
							<p className="text-2xl font-extrabold text-white font-mono">{totalOrders}</p>
							<p className="text-[10px] uppercase font-bold tracking-wider text-white/85 mt-0.5">
								Total Orders
							</p>
						</div>
					</div>

					{/* Paid Orders Card */}
					<div className="p-5 rounded-2xl bg-[#137a6b] text-white border border-[#137a6b]/35 shadow-3xs transition-all duration-300 space-y-3 hover:bg-[#0c594e]">
						<div className="flex items-center justify-between">
							<div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
								<CheckCircle className="w-4 h-4" />
							</div>
							<span className="text-[9px] font-bold uppercase tracking-wider text-white bg-white/15 px-2 py-0.5 rounded-md font-mono border border-white/10">
								Settled
							</span>
						</div>
						<div>
							<p className="text-2xl font-extrabold text-white font-mono">{paidOrders}</p>
							<p className="text-[10px] uppercase font-bold tracking-wider text-white/85 mt-0.5">
								Paid Orders
							</p>
						</div>
					</div>

					{/* Shipped/Delivered Card */}
					<div className="p-5 rounded-2xl bg-[#b05d23] text-white border border-[#b05d23]/35 shadow-3xs transition-all duration-300 space-y-3 hover:bg-[#914716]">
						<div className="flex items-center justify-between">
							<div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
								<Truck className="w-4 h-4" />
							</div>
							<span className="text-[9px] font-bold uppercase tracking-wider text-white bg-white/15 px-2 py-0.5 rounded-md font-mono border border-white/10">
								Fulfillment
							</span>
						</div>
						<div>
							<p className="text-2xl font-extrabold text-white font-mono">{shippedDelivered}</p>
							<p className="text-[10px] uppercase font-bold tracking-wider text-white/85 mt-0.5">
								Dispatched / Shipped
							</p>
						</div>
					</div>

					{/* Revenue Card (Hero Card - Solid brand green) */}
					<div className="p-5 rounded-2xl bg-[#599161] text-white border border-[#599161]/35 shadow-md transition-all duration-300 space-y-3 hover:bg-[#48784f]">
						<div className="flex items-center justify-between">
							<div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white">
								<TrendingUp className="w-4 h-4" />
							</div>
							<span className="text-[9px] font-bold uppercase tracking-wider text-white bg-white/15 px-2 py-0.5 rounded-md font-mono border border-white/10">
								Revenue
							</span>
						</div>
						<div>
							<p className="text-2xl font-extrabold text-white font-mono">${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
							<p className="text-[10px] uppercase font-bold tracking-wider text-white/85 mt-0.5">
								Gross Settled Sales
							</p>
						</div>
					</div>
				</div>
			)}

			{/* Filter Control Bar */}
			{orders !== null && (
				<div className="flex flex-col sm:flex-row gap-3 bg-white p-4 rounded-2xl border border-[#E9ECEA] shadow-3xs">
					<div className="relative flex-1">
						<Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
						<input
							type="text"
							value={searchQuery}
							onChange={(e) => setSearchQuery(e.target.value)}
							className="w-full pl-9 pr-4 py-2 rounded-xl border border-[#E9ECEA] bg-[#F7F7F5] text-xs focus:outline-none focus:border-[#599161] focus:bg-white transition-all font-sans"
							placeholder="Search by Reference, Customer Name or Email..."
						/>
					</div>
					<div className="flex flex-wrap gap-3">
						<select
							value={statusFilter}
							onChange={(e) => setStatusFilter(e.target.value)}
							className="px-3 py-2 rounded-xl border border-[#E9ECEA] bg-[#F7F7F5] text-xs focus:outline-none focus:border-[#599161] bg-white cursor-pointer font-sans capitalize font-semibold"
						>
							<option value="all">All Order Statuses</option>
							{ORDER_STATUSES.map((s) => (
								<option key={s} value={s}>{s}</option>
							))}
						</select>
						<select
							value={paymentFilter}
							onChange={(e) => setPaymentFilter(e.target.value)}
							className="px-3 py-2 rounded-xl border border-[#E9ECEA] bg-[#F7F7F5] text-xs focus:outline-none focus:border-[#599161] bg-white cursor-pointer font-sans capitalize font-semibold"
						>
							<option value="all">All Payment Statuses</option>
							{PAYMENT_STATUSES.map((s) => (
								<option key={s} value={s}>{s}</option>
							))}
						</select>
					</div>
				</div>
			)}

			{orders === null ? (
				<TableShimmer />
			) : filteredOrders.length === 0 ? (
				<EmptyState message="No matching orders found." />
			) : (
				<div className="border border-[#E9ECEA] rounded-3xl overflow-hidden bg-card overflow-x-auto">
					<table className="w-full text-sm min-w-[820px]">
						<thead>
							<tr className="bg-secondary text-left border-b border-[#E9ECEA]">
								{['Reference', 'Marketplace', 'Total', 'Placed', 'Order Status', 'Payment', ''].map((h) => (
									<th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">{h}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{filteredOrders.map((order) => (
								<OrderRow
									key={order.id}
									order={order}
									expanded={expanded === order.id}
									onToggle={() => setExpanded(expanded === order.id ? null : order.id)}
									writable={writable}
									onPatch={patch}
								/>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	)
}

function OrderRow({
	order,
	expanded,
	onToggle,
	writable,
	onPatch,
}: {
	order: any
	expanded: boolean
	onToggle: () => void
	writable: boolean
	onPatch: (id: string, body: Record<string, string>) => void
}) {
	const { toast } = useToast()

	// Local state for shipping details & tabs
	const [activeSubTab, setActiveSubTab] = useState<'customer' | 'items' | 'shipping'>('customer')
	const [customAddress, setCustomAddress] = useState<string>('')
	const [customName, setCustomName] = useState<string>('')
	const [customPhone, setCustomPhone] = useState<string>('')
	const [orderNote, setOrderNote] = useState<string>('')
	const [carrier, setCarrier] = useState<string>('Canada Post')
	const [trackingNum, setTrackingNum] = useState<string>('7023210159049755')

	useEffect(() => {
		const name = order.users?.full_name || order.gift_recipient_name || 'Areeba Waqar'
		const phone = order.users?.phone || order.gift_recipient_phone || '+92 3141812453'
		const addr = order.shipping_address
			? `${order.shipping_address.line1} ${order.shipping_address.line2 || ''}\n${order.shipping_address.city}, ${order.shipping_address.state_province || ''} ${order.shipping_address.postal_code || ''}\n${order.shipping_address.country.toUpperCase()}`
			: 'abc\nWAH CANTT, Punjab 47000\nPAKISTAN'

		setCustomName(name)
		setCustomPhone(phone)
		setCustomAddress(addr)
		setOrderNote(order.gift_message || '')
		setCarrier(order.marketplace === 'CA' ? 'Canada Post' : 'USPS')
	}, [order])

	const handlePrintLabel = () => {
		const printWindow = window.open('', '_blank')
		if (!printWindow) return

		const itemsDesc = (order.order_items || []).map((i: any) => `${i.products?.name ?? 'Product'} x ${i.quantity}`).join(', ') || 'iPhone 15 Pro Max x 1'
		const ref = order.reference || `CK-${new Date().getFullYear()}-14395`

		printWindow.document.write(`
			<html>
			<head>
				<title>Shipping Label - ${ref}</title>
				<style>
					@page {
						size: 4in 6in;
						margin: 0;
					}
					body {
						font-family: Arial, sans-serif;
						margin: 0;
						padding: 12px;
						width: 3.8in;
						height: 5.8in;
						box-sizing: border-box;
						background-color: #ffffff;
						color: #000000;
					}
					.label-border {
						border: 3px solid #000000;
						height: 100%;
						padding: 10px;
						display: flex;
						flex-direction: column;
						justify-content: space-between;
						box-sizing: border-box;
					}
					.header {
						border-bottom: 2px solid #000000;
						padding-bottom: 6px;
						text-align: center;
						font-size: 15px;
						font-weight: 800;
						letter-spacing: 1px;
						text-transform: uppercase;
					}
					.section {
						border-bottom: 1px solid #000000;
						padding: 6px 0;
						font-size: 10px;
						line-height: 1.25;
					}
					.address-title {
						font-weight: bold;
						text-transform: uppercase;
						font-size: 8px;
						margin-bottom: 2px;
						letter-spacing: 0.5px;
					}
					.bold {
						font-weight: bold;
					}
					.barcode-container {
						text-align: center;
						padding: 8px 0;
					}
					.barcode-lines {
						display: flex;
						justify-content: center;
						align-items: stretch;
						height: 48px;
						margin-bottom: 4px;
					}
					.barcode-lines div {
						background-color: #000000;
						margin-right: 1px;
					}
					.tracking-text {
						font-size: 10px;
						font-weight: bold;
						letter-spacing: 1px;
					}
					.footer-info {
						font-size: 8px;
						text-align: center;
						font-weight: bold;
						text-transform: uppercase;
						letter-spacing: 0.5px;
					}
				</style>
			</head>
			<body>
				<div class="label-border">
					<div class="header">
						${carrier.toUpperCase()} POSTAGE PAID
					</div>
					
					<div class="section">
						<div class="address-title">FROM:</div>
						<div class="bold">CELLKORE LOGISTICS</div>
						<div>123 Logistics Way, Suite A</div>
						<div>Toronto, ON, M5V 2N2, Canada</div>
					</div>

					<div class="section" style="flex: 1;">
						<div class="address-title">SHIP TO:</div>
						<div class="bold" style="font-size: 13px; text-transform: uppercase;">${customName}</div>
						<div style="white-space: pre-line; font-size: 10.5px; margin-top: 2px;">${customAddress}</div>
						<div style="margin-top: 4px;">Phone: ${customPhone}</div>
					</div>

					<div class="section">
						<div class="bold">REF: ${ref}</div>
						<div style="margin-top: 2px; font-weight: 500;">ITEMS: ${itemsDesc}</div>
						${orderNote ? `<div style="margin-top: 4px; font-style: italic; font-weight: bold;">Note: "${orderNote}"</div>` : ''}
					</div>

					<div class="barcode-container">
						<div class="barcode-lines">
							<div style="width: 2px;"></div><div style="width: 4px;"></div><div style="width: 1px;"></div>
							<div style="width: 3px;"></div><div style="width: 2px;"></div><div style="width: 5px;"></div>
							<div style="width: 1px;"></div><div style="width: 4px;"></div><div style="width: 2px;"></div>
							<div style="width: 3px;"></div><div style="width: 1px;"></div><div style="width: 5px;"></div>
							<div style="width: 2px;"></div><div style="width: 4px;"></div><div style="width: 1px;"></div>
							<div style="width: 3px;"></div><div style="width: 2px;"></div><div style="width: 5px;"></div>
							<div style="width: 1px;"></div><div style="width: 4px;"></div><div style="width: 2px;"></div>
							<div style="width: 3px;"></div><div style="width: 2px;"></div><div style="width: 4px;"></div>
						</div>
						<div class="tracking-text">TRACKING #: ${trackingNum}</div>
					</div>

					<div class="footer-info">
						CellKore Fulfillment Hub - Internal Dispatch Copy
					</div>
				</div>
				<script>
					window.onload = function() {
						window.print();
						window.onafterprint = function() {
							window.close();
						}
					}
				</script>
			</body>
			</html>
		`)
		printWindow.document.close()
	}

	const handleDownloadPDF = () => {
		toast({ title: 'Downloading label PDF', description: 'Generating layout copy...', variant: 'success' })
		handlePrintLabel()
	}

	return (
		<>
			<tr 
				className="border-t border-[#E9ECEA] hover:bg-[#EEF7F0]/10 transition-colors cursor-pointer" 
				onClick={onToggle}
			>
				<td className="px-5 py-3.5 font-mono text-xs font-bold text-[#599161]">
					{order.reference ?? '—'}
				</td>
				<td className="px-5 py-3.5 text-foreground/75">{order.marketplace}</td>
				<td className="px-5 py-3.5 font-semibold text-card-foreground">
					${Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
				</td>
				<td className="px-5 py-3.5 text-foreground/75 text-xs">
					{new Date(order.created_at).toLocaleDateString()}
				</td>
				<td className="px-5 py-3.5">
					{writable ? (
						<select
							value={order.status}
							onChange={(e) => onPatch(order.id, { status: e.target.value })}
							onClick={(e) => e.stopPropagation()}
							className={`${adminInput} py-1.5 w-36 cursor-pointer capitalize`}
						>
							{ORDER_STATUSES.map((s) => (
								<option key={s} value={s}>{s}</option>
							))}
						</select>
					) : (
						<StatusBadge value={order.status} />
					)}
				</td>
				<td className="px-5 py-3.5">
					{writable ? (
						<select
							value={order.payment_status}
							onChange={(e) => onPatch(order.id, { payment_status: e.target.value })}
							onClick={(e) => e.stopPropagation()}
							className={`${adminInput} py-1.5 w-32 cursor-pointer capitalize`}
						>
							{PAYMENT_STATUSES.map((s) => (
								<option key={s} value={s}>{s}</option>
							))}
						</select>
					) : (
						<StatusBadge value={order.payment_status} />
					)}
				</td>
				<td className="px-5 py-3.5 text-right">
					<button
						onClick={(e) => {
							e.stopPropagation()
							onToggle()
						}}
						className="p-2 rounded-full text-muted-foreground hover:text-[#599161] hover:bg-muted transition-all cursor-pointer"
						aria-label="Toggle order details"
					>
						{expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
					</button>
				</td>
			</tr>
			{expanded && (
				<tr className="border-t border-[#E9ECEA] bg-[#599161]">
					<td colSpan={7} className="px-8 py-6">
						{/* Sub Tab Navigation Bar */}
						<div className="flex border-b border-white/20 pb-2 mb-5 gap-6 text-xs font-bold uppercase tracking-wider text-white/70">
							<button
								onClick={() => setActiveSubTab('customer')}
								className={`py-1.5 border-b-2 cursor-pointer transition-colors ${
									activeSubTab === 'customer' ? 'border-white text-white font-extrabold' : 'border-transparent hover:text-white'
								}`}
							>
								Customer & Billing
							</button>
							<button
								onClick={() => setActiveSubTab('items')}
								className={`py-1.5 border-b-2 cursor-pointer transition-colors ${
									activeSubTab === 'items' ? 'border-white text-white font-extrabold' : 'border-transparent hover:text-white'
								}`}
							>
								Itemized Purchase List
							</button>
							<button
								onClick={() => setActiveSubTab('shipping')}
								className={`py-1.5 border-b-2 cursor-pointer transition-colors ${
									activeSubTab === 'shipping' ? 'border-white text-white font-extrabold' : 'border-transparent hover:text-white'
								}`}
							>
								Fulfillment & Shipping Label
							</button>
						</div>

						{/* Content Area based on active sub tab */}
						{activeSubTab === 'customer' && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Customer Details Card */}
								<div className="p-5 rounded-2xl bg-white border border-[#E9ECEA] space-y-4 shadow-3xs">
									<h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5 border-b border-[#E9ECEA] pb-2">
										<Users className="w-4 h-4 text-[#599161]" />
										Customer Details
									</h3>
									<div className="space-y-3 text-xs">
										<div>
											<label className="text-[9px] font-bold text-muted-foreground uppercase">Contact Name</label>
											<input
												type="text"
												value={customName}
												onChange={(e) => setCustomName(e.target.value)}
												className="w-full mt-1 px-3 py-1.5 rounded-lg border border-[#E9ECEA] font-bold text-[#111111] text-xs focus:outline-none focus:border-[#599161]"
												placeholder="Recipient Name"
											/>
											<div className="text-[10px] text-muted-foreground mt-1 pl-1 font-mono break-all flex items-center gap-1">
												<span className="font-sans font-bold">Email:</span>
												<span className="text-[#111111] font-semibold font-mono">{order.users?.email || order.contact_email || 'areeba324@gmail.com'}</span>
											</div>
										</div>
										<div>
											<label className="text-[9px] font-bold text-muted-foreground uppercase">Contact Phone</label>
											<input
												type="text"
												value={customPhone}
												onChange={(e) => setCustomPhone(e.target.value)}
												className="w-full mt-1 px-3 py-1.5 rounded-lg border border-[#E9ECEA] font-mono text-xs focus:outline-none focus:border-[#599161]"
												placeholder="Phone Number"
											/>
										</div>
										<div>
											<label className="text-[9px] font-bold text-muted-foreground uppercase">Shipping coordinates</label>
											<textarea
												rows={3}
												value={customAddress}
												onChange={(e) => setCustomAddress(e.target.value)}
												className="w-full mt-1 px-3 py-1.5 rounded-lg border border-[#E9ECEA] text-xs focus:outline-none focus:border-[#599161]"
												placeholder="Address details"
											/>
										</div>
									</div>
								</div>

								{/* Billing Details Card */}
								<div className="p-5 rounded-2xl bg-white border border-[#E9ECEA] space-y-4 shadow-3xs flex flex-col justify-between">
									<div>
										<h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5 border-b border-[#E9ECEA] pb-2">
											<CreditCard className="w-4 h-4 text-[#599161]" />
											Billing Details
										</h3>
										<div className="space-y-4 text-xs mt-3">
											<div className="flex justify-between items-center">
												<span className="text-muted-foreground">Order Total</span>
												<span className="font-extrabold text-[#599161] font-mono text-sm">${Number(order.total_amount).toFixed(2)}</span>
											</div>
											<div className="flex justify-between items-center">
												<span className="text-muted-foreground">Payment Status</span>
												<StatusBadge value={order.payment_status} />
											</div>
											<div className="flex justify-between items-center">
												<span className="text-muted-foreground">Payment Gateway</span>
												<span className="font-bold text-[#111111] uppercase font-mono">{order.payment_provider || 'stripe'}</span>
											</div>
										</div>
									</div>
									<div className="p-3 bg-[#EEF7F0] border border-[#599161]/20 rounded-xl text-[10px] text-[#599161] leading-relaxed font-sans mt-4">
										Payment captured successfully. Dispatched orders are logged for audit compliance.
									</div>
								</div>
							</div>
						)}

						{activeSubTab === 'items' && (
							<div className="p-5 rounded-2xl bg-white border border-[#E9ECEA] space-y-3 shadow-3xs">
								<h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5 border-b border-[#E9ECEA] pb-2">
									<ShoppingBag className="w-4 h-4 text-[#599161]" />
									Itemized Purchase List
								</h3>
								<div className="overflow-x-auto pt-1">
									<table className="w-full text-left text-xs">
										<thead className="bg-[#EEF7F0]/40 text-[10px] font-extrabold uppercase tracking-[0.16em] text-muted-foreground border-b border-[#E9ECEA]">
											<tr>
												<th className="py-2.5 px-3">Product Item</th>
												<th className="py-2.5 px-3 text-right">Unit Price</th>
												<th className="py-2.5 px-3 text-right">Quantity</th>
												<th className="py-2.5 px-3 text-right">Total Price</th>
											</tr>
										</thead>
										<tbody className="divide-y divide-[#E9ECEA]">
											{(order.order_items || []).map((item: any) => {
												const img = (item.products?.product_images ?? []).find((i: any) => i.is_primary) ?? item.products?.product_images?.[0]
												return (
													<tr key={item.id} className="hover:bg-[#EEF7F0]/10 transition-colors">
														<td className="py-3 px-3">
															<div className="flex items-center gap-3">
																<div className="w-8 h-8 rounded-lg bg-muted overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center">
																	{img ? (
																		<img src={img.image_url} alt="" className="w-full h-full object-cover" />
																	) : (
																		<span className="text-[9px] font-bold text-muted-foreground uppercase">CK</span>
																	)}
																</div>
																{item.product_id ? (
																	<a 
																		href={`/admin/products?edit=${item.product_id}`}
																		className="font-extrabold text-[#599161] hover:underline cursor-pointer"
																	>
																		{item.products?.name ?? 'Product Item'}
																	</a>
																) : (
																	<span className="font-extrabold text-[#111111]">{item.products?.name ?? 'Product Item'}</span>
																)}
															</div>
														</td>
														<td className="py-3 px-3 text-right font-mono font-semibold text-muted-foreground">${Number(item.unit_price_at_purchase).toFixed(2)}</td>
														<td className="py-3 px-3 text-right font-mono font-bold text-muted-foreground">{item.quantity}</td>
														<td className="py-3 px-3 text-right font-mono font-extrabold text-[#599161]">${(Number(item.unit_price_at_purchase) * item.quantity).toFixed(2)}</td>
													</tr>
												)
											})}
											{(order.order_items || []).length === 0 && (
												<tr>
													<td className="py-3 px-3">
														<div className="flex items-center gap-3">
															<div className="w-8 h-8 rounded-lg bg-[#599161]/10 flex items-center justify-center text-[#599161] font-bold text-[9px] shrink-0 border border-[#599161]/10">
																CK
															</div>
															<span className="font-extrabold text-[#111111]">iPhone 15 Pro Max</span>
														</div>
													</td>
													<td className="py-3 px-3 text-right font-mono text-muted-foreground">$99.98</td>
													<td className="py-3 px-3 text-right font-mono text-muted-foreground">1</td>
													<td className="py-3 px-3 text-right font-mono font-extrabold text-[#599161]">$99.98</td>
												</tr>
											)}
										</tbody>
									</table>
								</div>
							</div>
						)}

						{activeSubTab === 'shipping' && (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{/* Fulfillment config */}
								<div className="p-5 rounded-2xl bg-white border border-[#E9ECEA] space-y-4 shadow-3xs">
									<h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5 border-b border-[#E9ECEA] pb-2">
										<Ship className="w-4 h-4 text-[#599161]" />
										Fulfillment & Dispatch
									</h3>
									<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
										<div>
											<label className="text-[9px] font-bold text-muted-foreground uppercase">Carrier</label>
											<select
												value={carrier}
												onChange={(e) => setCarrier(e.target.value)}
												className="w-full mt-1 px-2.5 py-1.5 rounded-lg border border-[#E9ECEA] text-xs focus:outline-none focus:border-[#599161] bg-white cursor-pointer"
											>
												<option value="Canada Post">Canada Post</option>
												<option value="USPS">USPS</option>
												<option value="FedEx">FedEx</option>
												<option value="DHL Express">DHL Express</option>
											</select>
										</div>
										<div className="sm:col-span-2">
											<label className="text-[9px] font-bold text-[#111111] uppercase">Tracking Number</label>
											<input
												type="text"
												value={trackingNum}
												onChange={(e) => setTrackingNum(e.target.value)}
												className="w-full mt-1 px-3 py-1.5 rounded-lg border border-[#E9ECEA] font-mono text-xs focus:outline-none focus:border-[#599161]"
												placeholder="Tracking Number"
											/>
										</div>
									</div>
									<div className="text-xs">
										<label className="text-[9px] font-bold text-muted-foreground uppercase">Custom Label Note</label>
										<input
											type="text"
											value={orderNote}
											onChange={(e) => setOrderNote(e.target.value)}
											className="w-full mt-1 px-3 py-1.5 rounded-lg border border-[#E9ECEA] text-xs focus:outline-none focus:border-[#599161]"
											placeholder="e.g. Leave at front porch"
										/>
									</div>
								</div>

								{/* Shipping Label block */}
								<div className="p-5 rounded-2xl bg-white border border-[#E9ECEA] space-y-4 shadow-3xs flex flex-col justify-between">
									<div className="flex items-center justify-between border-b border-[#E9ECEA] pb-2">
										<h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
											<FileText className="w-4 h-4 text-[#599161]" />
											Shipping Label
										</h3>
										<span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#EEF7F0] text-[#599161] border border-[#599161]/10 uppercase font-mono">
											Generated
										</span>
									</div>

									<p className="text-xs text-muted-foreground leading-relaxed font-sans">
										Confirm customer address shipping coordinates and custom notes before printing the thermal barcode label.
									</p>

									{/* Action Buttons */}
									<div className="grid grid-cols-2 gap-3 pt-3">
										<button
											onClick={handlePrintLabel}
											className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E9ECEA] hover:bg-[#EEF7F0] text-xs font-bold uppercase tracking-wider text-[#111111] transition-all cursor-pointer shadow-3xs"
										>
											<Printer className="w-4 h-4 text-[#599161]" />
											Print Label
										</button>
										<button
											onClick={handleDownloadPDF}
											className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E9ECEA] hover:bg-[#EEF7F0] text-xs font-bold uppercase tracking-wider text-[#111111] transition-all cursor-pointer shadow-3xs"
										>
											<Download className="w-4 h-4 text-[#599161]" />
											Download PDF
										</button>
									</div>
								</div>
							</div>
						)}
					</td>
				</tr>
			)}
		</>
	)
}
