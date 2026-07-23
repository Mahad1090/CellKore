import { supabase } from '@/lib/supabase'
import type { Marketplace } from '@/contexts/marketplace-context'
import type {
	Announcement,
	Category,
	CmsPage,
	CountryContactInfo,
	Product,
	ProductReview,
	RepairSettings,
	SocialLink,
	TaxRate,
	StoreTestimonial,
	WholesalePriceTier,
} from '@/lib/types'

// Explicit column list (not "*") so purchase_price — admin-only cost data — never
// reaches this public/anon-key query used by the storefront.
const PRODUCT_SELECT = `
	id, category_id, sku, name, brand, condition, base_price, discount_percent, is_on_sale, description,
	is_wholesale, lot_quantity, is_active, mobile_specifications, template_specifications,
	created_at, updated_at,
	categories ( id, name, slug, image_url, is_active, sort_order, created_at ),
	product_images ( id, product_id, image_url, sort_order, is_primary, variant_color ),
	product_variants ( id, product_id, color, swatch_hex, storage, ram, model_name, condition, carrier_lock, image_url, stock_quantity, price_adjustment ),
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

export async function fetchActiveAnnouncements(): Promise<Announcement[]> {
	const { data, error } = await supabase
		.from('announcements')
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

export async function fetchProductReviews(productId: string): Promise<ProductReview[]> {
	const { data, error } = await supabase
		.from('product_reviews')
		.select('*')
		.eq('product_id', productId)
		.eq('status', 'approved')
		.order('created_at', { ascending: false })
	if (error) throw error
	return (data ?? []) as ProductReview[]
}

export async function fetchMyProductReview(productId: string, userId: string): Promise<ProductReview | null> {
	const { data, error } = await supabase
		.from('product_reviews')
		.select('*')
		.eq('product_id', productId)
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle()
	if (error) throw error
	return (data as ProductReview) ?? null
}

export async function fetchFeaturedTestimonials(): Promise<StoreTestimonial[]> {
	const { data, error } = await supabase
		.from('store_testimonials')
		.select('*')
		.eq('status', 'approved')
		.order('is_featured', { ascending: false })
		.order('created_at', { ascending: false })
		.limit(12)

	if (error) throw error
	return (data ?? []) as StoreTestimonial[]
}

export async function fetchApprovedTestimonials(): Promise<StoreTestimonial[]> {
	const { data, error } = await supabase
		.from('store_testimonials')
		.select('*')
		.eq('status', 'approved')
		.order('created_at', { ascending: false })
	if (error) throw error
	return (data ?? []) as StoreTestimonial[]
}

export async function fetchMyStoreTestimonial(userId: string): Promise<StoreTestimonial | null> {
	const { data, error } = await supabase
		.from('store_testimonials')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.limit(1)
		.maybeSingle()
	if (error) return null
	return (data as StoreTestimonial) ?? null
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

export async function fetchTaxRates(): Promise<TaxRate[]> {
	const { data, error } = await supabase
		.from('tax_rates')
		.select('*')
		.eq('is_active', true)
	if (error) throw error
	return data ?? []
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

/** Converts literal "\n" escape sequences (e.g. from a placeholder seeded via SQL) into real newlines. */
export function normalizeAddressNewlines(value: string): string {
	return value.replace(/\\n/g, '\n')
}

export async function fetchRepairSettings(): Promise<RepairSettings | null> {
	const { data, error } = await supabase.from('repair_settings').select('*').limit(1).maybeSingle()
	if (error) throw error
	return data
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
	const res = await fetch('/api/newsletter/subscribe', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json' },
		body: JSON.stringify({ email }),
	})
	const json = await res.json()
	if (!res.ok) throw new Error(json.error || 'Subscription failed')
	return { alreadySubscribed: !!json.alreadySubscribed }
}