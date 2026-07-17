import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request)
	if ('error' in auth) return auth.error
	const { sub, email, name, role } = auth.admin
	return NextResponse.json({ admin: { id: sub, email, name, role } })
}
