'use client'

import { useEffect, useRef, useState } from 'react'

/**
 * Drives the "this row is swipeable" affordance used on horizontally
 * scrolling card strips (device-type pickers, category rails) — a fade on
 * the trailing edge plus a live progress thumb, in place of prev/next arrow
 * buttons. Re-measures on content changes and viewport resize.
 */
export function useHorizontalScrollHint<T extends HTMLElement>(deps: React.DependencyList = []) {
	const ref = useRef<T>(null)
	const [atStart, setAtStart] = useState(true)
	const [atEnd, setAtEnd] = useState(false)
	const [thumb, setThumb] = useState({ widthPct: 100, leftPct: 0 })

	const measure = () => {
		const el = ref.current
		if (!el) return
		const maxScroll = el.scrollWidth - el.clientWidth
		const widthPct = Math.min(100, (el.clientWidth / el.scrollWidth) * 100)
		const leftPct = maxScroll > 0 ? (el.scrollLeft / maxScroll) * (100 - widthPct) : 0
		setThumb({ widthPct, leftPct })
		setAtStart(el.scrollLeft <= 4)
		setAtEnd(maxScroll <= 0 || el.scrollLeft >= maxScroll - 4)
	}

	const scrollBy = (dir: 1 | -1) => {
		const el = ref.current
		if (!el) return
		el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: 'smooth' })
	}

	useEffect(() => {
		measure()
		window.addEventListener('resize', measure)
		return () => window.removeEventListener('resize', measure)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps)

	return { ref, atStart, atEnd, thumb, onScroll: measure, scrollBy }
}
