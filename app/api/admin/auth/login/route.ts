import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { createServiceClient } from '@/lib/supabase-server'
import { signAdminToken, ADMIN_COOKIE } from '@/lib/admin/session'
import { normalizeAdminRole } from '@/lib/admin/rbac'

// Hash of a throwaway password, compared when the email doesn't exist so
// missing and wrong-password attempts take the same time.
const DUMMY_HASH = bcrypt.hashSync('cellkore-timing-pad', 10)

const MAX_ATTEMPTS = 5
const WINDOW_MS = 15 * 60 * 1000
const attempts = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(key: string): boolean {
	const now = Date.now()
	const entry = attempts.get(key)
	if (!entry || now > entry.resetAt) {
		attempts.set(key, { count: 1, resetAt: now + WINDOW_MS })
		return false
	}
	entry.count += 1
	return entry.count > MAX_ATTEMPTS
}

export async function POST(request: NextRequest) {
	const { email, password } = await request.json().catch(() => ({}))
	if (!email || !password) {
		return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
	}

	const ip =
		request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
		request.headers.get('x-real-ip') ||
		'unknown'
	if (isRateLimited(ip)) {
		return NextResponse.json(
			{ error: 'Too many login attempts. Try again in 15 minutes.' },
			{ status: 429 }
		)
	}

	const service = createServiceClient()
	const { data: admin } = await service
		.from('admin_users')
		.select('id, full_name, email, password_hash, role')
		.eq('email', String(email).toLowerCase().trim())
		.maybeSingle()

	const valid = await bcrypt.compare(password, admin?.password_hash ?? DUMMY_HASH)
	if (!admin || !valid) {
		return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
	}
	attempts.delete(ip)

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
