import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'
import { syncProductRelations, type ProductPayload } from '@/lib/admin/product-sync'

const PRODUCT_SELECT = `
	*,
	categories ( id, name, slug ),
	product_images ( id, image_url, sort_order, is_primary, variant_color ),
	product_variants ( id, color, swatch_hex, storage, ram, model_name, condition, carrier_lock, image_url, stock_quantity, price_adjustment ),
	product_specifications ( id, spec_name, spec_value ),
	product_marketplaces ( marketplace )
`

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request, 'products:read')
	if ('error' in auth) return auth.error

	const service = createServiceClient()
	const wholesale = request.nextUrl.searchParams.get('wholesale')
	let query = service.from('products').select(PRODUCT_SELECT).order('created_at', { ascending: false })
	if (wholesale === 'true') query = query.eq('is_wholesale', true)
	if (wholesale === 'false') query = query.eq('is_wholesale', false)

	const { data, error } = await query
	if (error) return NextResponse.json({ error: error.message }, { status: 500 })
	return NextResponse.json({ products: data })
}

export async function POST(request: NextRequest) {
	const auth = await requireAdmin(request, 'products:write')
	if ('error' in auth) return auth.error

	const payload = (await request.json()) as ProductPayload
	if (!payload.name || payload.base_price == null) {
		return NextResponse.json({ error: 'Name and base price are required' }, { status: 400 })
	}

	const service = createServiceClient()
	const { data: product, error } = await service
		.from('products')
		.insert({
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
		.select('id')
		.single()
	if (error || !product) {
		return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })
	}

	const syncError = await syncProductRelations(service, product.id, payload)
	if (syncError) return NextResponse.json({ error: syncError }, { status: 500 })

	return NextResponse.json({ id: product.id })
}
