import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { StockError } from '@/lib/checkout-server'
import { getCanadaPostShippingRates } from '@/lib/shipping/aggregator'
import { resolveRateRequest, type RateRequestBody } from '@/lib/shipping/rate-request'

/**
 * Canada Post-only rate quote for the checkout page's progressive
 * shipping-method list — called alongside (not before) the UPS route, so
 * Canada Post's variable latency never delays UPS rates from showing up.
 */
export async function POST(request: NextRequest) {
	try {
		const body: RateRequestBody = await request.json()
		const service = createServiceClient()
		const resolved = await resolveRateRequest(service, body)
		if ('error' in resolved) return NextResponse.json({ error: resolved.error }, { status: resolved.status })

		const { rates, error } = await getCanadaPostShippingRates(resolved.pkg, resolved.destination)
		return NextResponse.json({ rates, error })
	} catch (err) {
		if (err instanceof StockError) {
			return NextResponse.json({ error: err.message, variantId: err.variantId }, { status: 400 })
		}
		return NextResponse.json({ error: err instanceof Error ? err.message : 'Unable to fetch Canada Post rates' }, { status: 500 })
	}
}
