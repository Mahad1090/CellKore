'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search } from 'lucide-react'
import { SHIPPING_COUNTRIES, type ShippingCountry } from '@/lib/shipping-countries'

export function CountrySelect({
	value,
	onChange,
	countries = SHIPPING_COUNTRIES,
	className = '',
	placeholder = 'Select country',
}: {
	value: string
	onChange: (code: string) => void
	countries?: ShippingCountry[]
	className?: string
	placeholder?: string
}) {
	const [open, setOpen] = useState(false)
	const [search, setSearch] = useState('')
	const [menuRect, setMenuRect] = useState<{ top: number; left: number; width: number } | null>(null)
	const buttonRef = useRef<HTMLButtonElement>(null)
	const menuRef = useRef<HTMLDivElement>(null)

	const updatePosition = () => {
		const rect = buttonRef.current?.getBoundingClientRect()
		if (rect) setMenuRect({ top: rect.bottom + 8, left: rect.left, width: rect.width })
	}

	useEffect(() => {
		if (!open) return
		updatePosition()
		// Scrolling the page (not the dropdown's own country list) should close the
		// menu, since its position is fixed and would otherwise drift from the button.
		const handleScroll = (event: Event) => {
			if (menuRef.current?.contains(event.target as Node)) return
			setOpen(false)
		}
		window.addEventListener('scroll', handleScroll, true)
		window.addEventListener('resize', handleScroll)
		return () => {
			window.removeEventListener('scroll', handleScroll, true)
			window.removeEventListener('resize', handleScroll)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open])

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			const target = event.target as Node
			if (
				buttonRef.current && !buttonRef.current.contains(target) &&
				menuRef.current && !menuRef.current.contains(target)
			) {
				setOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase()
		if (!q) return countries
		return countries.filter((c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase() === q)
	}, [search, countries])

	const selected = countries.find((c) => c.code === value)

	return (
		<>
			<button
				ref={buttonRef}
				type="button"
				onClick={() => setOpen((o) => !o)}
				className={`flex items-center gap-2.5 cursor-pointer text-left ${className}`}
			>
				{selected ? (
					<>
						<selected.Flag className="w-5 h-3.5 rounded-[2px] shadow-sm shrink-0" />
						<span className="flex-1 truncate">{selected.name}</span>
					</>
				) : (
					<span className="flex-1 truncate text-muted-foreground">{placeholder}</span>
				)}
				<ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
			</button>
			{open && menuRect && typeof document !== 'undefined' &&
				createPortal(
					<div
						ref={menuRef}
						style={{ position: 'fixed', top: menuRect.top, left: menuRect.left, width: Math.max(menuRect.width, 280) }}
						className="bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-[9999] animate-in fade-in slide-in-from-top-2 duration-200"
					>
						<div className="p-2 border-b border-border sticky top-0 bg-card">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
								<input
									autoFocus
									type="text"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder="Search country..."
									className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
								/>
							</div>
						</div>
						<div className="max-h-64 overflow-y-auto">
							{filtered.length === 0 ? (
								<p className="px-4 py-6 text-center text-sm text-muted-foreground">No countries found</p>
							) : (
								filtered.map((c) => (
									<button
										key={c.code}
										type="button"
										onClick={() => {
											onChange(c.code)
											setOpen(false)
											setSearch('')
										}}
										className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex items-center gap-2.5 ${
											c.code === value ? 'bg-secondary text-primary' : 'text-foreground/80 hover:bg-muted'
										}`}
									>
										<c.Flag className="w-5 h-3.5 rounded-[2px] shadow-sm shrink-0" />
										<span className="flex-1 truncate">{c.name}</span>
									</button>
								))
							)}
						</div>
					</div>,
					document.body
				)}
		</>
	)
}
