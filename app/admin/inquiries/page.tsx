'use client'

import { useCallback, useEffect, useState } from 'react'
import { PageTitle, EmptyState } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import { Mail, MailOpen, Reply, Clock, User, Phone, Globe } from 'lucide-react'
import type { ContactInquiry, InquiryStatus } from '@/lib/types'

const SUPPORT_EMAIL = 'support@cellkore.com'

const FILTERS = [
	{ value: 'all', label: 'All' },
	{ value: 'new', label: 'Unread' },
	{ value: 'responded', label: 'Responded' },
]

export default function AdminInboxPage() {
	const { toast } = useToast()
	const { can } = useAdmin()
	const [inquiries, setInquiries] = useState<ContactInquiry[] | null>(null)
	const [filter, setFilter] = useState('all')
	const [selected, setSelected] = useState<ContactInquiry | null>(null)

	const load = useCallback(() => {
		const query = filter === 'all' ? '' : `?status=${filter}`
		fetch(`/api/admin/inquiries${query}`)
			.then((res) => res.json())
			.then((json) => {
				const list = json.inquiries ?? []
				setInquiries(list)
				if (list.length > 0 && !selected) setSelected(list[0])
			})
			.catch(() => setInquiries([]))
	}, [filter]) // eslint-disable-line react-hooks/exhaustive-deps

	useEffect(() => {
		setInquiries(null)
		load()
	}, [load])

	const markStatus = async (inquiry: ContactInquiry, status: InquiryStatus) => {
		const res = await fetch(`/api/admin/inquiries/${inquiry.id}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ status }),
		})
		if (res.ok) {
			load()
			setSelected((prev) => prev?.id === inquiry.id ? { ...prev, status } : prev)
		} else {
			const json = await res.json()
			toast({ title: 'Update failed', description: json.error, variant: 'error' })
		}
	}

	const openReply = (inquiry: ContactInquiry) => {
		const subject = encodeURIComponent(`Re: Your Inquiry – CellKore Support`)
		const body = encodeURIComponent(
			`Hi ${inquiry.name},\n\nThank you for reaching out to CellKore Support.\n\n` +
			`We received your message:\n"${inquiry.message}"\n\n` +
			`---\n\n[Your reply here]\n\n` +
			`Best regards,\nCellKore Support\n${SUPPORT_EMAIL}`
		)
		window.open(`mailto:${inquiry.email}?from=${encodeURIComponent(SUPPORT_EMAIL)}&subject=${subject}&body=${body}`)
		if (inquiry.status === 'new') markStatus(inquiry, 'responded')
	}

	const writable = can('inquiries:write')
	const unreadCount = (inquiries ?? []).filter((i) => i.status === 'new').length

	return (
		<div>
			<PageTitle
				title="Customer Inbox"
				subtitle={`Messages from customers · ${unreadCount} unread · reply from ${SUPPORT_EMAIL}`}
			/>

			{/* Tab Filter */}
			<div className="flex bg-[#F7F7F5] border border-[#E9ECEA]/80 p-1.5 rounded-2xl gap-1 mb-6 text-xs font-semibold text-muted-foreground w-max">
				{FILTERS.map((f) => (
					<button
						key={f.value}
						onClick={() => setFilter(f.value)}
						className={`px-5 py-2 rounded-xl cursor-pointer transition-all ${
							filter === f.value ? 'bg-white text-[#599161] font-extrabold shadow-sm' : 'hover:text-foreground'
						}`}
					>
						{f.label}
						{f.value === 'new' && unreadCount > 0 && (
							<span className="ml-1.5 bg-[#599161] text-white text-[9px] font-bold rounded-full px-1.5 py-0.5">
								{unreadCount}
							</span>
						)}
					</button>
				))}
			</div>

			{inquiries === null ? (
				<TableShimmer />
			) : inquiries.length === 0 ? (
				<EmptyState message="No messages in this view." />
			) : (
				<div className="flex gap-4 min-h-[560px] border border-[#E9ECEA] rounded-3xl overflow-hidden bg-white shadow-sm">
					{/* Left – message list */}
					<div className="w-[300px] shrink-0 border-r border-[#E9ECEA] overflow-y-auto">
						{inquiries.map((inq) => (
							<button
								key={inq.id}
								onClick={() => setSelected(inq)}
								className={`w-full text-left px-4 py-3.5 border-b border-[#F3F4F2] transition-colors cursor-pointer ${
									selected?.id === inq.id
										? 'bg-[#EEF7F0]'
										: 'hover:bg-[#F7F7F5]'
								}`}
							>
								<div className="flex items-start justify-between gap-2 mb-1">
									<span className={`text-xs font-bold truncate max-w-[140px] ${inq.status === 'new' ? 'text-foreground' : 'text-foreground/60'}`}>
										{inq.name}
									</span>
									<span className="text-[10px] text-muted-foreground shrink-0">
										{new Date(inq.submitted_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
									</span>
								</div>
								<p className="text-[10px] text-muted-foreground truncate mb-1">{inq.email}</p>
								<p className="text-[11px] text-foreground/60 truncate leading-snug">{inq.message}</p>
								<div className="mt-1.5 flex items-center gap-1.5">
									{inq.status === 'new' ? (
										<span className="inline-flex items-center gap-1 text-[9px] font-bold text-[#599161] uppercase tracking-wide">
											<Mail className="w-2.5 h-2.5" /> Unread
										</span>
									) : (
										<span className="inline-flex items-center gap-1 text-[9px] font-semibold text-muted-foreground uppercase tracking-wide">
											<MailOpen className="w-2.5 h-2.5" /> Responded
										</span>
									)}
								</div>
							</button>
						))}
					</div>

					{/* Right – detail panel */}
					{selected ? (
						<div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
							{/* Header */}
							<div className="flex items-start justify-between gap-4">
								<div className="flex items-center gap-3">
									<div className="w-10 h-10 rounded-full bg-[#EEF7F0] border border-[#C8E6CE] flex items-center justify-center shrink-0">
										<span className="text-sm font-bold text-[#599161]">{selected.name.charAt(0).toUpperCase()}</span>
									</div>
									<div>
										<p className="text-sm font-bold text-foreground">{selected.name}</p>
										<p className="text-xs text-muted-foreground">{selected.email}</p>
									</div>
								</div>
								<div className="flex items-center gap-2">
									{writable && (
										<button
											onClick={() => markStatus(selected, selected.status === 'new' ? 'responded' : 'new')}
											className="text-[10px] font-semibold border border-[#E9ECEA] px-3 py-1.5 rounded-full hover:bg-[#F7F7F5] transition-colors cursor-pointer text-foreground/70"
										>
											{selected.status === 'new' ? 'Mark Responded' : 'Mark Unread'}
										</button>
									)}
									<button
										onClick={() => openReply(selected)}
										className="flex items-center gap-1.5 bg-[#599161] hover:bg-[#4a7a52] text-white text-xs font-bold px-4 py-2 rounded-full transition-colors cursor-pointer shadow-sm"
									>
										<Reply className="w-3.5 h-3.5" />
										Reply via Email
									</button>
								</div>
							</div>

							{/* Meta info */}
							<div className="flex flex-wrap gap-4 text-[11px] text-muted-foreground bg-[#F7F7F5] border border-[#E9ECEA] rounded-2xl px-4 py-3">
								<span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{new Date(selected.submitted_at).toLocaleString()}</span>
								{selected.phone && <span className="flex items-center gap-1.5"><Phone className="w-3 h-3" />{selected.phone}</span>}
								{selected.country && <span className="flex items-center gap-1.5"><Globe className="w-3 h-3" />{selected.country}</span>}
								<span className={`flex items-center gap-1.5 font-semibold ${selected.status === 'new' ? 'text-[#599161]' : 'text-muted-foreground'}`}>
									{selected.status === 'new' ? <Mail className="w-3 h-3" /> : <MailOpen className="w-3 h-3" />}
									{selected.status === 'new' ? 'Unread' : 'Responded'}
								</span>
							</div>

							{/* Message bubble */}
							<div className="bg-white border border-[#E9ECEA] rounded-2xl p-5">
								<p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-3">Customer Message</p>
								<p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-line">{selected.message}</p>
							</div>

							{/* Reply CTA */}
							<div className="border border-dashed border-[#C8E6CE] bg-[#EEF7F0]/50 rounded-2xl p-5">
								<p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#599161] mb-1">Reply via Email</p>
								<p className="text-xs text-muted-foreground mb-3">
									Send a response to <span className="font-semibold text-foreground">{selected.email}</span> from{' '}
									<span className="font-semibold text-foreground">{SUPPORT_EMAIL}</span> — your email client will open pre-filled with their original message quoted.
								</p>
								<button
									onClick={() => openReply(selected)}
									className="flex items-center gap-2 bg-[#599161] hover:bg-[#4a7a52] text-white text-xs font-bold px-5 py-2.5 rounded-full transition-colors cursor-pointer shadow-sm"
								>
									<Reply className="w-3.5 h-3.5" />
									Open Reply in Email Client
								</button>
							</div>
						</div>
					) : (
						<div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
							Select a message to view
						</div>
					)}
				</div>
			)}
		</div>
	)
}
