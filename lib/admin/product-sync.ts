import { SupabaseClient } from '@supabase/supabase-js'
import type { CarrierLockStatus, MarketplaceType, ProductCondition, TemplateSpecifications } from '@/lib/types'
import type { MobileSpecifications } from '@/lib/mobile-specs'

export interface ProductPayload {
	name: string
	sku?: string | null
	brand?: string | null
	category_id?: string | null
	product_type_id?: string | null
	spec_template_id?: string | null
	condition?: ProductCondition
	base_price: number
	purchase_price?: number | null
	discount_percent?: number
	is_on_sale?: boolean
	description?: string | null
	is_wholesale?: boolean
	lot_quantity?: number | null
	is_active?: boolean
	mobile_specifications?: MobileSpecifications
	template_specifications?: TemplateSpecifications
	variants?: {
		id?: string
		color: string | null
		swatch_hex: string | null
		storage: string | null
		ram: string | null
		model_name?: string | null
		condition?: ProductCondition | null
		carrier_lock?: CarrierLockStatus | null
		image_url?: string | null
		stock_quantity: number
		price_adjustment: number
	}[]
	marketplaces?: MarketplaceType[]
	images?: { image_url: string; sort_order: number; is_primary: boolean; variant_color: string | null }[]
	wholesale_colors?: string[]
}

/**
 * Sync a product's child tables from the admin form payload.
 * Specs / marketplaces / images are replace-all; variants are upserted by id
 * so rows referenced from carts keep their identity, and removed rows are deleted.
 */
export async function syncProductRelations(
	service: SupabaseClient,
	productId: string,
	payload: ProductPayload
): Promise<string | null> {
	try {
		if (payload.variants) {
			const keepIds: string[] = []
			for (const variant of payload.variants) {
				if (variant.id) {
					keepIds.push(variant.id)
					const { error } = await service
						.from('product_variants')
						.update({
							color: variant.color,
							swatch_hex: variant.swatch_hex,
							storage: variant.storage,
							ram: variant.ram,
							model_name: variant.model_name ?? null,
							condition: variant.condition ?? null,
							carrier_lock: variant.carrier_lock ?? null,
							image_url: variant.image_url ?? null,
							stock_quantity: variant.stock_quantity,
							price_adjustment: variant.price_adjustment,
						})
						.eq('id', variant.id)
						.eq('product_id', productId)
					if (error) throw error
				} else {
					const { data, error } = await service
						.from('product_variants')
						.insert({
							product_id: productId,
							color: variant.color,
							swatch_hex: variant.swatch_hex,
							storage: variant.storage,
							ram: variant.ram,
							model_name: variant.model_name ?? null,
							condition: variant.condition ?? null,
							carrier_lock: variant.carrier_lock ?? null,
							image_url: variant.image_url ?? null,
							stock_quantity: variant.stock_quantity,
							price_adjustment: variant.price_adjustment,
						})
						.select('id')
						.single()
					if (error) throw error
					keepIds.push(data.id)
				}
			}
			let del = service.from('product_variants').delete().eq('product_id', productId)
			if (keepIds.length > 0) del = del.not('id', 'in', `(${keepIds.join(',')})`)
			const { error } = await del
			if (error) throw error
		}

		if (payload.marketplaces) {
			await service.from('product_marketplaces').delete().eq('product_id', productId)
			if (payload.marketplaces.length > 0) {
				const { error } = await service
					.from('product_marketplaces')
					.insert(payload.marketplaces.map((m) => ({ product_id: productId, marketplace: m })))
				if (error) throw error
			}
		}

		if (payload.images) {
			await service.from('product_images').delete().eq('product_id', productId)
			const images = payload.images.filter((i) => i.image_url.trim())
			if (images.length > 0) {
				const hasPrimary = images.some((i) => i.is_primary)
				const { error } = await service.from('product_images').insert(
					images.map((img, index) => ({
						product_id: productId,
						image_url: img.image_url,
						sort_order: img.sort_order ?? index,
						is_primary: hasPrimary ? img.is_primary : index === 0,
						variant_color: img.variant_color || null,
					}))
				)
				if (error) throw error
			}
		}

		if (payload.wholesale_colors) {
			await service.from('wholesale_variant_colors').delete().eq('product_id', productId)
			const colors = payload.wholesale_colors.filter((c) => c.trim())
			if (colors.length > 0) {
				const { error } = await service
					.from('wholesale_variant_colors')
					.insert(colors.map((color) => ({ product_id: productId, color })))
				if (error) throw error
			}
		}

		return null
	} catch (err) {
		return err instanceof Error ? err.message : 'Failed to sync product relations'
	}
}