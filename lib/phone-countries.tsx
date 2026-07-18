import worldCountries from 'world-countries'
import * as flagComponents from 'country-flag-icons/react/3x2'
import type { ComponentType, SVGProps } from 'react'

export type PhoneCountry = {
	code: string
	name: string
	dial: string
	format: string
	Flag: ComponentType<SVGProps<SVGSVGElement>>
}

const FORMAT_OVERRIDES: Record<string, string> = {
	US: '(555) 123-4567',
	CA: '(555) 123-4567',
	GB: '7400 123456',
}

const flags = flagComponents as unknown as Record<string, ComponentType<SVGProps<SVGSVGElement>>>

function dialCode(idd: { root?: string; suffixes?: string[] }): string | null {
	if (!idd.root) return null
	if (idd.suffixes && idd.suffixes.length === 1) return idd.root + idd.suffixes[0]
	return idd.root
}

const PRIORITY = ['US', 'CA', 'GB']

const allCountries: PhoneCountry[] = worldCountries
	.map((c) => {
		const dial = dialCode(c.idd)
		const Flag = flags[c.cca2]
		if (!dial || !Flag) return null
		return {
			code: c.cca2,
			name: c.name.common,
			dial,
			format: FORMAT_OVERRIDES[c.cca2] ?? 'Phone number',
			Flag,
		}
	})
	.filter((c): c is PhoneCountry => c !== null)
	.sort((a, b) => a.name.localeCompare(b.name))

const priorityList = PRIORITY.map((code) => allCountries.find((c) => c.code === code)!).filter(Boolean)
const restList = allCountries.filter((c) => !PRIORITY.includes(c.code))

export const PHONE_COUNTRIES: PhoneCountry[] = [...priorityList, ...restList]
