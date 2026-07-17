export type ProductCondition = 'new' | 'used' | 'refurbished'
export type MarketplaceType = 'US' | 'CA'
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed'
export type InquiryStatus = 'new' | 'responded'
export type SellPhoneStatus = 'submitted' | 'reviewed' | 'quoted' | 'contacted' | 'closed'
export type AdminRole = 'super_admin' | 'editor' | 'support'

export interface Category {
	id: string
	name: string
	slug: string
	image_url: string | null
	is_active: boolean
	sort_order: number
	created_at: string
}

export interface ProductImage {
	id: string
	product_id: string
	image_url: string
	sort_order: number
	is_primary: boolean
}

export interface ProductVariant {
	id: string
	product_id: string
	color: string | null
	stock_quantity: number
	price_adjustment: number
	created_at?: string
}

export interface ProductSpecification {
	id: string
	product_id: string
	spec_name: string
	spec_value: string
}

export interface Product {
	id: string
	category_id: string | null
	sku: string | null
	name: string
	brand: string | null
	condition: ProductCondition
	base_price: number
	location: string | null
	description: string | null
	is_wholesale: boolean
	lot_quantity?: number | null
	is_active: boolean
	created_at: string
	updated_at: string
	categories?: Category | null
	product_images?: ProductImage[]
	product_variants?: ProductVariant[]
	product_specifications?: ProductSpecification[]
	product_marketplaces?: { marketplace: MarketplaceType }[]
}

export interface WholesalePriceTier {
	id: string
	product_id: string
	min_quantity: number
	max_quantity: number | null
	price_per_unit: number
}

export interface CmsPage {
	id: string
	slug: string
	title: string
	content: string | null
	updated_at: string
}

export interface CountryContactInfo {
	id: string
	country: string
	whatsapp_number: string | null
	email: string | null
	landline: string | null
}

export interface SocialLink {
	id: string
	platform: string
	url: string
	is_active: boolean
}

export interface SellPhoneRequest {
	id: string
	user_id: string | null
	device_brand: string
	device_model: string
	condition: ProductCondition
	description: string | null
	contact_phone: string | null
	contact_email: string | null
	status: SellPhoneStatus
	offered_price: number | null
	submitted_at: string
	updated_at: string
	sell_phone_images?: { id: string; image_url: string }[]
}

export interface ContactInquiry {
	id: string
	name: string
	email: string
	phone: string | null
	message: string
	country: string | null
	status: InquiryStatus
	submitted_at: string
}

export interface OrderRecord {
	id: string
	reference: string | null
	user_id: string | null
	marketplace: MarketplaceType
	status: OrderStatus
	payment_status: PaymentStatus
	total_amount: number
	created_at: string
	updated_at: string
	order_items?: OrderItemRecord[]
}

export interface OrderItemRecord {
	id: string
	order_id: string
	product_id: string | null
	variant_id: string | null
	quantity: number
	unit_price_at_purchase: number
	products?: { name: string } | null
}

export interface AdminUser {
	id: string
	full_name: string
	email: string
	role: AdminRole
	created_at: string
}

export function primaryImage(product: Product): string | null {
	const images = product.product_images ?? []
	if (images.length === 0) return null
	const primary = images.find((i) => i.is_primary)
	return (primary ?? [...images].sort((a, b) => a.sort_order - b.sort_order)[0]).image_url
}

export function totalStock(product: Product): number {
	return (product.product_variants ?? []).reduce((sum, v) => sum + v.stock_quantity, 0)
}
