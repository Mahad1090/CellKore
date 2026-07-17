'use client'

import { useEffect, useState } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { PageTitle, Panel, adminButton, adminInput } from '@/components/admin/ui'
import { FormShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import type { CmsPage } from '@/lib/types'

const KNOWN_PAGES: { slug: string; label: string }[] = [
	{ slug: 'terms', label: 'Terms and Conditions' },
	{ slug: 'privacy', label: 'Privacy Policy' },
	{ slug: 'about', label: 'About Us' },
	{ slug: 'sell-success', label: 'Sell Phone — Success Message' },
]

export default function AdminContentPage() {
	const { toast } = useToast()
	const { can } = useAdmin()
	const [pages, setPages] = useState<CmsPage[] | null>(null)
	const [selectedSlug, setSelectedSlug] = useState('terms')
	const [title, setTitle] = useState('')
	const [content, setContent] = useState('')
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		fetch('/api/admin/cms')
			.then((res) => res.json())
			.then((json) => setPages(json.pages ?? []))
			.catch(() => setPages([]))
	}, [])

	useEffect(() => {
		if (!pages) return
		const page = pages.find((p) => p.slug === selectedSlug)
		const known = KNOWN_PAGES.find((k) => k.slug === selectedSlug)
		setTitle(page?.title ?? known?.label ?? '')
		setContent(page?.content ?? '')
	}, [pages, selectedSlug])

	const save = async () => {
		setSaving(true)
		try {
			const res = await fetch('/api/admin/cms', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ slug: selectedSlug, title, content }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Page saved', description: `"${title}" has been published.`, variant: 'success' })
			setPages((prev) => {
				const list = [...(prev ?? [])]
				const index = list.findIndex((p) => p.slug === selectedSlug)
				const updated = { id: selectedSlug, slug: selectedSlug, title, content, updated_at: new Date().toISOString() }
				if (index >= 0) list[index] = { ...list[index], ...updated }
				else list.push(updated as CmsPage)
				return list
			})
		} catch (err) {
			toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSaving(false)
		}
	}

	const writable = can('cms:write')
	const label = 'text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block'

	return (
		<div>
			<PageTitle
				title="Content Pages"
				subtitle="Storefront copy served from the CMS"
				actions={
					writable && (
						<button onClick={save} disabled={saving || !title.trim()} className={adminButton}>
							{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
							Save Page
						</button>
					)
				}
			/>

			{pages === null ? (
				<FormShimmer />
			) : (
				<Panel className="max-w-3xl">
					<div className="space-y-5">
						<div>
							<label className={label}>Page</label>
							<select
								value={selectedSlug}
								onChange={(e) => setSelectedSlug(e.target.value)}
								className={`${adminInput} cursor-pointer`}
							>
								{KNOWN_PAGES.map((page) => (
									<option key={page.slug} value={page.slug}>{page.label}</option>
								))}
							</select>
						</div>
						<div>
							<label className={label}>Title</label>
							<input value={title} onChange={(e) => setTitle(e.target.value)} className={adminInput} disabled={!writable} />
						</div>
						<div>
							<label className={label}>Body Content</label>
							<textarea
								value={content}
								onChange={(e) => setContent(e.target.value)}
								rows={16}
								className={`${adminInput} resize-y leading-relaxed`}
								placeholder="Write the page content here..."
								disabled={!writable}
							/>
						</div>
					</div>
				</Panel>
			)}
		</div>
	)
}
