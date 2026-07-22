'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
	LayoutDashboard, Package, Tag, MapPin, Boxes, Layers, ListChecks, Phone, Smartphone, Settings, FileText,
	Users, BarChart3, ShoppingBag, Shield, MailPlus, Wrench, Receipt, ArrowUpRight, ChevronLeft, ChevronRight, X
} from 'lucide-react'
import { useAdmin } from '@/contexts/admin-context'
import type { AdminPermission } from '@/lib/admin/rbac'

interface NavGroup {
	title: string
	items: { label: string; href: string; icon: any; permission?: AdminPermission }[]
}

const navGroups: NavGroup[] = [
	{
		title: 'CONSOLE',
		items: [
			{ label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
			{ label: 'Trade-ins', href: '/admin/sell-requests', icon: Phone, permission: 'sell-requests:read' },
			{ label: 'Orders', href: '/admin/orders', icon: ShoppingBag, permission: 'orders:read' },
			{ label: 'Customers', href: '/admin/inquiries', icon: Users, permission: 'inquiries:read' },
			{ label: 'Analytics', href: '/admin/analytics', icon: BarChart3, permission: 'analytics:read' },
		],
	},
	{
		title: 'CATALOG',
		items: [
			{ label: 'Products', href: '/admin/products', icon: Package, permission: 'products:read' },
			{ label: 'Product Types', href: '/admin/product-types', icon: Layers, permission: 'products:read' },
			{ label: 'Spec Templates', href: '/admin/spec-templates', icon: ListChecks, permission: 'products:read' },
			{ label: 'Mobile Spec Presets', href: '/admin/mobile-spec-presets', icon: Smartphone, permission: 'products:read' },
			{ label: 'Wholesale Lots', href: '/admin/wholesale', icon: Boxes, permission: 'products:read' },
			{ label: 'Categories', href: '/admin/categories', icon: Tag, permission: 'products:read' },
		],
	},
	{
		title: 'REPAIR SERVICES',
		items: [
			{ label: 'Repair Queue', href: '/admin/repair-requests', icon: Wrench },
			{ label: 'Repair Workflow', href: '/admin/repair-workflow', icon: ListChecks },
			{ label: 'Repair Payments', href: '/admin/repair-payments', icon: Receipt },
		],
	},
	{
		title: 'MANAGEMENT',
		items: [
			{ label: 'CMS Content', href: '/admin/content', icon: FileText },
			{ label: 'Marketplaces', href: '/admin/marketplaces', icon: MapPin },
			{ label: 'Marketing', href: '/admin/newsletter', icon: MailPlus, permission: 'newsletter:read' },
			{ label: 'Admin Users', href: '/admin/admin-users', icon: Shield, permission: 'admin-users:write' },
			{ label: 'Settings', href: '/admin/settings', icon: Settings },
		],
	},
]


export function AdminSidebar() {
	const pathname = usePathname()
	const { can, adminUser, sidebarOpen, setSidebarOpen, sidebarCollapsed, setSidebarCollapsed } = useAdmin()

	return (
		<>
			{sidebarOpen && (
				<div
					onClick={() => setSidebarOpen(false)}
					className="fixed inset-0 z-45 bg-black/40 backdrop-blur-xs lg:hidden transition-all"
				/>
			)}

			<aside
				className={`bg-white border-r border-[#E9ECEA] flex flex-col sticky top-0 h-screen font-sans transition-all duration-300 z-40 shrink-0 ${
					sidebarOpen ? 'fixed inset-y-0 left-0 w-72 flex shadow-xl' : 'hidden lg:flex'
				} ${
					sidebarCollapsed ? 'lg:w-20' : 'lg:w-64'
				}`}
			>
				{/* Top Header Logo */}
				{sidebarCollapsed ? (
					<div className="p-5 border-b border-[#E9ECEA] flex items-center justify-center">
						<button
							type="button"
							onClick={() => setSidebarCollapsed(false)}
							className="p-1.5 rounded-lg border border-[#E9ECEA] text-[#599161] hover:bg-[#EEF7F0] transition-colors cursor-pointer"
							title="Expand"
						>
							<ChevronRight className="w-4 h-4" />
						</button>
					</div>
				) : (
					<div className="p-5 border-b border-[#E9ECEA] flex items-center justify-between">
						<Link href="/admin/dashboard" className="flex items-center gap-2 group">
							<img src="/cellkore_apple_green.webp" alt="CellKore Logo" className="w-8 h-8 object-contain" />
							<div>
								<span className="text-sm font-extrabold text-[#111111] tracking-tight block">CellKore</span>
								<p className="text-[9px] uppercase tracking-[0.18em] text-[#599161] font-bold">Workspace</p>
							</div>
						</Link>

						<button
							type="button"
							onClick={() => setSidebarOpen(false)}
							className="lg:hidden p-1.5 rounded-lg border border-[#E9ECEA] text-[#111111] hover:bg-[#EEF7F0] transition-colors"
						>
							<X className="w-4 h-4" />
						</button>

						<button
							type="button"
							onClick={() => setSidebarCollapsed(true)}
							className="hidden lg:flex p-1.5 rounded-lg border border-[#E9ECEA] text-muted-foreground hover:bg-[#EEF7F0] hover:text-[#111111] transition-colors cursor-pointer"
							title="Collapse"
						>
							<ChevronLeft className="w-4 h-4" />
						</button>
					</div>
				)}

				{/* Nav List */}
				<nav className="flex-1 overflow-y-auto p-4 space-y-5 no-scrollbar">
					{navGroups.map((group) => {
						const visibleItems = group.items.filter(
							(item) => !item.permission || can(item.permission) || !adminUser
						)
						if (visibleItems.length === 0) return null

						return (
							<div key={group.title} className="space-y-1">
								{!sidebarCollapsed && (
									<p className="px-3.5 text-[9px] font-extrabold uppercase tracking-[0.18em] text-muted-foreground mb-1.5">
										{group.title}
									</p>
								)}
								{visibleItems.map((item) => {
									const Icon = item.icon
									const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname.startsWith(item.href))
									return (
										<Link
											key={item.href}
											href={item.href}
											onClick={() => setSidebarOpen(false)}
											title={sidebarCollapsed ? item.label : undefined}
											className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl transition-all duration-200 ${
												sidebarCollapsed ? 'justify-center' : ''
											} ${
												isActive
													? 'bg-[#EEF7F0] text-[#111111] font-bold border border-[#E9ECEA] shadow-2xs'
													: 'text-[#111111]/70 hover:bg-[#EEF7F0]/65 hover:text-[#111111] font-medium'
											}`}
										>
											<Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#599161]' : 'text-[#111111]/60'}`} />
											{!sidebarCollapsed && <span className="text-xs tracking-wide">{item.label}</span>}
										</Link>
									)
								})}
							</div>
						)
					})}
				</nav>

				{/* Bottom Info Help Box */}
				{!sidebarCollapsed && (
					<div className="p-4 border-t border-[#E9ECEA]">
						<div className="p-3 bg-[#EEF7F0]/60 rounded-xl border border-[#E9ECEA] space-y-2">
							<p className="text-[10px] font-bold uppercase tracking-wider text-[#599161]">Need Help?</p>
							<p className="text-[10px] text-muted-foreground leading-snug">CellKore Internal Support Console</p>
							<a href="mailto:support@cellkore.com" className="text-[10px] font-semibold text-[#599161] hover:underline block pt-1">
								support@cellkore.com
							</a>
						</div>
					</div>
				)}
			</aside>
		</>
	)
}
