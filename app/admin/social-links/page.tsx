'use client'

import { useCallback, useEffect, useState } from 'react'
import { Trash2, Globe, ExternalLink, Copy } from 'lucide-react'
import { PageTitle, EmptyState, adminInput } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import type { SocialLink } from '@/lib/types'

function renderPlatformIcon(platform: string) {
	const p = platform.toLowerCase()
	if (p.includes('amazon')) return <img src="/amazon.svg" alt="Amazon" className="w-4 h-4 object-contain" />
	if (p.includes('facebook')) return <img src="/facebook.svg" alt="Facebook" className="w-4 h-4 object-contain" />
	if (p.includes('instagram')) return <img src="/instagram.svg" alt="Instagram" className="w-4 h-4 object-contain" />
	if (p.includes('tiktok')) return <img src="/tiktok.svg" alt="TikTok" className="w-4 h-4 object-contain" />
	if (p.includes('whatsapp')) return <img src="/whatsapp.svg" alt="WhatsApp" className="w-4 h-4 object-contain" />
	if (p.includes('ebay')) return <img src="/ebay.svg" alt="eBay" className="w-4 h-4 object-contain" />
	return <Globe className="w-4 h-4 text-muted-foreground" />
}

export default function AdminSocialLinksPage() {
	const { toast, confirm } = useToast()
	const { can } = useAdmin()

	const [links, setLinks] = useState<SocialLink[] | null>(null)

	const load = useCallback(() => {
		fetch('/api/admin/social-links')
			.then((res) => res.json())
			.then((json) => setLinks(json.links ?? []))
			.catch(() => setLinks([]))
	}, [])

	useEffect(load, [load])

	const update = async (link: SocialLink) => {
		const res = await fetch('/api/admin/social-links', {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(link),
		})
		if (!res.ok) {
			const json = await res.json()
			toast({ title: 'Update failed', description: json.error, variant: 'error' })
		}
		load()
	}

	const remove = async (link: SocialLink) => {
		const ok = await confirm({
			title: 'Remove social link?',
			description: `The ${link.platform} link will be removed from the storefront header, footer, and contact sections.`,
			confirmLabel: 'Remove',
			destructive: true,
		})
		if (!ok) return
		await fetch(`/api/admin/social-links?id=${link.id}`, { method: 'DELETE' })
		load()
	}

	const writable = can('settings:write')

	return (
		<div className="max-w-4xl space-y-6 pb-16">
			<PageTitle title="Store Links & Social Platforms" subtitle="Configure external store channels, WhatsApp numbers, and social profile links" />

			<section className="bg-card border border-border/80 rounded-3xl p-6 shadow-sm space-y-6 font-sans">
				<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-border/80">
					<div className="flex items-center gap-2.5">
						<Globe className="w-5 h-5 text-primary" />
						<div>
							<h2 className="text-lg font-serif font-bold text-foreground tracking-tight font-sans">Store Platforms &amp; Links</h2>
							<p className="text-xs text-muted-foreground font-sans">
								These links appear in the website header, footer, and contact sections.
							</p>
						</div>
					</div>

					{writable && (
						<div className="flex items-center gap-2.5">
							<span className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground whitespace-nowrap">
								ADD PLATFORM:
							</span>
							<select
								onChange={async (e) => {
									const val = e.target.value
									if (!val) return
									try {
										const res = await fetch('/api/admin/social-links', {
											method: 'POST',
											headers: { 'Content-Type': 'application/json' },
											body: JSON.stringify({ platform: val, url: '', is_active: true }),
										})
										const json = await res.json()
										if (!res.ok) throw new Error(json.error || 'Failed to add platform')
										toast({ title: 'Platform added', description: `${val} added to store settings.`, variant: 'success' })
										load()
									} catch (err) {
										toast({ title: 'Error', description: err instanceof Error ? err.message : 'Error', variant: 'error' })
									}
									e.target.value = ''
								}}
								className="px-3.5 py-2 bg-muted/30 border border-border/80 rounded-xl text-xs font-semibold text-foreground focus:outline-none focus:border-primary cursor-pointer"
							>
								<option value="">Choose platform...</option>
								<option value="Amazon Store">Amazon Store</option>
								<option value="Facebook">Facebook</option>
								<option value="Instagram">Instagram</option>
								<option value="TikTok">TikTok</option>
								<option value="WhatsApp Canada Number">WhatsApp Canada Number</option>
								<option value="WhatsApp Group Invite Link">WhatsApp Group Invite Link</option>
								<option value="WhatsApp US Number">WhatsApp US Number</option>
								<option value="eBay Store">eBay Store</option>
								<option value="Google Business">Google Business</option>
							</select>
						</div>
					)}
				</div>

				{links === null ? (
					<TableShimmer />
				) : links.length === 0 ? (
					<EmptyState message="No store platforms configured. Choose a platform above to get started." />
				) : (
					<div className="space-y-3.5">
						{links.map((link) => {
							const isWhatsapp = link.platform.toLowerCase().includes('whatsapp')
							return (
								<div
									key={link.id}
									className="bg-card border border-border/80 rounded-2xl p-4.5 hover:border-primary/40 transition-all shadow-3xs group"
								>
									<div className="flex items-center justify-between gap-3 mb-2.5">
										<div className="flex items-center gap-2">
											{renderPlatformIcon(link.platform)}
											<span className="text-[11px] font-bold uppercase tracking-[0.16em] text-foreground font-sans">
												{link.platform}
											</span>
										</div>

										{writable && (
											<button
												type="button"
												onClick={() => remove(link)}
												className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
											>
												<Trash2 className="w-3.5 h-3.5" />
												Remove Link
											</button>
										)}
									</div>

									<div className="flex items-center gap-2">
										<input
											defaultValue={link.url}
											placeholder={
												isWhatsapp
													? 'e.g. +1 (206) 841-2427'
													: `https://www.${link.platform.toLowerCase().replace(/[^a-z0-9]/g, '')}.com/...`
											}
											onBlur={(e) => {
												if (e.target.value !== link.url) {
													update({ ...link, url: e.target.value })
												}
											}}
											disabled={!writable}
											className={`${adminInput} bg-muted/20 border-border/80 text-xs font-medium flex-1`}
										/>

										{link.url.trim() && (
											<>
												<a
													href={
														link.url.startsWith('http')
															? link.url
															: isWhatsapp
															? `https://wa.me/${link.url.replace(/\D/g, '')}`
															: `https://${link.url}`
													}
													target="_blank"
													rel="noopener noreferrer"
													className="p-2.5 rounded-xl border border-border/80 bg-secondary hover:bg-muted text-foreground transition-all cursor-pointer"
													title="Open Link in New Tab"
												>
													<ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
												</a>
												<button
													type="button"
													onClick={() => {
														navigator.clipboard.writeText(link.url)
														toast({ title: 'Copied to clipboard', variant: 'success' })
													}}
													className="p-2.5 rounded-xl border border-border/80 bg-secondary hover:bg-muted text-foreground transition-all cursor-pointer"
													title="Copy to Clipboard"
												>
													<Copy className="w-3.5 h-3.5 text-muted-foreground" />
												</button>
											</>
										)}
									</div>
								</div>
							)
						})}
					</div>
				)}
			</section>
		</div>
	)
}
