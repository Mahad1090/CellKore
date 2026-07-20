import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'
import { syncProductRelations, type ProductPayload } from '@/lib/admin/product-sync'
import type { CarrierLockStatus, MarketplaceType, ProductCondition } from '@/lib/types'

interface BulkItem {
	model_name: string
	storage: string | null
	ram: string | null
	color: string | null
	swatch_hex: string | null
	quantity: number
	condition: ProductCondition
	carrier_lock: CarrierLockStatus
	image_url: string | null
}

interface BulkPayload {
	marketplaces: MarketplaceType[]
	category_id: string | null
	product_type_id: string | null
	name: string
	purchase_price: number | null
	base_price: number
	number_of_lots: number
	quantity_per_lot: number
	items: BulkItem[]
	images: { image_url: string; sort_order: number; is_primary: boolean }[]
}

function compact(value: string, length: number): string {
	return value.replace(/[^a-zA-Z0-9]/g, '').toUpperCase().slice(0, length)
}

function pad(value: number, length: number): string {
	return String(value).padStart(length, '0')
}

function dateStamp(): string {
	const now = new Date()
	return `${String(now.getFullYear()).slice(2)}${pad(now.getMonth() + 1, 2)}${pad(now.getDate(), 2)}`
}

function randomSuffix(): string {
	return Math.random().toString(36).slice(2, 6).toUpperCase()
}

function generateLotSku(name: string, lotIndex: number): string {
	return ['CK', `LOT-${compact(name, 10) || 'LOT'}`, dateStamp(), randomSuffix(), pad(lotIndex + 1, 2)].join('-')
}

export async function POST(request: NextRequest) {
	const auth = await requireAdmin(request, 'products:write')
	if ('error' in auth) return auth.error

	const payload = (await request.json()) as BulkPayload

	if (!payload.name?.trim()) {
		return NextResponse.json({ error: 'Lot title is required' }, { status: 400 })
	}
	if (payload.base_price == null || Number.isNaN(payload.base_price) || payload.base_price <= 0) {
		return NextResponse.json({ error: 'A valid base (selling) price is required' }, { status: 400 })
	}
	const numberOfLots = Math.floor(payload.number_of_lots)
	const quantityPerLot = Math.floor(payload.quantity_per_lot)
	if (!Number.isInteger(numberOfLots) || numberOfLots < 1) {
		return NextResponse.json({ error: 'Number of lots must be a positive integer' }, { status: 400 })
	}
	if (!Number.isInteger(quantityPerLot) || quantityPerLot < 1) {
		return NextResponse.json({ error: 'Quantity per lot must be a positive integer' }, { status: 400 })
	}
	if (!Array.isArray(payload.items) || payload.items.length === 0) {
		return NextResponse.json({ error: 'At least one item row is required' }, { status: 400 })
	}
	const itemsTotal = payload.items.reduce((sum, row) => sum + (Number(row.quantity) || 0), 0)
	if (itemsTotal !== quantityPerLot) {
		return NextResponse.json(
			{ error: `Item row quantities (${itemsTotal}) must sum to the quantity per lot (${quantityPerLot})` },
			{ status: 400 }
		)
	}
	if (payload.items.some((row) => !row.model_name?.trim() || !row.quantity || row.quantity <= 0)) {
		return NextResponse.json({ error: 'Every item row needs a phone name and a positive quantity' }, { status: 400 })
	}
	if (payload.items.some((row) => !row.image_url?.trim())) {
		return NextResponse.json({ error: 'Every item row needs a photo' }, { status: 400 })
	}

	const service = createServiceClient()

	const distinctColors = Array.from(
		new Set(payload.items.map((row) => row.color?.trim()).filter((c): c is string => !!c))
	)

	const createdIds: string[] = []
	for (let i = 0; i < numberOfLots; i++) {
		let sku = generateLotSku(payload.name, i)
		let product: { id: string } | null = null
		let insertError: string | null = null

		for (let attempt = 0; attempt < 2; attempt++) {
			const { data, error } = await service
				.from('products')
				.insert({
					name: payload.name.trim(),
					sku,
					category_id: payload.category_id || null,
					product_type_id: payload.product_type_id || null,
					condition: payload.items[0]?.condition ?? 'used',
					base_price: payload.base_price,
					purchase_price: payload.purchase_price ?? null,
					is_wholesale: true,
					is_active: true,
					lot_quantity: quantityPerLot,
				})
				.select('id')
				.single()

			if (!error && data) {
				product = data
				insertError = null
				break
			}
			insertError = error?.message ?? 'Insert failed'
			sku = generateLotSku(payload.name, i)
		}

		if (!product) {
			return NextResponse.json(
				{ error: `Failed to create lot ${i + 1}: ${insertError}`, createdIds },
				{ status: 500 }
			)
		}

		const relationsPayload: ProductPayload = {
			name: payload.name.trim(),
			base_price: payload.base_price,
			purchase_price: payload.purchase_price ?? null,
			is_wholesale: true,
			lot_quantity: quantityPerLot,
			variants: payload.items.map((row) => ({
				color: row.color || null,
				swatch_hex: row.swatch_hex || null,
				storage: row.storage || null,
				ram: row.ram || null,
				model_name: row.model_name.trim(),
				condition: row.condition,
				carrier_lock: row.carrier_lock,
				image_url: row.image_url || null,
				stock_quantity: Math.max(0, Math.floor(Number(row.quantity) || 0)),
				price_adjustment: 0,
			})),
			marketplaces: payload.marketplaces?.length ? payload.marketplaces : ['US'],
			images: payload.images.map((img) => ({ ...img, variant_color: null })),
			wholesale_colors: distinctColors,
		}

		const syncError = await syncProductRelations(service, product.id, relationsPayload)
		if (syncError) {
			return NextResponse.json(
				{ error: `Lot ${i + 1} created but failed to save details: ${syncError}`, createdIds },
				{ status: 500 }
			)
		}

		createdIds.push(product.id)
	}

	return NextResponse.json({ ids: createdIds })
}
