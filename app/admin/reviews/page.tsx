'use client'

import { useEffect, useMemo, useState } from 'react'
import { Search, Loader2, Star, Trash2, PenSquare, BookOpen } from 'lucide-react'
import { PageTitle, StatusBadge, EmptyState, Modal, adminButton, adminButtonGhost, adminInput } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'

type ReviewKind = 'product' | 'testimonial'
type ReviewStatus = 'pending' | 'approved' | 'rejected'

interface ProductReviewRecord {
	id: string
	product_id: string
	reviewer_name: string
	reviewer_email: string | null
	rating: number
	title: string | null
	comment: string
	status: ReviewStatus
	is_featured: boolean
	created_at: string
	products?: { id: string; name: string; brand: string | null } | null
}

interface TestimonialRecord {
	id: string
	customer_name: string
	customer_email: string | null
	rating: number
	title: string | null
	comment: string
	status: ReviewStatus
	is_featured: boolean
	created_at: string
}

interface ReviewsResponse {
	productReviews: ProductReviewRecord[]
	testimonials: TestimonialRecord[]
	stats: {
		productReviewsTotal: number
		productReviewsPending: number
		productReviewsApproved: number
		testimonialsTotal: number
		testimonialsPending: number
		testimonialsApproved: number
	}
}

function Stars({ value }: { value: number }) {
	return (
		<div className="flex items-center gap-0.5 text-amber-400">
			{Array.from({ length: 5 }).map((_, index) => (
				<Star key={index} className={`w-3.5 h-3.5 ${index < value ? 'fill-current' : 'text-amber-200'}`} />
			))}
		</div>
	)
}

export default function AdminReviewsPage() {
	const { toast, confirm } = useToast()
	const { can } = useAdmin()
	const [data, setData] = useState<ReviewsResponse | null>(null)
	const [activeTab, setActiveTab] = useState<ReviewKind>('product')
	const [search, setSearch] = useState('')
	const [statusFilter, setStatusFilter] = useState<'all' | ReviewStatus>('all')
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [selectedKind, setSelectedKind] = useState<ReviewKind>('product')
	const [selectedStatus, setSelectedStatus] = useState<ReviewStatus>('pending')
	const [selectedFeatured, setSelectedFeatured] = useState(false)
	const [selectedTitle, setSelectedTitle] = useState('')
	const [selectedComment, setSelectedComment] = useState('')
	const [selectedRating, setSelectedRating] = useState(5)
	const [saving, setSaving] = useState(false)

	const load = () => {
		fetch('/api/admin/reviews')
			.then((res) => res.json())
			.then((json: ReviewsResponse) => setData(json))
			.catch(() => setData({ productReviews: [], testimonials: [], stats: { productReviewsTotal: 0, productReviewsPending: 0, productReviewsApproved: 0, testimonialsTotal: 0, testimonialsPending: 0, testimonialsApproved: 0 } }))
	}

	useEffect(load, [])

	const reviews = activeTab === 'product' ? data?.productReviews ?? [] : data?.testimonials ?? []

	const filtered = useMemo(
		() =>
			reviews.filter((item: any) => {
				const haystack = [
					item.reviewer_name,
					item.customer_name,
					item.reviewer_email,
					item.customer_email,
					item.title,
					item.comment,
					item.products?.name,
					item.products?.brand,
				]
					.filter(Boolean)
					.join(' ')
					.toLowerCase()
				return (
					(!search.trim() || haystack.includes(search.toLowerCase())) &&
					(statusFilter === 'all' || item.status === statusFilter)
				)
			}),
		[reviews, search, statusFilter]
	)

	const openDetail = (item: any) => {
		setSelectedId(item.id)
		setSelectedKind(activeTab)
		setSelectedStatus(item.status)
		setSelectedFeatured(Boolean(item.is_featured))
		setSelectedTitle(item.title ?? '')
		setSelectedComment(item.comment ?? '')
		setSelectedRating(item.rating ?? 5)
	}

	const selectedItem = useMemo(() => filtered.find((item: any) => item.id === selectedId) ?? null, [filtered, selectedId])

	const save = async () => {
		if (!selectedId) return
		setSaving(true)
		try {
			const res = await fetch(`/api/admin/reviews/${selectedId}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					kind: selectedKind,
					status: selectedStatus,
					is_featured: selectedFeatured,
					title: selectedTitle,
					comment: selectedComment,
					rating: selectedRating,
				}),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Review updated', variant: 'success' })
			setSelectedId(null)
			load()
		} catch (error) {
			toast({ title: 'Update failed', description: error instanceof Error ? error.message : undefined, variant: 'error' })
		} finally {
			setSaving(false)
		}
	}

	const remove = async () => {
		if (!selectedId) return
		const ok = await confirm({ title: 'Delete entry?', description: 'This will permanently remove the record.', confirmLabel: 'Delete', destructive: true })
		if (!ok) return
		setSaving(true)
		try {
			const res = await fetch(`/api/admin/reviews/${selectedId}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ kind: selectedKind }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Review deleted', variant: 'success' })
			setSelectedId(null)
			load()
		} catch (error) {
			toast({ title: 'Delete failed', description: error instanceof Error ? error.message : undefined, variant: 'error' })
		} finally {
			setSaving(false)
		}
	}

	if (!can('reviews:write')) {
		return (
			<div>
				<PageTitle title="Reviews" subtitle="Product reviews and store testimonials" />
				<EmptyState message="You do not have access to manage reviews." />
			</div>
		)
	}

	return (
		<div>
			<PageTitle title="Reviews" subtitle="Moderate product reviews and store testimonials" />

			<div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
				{[
					{ label: 'Product Reviews', value: data?.stats.productReviewsTotal ?? 0 },
					{ label: 'Pending Reviews', value: data?.stats.productReviewsPending ?? 0 },
					{ label: 'Testimonials', value: data?.stats.testimonialsTotal ?? 0 },
					{ label: 'Pending Testimonials', value: data?.stats.testimonialsPending ?? 0 },
				].map((card) => (
					<div key={card.label} className="bg-card border border-border rounded-3xl p-5">
						<p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground font-bold">{card.label}</p>
						<p className="text-3xl font-bold text-card-foreground mt-2">{card.value}</p>
					</div>
				))}
			</div>

			<div className="bg-card border border-border rounded-3xl p-2.5 flex flex-wrap gap-2 mb-6 max-w-fit">
				{[
					{ key: 'product' as const, label: 'Product Reviews' },
					{ key: 'testimonial' as const, label: 'Store Testimonials' },
				].map((tab) => (
					<button
						key={tab.key}
						onClick={() => {
							setActiveTab(tab.key)
							setSearch('')
							setStatusFilter('all')
							setSelectedId(null)
						}}
						className={`px-5 py-2.5 rounded-2xl text-[11px] font-bold uppercase tracking-[0.14em] transition-all ${
							activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'text-foreground/70 hover:bg-muted'
						}`}
					>
						{tab.label}
					</button>
				))}
			</div>

			<div className="flex flex-wrap gap-3 mb-6 max-w-4xl">
				<div className="relative flex-1 min-w-[240px] max-w-md">
					<Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search reviews or testimonials..." className={`${adminInput} pl-11`} />
				</div>
				<select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as 'all' | ReviewStatus)} className={adminInput}>
					<option value="all">All statuses</option>
					<option value="pending">Pending</option>
					<option value="approved">Approved</option>
					<option value="rejected">Rejected</option>
				</select>
			</div>

			{data === null ? (
				<TableShimmer />
			) : filtered.length === 0 ? (
				<EmptyState message={`No ${activeTab === 'product' ? 'product reviews' : 'testimonials'} match the current filters.`} />
			) : (
				<div className="border border-border rounded-3xl overflow-hidden bg-card overflow-x-auto">
					<table className="w-full text-sm min-w-[900px]">
						<thead>
							<tr className="bg-secondary text-left">
								{activeTab === 'product'
									? ['Product', 'Reviewer', 'Rating', 'Status', 'Featured', 'Created', ''].map((header) => (
										<th key={header} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">{header}</th>
									))
									: ['Customer', 'Rating', 'Status', 'Featured', 'Created', ''].map((header) => (
										<th key={header} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">{header}</th>
									))}
							</tr>
						</thead>
						<tbody>
							{filtered.map((item: any) => (
								<tr key={item.id} className="border-t border-border hover:bg-muted/40 transition-colors">
									{activeTab === 'product' ? (
										<>
											<td className="px-5 py-3.5 font-medium text-card-foreground">
												{item.products?.name ?? 'Unknown Product'}
												<p className="text-[10px] text-muted-foreground mt-1">{item.products?.brand ?? ''}</p>
											</td>
											<td className="px-5 py-3.5 text-foreground/75">
												{item.reviewer_name}
												<p className="text-[10px] text-muted-foreground mt-1">{item.reviewer_email ?? '—'}</p>
											</td>
										</>
									) : (
										<td className="px-5 py-3.5 font-medium text-card-foreground">
											{item.customer_name}
											<p className="text-[10px] text-muted-foreground mt-1">{item.customer_email ?? '—'}</p>
										</td>
									)}
									<td className="px-5 py-3.5"><Stars value={item.rating} /></td>
									<td className="px-5 py-3.5"><StatusBadge value={item.status} /></td>
									<td className="px-5 py-3.5 text-xs text-foreground/75">{item.is_featured ? 'Yes' : 'No'}</td>
									<td className="px-5 py-3.5 text-xs text-foreground/75">{new Date(item.created_at).toLocaleDateString()}</td>
									<td className="px-5 py-3.5 text-right">
										<button onClick={() => openDetail(item)} className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-all cursor-pointer" aria-label="View details">
											<PenSquare className="w-4 h-4" />
										</button>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{selectedItem && (
				<Modal open onClose={() => setSelectedId(null)} title={selectedKind === 'product' ? 'Product Review' : 'Store Testimonial'} wide>
					<div className="grid md:grid-cols-2 gap-8">
						<div className="space-y-5">
							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2">Submitted By</p>
								<p className="text-sm font-semibold text-card-foreground">{selectedKind === 'product' ? (selectedItem as ProductReviewRecord).reviewer_name : (selectedItem as TestimonialRecord).customer_name}</p>
								<p className="text-xs text-muted-foreground mt-1">{selectedKind === 'product' ? (selectedItem as ProductReviewRecord).reviewer_email ?? '—' : (selectedItem as TestimonialRecord).customer_email ?? '—'}</p>
							</div>
							{selectedKind === 'product' && (
								<div>
									<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2">Product</p>
									<p className="text-sm font-semibold text-card-foreground">{(selectedItem as ProductReviewRecord).products?.name ?? 'Unknown'}</p>
									<p className="text-xs text-muted-foreground mt-1">{(selectedItem as ProductReviewRecord).products?.brand ?? ''}</p>
								</div>
							)}
							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2">Comment</p>
								<p className="text-sm text-foreground/80 whitespace-pre-line bg-secondary rounded-2xl p-4">{selectedComment}</p>
							</div>
						</div>

						<div className="space-y-4">
							<div>
								<label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block">Status</label>
								<select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value as ReviewStatus)} className={`${adminInput} cursor-pointer`}>
									<option value="pending">Pending</option>
									<option value="approved">Approved</option>
									<option value="rejected">Rejected</option>
								</select>
							</div>
							<div>
								<label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block">Title</label>
								<input value={selectedTitle} onChange={(e) => setSelectedTitle(e.target.value)} className={adminInput} />
							</div>
							<div>
								<label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block">Comment</label>
								<textarea value={selectedComment} onChange={(e) => setSelectedComment(e.target.value)} className={adminInput} rows={5} />
							</div>
							<div>
								<label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block">Rating</label>
								<select value={selectedRating} onChange={(e) => setSelectedRating(Number(e.target.value))} className={`${adminInput} cursor-pointer`}>
									{[1, 2, 3, 4, 5].map((value) => <option key={value} value={value}>{value}</option>)}
								</select>
							</div>
							<label className="flex items-center gap-2 text-xs text-foreground/80">
								<input type="checkbox" checked={selectedFeatured} onChange={(e) => setSelectedFeatured(e.target.checked)} className="accent-[var(--primary)]" />
								Featured on homepage
							</label>
							<div className="flex gap-3 pt-2">
								<button onClick={save} disabled={saving} className={`${adminButton} flex-1 justify-center`}>
									{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
									Save
								</button>
								<button onClick={remove} disabled={saving} className={`${adminButtonGhost} flex-1 justify-center border-destructive text-destructive hover:border-destructive hover:text-destructive`}>
									<Trash2 className="w-3.5 h-3.5" />
									Delete
								</button>
							</div>
						</div>
					</div>
				</Modal>
			)}
		</div>
	)
}
