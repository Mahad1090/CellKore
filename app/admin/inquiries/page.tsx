'use client'

import { useCallback, useEffect, useState } from 'react'
import { PageTitle, StatusBadge, EmptyState } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import type { ContactInquiry } from '@/lib/types'

const FILTERS = [
	{ value: 'all', label: 'All' },
	{ value: 'new', label: 'New' },
	{ value: 'responded', label: 'Responded' },
]

export default function AdminInquiriesPage() {
	const { toast } = useToast()
	const { can } = useAdmin()
	const [inquiries, setInquiries] = useState<ContactInquiry[] | null>(null)
	const [filter, setFilter] = useState('all')

	const load = useCallback(() => {
		const query = filter === 'all' ? '' : `?status=${filter}`
		fetch(`/api/admin/inquiries${query}`)
			.then((res) => res.json())
			.then((json) => setInquiries(json.inquiries ?? []))
			.catch(() => setInquiries([]))
	}, [filter])

	useEffect(() => {
		setInquiries(null)
		load()
	}, [load])

	const toggleStatus = async (inquiry: ContactInquiry) => {
		const next = inquiry.status === 'new' ? 'responded' : 'new'
		const res = await fetch(`/api/admin/inquiries/${inquiry.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status: next }),
		})
		if (res.ok) {
			load()
		} else {
			const json = await res.json()
			toast({ title: 'Update failed', description: json.error, variant: 'error' })
		}
	}

	const writable = can('inquiries:write')

	return (
		<div>
			<PageTitle title="Contact Inquiries" subtitle="Messages submitted through the contact form" />

			<div className="inline-flex rounded-full border border-border overflow-hidden bg-background mb-6">
				{FILTERS.map((f) => (
					<button
						key={f.value}
						onClick={() => setFilter(f.value)}
						className={`px-5 py-2 text-[10px] uppercase tracking-[0.16em] font-semibold transition-colors cursor-pointer ${
							filter === f.value ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-muted'
						}`}
					>
						{f.label}
					</button>
				))}
			</div>

			{inquiries === null ? (
				<TableShimmer />
			) : inquiries.length === 0 ? (
				<EmptyState message="No inquiries in this view." />
			) : (
				<div className="space-y-4">
					{inquiries.map((inquiry) => (
						<div key={inquiry.id} className="bg-card border border-border rounded-3xl p-6 hover:border-primary/40 transition-colors">
							<div className="flex flex-wrap items-start justify-between gap-3 mb-3">
								<div>
									<p className="text-sm font-semibold text-card-foreground">{inquiry.name}</p>
									<p className="text-xs text-muted-foreground mt-0.5">
										{inquiry.email}
										{inquiry.phone ? ` · ${inquiry.phone}` : ''}
										{inquiry.country ? ` · ${inquiry.country}` : ''}
									</p>
								</div>
								<div className="flex items-center gap-3">
									<span className="text-[10px] text-muted-foreground uppercase tracking-wider">
										{new Date(inquiry.submitted_at).toLocaleString()}
									</span>
									<StatusBadge value={inquiry.status} />
								</div>
							</div>
							<p className="text-xs text-foreground/75 leading-relaxed whitespace-pre-line">{inquiry.message}</p>
							{writable && (
								<label className="flex items-center gap-2.5 mt-4 cursor-pointer w-fit">
									<input
										type="checkbox"
										checked={inquiry.status === 'responded'}
										onChange={() => toggleStatus(inquiry)}
										className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
									/>
									<span className="text-xs font-semibold text-foreground/80">Mark as responded</span>
								</label>
							)}
						</div>
					))}
				</div>
			)}
		</div>
	)
}
