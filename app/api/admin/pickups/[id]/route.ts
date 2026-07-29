import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'
import { getShipFromAddress } from '@/lib/shipping/ship-from'
import { cancelUpsPickup } from '@/lib/shipping/ups-pickup'
import { cancelCanadaPostPickup, modifyCanadaPostPickup } from '@/lib/shipping/canada-post-pickup'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireAdmin(request, 'orders:read')
	if ('error' in auth) return auth.error
	const { id } = await params
	const service = createServiceClient()
	const { data, error } = await service.from('pickups').select('*, orders(reference)').eq('id', id).maybeSingle()
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	if (!data) return NextResponse.json({ error: 'Pickup not found' }, { status: 404 })
	return NextResponse.json({ pickup: data })
}

// Canada Post's Pickup API supports modifying contact/location/volume/time
// details on an existing request; UPS's Pickup API has no equivalent —
// cancel and recreate is the only option there.
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireAdmin(request, 'orders:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const body = await request.json().catch(() => ({}))

	const service = createServiceClient()
	const { data: pickup, error: fetchError } = await service.from('pickups').select('*').eq('id', id).maybeSingle()
	if (fetchError || !pickup) return NextResponse.json({ error: 'Pickup not found' }, { status: 404 })
	if (pickup.carrier !== 'canada_post') {
		return NextResponse.json({ error: 'UPS pickups cannot be modified — cancel and reschedule instead' }, { status: 400 })
	}
	if (!pickup.carrier_request_id) return NextResponse.json({ error: 'Pickup has no carrier request ID on file' }, { status: 400 })

	const email = String(body.contact_email ?? '').trim()
	if (!email) return NextResponse.json({ error: 'contact_email is required' }, { status: 400 })

	let origin
	try {
		origin = await getShipFromAddress()
	} catch (err) {
		return NextResponse.json({ error: err instanceof Error ? err.message : 'Ship-from address is not configured' }, { status: 400 })
	}

	const pickupDate = String(body.pickup_date ?? pickup.pickup_date)
	const readyTime = String(body.ready_time ?? pickup.ready_time ?? '13:00')
	const closeTime = String(body.close_time ?? pickup.close_time ?? '15:00')
	const specialInstruction = String(body.special_instruction ?? pickup.special_instruction ?? 'Ready at front desk')
	const pieceCount = body.piece_count != null ? Number(body.piece_count) : pickup.piece_count

	try {
		await modifyCanadaPostPickup(pickup.carrier_request_id, {
			origin,
			contactName: body.contact_name || undefined,
			phone: body.phone || undefined,
			telephoneExt: body.telephone_ext || undefined,
			email,
			receiveEmailUpdatesFlag: Boolean(body.receive_email_updates_flag),
			date: pickupDate,
			preferredTime: readyTime,
			closingTime: closeTime,
			pickupInstructions: specialInstruction,
			pickupVolume: String(pieceCount),
			loadingDockFlag: Boolean(body.loading_dock_flag),
			fiveTonFlag: Boolean(body.five_ton_flag),
			priorityFlag: Boolean(body.priority_flag),
			returnsFlag: Boolean(body.returns_flag),
			heavyItemFlag: Boolean(body.heavy_item_flag),
			contractId: body.contract_id || undefined,
			methodOfPayment: body.method_of_payment || undefined,
		})
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Pickup modification failed'
		return NextResponse.json({ error: message }, { status: 502 })
	}

	const { data: updated, error } = await service
		.from('pickups')
		.update({
			pickup_date: pickupDate,
			ready_time: readyTime,
			close_time: closeTime,
			piece_count: pieceCount,
			special_instruction: specialInstruction,
			updated_at: new Date().toISOString(),
		})
		.eq('id', id)
		.select()
		.single()
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ pickup: updated })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireAdmin(request, 'orders:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const service = createServiceClient()
	const { data: pickup, error: fetchError } = await service.from('pickups').select('*').eq('id', id).maybeSingle()
	if (fetchError || !pickup) return NextResponse.json({ error: 'Pickup not found' }, { status: 404 })
	if (pickup.status === 'cancelled') return NextResponse.json({ pickup })

	try {
		if (pickup.carrier_request_id) {
			if (pickup.carrier === 'ups') await cancelUpsPickup(pickup.carrier_request_id)
			else await cancelCanadaPostPickup(pickup.carrier_request_id)
		}
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Pickup cancellation failed'
		return NextResponse.json({ error: message }, { status: 502 })
	}

	const { data: updated, error } = await service
		.from('pickups')
		.update({ status: 'cancelled', cancelled_at: new Date().toISOString(), updated_at: new Date().toISOString() })
		.eq('id', id)
		.select()
		.single()
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ pickup: updated })
}
