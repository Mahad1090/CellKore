import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { authorizeSellRequestCustomer } from '@/lib/sell-request-auth'
import { getShippingRates } from '@/lib/shipping/aggregator'
import { computePackageForItems } from '@/lib/shipping/package'

interface ReturnAddressInput {
	line1: string
	line2?: string
	city: string
	stateProvince?: string
	postalCode?: string
	country: string
	phone?: string
}

/**
 * Live Canada Post + UPS rates for returning a rejected, already-received
 * device to the customer. Read-only — the rate is re-validated again at
 * checkout time, same trust model as the storefront's shipping-rates route.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	const body = await request.json()
	const address: ReturnAddressInput = body.address ?? {}
	if (!address.line1?.trim() || !address.city?.trim() || !address.country?.trim() || !address.phone?.trim()) {
		return NextResponse.json({ error: 'A complete shipping address and phone number are required' }, { status: 400 })
	}

	const service = createServiceClient()
	const { data: existing, error: fetchError } = await service
		.from('sell_phone_requests')
		.select('id, user_id, status, contact_email, contact_phone, device_brand, device_model')
		.eq('id', id)
		.maybeSingle()
	if (fetchError || !existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

	const authError = await authorizeSellRequestCustomer(request, body, existing)
	if (authError) return authError

	if (existing.status !== 'rejected') {
		return NextResponse.json({ error: 'This request does not have a return shipment to quote' }, { status: 400 })
	}

	const pkg = computePackageForItems([{ quantity: 1 }])
	const { rates, errors } = await getShippingRates(pkg, {
		name: 'Customer',
		phone: address.phone,
		line1: address.line1,
		line2: address.line2,
		city: address.city,
		stateProvince: address.stateProvince ?? '',
		postalCode: address.postalCode ?? '',
		country: address.country,
	})

	return NextResponse.json({ rates, errors })
}
