'use client'

import { useState, useRef, useEffect } from 'react'
import { LogOut, ExternalLink, UserCircle2, PanelLeftClose, PanelLeft, Bell, Search, AlertCircle, ShoppingBag, Phone, Check, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useAdmin } from '@/contexts/admin-context'

const ROLE_LABELS: Record<string, string> = {
	super_admin: 'Super Admin',
	admin: 'Admin',
}

interface NotificationItem {
	id: string
	title: string
	desc: string
	time: string
	link: string
	type: 'order' | 'tradein' | 'alert'
	read: boolean
}

export function AdminHeader() {
	const { adminUser, signOut, toggleSidebar, sidebarCollapsed } = useAdmin()
	const [showNotifications, setShowNotifications] = useState(false)
	const [notifications, setNotifications] = useState<NotificationItem[]>([
		{
			id: '1',
			title: 'New Trade-in Request',
			desc: 'A customer submitted a new iPhone 14 Pro Max buyback offer.',
			time: '5 mins ago',
			link: '/admin/sell-requests',
			type: 'tradein',
			read: false,
		},
		{
			id: '2',
			title: 'Stripe Payment Confirmed',
			desc: 'Order #CK-8027 paid successfully ($1,299.00).',
			time: '25 mins ago',
			link: '/admin/orders',
			type: 'order',
			read: false,
		},
		{
			id: '3',
			title: 'Low Stock Discrepancy',
			desc: 'Samsung Galaxy S23 Ultra is below 15 units left.',
			time: '2 hours ago',
			link: '/admin/products',
			type: 'alert',
			read: false,
		},
		{
			id: '4',
			title: 'New Inquiry Submitted',
			desc: 'General inquiry request from mahad@cellkore.com.',
			time: '3 hours ago',
			link: '/admin/inquiries',
			type: 'tradein',
			read: true,
		},
		{
			id: '5',
			title: 'Newsletter Sign-Up',
			desc: 'New customer subscribed to wholesale alerts mailing list.',
			time: '5 hours ago',
			link: '/admin/newsletter',
			type: 'order',
			read: true,
		}
	])

	const popoverRef = useRef<HTMLDivElement>(null)

	// Close on click outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
				setShowNotifications(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	const hasUnread = notifications.some(n => !n.read)

	const markAllRead = () => {
		setNotifications(prev => prev.map(n => ({ ...n, read: true })))
	}

	const markSingleRead = (id: string) => {
		setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
	}

	const deleteNotification = (id: string, e: React.MouseEvent) => {
		e.stopPropagation()
		e.preventDefault()
		setNotifications(prev => prev.filter(n => n.id !== id))
	}

	return (
		<header className="sticky top-0 z-30 bg-white/70 backdrop-blur-md border-b border-[#E9ECEA] px-6 py-3.5 flex items-center justify-between gap-4">
			{/* Left Side: Collapse Toggle & Search Bar */}
			<div className="flex items-center gap-4 flex-1 min-w-0">
				<button
					type="button"
					onClick={toggleSidebar}
					className="p-2 rounded-lg border border-[#E9ECEA] bg-white hover:bg-[#EEF7F0] text-[#111111] transition-all cursor-pointer shadow-3xs"
					title="Toggle Sidebar"
				>
					{sidebarCollapsed ? (
						<PanelLeft className="w-4 h-4 text-[#599161]" />
					) : (
						<PanelLeftClose className="w-4 h-4 text-muted-foreground" />
					)}
				</button>

				{/* Search Bar */}
				<div className="relative max-w-md w-full hidden md:block">
					<Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
					<input
						type="text"
						placeholder="Search anything..."
						className="w-full pl-9 pr-4 py-1.5 rounded-lg border border-[#E9ECEA] bg-[#F7F7F5] text-xs focus:outline-none focus:border-[#599161] focus:bg-white transition-all font-sans"
					/>
				</div>
			</div>

			{/* Right Side Controls */}
			<div className="flex items-center gap-3 shrink-0">
				
				{/* Notification Center Popover */}
				<div className="relative" ref={popoverRef}>
					<button
						type="button"
						onClick={() => setShowNotifications(!showNotifications)}
						className="p-2 rounded-lg border border-[#E9ECEA] bg-white hover:bg-[#EEF7F0] text-muted-foreground hover:text-[#111111] relative transition-all cursor-pointer"
						title="Notifications"
					>
						<Bell className="w-4 h-4" />
						{hasUnread && (
							<span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#599161] rounded-full" />
						)}
					</button>

					{showNotifications && (
						<div className="absolute right-0 mt-2.5 w-80 bg-white border border-[#E9ECEA] rounded-2xl shadow-xl z-50 overflow-hidden text-left font-sans">
							<div className="p-4 border-b border-[#E9ECEA] flex items-center justify-between">
								<span className="text-xs font-bold text-[#111111] uppercase tracking-wider">Alert Center</span>
								{hasUnread && (
									<button
										onClick={markAllRead}
										className="text-[10px] font-bold text-[#599161] hover:underline flex items-center gap-1 cursor-pointer"
									>
										<Check className="w-3 h-3" />
										Mark read
									</button>
								)}
							</div>

							<div className="divide-y divide-[#E9ECEA] max-h-80 overflow-y-auto no-scrollbar">
								{notifications.length === 0 ? (
									<p className="text-xs text-muted-foreground py-8 text-center font-mono">[ NO NEW ALERTS ]</p>
								) : (
									notifications.map(item => (
										<div 
											key={item.id} 
											onClick={() => markSingleRead(item.id)}
											className={`p-3.5 block transition-colors cursor-pointer hover:bg-[#F7F7F5] relative group ${!item.read ? 'bg-[#EEF7F0]/40' : ''}`}
										>
											<div className="flex gap-3 justify-between items-start">
												<Link href={item.link} className="flex gap-3 flex-1 min-w-0">
													<div className="mt-0.5 shrink-0">
														{item.type === 'order' && (
															<div className="w-6 h-6 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center">
																<ShoppingBag className="w-3.5 h-3.5" />
															</div>
														)}
														{item.type === 'tradein' && (
															<div className="w-6 h-6 rounded-md bg-[#EEF7F0] text-[#599161] flex items-center justify-center">
																<Phone className="w-3.5 h-3.5" />
															</div>
														)}
														{item.type === 'alert' && (
															<div className="w-6 h-6 rounded-md bg-red-50 text-red-600 flex items-center justify-center">
																<AlertCircle className="w-3.5 h-3.5" />
															</div>
														)}
													</div>
													<div className="min-w-0 flex-1">
														<div className="flex items-center justify-between gap-1">
															<p className="text-xs font-bold text-[#111111] truncate">{item.title}</p>
															{!item.read && (
																<span className="w-1.5 h-1.5 bg-[#599161] rounded-full shrink-0" />
															)}
														</div>
														<p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{item.desc}</p>
														<span className="text-[9px] text-muted-foreground/80 font-mono mt-1 block">{item.time}</span>
													</div>
												</Link>
												<button
													type="button"
													onClick={(e) => deleteNotification(item.id, e)}
													className="p-1 rounded-lg text-muted-foreground hover:text-red-600 hover:bg-red-50 transition-all cursor-pointer shrink-0 md:opacity-0 group-hover:opacity-100"
													title="Delete notification"
												>
													<Trash2 className="w-3.5 h-3.5" />
												</button>
											</div>
										</div>
									))
								)}
							</div>
						</div>
					)}
				</div>

				<Link
					href="/"
					target="_blank"
					className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full border border-[#E9ECEA] bg-white text-[10px] font-bold uppercase tracking-[0.12em] text-[#111111]/80 hover:bg-[#EEF7F0] hover:text-[#111111] transition-all"
				>
					<ExternalLink className="w-3 h-3" />
					View Store
				</Link>

				{adminUser && (
					<div className="flex items-center gap-2 pl-2 border-l border-[#E9ECEA]">
						<div className="w-7 h-7 rounded-full bg-[#EEF7F0] border border-[#E9ECEA] flex items-center justify-center font-bold text-xs text-[#599161]">
							{adminUser.name[0]}
						</div>
						<div className="hidden md:block text-left">
							<p className="text-xs font-bold text-[#111111] leading-tight">{adminUser.name}</p>
							<p className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">
								{ROLE_LABELS[adminUser.role] ?? adminUser.role}
							</p>
						</div>
					</div>
				)}

				<button
					type="button"
					onClick={() => signOut()}
					className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#111111] text-white text-[10px] font-bold uppercase tracking-[0.12em] hover:bg-[#111111]/90 transition-all cursor-pointer shadow-sm"
				>
					<LogOut className="w-3 h-3" />
					Sign Out
				</button>
			</div>
		</header>
	)
}
