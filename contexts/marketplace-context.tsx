'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { useToast } from '@/components/ui/toast'

export type Marketplace = 'US' | 'CA' | 'BOTH'

const COOKIE_NAME = 'cellkore_marketplace'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365

interface MarketplaceContextType {
	marketplace: Marketplace
	setMarketplace: (m: Marketplace) => void
	detectedCountry: 'US' | 'CA' | 'INT' | null
	isInternational: boolean
	loading: boolean
}

const MarketplaceContext = createContext<MarketplaceContextType | undefined>(undefined)

function readCookie(name: string): string | null {
	if (typeof document === 'undefined') return null
	const match = document.cookie
		.split('; ')
		.find((row) => row.startsWith(`${name}=`))
	return match ? decodeURIComponent(match.split('=')[1]) : null
}

function writeCookie(name: string, value: string) {
	document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax`
}

export function MarketplaceProvider({ children }: { children: React.ReactNode }) {
	const { toast } = useToast()
	const [marketplace, setMarketplaceState] = useState<Marketplace>('US')
	const [detectedCountry, setDetectedCountry] = useState<'US' | 'CA' | 'INT' | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		// A manually selected marketplace persists in a cookie and bypasses geolocation.
		const saved = readCookie(COOKIE_NAME)
		if (saved === 'US' || saved === 'CA' || saved === 'BOTH') {
			setMarketplaceState(saved)
			setLoading(false)
			return
		}

		const controller = new AbortController()
		const timer = setTimeout(() => controller.abort(), 6000)

		fetch('/api/geolocation', { signal: controller.signal })
			.then((res) => res.json())
			.then((data: { countryCode: 'US' | 'CA' | 'INT' }) => {
				setDetectedCountry(data.countryCode)
				if (data.countryCode === 'CA') {
					setMarketplaceState('CA')
				} else if (data.countryCode === 'INT') {
					setMarketplaceState('BOTH')
				} else {
					setMarketplaceState('US')
				}
			})
			.catch(() => {
				// Geolocation failed or timed out — default to the US catalog and inform the user.
				setDetectedCountry(null)
				setMarketplaceState('US')
				toast({
					title: 'Showing the US catalog',
					description:
						'We could not detect your region, so you are viewing the US marketplace. You can change it anytime from the selector in the header.',
					variant: 'info',
				})
			})
			.finally(() => {
				clearTimeout(timer)
				setLoading(false)
			})

		return () => {
			clearTimeout(timer)
			controller.abort()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const setMarketplace = (m: Marketplace) => {
		setMarketplaceState(m)
		writeCookie(COOKIE_NAME, m)
	}

	return (
		<MarketplaceContext.Provider
			value={{
				marketplace,
				setMarketplace,
				detectedCountry,
				isInternational: detectedCountry === 'INT',
				loading,
			}}
		>
			{children}
		</MarketplaceContext.Provider>
	)
}

export function useMarketplace() {
	const context = useContext(MarketplaceContext)
	if (context === undefined) {
		throw new Error('useMarketplace must be used within a MarketplaceProvider')
	}
	return context
}
