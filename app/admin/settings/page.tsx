'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { PageTitle, Panel, EmptyState, adminButton, adminButtonGhost, adminInput } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import type { SocialLink } from '@/lib/types'

export default function AdminSettingsPage() {
	const { toast, confirm } = useToast()
	const { can } = useAdmin()
	const [links, setLinks] = useState<SocialLink[] | null>(null)
	const [newLink, setNewLink] = useState({ platform: '', url: '' })
	const [saving, setSaving] = useState(false)

	const load = useCallback(() => {
		fetch('/api/admin/social-links')
			.then((res) => res.json())
			.then((json) => setLinks(json.links ?? []))
			.catch(() => setLinks([]))
	}, [])

	useEffect(load, [load])

	const add = async () => {
		if (!newLink.platform.trim() || !newLink.url.trim()) return
		setSaving(true)
		try {
			const res = await fetch('/api/admin/social-links', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ ...newLink, is_active: true }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			setNewLink({ platform: '', url: '' })
			toast({ title: 'Social link added', variant: 'success' })
			load()
		} catch (err) {
			toast({ title: 'Add failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSaving(false)
		}
	}

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
			description: `The ${link.platform} link will be removed from the storefront footer.`,
			confirmLabel: 'Remove',
			destructive: true,
		})
		if (!ok) return
		await fetch(`/api/admin/social-links?id=${link.id}`, { method: 'DELETE' })
		load()
	}

	const writable = can('settings:write')

	return (
		<div>
			<PageTitle title="Settings & Social Links" subtitle="Platforms shown in the storefront footer" />

			{writable && (
				<Panel title="Add Platform" className="max-w-3xl mb-8">
					<div className="grid sm:grid-cols-3 gap-3">
						<input
							placeholder="Platform (e.g. Instagram)"
							value={newLink.platform}
							onChange={(e) => setNewLink({ ...newLink, platform: e.target.value })}
							className={adminInput}
						/>
						<input
							placeholder="https://instagram.com/cellkore"
							value={newLink.url}
							onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
							className={adminInput}
						/>
						<button onClick={add} disabled={saving} className={`${adminButton} justify-center`}>
							{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
							Add Link
						</button>
					</div>
				</Panel>
			)}

			{links === null ? (
				<TableShimmer />
			) : links.length === 0 ? (
				<EmptyState message="No social links configured." />
			) : (
				<div className="border border-border rounded-3xl overflow-hidden bg-card overflow-x-auto max-w-3xl">
					<table className="w-full text-sm min-w-[520px]">
						<thead>
							<tr className="bg-secondary text-left">
								{['Platform', 'URL', 'Active', ''].map((h) => (
									<th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">{h}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{links.map((link) => (
								<tr key={link.id} className="border-t border-border hover:bg-muted/40 transition-colors">
									<td className="px-5 py-3.5 font-medium text-card-foreground">{link.platform}</td>
									<td className="px-5 py-3.5">
										{writable ? (
											<input
												defaultValue={link.url}
												onBlur={(e) => {
													if (e.target.value !== link.url) update({ ...link, url: e.target.value })
												}}
												className={`${adminInput} py-1.5`}
											/>
										) : (
											<span className="text-foreground/75 text-xs">{link.url}</span>
										)}
									</td>
									<td className="px-5 py-3.5">
										<input
											type="checkbox"
											checked={link.is_active}
											disabled={!writable}
											onChange={(e) => update({ ...link, is_active: e.target.checked })}
											className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
										/>
									</td>
									<td className="px-5 py-3.5">
										{writable && (
											<button
												onClick={() => remove(link)}
												className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
												aria-label="Remove"
											>
												<Trash2 className="w-4 h-4" />
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
	)
}
