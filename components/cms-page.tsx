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

			<section className="bg-gradient-to-r from-primary via-primary/95 to-accent text-primary-foreground py-14 border-b border-primary/20 shadow-md">
				<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
					{page === undefined ? (
						<div className="h-9 w-64 bg-primary-foreground/20 rounded-full animate-pulse" />
					) : (
						<div>
							<div className="flex items-center gap-2 mb-3">
								<span className="h-0.5 w-6 bg-primary-foreground/70 rounded-full inline-block" />
								<p className="text-[10px] uppercase tracking-[0.28em] text-primary-foreground/80 font-bold">CellKore Portal</p>
							</div>
							<h1 className="text-3xl md:text-5xl font-extrabold tracking-luxury uppercase text-primary-foreground drop-shadow-sm">
								{page?.title ?? fallbackTitle}
							</h1>
						</div>
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
