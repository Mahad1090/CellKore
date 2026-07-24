import Stripe from 'stripe'
import { stripeSecretKey } from './payments-env'

// General - Tangible Goods, per Stripe's Tax Code Registry
// (https://docs.stripe.com/tax/tax-codes) — correct for phones/electronics.
const GENERAL_TANGIBLE_GOODS_TAX_CODE = 'txcd_99999999'

export interface TaxLineItem {
	reference: string
	amount: number
	quantity: number
}

export interface TaxAddress {
	line1: string
	line2?: string
	city: string
	stateProvince?: string
	postalCode?: string
	country: string
}

// Stripe's own breakdown amounts are in cents (its smallest-currency-unit
// convention); this re-shapes it to dollars so every consumer that stores
// or displays it — the orders table, the admin analytics page — deals in
// one consistent unit, matching tax_amount/subtotal_amount/etc.
export interface TaxBreakdownLine {
	amount: number
	taxableAmount: number
	inclusive: boolean
	taxType: string
	percentageDecimal: string
	state: string | null
	country: string | null
}

export interface OrderTaxResult {
	taxAmount: number
	calculationId: string
	breakdown: TaxBreakdownLine[]
}

function stripeClient(): Stripe {
	const key = stripeSecretKey()
	if (!key) throw new Error('Stripe is not configured')
	return new Stripe(key)
}

/**
 * Computes tax via Stripe Tax for an order, regardless of which payment
 * processor ultimately captures the payment — PayPal payments never touch
 * Stripe, so this is the one shared tax engine for both checkout paths.
 * `discountAmount` is distributed proportionally across line items so the
 * taxable base matches the post-discount subtotal (the same semantics the
 * old flat-rate `computeTax` used).
 *
 * Errors are allowed to propagate: a Tax API failure means something's
 * misconfigured (Stripe Tax not enabled, no registrations, etc.) and
 * checkout should surface that rather than silently charging no tax.
 */
export async function calculateOrderTax(params: {
	items: TaxLineItem[]
	shippingAddress: TaxAddress
	shippingCost: number
	discountAmount: number
	currency: 'usd' | 'cad'
}): Promise<OrderTaxResult> {
	const stripe = stripeClient()

	const subtotal = params.items.reduce((sum, i) => sum + i.amount, 0)
	const discountRatio = subtotal > 0 ? Math.min(1, params.discountAmount / subtotal) : 0

	const lineItems: Stripe.Tax.CalculationCreateParams.LineItem[] = params.items.map((item) => ({
		amount: Math.round(item.amount * (1 - discountRatio) * 100),
		quantity: item.quantity,
		reference: item.reference,
		tax_code: GENERAL_TANGIBLE_GOODS_TAX_CODE,
	}))

	const calculation = await stripe.tax.calculations.create({
		currency: params.currency,
		line_items: lineItems,
		// tax_code intentionally omitted — falls back to the default shipping
		// tax code configured in the account's Stripe Tax Settings.
		shipping_cost: params.shippingCost > 0 ? { amount: Math.round(params.shippingCost * 100) } : undefined,
		customer_details: {
			address_source: 'shipping',
			address: {
				country: params.shippingAddress.country,
				state: params.shippingAddress.stateProvince,
				city: params.shippingAddress.city,
				postal_code: params.shippingAddress.postalCode,
				line1: params.shippingAddress.line1,
				line2: params.shippingAddress.line2,
			},
		},
	})

	if (!calculation.id) throw new Error('Stripe Tax calculation did not return an id')

	return {
		taxAmount: calculation.tax_amount_exclusive / 100,
		calculationId: calculation.id,
		breakdown: calculation.tax_breakdown.map((line) => ({
			amount: line.amount / 100,
			taxableAmount: line.taxable_amount / 100,
			inclusive: line.inclusive,
			taxType: line.tax_rate_details.tax_type ?? 'unknown',
			percentageDecimal: line.tax_rate_details.percentage_decimal,
			state: line.tax_rate_details.state,
			country: line.tax_rate_details.country,
		})),
	}
}

/**
 * Records a Tax Transaction from a prior calculation, for Stripe's own tax
 * filing/reporting — only call this once payment has actually succeeded.
 * Best-effort by design: callers must catch failures here rather than let
 * them block a paid order from being written.
 */
export async function recordTaxTransaction(calculationId: string, reference: string): Promise<string> {
	const stripe = stripeClient()
	const transaction = await stripe.tax.transactions.createFromCalculation({
		calculation: calculationId,
		reference,
	})
	return transaction.id
}
