'use client'

import Link from 'next/link'
import { PageTitle, Panel } from '@/components/admin/ui'

const WORKFLOW_TABS = [
	{ href: '/admin/sell-requests', label: 'Sell Queue' },
	{ href: '/admin/repair-requests', label: 'Repair Queue' },
	{ href: '/admin/repair-workflow', label: 'Repair Workflow' },
	{ href: '/admin/repair-payments', label: 'Repair Payments' },
]

export default function AdminRepairRequestsPage() {
	return (
		<div>
			<PageTitle title="Repair Requests" subtitle="Navigation scaffold for the repair operations workflow" />

			<div className="mb-6 flex flex-wrap gap-2">
				{WORKFLOW_TABS.map((tab) => (
					<Link
						key={tab.href}
						href={tab.href}
						className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.14em] border transition-all ${
							tab.href === '/admin/repair-requests'
								? 'bg-primary text-primary-foreground border-primary'
								: 'border-border text-foreground/70 hover:border-primary hover:text-foreground'
						}`}
					>
						{tab.label}
					</Link>
				))}
			</div>

			<Panel title="Coming Next" className="max-w-3xl">
				<p className="text-sm text-muted-foreground">
					Repair request listing and status controls are intentionally left as navigation-only for now, per requirement.
				</p>
			</Panel>
		</div>
	)
}
