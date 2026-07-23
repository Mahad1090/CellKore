'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import {
	Search,
	Loader2,
	Star,
	Trash2,
	PenSquare,
	ChevronRight,
	Home,
	Check,
	X,
	Award,
	MessageCircle,
	ExternalLink,
	Filter,
	Calendar,
} from 'lucide-react'
import { PageTitle, EmptyState, Modal, adminInput } from '@/components/admin/ui'
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
				<Star key={index} className={`w-3.5 h-3.5 ${index < value ? 'fill-amber-400 text-amber-400' : 'text-amber-200/60'}`} />
			))}
		</div>
	)
}

export default function AdminReviewsPage() {
	const { toast, confirm } = useToast()
	const { can } = useAdmin()

	const [data, setData] = useState<ReviewsResponse | null>(null)
	const [activeTab, setActiveTab] = useState<ReviewKind>('product')

	// Filters
	const [search, setSearch] = useState('')
	const [statusFilter, setStatusFilter] = useState<'all' | ReviewStatus>('all')
	const [ratingFilter, setRatingFilter] = useState<'all' | number>('all')
	const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days'>('all')
	const [selectedProductId, setSelectedProductId] = useState<string>('all')

	// Modal / Edit state
	const [selectedId, setSelectedId] = useState<string | null>(null)
	const [selectedKind, setSelectedKind] = useState<ReviewKind>('product')
	const [selectedStatus, setSelectedStatus] = useState<ReviewStatus>('pending')
	const [selectedFeatured, setSelectedFeatured] = useState(false)
	const [selectedTitle, setSelectedTitle] = useState('')
	const [selectedComment, setSelectedComment] = useState('')
	const [selectedRating, setSelectedRating] = useState(5)
	const [saving, setSaving] = useState(false)
	const [actionId, setActionId] = useState<string | null>(null)

	const load = () => {
		fetch('/api/admin/reviews')
			.then((res) => res.json())
			.then((json: ReviewsResponse) => setData(json))
			.catch(() =>
				setData({
					productReviews: [],
					testimonials: [],
					stats: {
						productReviewsTotal: 0,
						productReviewsPending: 0,
						productReviewsApproved: 0,
						testimonialsTotal: 0,
						testimonialsPending: 0,
						testimonialsApproved: 0,
					},
				})
			)
	}

	useEffect(load, [])

	const currentList = activeTab === 'product' ? data?.productReviews ?? [] : data?.testimonials ?? []

	// Compute Product Sidebar Groupings
	const productGroups = useMemo(() => {
		if (activeTab !== 'product') return []
		const map = new Map<string, { id: string; name: string; count: number }>()
		;(data?.productReviews ?? []).forEach((r) => {
			const pid = r.product_id
			const name = r.products?.name ?? 'Unknown Product'
			if (!map.has(pid)) {
				map.set(pid, { id: pid, name, count: 0 })
			}
			map.get(pid)!.count += 1
		})
		return Array.from(map.values())
	}, [data, activeTab])

	// Filtered items based on search, status, rating, date, and product filter
	const filtered = useMemo(() => {
		const now = Date.now()
		const days7 = 7 * 24 * 60 * 60 * 1000
		const days30 = 30 * 24 * 60 * 60 * 1000

		return currentList.filter((item: any) => {
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

			const matchesSearch = !search.trim() || haystack.includes(search.toLowerCase())
			const matchesStatus = statusFilter === 'all' || item.status === statusFilter
			const matchesRating = ratingFilter === 'all' || item.rating === ratingFilter

			let matchesDate = true
			if (dateFilter === '7days') {
				matchesDate = now - new Date(item.created_at).getTime() <= days7
			} else if (dateFilter === '30days') {
				matchesDate = now - new Date(item.created_at).getTime() <= days30
			}

			let matchesProduct = true
			if (activeTab === 'product' && selectedProductId !== 'all') {
				matchesProduct = item.product_id === selectedProductId
			}

			return matchesSearch && matchesStatus && matchesRating && matchesDate && matchesProduct
		})
	}, [currentList, search, statusFilter, ratingFilter, dateFilter, selectedProductId, activeTab])

	// Calculations for the 4 Stat Cards
	const computedStats = useMemo(() => {
		const list = currentList
		const total = list.length
		const pending = list.filter((i) => i.status === 'pending').length
		const approved = list.filter((i) => i.status === 'approved').length
		const rejected = list.filter((i) => i.status === 'rejected').length
		return { total, pending, approved, rejected }
	}, [currentList])

	// Quick actions: Approve, Reject, Toggle Feature
	const handleQuickStatusChange = async (id: string, newStatus: ReviewStatus) => {
		setActionId(id)
		try {
			const res = await fetch(`/api/admin/reviews/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ kind: activeTab, status: newStatus }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({
				title: `Review ${newStatus === 'approved' ? 'Approved' : 'Rejected'}`,
				variant: newStatus === 'approved' ? 'success' : 'info',
			})
			load()
		} catch (err) {
			toast({ title: 'Action failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setActionId(null)
		}
	}

	const handleQuickFeatureToggle = async (id: string, currentFeatured: boolean) => {
		setActionId(id)
		try {
			const res = await fetch(`/api/admin/reviews/${id}`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ kind: activeTab, is_featured: !currentFeatured }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({
				title: !currentFeatured ? 'Featured on Homepage' : 'Removed from Featured',
				variant: 'success',
			})
			load()
		} catch (err) {
			toast({ title: 'Action failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setActionId(null)
		}
	}

	const handleQuickDelete = async (id: string) => {
		const ok = await confirm({
			title: 'Delete Entry?',
			description: 'This will permanently delete this review record.',
			confirmLabel: 'Delete',
			destructive: true,
		})
		if (!ok) return

		setActionId(id)
		try {
			const res = await fetch(`/api/admin/reviews/${id}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ kind: activeTab }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Review deleted', variant: 'success' })
			load()
		} catch (err) {
			toast({ title: 'Delete failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setActionId(null)
		}
	}

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

	const saveModal = async () => {
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
			toast({ title: 'Review updated successfully', variant: 'success' })
			setSelectedId(null)
			load()
		} catch (error) {
			toast({ title: 'Update failed', description: error instanceof Error ? error.message : undefined, variant: 'error' })
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
		<div className="space-y-6 max-w-7xl mx-auto pb-16">
			{/* Top Breadcrumb matching reference screenshot */}
			<div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
				<Home className="w-3 h-3 text-muted-foreground" />
				<span>ADMIN</span>
				<ChevronRight className="w-3 h-3 text-muted-foreground/60" />
				<span className="text-foreground font-extrabold">
					{activeTab === 'product' ? 'PRODUCT REVIEWS' : 'STORE TESTIMONIALS'}
				</span>
			</div>

			{/* Top Navigation Tabs */}
			<div className="border-b border-border/80 flex items-center gap-8">
				<button
					onClick={() => {
						setActiveTab('product')
						setSelectedProductId('all')
						setSearch('')
					}}
					className={`pb-3 text-xs font-extrabold uppercase tracking-[0.18em] transition-all cursor-pointer relative ${
						activeTab === 'product' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
					}`}
				>
					PRODUCT REVIEWS
					{activeTab === 'product' && (
						<div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground rounded-full" />
					)}
				</button>

				<button
					onClick={() => {
						setActiveTab('testimonial')
						setSelectedProductId('all')
						setSearch('')
					}}
					className={`pb-3 text-xs font-extrabold uppercase tracking-[0.18em] transition-all cursor-pointer relative ${
						activeTab === 'testimonial' ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
					}`}
				>
					STORE TESTIMONIALS
					{activeTab === 'testimonial' && (
						<div className="absolute bottom-0 left-0 right-0 h-[2px] bg-foreground rounded-full" />
					)}
				</button>
			</div>

			{/* 4 Stat Cards matching reference design */}
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
				<div className="bg-white border border-border/80 rounded-2xl p-5 shadow-3xs">
					<p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground font-extrabold">
						TOTAL {activeTab === 'product' ? 'REVIEWS' : 'TESTIMONIALS'}
					</p>
					<p className="text-3xl font-extrabold text-foreground font-serif mt-2">{computedStats.total}</p>
				</div>

				<div className="bg-white border border-border/80 rounded-2xl p-5 shadow-3xs relative overflow-hidden">
					<div className="flex items-center justify-between">
						<p className="text-[10px] uppercase tracking-[0.18em] text-amber-700 font-extrabold">
							PENDING APPROVAL
						</p>
						<span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
					</div>
					<p className="text-3xl font-extrabold text-amber-900 font-serif mt-2">{computedStats.pending}</p>
				</div>

				<div className="bg-white border border-border/80 rounded-2xl p-5 shadow-3xs">
					<p className="text-[10px] uppercase tracking-[0.18em] text-[#599161] font-extrabold">
						APPROVED REVIEWS
					</p>
					<p className="text-3xl font-extrabold text-[#599161] font-serif mt-2">{computedStats.approved}</p>
				</div>

				<div className="bg-white border border-border/80 rounded-2xl p-5 shadow-3xs">
					<p className="text-[10px] uppercase tracking-[0.18em] text-rose-600 font-extrabold">
						REJECTED REVIEWS
					</p>
					<p className="text-3xl font-extrabold text-rose-600 font-serif mt-2">{computedStats.rejected}</p>
				</div>
			</div>

			{/* Filter Bar matching reference design */}
			<div className="bg-white border border-border/80 rounded-2xl p-4 shadow-3xs flex flex-wrap items-center gap-3">
				<div className="relative flex-1 min-w-[220px]">
					<Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<input
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						placeholder="Search comments, users, email..."
						className={`${adminInput} pl-10 text-xs py-2 bg-muted/20 border-border/70`}
					/>
				</div>

				{/* Status Filter */}
				<div className="relative min-w-[140px]">
					<select
						value={statusFilter}
						onChange={(e) => setStatusFilter(e.target.value as any)}
						className={`${adminInput} text-xs py-2 pr-8 bg-muted/20 border-border/70 font-semibold cursor-pointer`}
					>
						<option value="all">All Statuses</option>
						<option value="pending">Pending</option>
						<option value="approved">Approved</option>
						<option value="rejected">Rejected</option>
					</select>
				</div>

				{/* Rating Filter */}
				<div className="relative min-w-[130px]">
					<select
						value={ratingFilter}
						onChange={(e) => setRatingFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
						className={`${adminInput} text-xs py-2 pr-8 bg-muted/20 border-border/70 font-semibold cursor-pointer`}
					>
						<option value="all">All Ratings</option>
						<option value="5">5 Stars</option>
						<option value="4">4 Stars</option>
						<option value="3">3 Stars</option>
						<option value="2">2 Stars</option>
						<option value="1">1 Star</option>
					</select>
				</div>

				{/* Date Filter */}
				<div className="relative min-w-[130px]">
					<select
						value={dateFilter}
						onChange={(e) => setDateFilter(e.target.value as any)}
						className={`${adminInput} text-xs py-2 pr-8 bg-muted/20 border-border/70 font-semibold cursor-pointer`}
					>
						<option value="all">All Dates</option>
						<option value="7days">Last 7 Days</option>
						<option value="30days">Last 30 Days</option>
					</select>
				</div>
			</div>

			{/* Content Area */}
			{data === null ? (
				<TableShimmer />
			) : (
				<div className="grid lg:grid-cols-[240px_1fr] gap-6 items-start">
					{/* Group By Product Sidebar (Product Reviews Tab) */}
					{activeTab === 'product' && (
						<div className="bg-white border border-border/80 rounded-2xl p-4 shadow-3xs space-y-3">
							<h4 className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground pb-2 border-b border-border/60">
								GROUP BY PRODUCT
							</h4>

							<div className="space-y-1">
								<button
									onClick={() => setSelectedProductId('all')}
									className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
										selectedProductId === 'all'
											? 'bg-foreground text-background shadow-3xs'
											: 'text-foreground/80 hover:bg-muted'
									}`}
								>
									<span className="truncate">All Products</span>
									<span className="text-[10px] opacity-80">({data.productReviews.length})</span>
								</button>

								{productGroups.map((p) => (
									<button
										key={p.id}
										onClick={() => setSelectedProductId(p.id)}
										className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
											selectedProductId === p.id
												? 'bg-foreground text-background font-bold shadow-3xs'
												: 'text-muted-foreground hover:bg-muted hover:text-foreground'
										}`}
									>
										<span className="truncate pr-2">{p.name}</span>
										<span className="text-[10px] opacity-75 shrink-0">({p.count})</span>
									</button>
								))}
							</div>
						</div>
					)}

					{/* Review Cards Feed */}
					<div className={`space-y-4 ${activeTab !== 'product' ? 'lg:col-span-2' : ''}`}>
						{filtered.length === 0 ? (
							<div className="bg-white border border-dashed border-border/80 rounded-3xl p-12 text-center bg-secondary/10">
								<p className="text-xs text-muted-foreground font-medium">
									No {activeTab === 'product' ? 'product reviews' : 'store testimonials'} match the selected criteria.
								</p>
							</div>
						) : (
							filtered.map((item: any) => {
								const isProduct = activeTab === 'product'
								const reviewerName = isProduct ? item.reviewer_name : item.customer_name
								const reviewerEmail = isProduct ? item.reviewer_email : item.customer_email
								const productName = item.products?.name ?? 'General Review'
								const brandName = item.products?.brand ?? 'COUTURE PIECE'

								const borderAccent =
									item.status === 'approved'
										? 'border-l-4 border-l-[#599161]'
										: item.status === 'rejected'
										? 'border-l-4 border-l-rose-500'
										: 'border-l-4 border-l-amber-500'

								return (
									<div
										key={item.id}
										className={`bg-white border border-border/80 rounded-2xl p-6 shadow-3xs space-y-4 transition-all hover:border-border ${borderAccent}`}
									>
										{/* Top Info Bar */}
										<div className="flex items-start justify-between gap-4 flex-wrap">
											<div>
												<p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground mb-1">
													{isProduct ? brandName : 'STORE TESTIMONIAL'}
												</p>

												{isProduct ? (
													<Link
														href={`/products/${item.product_id}`}
														target="_blank"
														className="text-sm font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1.5 font-serif"
													>
														{productName}
														<ExternalLink className="w-3.5 h-3.5 opacity-60" />
													</Link>
												) : (
													item.title && (
														<h4 className="text-sm font-bold text-foreground font-serif">
															{item.title}
														</h4>
													)
												)}

												<div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
													<span className="font-semibold text-foreground/90">{reviewerName}</span>
													{reviewerEmail && <span>&bull; {reviewerEmail}</span>}
												</div>
											</div>

											<div className="flex items-center gap-3">
												<Stars value={item.rating} />

												{/* Badges */}
												{item.is_featured && (
													<span className="px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-amber-700 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1">
														<Award className="w-3 h-3 text-amber-600" />
														FEATURED
													</span>
												)}

												<span
													className={`px-2.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider border ${
														item.status === 'approved'
															? 'bg-[#EEF7F0] border-[#C8E6CE] text-[#599161]'
															: item.status === 'rejected'
															? 'bg-rose-50 border-rose-200 text-rose-700'
															: 'bg-amber-50 border-amber-200 text-amber-700'
													}`}
												>
													{item.status}
												</span>
											</div>
										</div>

										{/* Quoted Comment */}
										<div className="bg-secondary/15 rounded-xl p-4 border border-border/40">
											{isProduct && item.title && (
												<p className="text-xs font-bold text-foreground mb-1">{item.title}</p>
											)}
											<p className="text-xs text-foreground/80 font-medium italic leading-relaxed whitespace-pre-line">
												&ldquo;{item.comment}&rdquo;
											</p>
										</div>

										{/* Bottom Action Footer */}
										<div className="flex items-center justify-between gap-4 pt-2 border-t border-border/50 flex-wrap text-xs">
											<span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
												CREATED: {new Date(item.created_at).toLocaleString()}
											</span>

											<div className="flex items-center gap-2">
												{/* Toggle Feature Button */}
												<button
													onClick={() => handleQuickFeatureToggle(item.id, item.is_featured)}
													disabled={actionId === item.id}
													className={`px-3 py-1.5 rounded-xl text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1 cursor-pointer ${
														item.is_featured
															? 'border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100'
															: 'border-border/80 text-muted-foreground hover:bg-muted hover:text-foreground'
													}`}
												>
													<Award className="w-3 h-3" />
													{item.is_featured ? 'REMOVE FEATURED' : 'FEATURE'}
												</button>

												{/* Quick Approve Button */}
												{item.status !== 'approved' && (
													<button
														onClick={() => handleQuickStatusChange(item.id, 'approved')}
														disabled={actionId === item.id}
														className="px-3.5 py-1.5 rounded-xl bg-[#599161] text-white text-[10px] font-bold uppercase tracking-wider hover:opacity-90 transition-all flex items-center gap-1 cursor-pointer shadow-3xs"
													>
														{actionId === item.id ? (
															<Loader2 className="w-3 h-3 animate-spin" />
														) : (
															<Check className="w-3 h-3" />
														)}
														APPROVE
													</button>
												)}

												{/* Quick Reject Button */}
												{item.status !== 'rejected' && (
													<button
														onClick={() => handleQuickStatusChange(item.id, 'rejected')}
														disabled={actionId === item.id}
														className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
													>
														<X className="w-3 h-3" />
														REJECT
													</button>
												)}

												{/* Edit / Reply Modal trigger */}
												<button
													onClick={() => openDetail(item)}
													className="px-3 py-1.5 rounded-xl border border-border/80 text-foreground/80 hover:bg-muted text-[10px] font-bold uppercase tracking-wider transition-all flex items-center gap-1 cursor-pointer"
												>
													<MessageCircle className="w-3 h-3 text-muted-foreground" />
													REPLY / EDIT
												</button>

												{/* Quick Delete */}
												<button
													onClick={() => handleQuickDelete(item.id)}
													disabled={actionId === item.id}
													className="p-1.5 text-muted-foreground hover:text-rose-600 transition-colors cursor-pointer rounded-lg hover:bg-rose-50"
													title="Delete Review"
												>
													<Trash2 className="w-3.5 h-3.5" />
												</button>
											</div>
										</div>
									</div>
								)
							})
						)}
					</div>
				</div>
			)}

			{/* Edit Detail Modal */}
			{selectedItem && (
				<Modal
					open
					onClose={() => setSelectedId(null)}
					title={selectedKind === 'product' ? 'Product Review Details' : 'Store Testimonial Details'}
					wide
				>
					<div className="grid md:grid-cols-2 gap-8">
						<div className="space-y-5">
							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1">Submitted By</p>
								<p className="text-sm font-bold text-foreground">
									{selectedKind === 'product'
										? (selectedItem as ProductReviewRecord).reviewer_name
										: (selectedItem as TestimonialRecord).customer_name}
								</p>
								<p className="text-xs text-muted-foreground mt-0.5">
									{selectedKind === 'product'
										? (selectedItem as ProductReviewRecord).reviewer_email ?? '—'
										: (selectedItem as TestimonialRecord).customer_email ?? '—'}
								</p>
							</div>

							{selectedKind === 'product' && (
								<div>
									<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1">Product</p>
									<p className="text-sm font-bold text-foreground">
										{(selectedItem as ProductReviewRecord).products?.name ?? 'Unknown'}
									</p>
									<p className="text-xs text-muted-foreground">
										{(selectedItem as ProductReviewRecord).products?.brand ?? ''}
									</p>
								</div>
							)}

							<div>
								<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Original Comment</p>
								<p className="text-xs text-foreground/80 whitespace-pre-line bg-secondary/30 rounded-xl p-4 border border-border/50 italic leading-relaxed">
									&ldquo;{selectedComment}&rdquo;
								</p>
							</div>
						</div>

						<div className="space-y-4">
							<div>
								<label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1.5 block">
									Status
								</label>
								<select
									value={selectedStatus}
									onChange={(e) => setSelectedStatus(e.target.value as ReviewStatus)}
									className={`${adminInput} cursor-pointer text-xs`}
								>
									<option value="pending">Pending</option>
									<option value="approved">Approved</option>
									<option value="rejected">Rejected</option>
								</select>
							</div>

							<div>
								<label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1.5 block">
									Title / Headline
								</label>
								<input
									value={selectedTitle}
									onChange={(e) => setSelectedTitle(e.target.value)}
									className={`${adminInput} text-xs`}
								/>
							</div>

							<div>
								<label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1.5 block">
									Comment
								</label>
								<textarea
									value={selectedComment}
									onChange={(e) => setSelectedComment(e.target.value)}
									className={`${adminInput} text-xs resize-none`}
									rows={4}
								/>
							</div>

							<div>
								<label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1.5 block">
									Rating
								</label>
								<select
									value={selectedRating}
									onChange={(e) => setSelectedRating(Number(e.target.value))}
									className={`${adminInput} cursor-pointer text-xs`}
								>
									{[1, 2, 3, 4, 5].map((v) => (
										<option key={v} value={v}>
											{v} Star{v > 1 ? 's' : ''}
										</option>
									))}
								</select>
							</div>

							<label className="flex items-center gap-2 text-xs font-bold text-foreground cursor-pointer pt-1">
								<input
									type="checkbox"
									checked={selectedFeatured}
									onChange={(e) => setSelectedFeatured(e.target.checked)}
									className="w-4 h-4 accent-primary rounded"
								/>
								Feature this review on the storefront
							</label>

							<div className="flex gap-3 pt-3">
								<button
									onClick={saveModal}
									disabled={saving}
									className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-3xs"
								>
									{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
									Save Changes
								</button>
							</div>
						</div>
					</div>
				</Modal>
			)}
		</div>
	)
}
