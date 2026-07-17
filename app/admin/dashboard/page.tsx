'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, Tag, ShoppingBag, Boxes, Phone, Users, Plus, ListOrdered } from 'lucide-react'
import { PageTitle } from '@/components/admin/ui'

interface Metrics {
	activeListings: number
	categories: number
	orders: number
	wholesaleLots: number
	sellRequests: number
	pendingInquiries: number
}

const CARDS: { key: keyof Metrics; label: string; icon: any; href: string }[] = [
	{ key: 'activeListings', label: 'Active Listings', icon: Package, href: '/admin/products' },
	{ key: 'categories', label: 'Categories', icon: Tag, href: '/admin/categories' },
	{ key: 'orders', label: 'Orders', icon: ShoppingBag, href: '/admin/orders' },
	{ key: 'wholesaleLots', label: 'Wholesale Lots', icon: Boxes, href: '/admin/wholesale' },
	{ key: 'sellRequests', label: 'Sell Requests', icon: Phone, href: '/admin/sell-requests' },
	{ key: 'pendingInquiries', label: 'Pending Inquiries', icon: Users, href: '/admin/inquiries' },
]

const QUICK_ACTIONS = [
	{ label: 'Add Product', icon: Plus, href: '/admin/products?new=1' },
	{ label: 'Manage Categories', icon: Tag, href: '/admin/categories' },
	{ label: 'View Orders', icon: ListOrdered, href: '/admin/orders' },
]

export default function AdminDashboardPage() {
	const [metrics, setMetrics] = useState<Metrics | null>(null)

	useEffect(() => {
		fetch('/api/admin/dashboard')
			.then((res) => res.json())
			.then((json) => setMetrics(json.metrics ?? null))
			.catch(() => setMetrics(null))
	}, [])

	return (
		<div>
			<PageTitle title="Dashboard" subtitle="Storefront overview at a glance" />

			<div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-10">
				{CARDS.map((card) => {
					const Icon = card.icon
					return (
						<Link key={card.key} href={card.href} className="group">
							<div className="bg-card border border-border rounded-3xl p-6 hover:border-primary hover:-translate-y-0.5 transition-all duration-300">
								<div className="flex items-center justify-between mb-4">
									<div className="w-10 h-10 rounded-2xl bg-secondary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
										<Icon className="w-4.5 h-4.5" />
									</div>
								</div>
								{metrics === null ? (
									<div className="h-8 w-16 bg-muted rounded-lg animate-pulse" />
								) : (
									<p className="text-3xl font-bold text-card-foreground">{metrics[card.key]}</p>
								)}
								<p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground mt-2">{card.label}</p>
							</div>
						</Link>
					)
				})}
			</div>

			<h2 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground mb-4">Quick Actions</h2>
			<div className="flex flex-wrap gap-3">
				{QUICK_ACTIONS.map((action) => {
					const Icon = action.icon
					return (
						<Link
							key={action.label}
							href={action.href}
							className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-[0.16em] hover:opacity-90 hover:scale-[1.02] transition-all"
						>
							<Icon className="w-3.5 h-3.5" />
							{action.label}
						</Link>
					)
				})}
			</div>
		</div>
	)
}
