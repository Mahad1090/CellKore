import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

const VALID_STATUSES = ['pending', 'approved', 'rejected'] as const

type ReviewKind = 'product' | 'testimonial'

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireAdmin(request, 'reviews:write')
	if ('error' in auth) return auth.error

	const { id } = await params
	const body = await request.json()
	const kind = body.kind as ReviewKind | undefined
	if (kind !== 'product' && kind !== 'testimonial') {
		return NextResponse.json({ error: 'Invalid review type' }, { status: 400 })
	}

	const update: Record<string, unknown> = {}
	if (body.status !== undefined) {
		if (!VALID_STATUSES.includes(body.status)) {
			return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
		}
		update.status = body.status
	}
	if (body.is_featured !== undefined) update.is_featured = Boolean(body.is_featured)
	if (body.title !== undefined) update.title = body.title ? String(body.title).trim() : null
	if (body.comment !== undefined) update.comment = body.comment ? String(body.comment).trim() : null
	if (body.rating !== undefined) {
		const rating = Number(body.rating)
		if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
			return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
		}
		update.rating = rating
	}
	if (Object.keys(update).length === 0) {
		return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
	}

	const service = createServiceClient()
	const table = kind === 'product' ? 'product_reviews' : 'store_testimonials'
	const { error } = await service.from(table).update(update).eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireAdmin(request, 'reviews:write')
	if ('error' in auth) return auth.error

	const { id } = await params
	const body = await request.json().catch(() => ({}))
	const kind = body.kind as ReviewKind | undefined
	if (kind !== 'product' && kind !== 'testimonial') {
		return NextResponse.json({ error: 'Invalid review type' }, { status: 400 })
	}

	const service = createServiceClient()
	const table = kind === 'product' ? 'product_reviews' : 'store_testimonials'
	const { error } = await service.from(table).delete().eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}
