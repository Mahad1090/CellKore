'use client'

import { useEffect, useState } from 'react'
import { Send, Loader2, Trash2, Mail, Users, CheckCircle2, ChevronRight, Home, ImagePlus, X, Upload } from 'lucide-react'
import { adminButton, adminButtonGhost, adminInput } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import { uploadViaAdminApi } from '@/lib/storage'

interface Subscriber {
	id: string
	email: string
	subscribed_at: string
}

export default function AdminNewsletterPage() {
	const { toast, confirm } = useToast()
	const { can } = useAdmin()
	const writable = can('newsletter:write')

	const [subscribers, setSubscribers] = useState<Subscriber[] | null>(null)
	const [subject, setSubject] = useState('')
	const [link, setLink] = useState('')
	const [buttonText, setButtonText] = useState('')
	const [imageUrl, setImageUrl] = useState('')
	const [uploadingImage, setUploadingImage] = useState(false)
	const [message, setMessage] = useState('')
	const [sending, setSending] = useState(false)
	const [search, setSearch] = useState('')

	const loadSubscribers = () => {
		fetch('/api/admin/newsletter')
			.then((res) => res.json())
			.then((json) => setSubscribers(json.subscribers ?? []))
			.catch(() => setSubscribers([]))
	}

	useEffect(() => {
		loadSubscribers()
	}, [])

	const handleImageFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return
		setUploadingImage(true)
		try {
			const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_')
			const url = await uploadViaAdminApi(`newsletter/${Date.now()}-${sanitizedName}`, file)
			setImageUrl(url)
			toast({ title: 'Image attached!', description: 'Banner picture uploaded for newsletter.', variant: 'success' })
		} catch (err) {
			toast({ title: 'Upload failed', description: err instanceof Error ? err.message : 'Upload failed', variant: 'error' })
		} finally {
			setUploadingImage(false)
		}
	}

	const handleSendBroadcast = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!subject.trim() || !message.trim()) {
			toast({ title: 'Validation error', description: 'Subject and message content are required.', variant: 'error' })
			return
		}

		if (!subscribers || subscribers.length === 0) {
			toast({ title: 'No subscribers', description: 'There are no active subscribers to send notifications to.', variant: 'info' })
			return
		}

		const ok = await confirm({
			title: 'Send Notification to All Subscribers?',
			description: `You are about to broadcast this message to ${subscribers.length} subscriber(s). Do you wish to proceed?`,
			confirmLabel: 'Send Notification',
		})
		if (!ok) return

		setSending(true)
		try {
			const res = await fetch('/api/admin/newsletter', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					subject: subject.trim(),
					link: link.trim(),
					buttonText: buttonText.trim(),
					message: message.trim(),
					imageUrl: imageUrl.trim(),
				}),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)

			toast({
				title: 'Broadcast Sent!',
				description: json.message || `Notification sent to ${subscribers.length} subscribers.`,
				variant: 'success',
			})
			setSubject('')
			setLink('')
			setButtonText('')
			setImageUrl('')
			setMessage('')
		} catch (err) {
			toast({ title: 'Failed to send', description: err instanceof Error ? err.message : 'Error sending broadcast', variant: 'error' })
		} finally {
			setSending(false)
		}
	}

	const handleDeleteSubscriber = async (id: string, email: string) => {
		const ok = await confirm({
			title: 'Unsubscribe Email?',
			description: `Remove ${email} from the newsletter subscribers list?`,
			confirmLabel: 'Delete',
			destructive: true,
		})
		if (!ok) return

		try {
			const res = await fetch(`/api/admin/newsletter?id=${id}`, { method: 'DELETE' })
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)

			toast({ title: 'Subscriber removed', description: `${email} has been unsubscribed.`, variant: 'success' })
			setSubscribers((prev) => (prev ? prev.filter((s) => s.id !== id) : []))
		} catch (err) {
			toast({ title: 'Delete failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		}
	}

	const filteredSubscribers = (subscribers ?? []).filter((s) =>
		s.email.toLowerCase().includes(search.toLowerCase().trim())
	)

	return (
		<div className="space-y-8 max-w-6xl mx-auto pb-16">
			{/* Top Breadcrumb matching reference screenshot */}
			<div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
				<Home className="w-3 h-3 text-muted-foreground" />
				<span>ADMIN</span>
				<ChevronRight className="w-3 h-3 text-muted-foreground/60" />
				<span className="text-foreground">NEWSLETTER</span>
			</div>

			{/* Main Container Card */}
			<div className="bg-white rounded-3xl border border-border/80 p-8 sm:p-10 space-y-10 shadow-3xs">
				<h1 className="text-2xl font-serif text-foreground tracking-tight">Newsletter</h1>

				{/* Send New Arrival Notification Section */}
				<div className="space-y-6 pt-2 pb-8 border-b border-border/60">
					<h2 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-foreground">
						SEND NEW ARRIVAL NOTIFICATION
					</h2>

					<form onSubmit={handleSendBroadcast} className="space-y-5">
						<div>
							<label className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2 block">
								SUBJECT
							</label>
							<input
								value={subject}
								onChange={(e) => setSubject(e.target.value)}
								placeholder="e.g. CellKore iPhone 16 Pro Max - New Arrivals!"
								className={`${adminInput} bg-muted/20 border-border/80 font-medium text-xs`}
								disabled={!writable || sending}
							/>
						</div>

						<div>
							<label className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2 block">
								PRODUCT / COLLECTION LINK (OPTIONAL)
							</label>
							<input
								value={link}
								onChange={(e) => setLink(e.target.value)}
								placeholder="https://cellkore.com/products/iphone-16-pro-max"
								className={`${adminInput} bg-muted/20 border-border/80 font-medium text-xs`}
								disabled={!writable || sending}
							/>
						</div>

						<div>
							<label className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2 block">
								BUTTON TEXT / CTA LABEL (OPTIONAL)
							</label>
							<input
								value={buttonText}
								onChange={(e) => setButtonText(e.target.value)}
								placeholder="e.g. SHOP NEW ARRIVALS, EXPLORE COLLECTION, CLAIM DEAL"
								className={`${adminInput} bg-muted/20 border-border/80 font-medium text-xs`}
								disabled={!writable || sending}
							/>
						</div>

						{/* BANNER / ATTACHMENT PICTURE */}
						<div>
							<label className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2 block">
								ATTACHMENT / BANNER PICTURE (OPTIONAL)
							</label>

							{imageUrl.trim() ? (
								<div className="relative inline-block rounded-2xl overflow-hidden border border-border/80 shadow-3xs max-w-sm group">
									<img
										src={imageUrl}
										alt="Newsletter attachment preview"
										className="max-h-48 w-full object-cover"
									/>
									<button
										type="button"
										onClick={() => setImageUrl('')}
										className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 text-white hover:bg-black transition-colors cursor-pointer flex items-center gap-1 text-[10px] px-2.5 font-bold uppercase tracking-wider"
										title="Remove image"
									>
										<X className="w-3.5 h-3.5" />
										Remove
									</button>
								</div>
							) : (
								<div>
									<label
										className={`inline-flex items-center gap-2.5 px-5 py-3 bg-secondary text-secondary-foreground font-bold text-xs rounded-xl border border-border/80 hover:bg-muted transition-all cursor-pointer shadow-3xs ${
											uploadingImage ? 'opacity-50 pointer-events-none' : ''
										}`}
									>
										{uploadingImage ? (
											<>
												<Loader2 className="w-4 h-4 animate-spin text-primary" />
												Uploading Picture...
											</>
										) : (
											<>
												<Upload className="w-4 h-4 text-primary" />
												Upload Banner Picture
											</>
										)}
										<input
											type="file"
											accept="image/*"
											onChange={handleImageFileUpload}
											className="hidden"
											disabled={!writable || sending || uploadingImage}
										/>
									</label>
								</div>
							)}
						</div>

						<div>
							<label className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground mb-2 block">
								MESSAGE CONTENT (SUPPORTS RICH TEXT/PARAGRAPHS)
							</label>
							<textarea
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								rows={6}
								placeholder="Check out our new premium arrivals designed with hand-crafted quality and verified battery health..."
								className={`${adminInput} bg-muted/20 border-border/80 font-medium text-xs leading-relaxed resize-y`}
								disabled={!writable || sending}
							/>
						</div>

						<div className="pt-2">
							<button
								type="submit"
								disabled={!writable || sending || !subject.trim() || !message.trim()}
								className="px-6 py-3.5 bg-foreground text-background font-extrabold text-[11px] uppercase tracking-[0.18em] rounded-xl hover:opacity-90 transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-50 shadow-sm"
							>
								{sending ? (
									<Loader2 className="w-4 h-4 animate-spin" />
								) : (
									<Send className="w-4 h-4 rotate-45" />
								)}
								SEND TO ALL SUBSCRIBERS
							</button>
						</div>
					</form>
				</div>

				{/* Subscribers List Section */}
				<div className="space-y-6">
					<div className="flex flex-wrap items-center justify-between gap-4">
						<div>
							<h3 className="text-base font-serif text-foreground">Subscribers</h3>
							<p className="text-xs text-muted-foreground mt-0.5 font-medium">
								Total subscribers: <strong className="text-foreground font-bold">{subscribers?.length ?? 0}</strong>
							</p>
						</div>

						<div className="flex items-center gap-3">
							<input
								type="text"
								placeholder="Search subscribers..."
								value={search}
								onChange={(e) => setSearch(e.target.value)}
								className={`${adminInput} max-w-[220px] text-xs py-1.5`}
							/>
						</div>
					</div>

					{subscribers === null ? (
						<TableShimmer />
					) : filteredSubscribers.length === 0 ? (
						<div className="py-16 text-center text-sm text-muted-foreground font-medium">
							No active subscribers found.
						</div>
					) : (
						<div className="border border-border/80 rounded-2xl overflow-hidden bg-white shadow-3xs">
							<table className="w-full text-xs">
								<thead>
									<tr className="bg-secondary text-left border-b border-border/60">
										<th className="px-5 py-3.5 font-bold uppercase tracking-[0.14em] text-muted-foreground text-[10px]">
											Subscriber Email
										</th>
										<th className="px-5 py-3.5 font-bold uppercase tracking-[0.14em] text-muted-foreground text-[10px]">
											Subscribed Date
										</th>
										<th className="px-5 py-3.5 font-bold uppercase tracking-[0.14em] text-muted-foreground text-[10px]">
											Status
										</th>
										<th className="px-5 py-3.5 text-right font-bold uppercase tracking-[0.14em] text-muted-foreground text-[10px]">
											Action
										</th>
									</tr>
								</thead>
								<tbody className="divide-y divide-border/60">
									{filteredSubscribers.map((subscriber) => (
										<tr key={subscriber.id} className="hover:bg-muted/20 transition-colors">
											<td className="px-5 py-3.5 font-bold text-foreground flex items-center gap-2.5">
												<Mail className="w-3.5 h-3.5 text-primary shrink-0" />
												<span>{subscriber.email}</span>
											</td>
											<td className="px-5 py-3.5 text-muted-foreground font-medium">
												{new Date(subscriber.subscribed_at).toLocaleString()}
											</td>
											<td className="px-5 py-3.5">
												<span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#EEF7F0] border border-[#C8E6CE] text-[#599161] font-bold text-[10px] uppercase tracking-wider">
													<CheckCircle2 className="w-2.5 h-2.5" />
													Active
												</span>
											</td>
											<td className="px-5 py-3.5 text-right">
												{writable && (
													<button
														onClick={() => handleDeleteSubscriber(subscriber.id, subscriber.email)}
														className="text-muted-foreground hover:text-destructive p-1 rounded-lg hover:bg-destructive/10 transition-colors cursor-pointer"
														title="Delete subscriber"
													>
														<Trash2 className="w-3.5 h-3.5" />
													</button>
												)}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</div>
			</div>
		</div>
	)
}
