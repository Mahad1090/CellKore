import type { RepairCurrency } from '@/lib/types'

const CURRENCY_SYMBOLS: Record<RepairCurrency, string> = {
	USD: '$',
	CAD: 'CA$',
}

/** Formats an amount with its currency symbol, e.g. formatMoney(12.5, 'CAD') -> "CA$12.50". */
export function formatMoney(amount: number, currency: RepairCurrency = 'USD'): string {
	return `${CURRENCY_SYMBOLS[currency] ?? '$'}${amount.toFixed(2)}`
}
