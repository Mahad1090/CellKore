'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Package, Heart, LogOut } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { TableShimmer } from '@/components/shimmer'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import type { OrderRecord } from '@/lib/types'

export default function AccountPage() {
	const { user, loading: authLoading, signOut } = useAuth()
	const router = useRouter()
	const [orders, setOrders] = useState<OrderRecord[] | null>(null)

	useEffect(() => {
		if (authLoading) return
		if (!user) {
			router.push('/')
			return
		}
		supabase
			.from('orders')
			.select('*, order_items ( id, product_id, quantity, unit_price_at_purchase, products ( name ) )')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
			.then(({ data }) => setOrders(data ?? []))
	}, [user, authLoading, router])

	if (authLoading || !user) {
		return (
			<main className="min-h-screen bg-background">
				<Navigation />
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
					<TableShimmer />
				</div>
				<Footer />
			</main>
		)
	}

	return (
		<main className="min-h-screen bg-background">
			<Navigation />

			<section className="bg-primary text-primary-foreground py-10">
				<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
					<h1 className="text-3xl font-bold tracking-luxury uppercase">My Account</h1>
					<p className="opacity-90 mt-2">Manage your profile and view your order history</p>
				</div>
			</section>

			<div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-8">
				<div className="bg-card border border-border rounded-3xl p-7 flex items-center justify-between flex-wrap gap-4">
					<div className="flex items-center gap-4">
						<div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center text-primary">
							<User className="w-6 h-6" />
						</div>
						<div>
							<p className="text-sm font-semibold text-card-foreground">{user.email}</p>
							<p className="text-xs text-muted-foreground mt-0.5">Signed in</p>
						</div>
					</div>
					<button
						onClick={() => signOut()}
						className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-xs font-semibold uppercase tracking-[0.14em] text-foreground/75 hover:border-destructive hover:text-destructive transition-all cursor-pointer"
					>
						<LogOut className="w-3.5 h-3.5" />
						Sign Out
					</button>
				</div>

				<div className="bg-card border border-border rounded-3xl p-7">
					<div className="flex items-center gap-2.5 mb-6">
						<Package className="w-4.5 h-4.5 text-primary" />
						<h2 className="text-sm font-bold uppercase tracking-[0.16em] text-card-foreground">Order History</h2>
					</div>

					{orders === null ? (
						<TableShimmer rows={3} />
					) : orders.length === 0 ? (
						<div className="text-center py-10">
							<p className="text-sm text-muted-foreground mb-5">No orders yet.</p>
							<Link
								href="/products"
								className="inline-block px-6 py-2.5 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-[0.16em] hover:opacity-90 transition-all"
							>
								Start Shopping
							</Link>
						</div>
					) : (
						<div className="space-y-3">
							{orders.map((order) => (
								<div key={order.id} className="flex items-center justify-between p-4 rounded-2xl bg-muted/40">
									<div>
										<p className="text-sm font-semibold text-card-foreground">{order.reference ?? order.id}</p>
										<p className="text-xs text-muted-foreground mt-0.5">
											{new Date(order.created_at).toLocaleDateString()} · {order.status}
										</p>
									</div>
									<p className="text-sm font-bold text-card-foreground">
										${Number(order.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
									</p>
								</div>
							))}
						</div>
					)}
				</div>

				<Link href="/wishlist" className="flex items-center justify-between bg-card border border-border rounded-3xl p-7 hover:border-primary transition-colors group">
					<div className="flex items-center gap-2.5">
						<Heart className="w-4.5 h-4.5 text-primary" />
						<span className="text-sm font-bold uppercase tracking-[0.16em] text-card-foreground">View Wishlist</span>
					</div>
					<span className="text-primary group-hover:translate-x-1 transition-transform">→</span>
				</Link>
			</div>

			<Footer />
		</main>
	)
}
