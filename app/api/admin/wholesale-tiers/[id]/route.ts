import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

type Params = { params: Promise<{ id: string }> }

export async function DELETE(request: NextRequest, { params }: Params) {
	const auth = await requireAdmin(request, 'wholesale:write')
	if ('error' in auth) return auth.error
	const { id } = await params
	const service = createServiceClient()
	const { error } = await service.from('wholesale_price_tiers').delete().eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}
