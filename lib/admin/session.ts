import { SignJWT, jwtVerify } from 'jose'
import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase-server'
import { normalizeAdminRole, roleHasPermission, type AdminPermission } from '@/lib/admin/rbac'
import type { AdminRole } from '@/lib/types'

export const ADMIN_COOKIE = 'cellkore_admin_token'
const SESSION_HOURS = 12

export interface AdminSessionPayload {
	sub: string // admin_users.id
	email: string
	name: string
	role: AdminRole
}

function jwtSecret(): Uint8Array {
	const secret = process.env.ADMIN_JWT_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY
	if (!secret) throw new Error('ADMIN_JWT_SECRET is not configured')
	return new TextEncoder().encode(secret)
}

export async function signAdminToken(payload: AdminSessionPayload): Promise<string> {
	return new SignJWT({ email: payload.email, name: payload.name, role: payload.role })
		.setProtectedHeader({ alg: 'HS256' })
		.setSubject(payload.sub)
		.setIssuedAt()
		.setExpirationTime(`${SESSION_HOURS}h`)
		.sign(jwtSecret())
}

export async function verifyAdminToken(token: string): Promise<AdminSessionPayload | null> {
	try {
		const { payload } = await jwtVerify(token, jwtSecret())
		if (!payload.sub || !payload.role) return null
		return {
			sub: payload.sub,
			email: String(payload.email ?? ''),
			name: String(payload.name ?? ''),
			role: normalizeAdminRole(String(payload.role)),
		}
	} catch {
		return null
	}
}

/**
 * Guard for /api/admin/* routes. Verifies the JWT cookie, re-checks the
 * admin still exists in admin_users (DB is the source of truth — a deleted
 * admin's token dies immediately), and enforces the RBAC permission.
 */
export async function requireAdmin(
	request: NextRequest,
	permission?: AdminPermission
): Promise<{ admin: AdminSessionPayload } | { error: NextResponse }> {
	const token = request.cookies.get(ADMIN_COOKIE)?.value
	if (!token) {
		return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
	}
	const session = await verifyAdminToken(token)
	if (!session) {
		return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
	}

	const service = createServiceClient()
	const { data: adminRow } = await service
		.from('admin_users')
		.select('id, role')
		.eq('id', session.sub)
		.maybeSingle()

	if (!adminRow) {
		return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) }
	}

	const role = normalizeAdminRole(adminRow.role as AdminRole)
	if (permission && !roleHasPermission(role, permission)) {
		return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) }
	}
	return { admin: { ...session, role } }
}
