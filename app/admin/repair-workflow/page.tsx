'use client'

import Link from 'next/link'
import { PageTitle, Panel } from '@/components/admin/ui'

const WORKFLOW_TABS = [
	{ href: '/admin/sell-requests', label: 'Sell Queue' },
	{ href: '/admin/repair-requests', label: 'Repair Queue' },
	{ href: '/admin/repair-workflow', label: 'Repair Workflow' },
	{ href: '/admin/repair-payments', label: 'Repair Payments' },
]

export default function AdminRepairWorkflowPage() {
	return (
		<div>
			<PageTitle title="Repair Workflow" subtitle="Navigation tabs added; implementation intentionally deferred" />

			<div className="mb-6 flex flex-wrap gap-2">
				{WORKFLOW_TABS.map((tab) => (
					<Link
						key={tab.href}
						href={tab.href}
						className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-[0.14em] border transition-all ${
							tab.href === '/admin/repair-workflow'
								? 'bg-primary text-primary-foreground border-primary'
								: 'border-border text-foreground/70 hover:border-primary hover:text-foreground'
						}`}
					>
						{tab.label}
					</Link>
				))}
			</div>

			<Panel title="Planned Steps" className="max-w-3xl">
				<ul className="text-sm text-muted-foreground space-y-2 list-disc pl-5">
					<li>Under Review intake</li>
					<li>Inspection and estimate</li>
					<li>Approval / rejection decision</li>
					<li>Repair completion and closure</li>
				</ul>
			</Panel>
		</div>
	)
}
