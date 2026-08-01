import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { authorizeSellRequestCustomer } from '@/lib/sell-request-auth'
import { signShippingLabelUrl } from '@/lib/shipping/label-storage'

/**
 * Exchanges the request's stored return-label URL for a short-lived signed
 * URL, for the customer-facing return-shipment view. Same dual-auth model
 * (account JWT or guest contact match) as the sibling rates route — the
 * shipping-labels bucket is private, so this is the only way a customer can
 * reach their own label.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const { id } = await params
	const body = await request.json().catch(() => ({}))

	const service = createServiceClient()
	const { data: existing, error: fetchError } = await service
		.from('sell_phone_requests')
		.select('id, user_id, contact_email, contact_phone, sell_phone_return_shipments(label_url)')
		.eq('id', id)
		.maybeSingle()
	if (fetchError || !existing) return NextResponse.json({ error: 'Request not found' }, { status: 404 })

	const authError = await authorizeSellRequestCustomer(request, body, existing)
	if (authError) return authError

	const shipment = existing.sell_phone_return_shipments as unknown as { label_url: string | null } | null
	if (!shipment?.label_url) return NextResponse.json({ error: 'No label available yet' }, { status: 404 })

	const signedUrl = await signShippingLabelUrl(shipment.label_url)
	if (!signedUrl) return NextResponse.json({ error: 'Label not found' }, { status: 404 })

	return NextResponse.json({ signedUrl })
}
