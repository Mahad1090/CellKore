'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * A background <video> that only mounts its <source> (and therefore only
 * starts downloading/decoding) once it scrolls near the viewport.
 *
 * `autoPlay` on a plain <video> forces the browser to start fetching data
 * immediately on mount, regardless of `preload`, because autoplay implies
 * "start playing as soon as possible." With several heavy banner videos
 * stacked on one long page, that means all of them compete for bandwidth
 * and decode time right away — even the ones far below the fold. Deferring
 * the mount itself (not just the preload hint) is what actually stops that.
 */
export function LazyBackgroundVideo({
	src,
	className,
}: {
	src: string
	className?: string
}) {
	const containerRef = useRef<HTMLDivElement>(null)
	const [shouldLoad, setShouldLoad] = useState(false)

	useEffect(() => {
		if (shouldLoad) return
		const node = containerRef.current
		if (!node) return

		const observer = new IntersectionObserver(
			(entries) => {
				if (entries[0]?.isIntersecting) {
					setShouldLoad(true)
					observer.disconnect()
				}
			},
			{ rootMargin: '600px 0px' }
		)
		observer.observe(node)
		return () => observer.disconnect()
	}, [shouldLoad])

	return (
		<div ref={containerRef} className="absolute inset-0 z-0">
			{shouldLoad && (
				<video autoPlay loop muted playsInline preload="none" className={className}>
					<source src={src} type="video/mp4" />
				</video>
			)}
		</div>
	)
}
