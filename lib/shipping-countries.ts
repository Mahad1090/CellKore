import worldCountries from 'world-countries'
import * as flagComponents from 'country-flag-icons/react/3x2'
import type { ComponentType, SVGProps } from 'react'

export type ShippingCountry = {
	code: string
	name: string
	Flag: ComponentType<SVGProps<SVGSVGElement>>
}

const flags = flagComponents as unknown as Record<string, ComponentType<SVGProps<SVGSVGElement>>>

const PRIORITY = ['US', 'CA']

const allCountries: ShippingCountry[] = worldCountries
	.map((c) => {
		const Flag = flags[c.cca2]
		if (!Flag) return null
		return { code: c.cca2, name: c.name.common, Flag }
	})
	.filter((c): c is ShippingCountry => c !== null)
	.sort((a, b) => a.name.localeCompare(b.name))

const priorityList = PRIORITY.map((code) => allCountries.find((c) => c.code === code)!).filter(Boolean)
const restList = allCountries.filter((c) => !PRIORITY.includes(c.code))

export const SHIPPING_COUNTRIES: ShippingCountry[] = [...priorityList, ...restList]
