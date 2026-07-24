'use client'

import { useCallback, useEffect, useState } from 'react'
import { ChevronDown, ChevronUp, X, MapPin, Users, ShoppingBag, CreditCard, Ship, FileText, Plus, Check, CheckCircle, Truck, TrendingUp, Search } from 'lucide-react'
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
									onReload={load}
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
	onReload,
}: {
	order: any
	expanded: boolean
	onToggle: () => void
	writable: boolean
	onPatch: (id: string, body: Record<string, string>) => void
	onReload: () => void
}) {
	const { toast } = useToast()

	// Local state for shipping details & tabs
	const [activeSubTab, setActiveSubTab] = useState<'customer' | 'items' | 'shipping'>('customer')
	const [customAddress, setCustomAddress] = useState<string>('')
	const [customName, setCustomName] = useState<string>('')
	const [customPhone, setCustomPhone] = useState<string>('')
	const [generatingLabel, setGeneratingLabel] = useState(false)
	const [manualEntry, setManualEntry] = useState(false)
	const [manualTracking, setManualTracking] = useState('')
	const [manualLabelUrl, setManualLabelUrl] = useState('')

	useEffect(() => {
		const name = order.users?.full_name || order.gift_recipient_name || '—'
		const phone = order.users?.phone || order.gift_recipient_phone || order.shipping_address?.phone || '—'
		const addr = order.shipping_address
			? `${order.shipping_address.line1} ${order.shipping_address.line2 || ''}\n${order.shipping_address.city}, ${order.shipping_address.state_province || ''} ${order.shipping_address.postal_code || ''}\n${order.shipping_address.country.toUpperCase()}`
			: 'No shipping address on file'

		setCustomName(name)
		setCustomPhone(phone)
		setCustomAddress(addr)
	}, [order])

	const generateLabel = async () => {
		setGeneratingLabel(true)
		try {
			const res = await fetch(`/api/admin/orders/${order.id}/shipment`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({}),
			})
			const json = await res.json()
			if (!res.ok) {
				toast({ title: 'Label generation failed', description: json.error, variant: 'error' })
				return
			}
			toast({ title: 'Label generated', description: `Tracking #: ${json.trackingNumber}`, variant: 'success' })
			onReload()
		} catch {
			toast({ title: 'Label generation failed', description: 'Please try again.', variant: 'error' })
		} finally {
			setGeneratingLabel(false)
		}
	}

	const submitManualLabel = async () => {
		if (!manualTracking.trim() || !manualLabelUrl.trim()) {
			toast({ title: 'Missing details', description: 'Tracking number and label URL are both required.', variant: 'error' })
			return
		}
		setGeneratingLabel(true)
		try {
			const res = await fetch(`/api/admin/orders/${order.id}/shipment`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ tracking_number: manualTracking.trim(), label_url: manualLabelUrl.trim() }),
			})
			const json = await res.json()
			if (!res.ok) {
				toast({ title: 'Update failed', description: json.error, variant: 'error' })
				return
			}
			toast({ title: 'Label saved', description: 'Manual tracking/label recorded.', variant: 'success' })
			setManualEntry(false)
			setManualTracking('')
			setManualLabelUrl('')
			onReload()
		} catch {
			toast({ title: 'Update failed', description: 'Please try again.', variant: 'error' })
		} finally {
			setGeneratingLabel(false)
		}
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
				<td className="px-5 py-3.5">
					<span className="inline-flex items-center gap-2 text-xs font-semibold text-foreground/80">
						<img
							src={order.marketplace === 'CA' ? 'https://flagcdn.com/ca.svg' : 'https://flagcdn.com/us.svg'}
							alt={order.marketplace === 'CA' ? 'Canada' : 'United States'}
							className="w-5 h-3.5 rounded-sm object-cover shadow-sm"
						/>
						{order.marketplace}
					</span>
				</td>
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

										<div>
											<label className="text-[9px] font-bold text-muted-foreground uppercase">🚚 Special Delivery Instructions</label>
											<div className={`mt-1 px-3 py-2 rounded-lg border text-xs leading-relaxed ${
												order.notes
													? 'bg-[#EEF7F0] border-[#599161]/30 text-[#111111] font-semibold'
													: 'bg-[#F7F7F5] border-[#E9ECEA] text-muted-foreground italic'
											}`}>
												{order.notes || 'None provided'}
											</div>
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
								{/* Fulfillment: read-only — carrier/service was the customer's choice at checkout */}
								<div className="p-5 rounded-2xl bg-white border border-[#E9ECEA] space-y-4 shadow-3xs">
									<h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5 border-b border-[#E9ECEA] pb-2">
										<Ship className="w-4 h-4 text-[#599161]" />
										Fulfillment & Dispatch
									</h3>
									{order.shipping_carrier ? (
										<div className="space-y-3 text-xs">
											<div className="flex justify-between items-center">
												<span className="text-muted-foreground">Carrier</span>
												<span className="font-extrabold text-[#111111] uppercase">
													{order.shipping_carrier === 'ups' ? 'UPS' : 'Canada Post'}
												</span>
											</div>
											<div className="flex justify-between items-center">
												<span className="text-muted-foreground">Service</span>
												<span className="font-bold text-[#111111]">{order.shipping_service_name || '—'}</span>
											</div>
											<div className="flex justify-between items-center">
												<span className="text-muted-foreground">Shipping Paid</span>
												<span className="font-extrabold text-[#599161] font-mono">
													${Number(order.shipping_cost ?? 0).toFixed(2)} {order.shipping_currency ?? ''}
												</span>
											</div>
										</div>
									) : (
										<p className="text-xs text-muted-foreground italic">
											No shipping method on file for this order (it may predate live carrier checkout).
										</p>
									)}
									<div className="text-xs pt-2 border-t border-[#E9ECEA]">
										<label className="text-[9px] font-bold text-muted-foreground uppercase">Ship-To Address</label>
										<p className="mt-1 whitespace-pre-line text-[#111111]">{customAddress}</p>
										<p className="mt-1 text-muted-foreground">Phone: {customPhone}</p>
									</div>
								</div>

								{/* Shipping Label */}
								<div className="p-5 rounded-2xl bg-white border border-[#E9ECEA] space-y-4 shadow-3xs flex flex-col justify-between">
									<div className="flex items-center justify-between border-b border-[#E9ECEA] pb-2">
										<h3 className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-1.5">
											<FileText className="w-4 h-4 text-[#599161]" />
											Shipping Label
										</h3>
										<span
											className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase font-mono border ${
												order.shipping_label_status === 'generated'
													? 'bg-[#EEF7F0] text-[#599161] border-[#599161]/10'
													: order.shipping_label_status === 'failed'
													? 'bg-red-50 text-red-600 border-red-200'
													: 'bg-[#F7F7F5] text-muted-foreground border-[#E9ECEA]'
											}`}
										>
											{order.shipping_label_status === 'generated'
												? 'Generated'
												: order.shipping_label_status === 'failed'
												? 'Failed'
												: 'Not Generated'}
										</span>
									</div>

									{order.shipping_tracking_number && (
										<p className="text-xs font-mono">
											<span className="text-muted-foreground">Tracking #: </span>
											<span className="font-bold text-[#111111]">{order.shipping_tracking_number}</span>
										</p>
									)}

									{order.shipping_label_url && (
										<a
											href={order.shipping_label_url}
											target="_blank"
											rel="noopener noreferrer"
											className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#EEF7F0] border border-[#599161]/20 text-xs font-bold uppercase tracking-wider text-[#599161] hover:bg-[#dcefe0] transition-all"
										>
											<FileText className="w-4 h-4" />
											View / Download Label
										</a>
									)}

									{writable && (
										<button
											onClick={generateLabel}
											disabled={generatingLabel || !order.shipping_carrier}
											className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E9ECEA] hover:bg-[#EEF7F0] text-xs font-bold uppercase tracking-wider text-[#111111] transition-all cursor-pointer shadow-3xs disabled:opacity-50 disabled:cursor-not-allowed"
										>
											<CheckCircle className="w-4 h-4 text-[#599161]" />
											{generatingLabel
												? 'Generating…'
												: order.shipping_label_status === 'generated'
												? 'Regenerate Label'
												: 'Generate Label'}
										</button>
									)}

									{writable && (
										<div className="pt-2 border-t border-[#E9ECEA]">
											<button
												onClick={() => setManualEntry((v) => !v)}
												className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-[#599161] cursor-pointer"
											>
												{manualEntry ? 'Cancel manual entry' : 'Enter label manually'}
											</button>
											{manualEntry && (
												<div className="mt-3 space-y-2">
													<input
														type="text"
														value={manualTracking}
														onChange={(e) => setManualTracking(e.target.value)}
														placeholder="Tracking number"
														className="w-full px-3 py-1.5 rounded-lg border border-[#E9ECEA] font-mono text-xs focus:outline-none focus:border-[#599161]"
													/>
													<input
														type="text"
														value={manualLabelUrl}
														onChange={(e) => setManualLabelUrl(e.target.value)}
														placeholder="Label URL"
														className="w-full px-3 py-1.5 rounded-lg border border-[#E9ECEA] text-xs focus:outline-none focus:border-[#599161]"
													/>
													<button
														onClick={submitManualLabel}
														disabled={generatingLabel}
														className="w-full px-4 py-2 rounded-xl bg-[#599161] text-white text-xs font-bold uppercase tracking-wider hover:bg-[#48784f] transition-all cursor-pointer disabled:opacity-50"
													>
														Save
													</button>
												</div>
											)}
										</div>
									)}
								</div>
							</div>
						)}
					</td>
				</tr>
			)}
		</>
	)
}
