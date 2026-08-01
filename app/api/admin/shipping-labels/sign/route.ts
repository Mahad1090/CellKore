import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { signShippingLabelUrl } from '@/lib/shipping/label-storage'
import type { AdminPermission } from '@/lib/admin/rbac'

const PERMISSION_BY_TYPE: Record<string, AdminPermission> = {
	order: 'orders:read',
	repair: 'repair-requests:read',
	'sell-return': 'sell-requests:read',
}

/**
 * Exchanges a stored (no-longer-public) shipping-label URL for a short-lived
 * signed URL and redirects to it. The shipping-labels bucket is private —
 * labels carry customer names/addresses — so every view goes through here
 * rather than a durable public link.
 */
export async function GET(request: NextRequest) {
	const type = request.nextUrl.searchParams.get('type') ?? ''
	const permission = PERMISSION_BY_TYPE[type]
	if (!permission) return NextResponse.json({ error: 'Invalid type' }, { status: 400 })

	const auth = await requireAdmin(request, permission)
	if ('error' in auth) return auth.error

	const stored = request.nextUrl.searchParams.get('url')
	if (!stored) return NextResponse.json({ error: 'url is required' }, { status: 400 })

	const signedUrl = await signShippingLabelUrl(stored)
	if (!signedUrl) return NextResponse.json({ error: 'Label not found' }, { status: 404 })

	return NextResponse.redirect(signedUrl)
}
