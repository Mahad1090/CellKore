import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { applyPromotion } from '@/lib/checkout-server'

export async function POST(request: NextRequest) {
	try {
		const { subtotal, country, userEmail, promoCode } = await request.json()
		if (typeof subtotal !== 'number' || subtotal < 0) {
			return NextResponse.json({ valid: false, message: 'Invalid subtotal' }, { status: 400 })
		}
		const service = createServiceClient()
		const result = await applyPromotion(service, promoCode, subtotal, country, userEmail)
		if (!result.valid) {
			return NextResponse.json({ valid: false, message: result.message ?? 'Code invalid or expired' })
		}
		return NextResponse.json({
			valid: true,
			discountAmount: result.discountAmount,
			updatedTotal: Math.round((subtotal - result.discountAmount) * 100) / 100,
		})
	} catch {
		return NextResponse.json({ valid: false, message: 'Code invalid or expired' }, { status: 500 })
	}
}
