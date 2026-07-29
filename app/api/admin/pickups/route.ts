import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'
import { getShipFromAddress } from '@/lib/shipping/ship-from'
import { createUpsPickup, triggerUpsSmartPickup } from '@/lib/shipping/ups-pickup'
import { createCanadaPostPickup } from '@/lib/shipping/canada-post-pickup'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request, 'orders:read')
	if ('error' in auth) return auth.error

	const { searchParams } = new URL(request.url)
	const carrier = searchParams.get('carrier')
	const status = searchParams.get('status')
	const orderId = searchParams.get('order_id')

	const service = createServiceClient()
	let query = service.from('pickups').select('*, orders(reference)').order('pickup_date', { ascending: false })
	if (carrier) query = query.eq('carrier', carrier)
	if (status) query = query.eq('status', status)
	if (orderId) query = query.eq('order_id', orderId)

	const { data, error } = await query
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ pickups: data })
}

// Schedules a real carrier driver pickup at CellKore's ship-from address —
// covers the UPS standard (PickupCreationRequest) + Smart/GWN flows and the
// Canada Post On-demand flow. See lib/shipping/{ups,canada-post}-pickup.ts.
export async function POST(request: NextRequest) {
	const auth = await requireAdmin(request, 'orders:write')
	if ('error' in auth) return auth.error
	const body = await request.json().catch(() => ({}))

	const carrier = body.carrier as 'ups' | 'canada_post'
	if (carrier !== 'ups' && carrier !== 'canada_post') {
		return NextResponse.json({ error: 'carrier must be "ups" or "canada_post"' }, { status: 400 })
	}
	const pickupMethod: 'standard' | 'smart' = carrier === 'ups' && body.pickup_method === 'smart' ? 'smart' : 'standard'
	const isSmart = carrier === 'ups' && pickupMethod === 'smart'

	let pickupDate = String(body.pickup_date ?? '').trim()
	if (!isSmart && !pickupDate) {
		return NextResponse.json({ error: 'pickup_date is required' }, { status: 400 })
	}
	if (isSmart && !pickupDate) pickupDate = new Date().toISOString().slice(0, 10)

	const service = createServiceClient()

	let origin
	try {
		origin = await getShipFromAddress()
	} catch (err) {
		return NextResponse.json({ error: err instanceof Error ? err.message : 'Ship-from address is not configured' }, { status: 400 })
	}

	let orderReference: string | undefined
	if (body.order_id) {
		const { data: order } = await service.from('orders').select('reference').eq('id', body.order_id).maybeSingle()
		orderReference = order?.reference ?? undefined
	}

	const pieceCount = Number(body.piece_count ?? 1) || 1
	const totalWeightKg = body.total_weight_kg != null && body.total_weight_kg !== '' ? Number(body.total_weight_kg) : undefined
	const specialInstruction = body.special_instruction ? String(body.special_instruction) : undefined

	try {
		let carrierRequestId = ''
		let estimatedCost: number | undefined
		let currency: string | undefined
		let rawResponse: unknown

		if (carrier === 'ups') {
			if (isSmart) {
				const result = await triggerUpsSmartPickup(body.service_date_option === '02' ? '02' : '01')
				carrierRequestId = result.prn
				rawResponse = result.raw
				if (result.serviceDate && /^\d{8}$/.test(result.serviceDate)) {
					pickupDate = `${result.serviceDate.slice(0, 4)}-${result.serviceDate.slice(4, 6)}-${result.serviceDate.slice(6, 8)}`
				}
			} else {
				const result = await createUpsPickup({
					origin,
					pickupDate: pickupDate.replace(/-/g, ''),
					readyTime: String(body.ready_time ?? '09:00').replace(':', ''),
					closeTime: String(body.close_time ?? '17:00').replace(':', ''),
					contactName: body.contact_name || undefined,
					phone: body.phone || undefined,
					pieceCount,
					totalWeightKg,
					specialInstruction,
					referenceNumber: orderReference,
					paymentMethod: body.payment_method || undefined,
				})
				carrierRequestId = result.prn
				estimatedCost = result.cost
				currency = result.currency
				rawResponse = result.raw
			}
		} else {
			const email = String(body.contact_email ?? '').trim()
			if (!email) return NextResponse.json({ error: 'contact_email is required for Canada Post pickups' }, { status: 400 })
			const result = await createCanadaPostPickup({
				businessAddressFlag: Boolean(body.business_address_flag),
				origin,
				contactName: body.contact_name || undefined,
				phone: body.phone || undefined,
				telephoneExt: body.telephone_ext || undefined,
				email,
				receiveEmailUpdatesFlag: Boolean(body.receive_email_updates_flag),
				date: pickupDate,
				preferredTime: String(body.ready_time ?? '13:00'),
				closingTime: String(body.close_time ?? '15:00'),
				pickupInstructions: specialInstruction || 'Ready at front desk',
				pickupVolume: String(body.pickup_volume ?? body.piece_count ?? pieceCount),
				loadingDockFlag: Boolean(body.loading_dock_flag),
				fiveTonFlag: Boolean(body.five_ton_flag),
				priorityFlag: Boolean(body.priority_flag),
				returnsFlag: Boolean(body.returns_flag),
				heavyItemFlag: Boolean(body.heavy_item_flag),
				contractId: body.contract_id || undefined,
				methodOfPayment: body.method_of_payment || undefined,
			})
			carrierRequestId = result.requestId
			estimatedCost = result.price?.dueAmount ? Number(result.price.dueAmount) : undefined
			currency = 'CAD'
			rawResponse = result.raw
		}

		const { data: inserted, error } = await service
			.from('pickups')
			.insert({
				order_id: body.order_id || null,
				carrier,
				pickup_method: pickupMethod,
				carrier_request_id: carrierRequestId,
				pickup_date: pickupDate,
				ready_time: body.ready_time ?? null,
				close_time: body.close_time ?? null,
				piece_count: pieceCount,
				total_weight_kg: totalWeightKg ?? null,
				address_snapshot: origin,
				estimated_cost: estimatedCost ?? null,
				currency: currency ?? null,
				special_instruction: specialInstruction ?? null,
				raw_create_response: rawResponse ?? null,
				created_by: auth.admin.sub,
			})
			.select()
			.single()

		if (error) return NextResponse.json({ error: error.message }, { status: 500 })
		return NextResponse.json({ pickup: inserted })
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Pickup scheduling failed'
		await service
			.from('admin_logs')
			.insert({ level: 'error', source: carrier, message: `Pickup scheduling failed: ${message}` })
			.then(undefined, () => undefined)
		return NextResponse.json({ error: message }, { status: 502 })
	}
}
