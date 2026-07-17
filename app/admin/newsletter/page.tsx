'use client'

import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { PageTitle, EmptyState, adminButton } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'

interface Subscriber {
	id: string
	email: string
	subscribed_at: string
}

export default function AdminNewsletterPage() {
	const [subscribers, setSubscribers] = useState<Subscriber[] | null>(null)

	useEffect(() => {
		fetch('/api/admin/newsletter')
			.then((res) => res.json())
			.then((json) => setSubscribers(json.subscribers ?? []))
			.catch(() => setSubscribers([]))
	}, [])

	const exportCsv = () => {
		// The API streams the CSV with a download disposition
		window.location.href = '/api/admin/newsletter?format=csv'
	}

	return (
		<div>
			<PageTitle
				title="Newsletter Subscribers"
				subtitle="Email list captured from the storefront footer"
				actions={
					<button onClick={exportCsv} className={adminButton}>
						<Download className="w-3.5 h-3.5" />
						Export as CSV
					</button>
				}
			/>

			{subscribers === null ? (
				<TableShimmer />
			) : subscribers.length === 0 ? (
				<EmptyState message="No subscribers yet." />
			) : (
				<div className="border border-border rounded-3xl overflow-hidden bg-card max-w-2xl">
					<table className="w-full text-sm">
						<thead>
							<tr className="bg-secondary text-left">
								<th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">Email</th>
								<th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">Subscribed</th>
							</tr>
						</thead>
						<tbody>
							{subscribers.map((subscriber) => (
								<tr key={subscriber.id} className="border-t border-border hover:bg-muted/40 transition-colors">
									<td className="px-5 py-3.5 font-medium text-card-foreground">{subscriber.email}</td>
									<td className="px-5 py-3.5 text-foreground/75 text-xs">
										{new Date(subscriber.subscribed_at).toLocaleString()}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	)
}
