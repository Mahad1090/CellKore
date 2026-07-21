'use client'

import Link from 'next/link'
import { PageTitle, Panel } from '@/components/admin/ui'

const WORKFLOW_TABS = [
	{ href: '/admin/sell-requests', label: 'Sell Queue' },
	{ href: '/admin/repair-requests', label: 'Repair Queue' },
	{ href: '/admin/repair-workflow', label: 'Repair Workflow' },
	{ href: '/admin/repair-payments', label: 'Repair Payments' },
]

export default function AdminRepairPaymentsPage() {
	return (
		<div>
			<PageTitle title="Repair Payments" subtitle="Navigation tabs ready for payment/receipt workflow" />

			<div className="mb-6 flex flex-wrap gap-2">
				{WORKFLOW_TABS.map((tab) => (
					<Link
						key={tab.href}
						href={tab.href}
						className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.14em] border transition-all ${
							tab.href === '/admin/repair-payments'
								? 'bg-primary text-primary-foreground border-primary'
								: 'border-border text-foreground/70 hover:border-primary hover:text-foreground'
						}`}
					>
						{tab.label}
					</Link>
				))}
			</div>

			<Panel title="Note" className="max-w-3xl">
				<p className="text-sm text-muted-foreground">
					This section is currently navigation-only and will host receipt confirmation and payout tracking for repair workflows.
				</p>
			</Panel>
		</div>
	)
}
