'use client'

import { useEffect, useState } from 'react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { fetchCmsPage } from '@/lib/data'
import type { CmsPage } from '@/lib/types'

/** Renders a storefront page whose title and body come from the cms_pages table. */
export function CmsPageView({ slug, fallbackTitle }: { slug: string; fallbackTitle: string }) {
	const [page, setPage] = useState<CmsPage | null | undefined>(undefined)

	useEffect(() => {
		fetchCmsPage(slug)
			.then(setPage)
			.catch(() => setPage(null))
	}, [slug])

	return (
		<main className="min-h-screen bg-background">
			<Navigation />

			<section className="bg-primary text-primary-foreground py-12">
				<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
					{page === undefined ? (
						<div className="h-9 w-64 bg-primary-foreground/20 rounded-full animate-pulse" />
					) : (
						<h1 className="text-3xl md:text-4xl font-bold tracking-luxury uppercase">
							{page?.title ?? fallbackTitle}
						</h1>
					)}
				</div>
			</section>

			<section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
				{page === undefined ? (
					<div className="animate-pulse space-y-4">
						{Array.from({ length: 8 }).map((_, i) => (
							<div key={i} className="h-4 bg-muted rounded-full" style={{ width: `${90 - (i % 4) * 12}%` }} />
						))}
					</div>
				) : page?.content ? (
					<div className="text-sm md:text-base text-foreground/80 leading-relaxed whitespace-pre-line">
						{page.content}
					</div>
				) : (
					<p className="text-sm text-muted-foreground">This page has not been published yet.</p>
				)}
				{page?.updated_at && (
					<p className="text-[11px] text-muted-foreground mt-12 uppercase tracking-[0.16em]">
						Last updated {new Date(page.updated_at).toLocaleDateString()}
					</p>
				)}
			</section>

			<Footer />
		</main>
	)
}
