import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

const ROLES = ['super_admin', 'editor', 'support']

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request, 'admin-users:write')
	if ('error' in auth) return auth.error
	const service = createServiceClient()
	const { data, error } = await service
		.from('admin_users')
		.select('id, full_name, email, role, created_at')
		.order('created_at')
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ admins: data })
}

export async function POST(request: NextRequest) {
	const auth = await requireAdmin(request, 'admin-users:write')
	if ('error' in auth) return auth.error
	const body = await request.json()
	if (!body.full_name || !body.email || !body.password || !ROLES.includes(body.role)) {
		return NextResponse.json({ error: 'Name, email, password and a valid role are required' }, { status: 400 })
	}
	if (String(body.password).length < 8) {
		return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
	}
	const service = createServiceClient()
	const { data, error } = await service
		.from('admin_users')
		.insert({
			full_name: body.full_name,
			email: String(body.email).toLowerCase().trim(),
			password_hash: await bcrypt.hash(body.password, 10),
			role: body.role,
		})
		.select('id')
		.single()
	if (error) {
		const message = error.code === '23505' ? 'An admin with this email already exists' : error.message
		return NextResponse.json({ error: message }, { status: 500 })
	}
	return NextResponse.json({ id: data.id })
}
