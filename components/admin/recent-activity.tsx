'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Package, ShoppingBag, MessageSquare } from 'lucide-react'

interface Activity {
	id: string
	type: string
	description: string
	timestamp: string
	icon: any
	color: string
}

export function RecentActivity() {
	const [activities, setActivities] = useState<Activity[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchRecentActivity()
	}, [])

	const fetchRecentActivity = async () => {
		try {
			setLoading(true)

			// Fetch recent products
			const { data: products } = await supabase
				.from('products')
				.select('id, name, created_at')
				.order('created_at', { ascending: false })
				.limit(2)

			// Fetch recent orders
			const { data: orders } = await supabase
				.from('orders')
				.select('id, total_amount, created_at')
				.order('created_at', { ascending: false })
				.limit(2)

			// Fetch recent inquiries
			const { data: inquiries } = await supabase
				.from('contact_inquiries')
				.select('id, email, submitted_at')
				.order('submitted_at', { ascending: false })
				.limit(2)

			const activitiesList: Activity[] = []

			products?.forEach((product: any) => {
				activitiesList.push({
					id: `product-${product.id}`,
					type: 'Product',
					description: `New product added: ${product.name}`,
					timestamp: product.created_at,
					icon: Package,
					color: 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20',
				})
			})

			orders?.forEach((order: any) => {
				activitiesList.push({
					id: `order-${order.id}`,
					type: 'Order',
					description: `New order processed for $${order.total_amount}`,
					timestamp: order.created_at,
					icon: ShoppingBag,
					color: 'bg-amber-500/10 text-amber-600 border border-amber-500/20',
				})
			})

			inquiries?.forEach((inquiry: any) => {
				activitiesList.push({
					id: `inquiry-${inquiry.id}`,
					type: 'Inquiry',
					description: `New contact inquiry from ${inquiry.email}`,
					timestamp: inquiry.submitted_at,
					icon: MessageSquare,
					color: 'bg-blue-500/10 text-blue-600 border border-blue-500/20',
				})
			})

			// Sort by timestamp descending
			activitiesList.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

			setActivities(activitiesList.slice(0, 6))
		} catch (error) {
			console.error('Error fetching activities:', error)
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="bg-card border border-border rounded-3xl p-6 shadow-sm">
			<h2 className="text-xs font-bold uppercase tracking-[0.18em] text-foreground mb-6">Recent Activity</h2>

			{loading ? (
				<div className="flex flex-col gap-4">
					{[...Array(3)].map((_, i) => (
						<div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/20 animate-pulse">
							<div className="w-10 h-10 rounded-xl bg-secondary" />
							<div className="flex-1 space-y-2">
								<div className="h-4 bg-secondary rounded w-3/4" />
								<div className="h-3 bg-secondary rounded w-1/4" />
							</div>
						</div>
					))}
				</div>
			) : activities.length === 0 ? (
				<p className="text-muted-foreground text-[11px] font-medium uppercase tracking-[0.14em] text-center py-6">
					No recent activity found
				</p>
			) : (
				<div className="space-y-4">
					{activities.map((activity) => {
						const Icon = activity.icon
						return (
							<div
								key={activity.id}
								className="flex items-start gap-4 p-4 rounded-2xl bg-secondary/20 hover:bg-secondary/40 border border-border/50 hover:border-border transition-all duration-300 group"
							>
								<div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${activity.color}`}>
									<Icon className="w-4.5 h-4.5" />
								</div>
								<div className="flex-1 min-w-0">
									<p className="font-semibold text-xs text-foreground group-hover:text-primary transition-colors leading-normal truncate">
										{activity.description}
									</p>
									<p className="text-[10px] text-muted-foreground mt-1.5 uppercase tracking-wider">
										{new Date(activity.timestamp).toLocaleString(undefined, {
											month: 'short',
											day: 'numeric',
											hour: 'numeric',
											minute: '2-digit',
										})}
									</p>
								</div>
							</div>
						)
					})}
				</div>
			)}
		</div>
	)
}
