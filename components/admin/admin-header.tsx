'use client'

import { useState, useRef, useEffect } from 'react'
import {
	LogOut,
	ExternalLink,
	PanelLeftClose,
	PanelLeft,
	Bell,
	Search,
	AlertCircle,
	ShoppingBag,
	Phone,
	Check,
	Trash2,
	KeyRound,
	ShieldCheck,
	ChevronDown,
	User,
	Mail,
	Lock,
	CheckCircle2,
	Loader2,
	X,
} from 'lucide-react'
import Link from 'next/link'
import { useAdmin } from '@/contexts/admin-context'
import { useToast } from '@/components/ui/toast'

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
	const { toast } = useToast()

	const [showNotifications, setShowNotifications] = useState(false)
	const [showProfilePopover, setShowProfilePopover] = useState(false)
	const [showPasswordForm, setShowPasswordForm] = useState(false)

	// Password Form State
	const [currentPassword, setCurrentPassword] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [updatingPassword, setUpdatingPassword] = useState(false)

	const [notifications, setNotifications] = useState<NotificationItem[]>([])
	const [loadingNotifications, setLoadingNotifications] = useState(true)

	const loadRealNotifications = () => {
		fetch('/api/admin/notifications')
			.then((res) => res.json())
			.then((json) => {
				if (json.notifications) {
					let dismissed: string[] = []
					let readIDs: string[] = []
					try {
						dismissed = JSON.parse(localStorage.getItem('cellkore_dismissed_notifs') || '[]')
						readIDs = JSON.parse(localStorage.getItem('cellkore_read_notifs') || '[]')
					} catch {
						dismissed = []
						readIDs = []
					}

					const filtered = (json.notifications as NotificationItem[])
						.filter((n) => !dismissed.includes(n.id))
						.map((n) => (readIDs.includes(n.id) ? { ...n, read: true } : n))

					setNotifications(filtered)
				}
			})
			.catch(() => undefined)
			.finally(() => setLoadingNotifications(false))
	}

	useEffect(() => {
		loadRealNotifications()
	}, [])

	const notifPopoverRef = useRef<HTMLDivElement>(null)
	const profilePopoverRef = useRef<HTMLDivElement>(null)

	// Close popovers on click outside
	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (notifPopoverRef.current && !notifPopoverRef.current.contains(event.target as Node)) {
				setShowNotifications(false)
			}
			if (profilePopoverRef.current && !profilePopoverRef.current.contains(event.target as Node)) {
				setShowProfilePopover(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	const hasUnread = notifications.some((n) => !n.read)

	const markAllRead = () => {
		try {
			const readIDs: string[] = JSON.parse(localStorage.getItem('cellkore_read_notifs') || '[]')
			const newIDs = Array.from(new Set([...readIDs, ...notifications.map((n) => n.id)]))
			localStorage.setItem('cellkore_read_notifs', JSON.stringify(newIDs))
		} catch {}
		setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
	}

	const markSingleRead = (id: string) => {
		try {
			const readIDs: string[] = JSON.parse(localStorage.getItem('cellkore_read_notifs') || '[]')
			if (!readIDs.includes(id)) {
				readIDs.push(id)
				localStorage.setItem('cellkore_read_notifs', JSON.stringify(readIDs))
			}
		} catch {}
		setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
	}

	const deleteNotification = (id: string, e: React.MouseEvent) => {
		e.stopPropagation()
		e.preventDefault()
		try {
			const dismissed: string[] = JSON.parse(localStorage.getItem('cellkore_dismissed_notifs') || '[]')
			if (!dismissed.includes(id)) {
				dismissed.push(id)
				localStorage.setItem('cellkore_dismissed_notifs', JSON.stringify(dismissed))
			}
		} catch {}
		setNotifications((prev) => prev.filter((n) => n.id !== id))
	}

	const handleChangePassword = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!currentPassword || !newPassword || !confirmPassword) {
			toast({ title: 'Validation error', description: 'All password fields are required.', variant: 'error' })
			return
		}

		if (newPassword !== confirmPassword) {
			toast({ title: 'Validation error', description: 'New passwords do not match.', variant: 'error' })
			return
		}

		if (newPassword.length < 6) {
			toast({ title: 'Validation error', description: 'New password must be at least 6 characters.', variant: 'error' })
			return
		}

		setUpdatingPassword(true)
		try {
			const res = await fetch('/api/admin/auth/change-password', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ currentPassword, newPassword }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error || 'Failed to update password')

			toast({
				title: 'Password Updated!',
				description: 'Your password has been changed successfully.',
				variant: 'success',
			})
			setCurrentPassword('')
			setNewPassword('')
			setConfirmPassword('')
			setShowPasswordForm(false)
		} catch (err) {
			toast({
				title: 'Password change failed',
				description: err instanceof Error ? err.message : 'Error updating password',
				variant: 'error',
			})
		} finally {
			setUpdatingPassword(false)
		}
	}

	return (
		<header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-[#E9ECEA] px-6 py-3 flex items-center justify-between gap-4">
			{/* Left Side: Collapse Toggle & Search Bar */}
			<div className="flex items-center gap-4 flex-1 min-w-0">
				<button
					type="button"
					onClick={toggleSidebar}
					className="p-2 rounded-xl border border-[#E9ECEA] bg-white hover:bg-[#EEF7F0] text-[#111111] transition-all cursor-pointer shadow-3xs"
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
						placeholder="Search products, orders, customers..."
						className="w-full pl-9 pr-4 py-1.5 rounded-xl border border-[#E9ECEA] bg-[#F7F7F5] text-xs focus:outline-none focus:border-[#599161] focus:bg-white transition-all font-sans"
					/>
				</div>
			</div>

			{/* Right Side Controls */}
			<div className="flex items-center gap-3 shrink-0">
				{/* Notification Center Popover */}
				<div className="relative" ref={notifPopoverRef}>
					<button
						type="button"
						onClick={() => setShowNotifications(!showNotifications)}
						className="p-2 rounded-xl border border-[#E9ECEA] bg-white hover:bg-[#EEF7F0] text-muted-foreground hover:text-[#111111] relative transition-all cursor-pointer"
						title="Notifications"
					>
						<Bell className="w-4 h-4" />
						{hasUnread && <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-[#599161] rounded-full" />}
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
									notifications.map((item) => (
										<div
											key={item.id}
											onClick={() => markSingleRead(item.id)}
											className={`p-3.5 block transition-colors cursor-pointer hover:bg-[#F7F7F5] relative group ${
												!item.read ? 'bg-[#EEF7F0]/40' : ''
											}`}
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
															{!item.read && <span className="w-1.5 h-1.5 bg-[#599161] rounded-full shrink-0" />}
														</div>
														<p className="text-[10px] text-muted-foreground mt-0.5 leading-snug">{item.desc}</p>
														<span className="text-[9px] text-muted-foreground/80 font-mono mt-1 block">
															{item.time}
														</span>
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
					<ExternalLink className="w-3 h-3 text-[#599161]" />
					View Store
				</Link>

				{/* Admin User Profile Button & Interactive Popover */}
				{adminUser && (
					<div className="relative" ref={profilePopoverRef}>
						<button
							type="button"
							onClick={() => {
								setShowProfilePopover(!showProfilePopover)
								setShowPasswordForm(false)
							}}
							className="flex items-center gap-2 pl-2 border-l border-[#E9ECEA] hover:opacity-80 transition-all cursor-pointer group py-1"
						>
							<div className="w-8 h-8 rounded-full bg-[#EEF7F0] border border-[#C8E6CE] flex items-center justify-center font-bold text-xs text-[#599161] shadow-3xs group-hover:border-[#599161]">
								{adminUser.name?.[0]?.toUpperCase() || 'A'}
							</div>
							<div className="hidden md:block text-left">
								<p className="text-xs font-bold text-[#111111] leading-tight flex items-center gap-1">
									{adminUser.name}
									<ChevronDown className="w-3 h-3 text-muted-foreground group-hover:text-[#599161] transition-colors" />
								</p>
								<p className="text-[9px] uppercase font-extrabold tracking-wider text-[#599161]">
									{ROLE_LABELS[adminUser.role] ?? adminUser.role}
								</p>
							</div>
						</button>

						{/* Admin Profile Modal / Popover Dropdown */}
						{showProfilePopover && (
							<div className="absolute right-0 mt-2.5 w-84 bg-white border border-[#E9ECEA] rounded-3xl shadow-2xl z-50 overflow-hidden text-left font-sans animate-in fade-in slide-in-from-top-2 duration-150">
								{/* Header Profile Badge */}
								<div className="p-5 bg-[#FAFBF9] border-b border-[#E9ECEA]">
									<div className="flex items-center gap-3.5">
										<div className="w-12 h-12 rounded-2xl bg-[#599161] text-white flex items-center justify-center font-black text-xl shadow-sm border border-[#4a7a52]">
											{adminUser.name?.[0]?.toUpperCase() || 'A'}
										</div>
										<div className="min-w-0 flex-1">
											<h4 className="text-sm font-extrabold text-[#111111] truncate tracking-tight font-sans">
												{adminUser.name}
											</h4>
											<p className="text-xs text-muted-foreground truncate font-sans">{adminUser.email}</p>
											<div className="mt-1.5 flex items-center gap-1.5">
												<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EEF7F0] text-[#599161] border border-[#C8E6CE] text-[9px] font-extrabold uppercase tracking-wider">
													<ShieldCheck className="w-3 h-3 text-[#599161]" />
													{ROLE_LABELS[adminUser.role] ?? adminUser.role}
												</span>
											</div>
										</div>
									</div>
								</div>

								{/* Account Info Details Card */}
								<div className="p-5 space-y-4">
									<div className="bg-[#F8FAF8] border border-[#E9ECEA] rounded-2xl p-3.5 space-y-2.5">
										<div className="flex items-center justify-between gap-2 text-xs">
											<span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold shrink-0">
												<Mail className="w-3.5 h-3.5 text-[#599161]" /> Email Address:
											</span>
											<span className="font-bold text-[#111111] truncate text-right">{adminUser.email}</span>
										</div>

										<div className="flex items-center justify-between gap-2 text-xs border-t border-[#E9ECEA]/80 pt-2">
											<span className="text-muted-foreground flex items-center gap-1.5 text-[11px] font-semibold shrink-0">
												<ShieldCheck className="w-3.5 h-3.5 text-[#599161]" /> Account Access:
											</span>
											<span className="font-bold text-[#599161] text-[10px] uppercase tracking-wider bg-[#EEF7F0] px-2.5 py-1 rounded-lg border border-[#C8E6CE]">
												Full Control
											</span>
										</div>
									</div>

									{/* Password Change Form Trigger / Section */}
									{!showPasswordForm ? (
										<button
											type="button"
											onClick={() => setShowPasswordForm(true)}
											className="w-full py-2.5 px-4 bg-[#F7F7F5] hover:bg-[#EEF7F0] text-[#111111] hover:text-[#599161] border border-[#E9ECEA] hover:border-[#C8E6CE] font-bold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
										>
											<KeyRound className="w-3.5 h-3.5 text-[#599161]" />
											Change Password
										</button>
									) : (
										<form onSubmit={handleChangePassword} className="space-y-3 pt-1 border-t border-[#E9ECEA]">
											<div className="flex items-center justify-between">
												<span className="text-[10px] font-extrabold uppercase tracking-wider text-[#599161] flex items-center gap-1">
													<KeyRound className="w-3 h-3" /> Change Password
												</span>
												<button
													type="button"
													onClick={() => setShowPasswordForm(false)}
													className="text-muted-foreground hover:text-foreground p-0.5 rounded-md"
												>
													<X className="w-3.5 h-3.5" />
												</button>
											</div>

											<div>
												<label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
													Current Password
												</label>
												<input
													type="password"
													value={currentPassword}
													onChange={(e) => setCurrentPassword(e.target.value)}
													placeholder="••••••••"
													className="w-full px-3 py-1.5 rounded-xl border border-[#E9ECEA] bg-[#F7F7F5] text-xs focus:outline-none focus:border-[#599161] focus:bg-white"
													required
												/>
											</div>

											<div>
												<label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
													New Password
												</label>
												<input
													type="password"
													value={newPassword}
													onChange={(e) => setNewPassword(e.target.value)}
													placeholder="Minimum 6 chars"
													className="w-full px-3 py-1.5 rounded-xl border border-[#E9ECEA] bg-[#F7F7F5] text-xs focus:outline-none focus:border-[#599161] focus:bg-white"
													required
												/>
											</div>

											<div>
												<label className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground block mb-1">
													Confirm New Password
												</label>
												<input
													type="password"
													value={confirmPassword}
													onChange={(e) => setConfirmPassword(e.target.value)}
													placeholder="Repeat new password"
													className="w-full px-3 py-1.5 rounded-xl border border-[#E9ECEA] bg-[#F7F7F5] text-xs focus:outline-none focus:border-[#599161] focus:bg-white"
													required
												/>
											</div>

											<button
												type="submit"
												disabled={updatingPassword}
												className="w-full py-2.5 bg-[#599161] hover:bg-[#4a7a52] text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 shadow-sm"
											>
												{updatingPassword ? (
													<Loader2 className="w-3.5 h-3.5 animate-spin" />
												) : (
													<CheckCircle2 className="w-3.5 h-3.5" />
												)}
												Update Password
											</button>
										</form>
									)}

									{/* Sign Out Button */}
									<button
										type="button"
										onClick={() => signOut()}
										className="w-full py-2.5 px-4 bg-[#111111] hover:bg-black text-white font-extrabold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm"
									>
										<LogOut className="w-3.5 h-3.5" />
										Sign Out of Admin Portal
									</button>
								</div>
							</div>
						)}
					</div>
				)}
			</div>
		</header>
	)
}
