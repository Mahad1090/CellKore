'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronDown, Search } from 'lucide-react'
import { PHONE_COUNTRIES, type PhoneCountry } from '@/lib/phone-countries'

/** Dial-code country picker + phone number field, shared by sign-up and lead-capture forms. */
export function PhoneInput({
	country,
	onCountryChange,
	value,
	onChange,
	required = false,
	className = '',
}: {
	country: PhoneCountry
	onCountryChange: (country: PhoneCountry) => void
	value: string
	onChange: (value: string) => void
	required?: boolean
	className?: string
}) {
	const [menuOpen, setMenuOpen] = useState(false)
	const [search, setSearch] = useState('')
	const menuRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
				setMenuOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase()
		if (!q) return PHONE_COUNTRIES
		return PHONE_COUNTRIES.filter(
			(c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase() === q
		)
	}, [search])

	return (
		<div className={`flex border border-border rounded-xl bg-background focus-within:border-primary focus-within:ring-1 focus-within:ring-ring transition-all overflow-visible ${className}`}>
			<div className="relative shrink-0" ref={menuRef}>
				<button
					type="button"
					onClick={() => setMenuOpen((open) => !open)}
					className="flex items-center gap-2 h-full pl-4 pr-3 py-3 text-sm text-foreground rounded-l-xl hover:bg-muted transition-colors cursor-pointer border-r border-border"
				>
					<country.Flag className="w-5 h-3.5 rounded-[2px] shadow-sm shrink-0" />
					<span className="hidden sm:inline whitespace-nowrap">{country.name}</span>
					<span className="font-semibold whitespace-nowrap">{country.dial}</span>
					<ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
				</button>
				{menuOpen && (
					<div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
						<div className="p-2 border-b border-border sticky top-0 bg-card">
							<div className="relative">
								<Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
								<input
									autoFocus
									type="text"
									value={search}
									onChange={(e) => setSearch(e.target.value)}
									placeholder="Search country or code..."
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
											onCountryChange(c)
											setMenuOpen(false)
											setSearch('')
										}}
										className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex items-center gap-2.5 ${
											c.code === country.code ? 'bg-secondary text-primary' : 'text-foreground/80 hover:bg-muted'
										}`}
									>
										<c.Flag className="w-5 h-3.5 rounded-[2px] shadow-sm shrink-0" />
										<span className="flex-1 truncate">{c.name}</span>
										<span className="font-semibold text-muted-foreground">{c.dial}</span>
									</button>
								))
							)}
						</div>
					</div>
				)}
			</div>
			<input
				type="tel"
				value={value}
				onChange={(e) => onChange(e.target.value)}
				required={required}
				className="flex-1 min-w-0 px-4 py-3 bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none rounded-r-xl"
				placeholder={country.format}
			/>
		</div>
	)
}
