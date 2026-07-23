import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
	const auth = await requireAdmin(request)
	if ('error' in auth) return auth.error

	try {
		const { currentPassword, newPassword } = await request.json()
		if (!currentPassword || !newPassword) {
			return NextResponse.json({ error: 'Current password and new password are required' }, { status: 400 })
		}

		if (newPassword.length < 6) {
			return NextResponse.json({ error: 'New password must be at least 6 characters long' }, { status: 400 })
		}

		const service = createServiceClient()
		const { data: adminUser, error: fetchErr } = await service
			.from('admin_users')
			.select('id, password_hash')
			.eq('id', auth.admin.sub)
			.single()

		if (fetchErr || !adminUser) {
			return NextResponse.json({ error: 'Admin user not found' }, { status: 404 })
		}

		const valid = await bcrypt.compare(currentPassword, adminUser.password_hash)
		if (!valid) {
			return NextResponse.json({ error: 'Incorrect current password' }, { status: 401 })
		}

		const newHash = await bcrypt.hash(newPassword, 10)
		const { error: updateErr } = await service
			.from('admin_users')
			.update({ password_hash: newHash })
			.eq('id', adminUser.id)

		if (updateErr) {
			return NextResponse.json({ error: updateErr.message }, { status: 500 })
		}

		return NextResponse.json({ success: true, message: 'Password updated successfully!' })
	} catch (err) {
		return NextResponse.json(
			{ error: err instanceof Error ? err.message : 'Failed to update password' },
			{ status: 500 }
		)
	}
}
