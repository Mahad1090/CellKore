import { supabase } from '@/lib/supabase'
import type { Marketplace } from '@/contexts/marketplace-context'
import type {
	Category,
	CmsPage,
	CountryContactInfo,
	Product,
	SocialLink,
	WholesalePriceTier,
} from '@/lib/types'

// Explicit column list (not "*") so purchase_price — admin-only cost data — never
// reaches this public/anon-key query used by the storefront.
const PRODUCT_SELECT = `
	id, category_id, sku, name, brand, condition, base_price, description,
	is_wholesale, lot_quantity, is_active, mobile_specifications, template_specifications,
	created_at, updated_at,
	categories ( id, name, slug, image_url, is_active, sort_order, created_at ),
	product_images ( id, product_id, image_url, sort_order, is_primary, variant_color ),
	product_variants ( id, product_id, color, swatch_hex, storage, ram, stock_quantity, price_adjustment ),
	product_specifications ( id, product_id, spec_name, spec_value ),
	product_marketplaces ( marketplace )
`

export async function fetchActiveCategories(): Promise<Category[]> {
	const { data, error } = await supabase
		.from('categories')
		.select('*')
		.eq('is_active', true)
		.order('sort_order', { ascending: true })
	if (error) throw error
	return data ?? []
}

interface CatalogFilters {
	marketplace?: Marketplace
	categorySlug?: string
	search?: string
	limit?: number
}

export async function fetchCatalogProducts(filters: CatalogFilters = {}): Promise<Product[]> {
	let query = supabase
		.from('products')
		.select(PRODUCT_SELECT)
		.eq('is_active', true)
		.eq('is_wholesale', false)
		.order('created_at', { ascending: false })

	if (filters.search) {
		query = query.or(`name.ilike.%${filters.search}%,brand.ilike.%${filters.search}%,description.ilike.%${filters.search}%`)
	}
	if (filters.limit) query = query.limit(filters.limit)

	const { data, error } = await query
	if (error) throw error

	let products = (data ?? []) as unknown as Product[]

	if (filters.marketplace && filters.marketplace !== 'BOTH') {
		products = products.filter((p) =>
			(p.product_marketplaces ?? []).some((m) => m.marketplace === filters.marketplace)
		)
	}
	if (filters.categorySlug) {
		products = products.filter((p) => p.categories?.slug === filters.categorySlug)
	}
	return products
}

export async function fetchProductById(id: string): Promise<Product | null> {
	const { data, error } = await supabase
		.from('products')
		.select(PRODUCT_SELECT)
		.eq('id', id)
		.maybeSingle()
	if (error) throw error
	return (data as unknown as Product) ?? null
}

export async function fetchWholesaleLots(marketplace?: Marketplace): Promise<Product[]> {
	const { data, error } = await supabase
		.from('products')
		.select(PRODUCT_SELECT)
		.eq('is_active', true)
		.eq('is_wholesale', true)
		.order('created_at', { ascending: false })
	if (error) throw error
	let lots = (data ?? []) as unknown as Product[]
	if (marketplace && marketplace !== 'BOTH') {
		lots = lots.filter((p) =>
			(p.product_marketplaces ?? []).some((m) => m.marketplace === marketplace)
		)
	}
	return lots
}

export async function fetchWholesaleTiers(productId: string): Promise<WholesalePriceTier[]> {
	const { data, error } = await supabase
		.from('wholesale_price_tiers')
		.select('*')
		.eq('product_id', productId)
		.order('min_quantity', { ascending: true })
	if (error) throw error
	return data ?? []
}

export async function fetchWholesaleColors(productId: string): Promise<string[]> {
	const { data, error } = await supabase
		.from('wholesale_variant_colors')
		.select('color')
		.eq('product_id', productId)
	if (error) throw error
	return (data ?? []).map((r) => r.color)
}

export async function fetchCmsPage(slug: string): Promise<CmsPage | null> {
	const { data, error } = await supabase
		.from('cms_pages')
		.select('*')
		.eq('slug', slug)
		.maybeSingle()
	if (error) throw error
	return data
}

export async function fetchCountryContacts(): Promise<CountryContactInfo[]> {
	const { data, error } = await supabase
		.from('country_contact_info')
		.select('*')
		.order('country', { ascending: true })
	if (error) throw error
	return data ?? []
}

export async function fetchSocialLinks(): Promise<SocialLink[]> {
	const { data, error } = await supabase
		.from('social_links')
		.select('*')
		.eq('is_active', true)
	if (error) throw error
	return data ?? []
}

export async function subscribeToNewsletter(email: string): Promise<{ alreadySubscribed: boolean }> {
	const { error } = await supabase.from('newsletter_subscribers').insert({ email })
	if (error) {
		if (error.code === '23505') return { alreadySubscribed: true }
		throw error
	}
	return { alreadySubscribed: false }
}
