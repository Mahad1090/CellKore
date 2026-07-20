export type TaxRegion = { code: string; name: string; rate: number }

/** Combined average sales-tax rates by US state. */
export const US_STATE_TAX: TaxRegion[] = [
	{ code: 'AL', name: 'Alabama', rate: 0.0924 },
	{ code: 'AK', name: 'Alaska', rate: 0.0176 },
	{ code: 'AZ', name: 'Arizona', rate: 0.0837 },
	{ code: 'AR', name: 'Arkansas', rate: 0.0947 },
	{ code: 'CA', name: 'California', rate: 0.0882 },
	{ code: 'CO', name: 'Colorado', rate: 0.0778 },
	{ code: 'CT', name: 'Connecticut', rate: 0.0635 },
	{ code: 'DE', name: 'Delaware', rate: 0 },
	{ code: 'FL', name: 'Florida', rate: 0.07 },
	{ code: 'GA', name: 'Georgia', rate: 0.0738 },
	{ code: 'HI', name: 'Hawaii', rate: 0.0444 },
	{ code: 'ID', name: 'Idaho', rate: 0.0602 },
	{ code: 'IL', name: 'Illinois', rate: 0.0882 },
	{ code: 'IN', name: 'Indiana', rate: 0.07 },
	{ code: 'IA', name: 'Iowa', rate: 0.0694 },
	{ code: 'KS', name: 'Kansas', rate: 0.0865 },
	{ code: 'KY', name: 'Kentucky', rate: 0.06 },
	{ code: 'LA', name: 'Louisiana', rate: 0.0956 },
	{ code: 'ME', name: 'Maine', rate: 0.055 },
	{ code: 'MD', name: 'Maryland', rate: 0.06 },
	{ code: 'MA', name: 'Massachusetts', rate: 0.0625 },
	{ code: 'MI', name: 'Michigan', rate: 0.06 },
	{ code: 'MN', name: 'Minnesota', rate: 0.0804 },
	{ code: 'MS', name: 'Mississippi', rate: 0.0706 },
	{ code: 'MO', name: 'Missouri', rate: 0.0839 },
	{ code: 'MT', name: 'Montana', rate: 0 },
	{ code: 'NE', name: 'Nebraska', rate: 0.0697 },
	{ code: 'NV', name: 'Nevada', rate: 0.0824 },
	{ code: 'NH', name: 'New Hampshire', rate: 0 },
	{ code: 'NJ', name: 'New Jersey', rate: 0.0661 },
	{ code: 'NM', name: 'New Mexico', rate: 0.0772 },
	{ code: 'NY', name: 'New York', rate: 0.0853 },
	{ code: 'NC', name: 'North Carolina', rate: 0.0699 },
	{ code: 'ND', name: 'North Dakota', rate: 0.0704 },
	{ code: 'OH', name: 'Ohio', rate: 0.0724 },
	{ code: 'OK', name: 'Oklahoma', rate: 0.0899 },
	{ code: 'OR', name: 'Oregon', rate: 0 },
	{ code: 'PA', name: 'Pennsylvania', rate: 0.0634 },
	{ code: 'RI', name: 'Rhode Island', rate: 0.07 },
	{ code: 'SC', name: 'South Carolina', rate: 0.0744 },
	{ code: 'SD', name: 'South Dakota', rate: 0.0641 },
	{ code: 'TN', name: 'Tennessee', rate: 0.0955 },
	{ code: 'TX', name: 'Texas', rate: 0.082 },
	{ code: 'UT', name: 'Utah', rate: 0.0727 },
	{ code: 'VT', name: 'Vermont', rate: 0.0636 },
	{ code: 'VA', name: 'Virginia', rate: 0.0575 },
	{ code: 'WA', name: 'Washington', rate: 0.0938 },
	{ code: 'WV', name: 'West Virginia', rate: 0.0657 },
	{ code: 'WI', name: 'Wisconsin', rate: 0.057 },
	{ code: 'WY', name: 'Wyoming', rate: 0.0544 },
	{ code: 'DC', name: 'District of Columbia', rate: 0.06 },
]

/** Combined GST/HST/PST rates by Canadian province. */
export const CA_PROVINCE_TAX: TaxRegion[] = [
	{ code: 'AB', name: 'Alberta', rate: 0.05 },
	{ code: 'BC', name: 'British Columbia', rate: 0.12 },
	{ code: 'MB', name: 'Manitoba', rate: 0.12 },
	{ code: 'NB', name: 'New Brunswick', rate: 0.15 },
	{ code: 'NL', name: 'Newfoundland and Labrador', rate: 0.15 },
	{ code: 'NS', name: 'Nova Scotia', rate: 0.14 },
	{ code: 'NT', name: 'Northwest Territories', rate: 0.05 },
	{ code: 'NU', name: 'Nunavut', rate: 0.05 },
	{ code: 'ON', name: 'Ontario', rate: 0.13 },
	{ code: 'PE', name: 'Prince Edward Island', rate: 0.15 },
	{ code: 'QC', name: 'Quebec', rate: 0.14975 },
	{ code: 'SK', name: 'Saskatchewan', rate: 0.11 },
	{ code: 'YT', name: 'Yukon', rate: 0.05 },
]

export interface TaxRateLookup {
	country_code: string
	tax_rate: number
	is_active: boolean
}

/** Looks up the admin-configured flat tax rate for a country (0 if unset/inactive). */
export function taxRateForCountry(rates: TaxRateLookup[], countryCode: string): number {
	const normalized = (countryCode || '').trim().toUpperCase()
	const match = rates.find((r) => r.is_active && r.country_code.toUpperCase() === normalized)
	return match?.tax_rate ?? 0
}

export function isValidPostalCode(country: string, value: string): boolean {
	const trimmed = value.trim()
	if (country === 'US') return /^\d{5}(-\d{4})?$/.test(trimmed)
	if (country === 'CA') return /^[A-Za-z]\d[A-Za-z][ -]?\d[A-Za-z]\d$/.test(trimmed)
	return trimmed.length >= 3
}

export function isValidPhone(value: string): boolean {
	const digits = value.replace(/\D/g, '')
	return digits.length >= 10 && digits.length <= 15
}
