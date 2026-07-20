import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'
import { syncProductRelations, type ProductPayload } from '@/lib/admin/product-sync'

type Params = { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, { params }: Params) {
	const auth = await requireAdmin(request, 'products:read')
	if ('error' in auth) return auth.error
	const { id } = await params

	const service = createServiceClient()
	const { data, error } = await service
		.from('products')
		.select(`
			*,
			product_images ( id, image_url, sort_order, is_primary, variant_color ),
			product_variants ( id, color, swatch_hex, storage, ram, model_name, condition, carrier_lock, image_url, stock_quantity, price_adjustment ),
			product_specifications ( id, spec_name, spec_value ),
			product_marketplaces ( marketplace ),
			wholesale_variant_colors ( id, color ),
			wholesale_price_tiers ( id, min_quantity, max_quantity, price_per_unit )
		`)
		.eq('id', id)
		.maybeSingle()
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
	return NextResponse.json({ product: data })
}

export async function PUT(request: NextRequest, { params }: Params) {
	const auth = await requireAdmin(request, 'products:write')
	if ('error' in auth) return auth.error
	const { id } = await params

	const payload = (await request.json()) as ProductPayload
	const service = createServiceClient()

	const { error } = await service
		.from('products')
		.update({
			name: payload.name,
			sku: payload.sku || null,
			brand: payload.brand || null,
			category_id: payload.category_id || null,
			product_type_id: payload.product_type_id || null,
			spec_template_id: payload.spec_template_id || null,
			condition: payload.condition ?? 'new',
			base_price: payload.base_price,
			purchase_price: payload.purchase_price ?? null,
			description: payload.description || null,
			is_wholesale: payload.is_wholesale ?? false,
			is_active: payload.is_active ?? true,
			lot_quantity: payload.lot_quantity ?? null,
			mobile_specifications: payload.mobile_specifications ?? {},
			template_specifications: payload.template_specifications ?? {},
		})
		.eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })

	const syncError = await syncProductRelations(service, id, payload)
	if (syncError) return NextResponse.json({ error: syncError }, { status: 500 })
	return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest, { params }: Params) {
	const auth = await requireAdmin(request, 'products:write')
	if ('error' in auth) return auth.error
	const { id } = await params

	const service = createServiceClient()
	const { error } = await service.from('products').delete().eq('id', id)
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ success: true })
}
