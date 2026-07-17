import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

const ROLES = ['super_admin', 'editor', 'support']

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireAdmin(request, 'admin-users:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const body = await request.json()

	const update: Record<string, unknown> = {}
	if (body.full_name) update.full_name = body.full_name
	if (body.email) update.email = String(body.email).toLowerCase().trim()
	if (body.role) {
		if (!ROLES.includes(body.role)) {
			return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
		}
		update.role = body.role
	}
	if (body.password) {
		if (String(body.password).length < 8) {
			return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
		}
		update.password_hash = await bcrypt.hash(body.password, 10)
	}

	const service = createServiceClient()
	const { error } = await service.from('admin_users').update(update).eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	const auth = await requireAdmin(request, 'admin-users:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	if (id === auth.admin.sub) {
		return NextResponse.json({ error: 'You cannot delete your own admin account' }, { status: 400 })
	}
	const service = createServiceClient()
	const { error } = await service.from('admin_users').delete().eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}
