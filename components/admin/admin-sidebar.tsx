'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
	LayoutDashboard, Package, Tag, MapPin, Boxes, Phone, Settings, FileText,
	Users, BarChart3, ShoppingBag, Shield, MailPlus,
} from 'lucide-react'
import { useAdmin } from '@/contexts/admin-context'
import type { AdminPermission } from '@/lib/admin/rbac'

const navItems: { label: string; href: string; icon: any; permission?: AdminPermission }[] = [
	{ label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
	{ label: 'Products', href: '/admin/products', icon: Package, permission: 'products:read' },
	{ label: 'Categories', href: '/admin/categories', icon: Tag, permission: 'products:read' },
	{ label: 'Wholesale', href: '/admin/wholesale', icon: Boxes, permission: 'products:read' },
	{ label: 'Orders', href: '/admin/orders', icon: ShoppingBag, permission: 'orders:read' },
	{ label: 'Sell Requests', href: '/admin/sell-requests', icon: Phone, permission: 'sell-requests:read' },
	{ label: 'Inquiries', href: '/admin/inquiries', icon: Users, permission: 'inquiries:read' },
	{ label: 'Content', href: '/admin/content', icon: FileText },
	{ label: 'Marketplaces', href: '/admin/marketplaces', icon: MapPin },
	{ label: 'Analytics', href: '/admin/analytics', icon: BarChart3, permission: 'analytics:read' },
	{ label: 'Newsletter', href: '/admin/newsletter', icon: MailPlus, permission: 'newsletter:read' },
	{ label: 'Admin Users', href: '/admin/admin-users', icon: Shield, permission: 'admin-users:write' },
	{ label: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar() {
	const pathname = usePathname()
	const { can, adminUser } = useAdmin()

	return (
		<div className="w-64 bg-sidebar border-r border-sidebar-border flex-col hidden lg:flex sticky top-0 h-screen">
			<div className="p-6 border-b border-sidebar-border">
				<Link href="/admin/dashboard" className="flex items-center gap-2.5">
					<div className="w-9 h-9 bg-sidebar-primary border border-sidebar-border rounded-xl flex items-center justify-center">
						<span className="text-sidebar-primary-foreground font-bold text-sm">CK</span>
					</div>
					<div>
						<span className="text-base font-bold text-sidebar-foreground tracking-wide">CellKore</span>
						<p className="text-[9px] uppercase tracking-[0.22em] text-sidebar-foreground/50">Admin Console</p>
					</div>
				</Link>
			</div>

			<nav className="flex-1 overflow-y-auto p-4 space-y-1 no-scrollbar">
				{navItems
					.filter((item) => !item.permission || can(item.permission) || !adminUser)
					.map((item) => {
						const Icon = item.icon
						const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
						return (
							<Link
								key={item.href}
								href={item.href}
								className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
									isActive
										? 'bg-sidebar-accent text-sidebar-foreground shadow-inner'
										: 'text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground'
								}`}
							>
								<Icon className="w-4.5 h-4.5" />
								<span className="text-[13px] font-medium tracking-wide">{item.label}</span>
							</Link>
						)
					})}
			</nav>

			<div className="p-4 border-t border-sidebar-border">
				<div className="text-[10px] text-sidebar-foreground/40 text-center py-2 uppercase tracking-[0.2em]">
					CellKore Admin
				</div>
			</div>
		</div>
	)
}
