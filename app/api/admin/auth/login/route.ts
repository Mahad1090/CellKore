import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServiceClient } from '@/lib/supabase-server'
import { signAdminToken, ADMIN_COOKIE } from '@/lib/admin/session'
import { normalizeAdminRole } from '@/lib/admin/rbac'

export async function POST(request: NextRequest) {
	const { email, password } = await request.json().catch(() => ({}))
	if (!email || !password) {
		return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
	}

	const service = createServiceClient()
	const { data: admin } = await service
		.from('admin_users')
		.select('id, full_name, email, password_hash, role')
		.eq('email', String(email).toLowerCase().trim())
		.maybeSingle()

	const valid = admin ? await bcrypt.compare(password, admin.password_hash) : false
	if (!admin || !valid) {
		return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
	}

	const token = await signAdminToken({
		sub: admin.id,
		email: admin.email,
		name: admin.full_name,
		role: normalizeAdminRole(admin.role),
	})
	const role = normalizeAdminRole(admin.role)

	const response = NextResponse.json({
		admin: { id: admin.id, email: admin.email, name: admin.full_name, role },
	})
	response.cookies.set(ADMIN_COOKIE, token, {
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		path: '/',
		maxAge: 60 * 60 * 12,
	})
	return response
}
