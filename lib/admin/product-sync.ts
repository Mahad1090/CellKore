import { SupabaseClient } from '@supabase/supabase-js'
import type { MarketplaceType, ProductCondition } from '@/lib/types'

export interface ProductPayload {
	name: string
	sku?: string | null
	brand?: string | null
	category_id?: string | null
	condition?: ProductCondition
	base_price: number
	location?: string | null
	description?: string | null
	is_wholesale?: boolean
	lot_quantity?: number | null
	is_active?: boolean
	specifications?: { spec_name: string; spec_value: string }[]
	variants?: { id?: string; color: string | null; stock_quantity: number; price_adjustment: number }[]
	marketplaces?: MarketplaceType[]
	images?: { image_url: string; sort_order: number; is_primary: boolean }[]
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
		if (payload.specifications) {
			await service.from('product_specifications').delete().eq('product_id', productId)
			const specs = payload.specifications.filter((s) => s.spec_name.trim() && s.spec_value.trim())
			if (specs.length > 0) {
				const { error } = await service
					.from('product_specifications')
					.insert(specs.map((s) => ({ ...s, product_id: productId })))
				if (error) throw error
			}
		}

		if (payload.variants) {
			const keepIds: string[] = []
			for (const variant of payload.variants) {
				if (variant.id) {
					keepIds.push(variant.id)
					const { error } = await service
						.from('product_variants')
						.update({
							color: variant.color,
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
