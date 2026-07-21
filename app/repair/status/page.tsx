'use client'

import Link from 'next/link'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'

const REPAIR_TABS = [
	{ href: '/repair', label: 'New Request' },
	{ href: '/repair/status', label: 'Track Status' },
	{ href: '/repair/workflow', label: 'Workflow' },
	{ href: '/repair/payments', label: 'Payments' },
]

export default function RepairStatusPage() {
	return (
		<main className="min-h-screen bg-background">
			<Navigation />
			<section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
				<div className="bg-card border border-border rounded-2xl p-2 grid grid-cols-2 md:grid-cols-4 gap-2">
					{REPAIR_TABS.map((tab) => (
						<Link
							key={tab.href}
							href={tab.href}
							className={`text-center px-4 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-[0.14em] transition-all ${
								tab.href === '/repair/status' ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-muted'
							}`}
						>
							{tab.label}
						</Link>
					))}
				</div>
				<div className="bg-card border border-border rounded-3xl p-8">
					<h1 className="text-2xl font-bold tracking-luxury uppercase text-foreground">Repair Status Tracking</h1>
					<p className="text-sm text-muted-foreground mt-3">
						Navigation tab is ready. Detailed tracking functionality is intentionally not implemented yet.
					</p>
				</div>
			</section>
			<Footer />
		</main>
	)
}
