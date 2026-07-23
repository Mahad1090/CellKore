import type { MobileSpecifications, SpecFieldType } from '@/lib/mobile-specs'

export interface MobileSpecPreset {
	id: string
	name: string
	brand: string | null
	mobile_specifications: MobileSpecifications
	sort_order: number
	is_active: boolean
	created_at: string
}

export type { SpecFieldType }

export type ProductCondition = 'new' | 'used' | 'refurbished'
export type DeviceCondition = 'excellent' | 'good' | 'fair' | 'poor'
export type MarketplaceType = 'US' | 'CA'
export type CarrierLockStatus = 'locked' | 'unlocked'
export type OrderStatus = 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
export type PaymentStatus = 'unpaid' | 'paid' | 'refunded' | 'failed'
export type InquiryStatus = 'new' | 'responded'
export type SellPhoneStatus =
	| 'submitted'
	| 'approved'
	| 'offer_accepted'
	| 'shipment_submitted'
	| 'awaiting_package'
	| 'under_inspection'
	| 'quoted'
	| 'payment_confirmed'
	| 'rejected'
	| 'cancelled'
export type SellPhoneStatusChangedBy = 'customer' | 'admin' | 'system'
export type RepairStatus =
	| 'submitted'
	| 'quote_sent'
	| 'quote_accepted'
	| 'payment_confirmed'
	| 'awaiting_device'
	| 'device_shipped'
	| 'device_received'
	| 'in_repair'
	| 'repaired'
	| 'shipped_back'
	| 'completed'
	| 'rejected'
	| 'cancelled'
export type RepairServiceMethod = 'mail_in' | 'drop_off'
export type RepairLabelStatus = 'pending' | 'generated' | 'failed'
export type RepairCurrency = 'USD' | 'CAD'
export type ReviewStatus = 'pending' | 'approved' | 'rejected'
export type AdminRole = 'super_admin' | 'admin'

export interface Category {
	id: string
	name: string
	slug: string
	image_url: string | null
	is_active: boolean
	sort_order: number
	created_at: string
}

export interface ProductType {
	id: string
	name: string
	category_id: string | null
	is_phone_type: boolean
	is_active: boolean
	sort_order: number
	created_at: string
}

export interface Announcement {
	id: string
	text: string
	sort_order: number
	is_active: boolean
	created_at: string
}

export interface SpecTemplateField {
	id?: string
	key: string
	label: string
	field_type: SpecFieldType
	options?: string[] | null
	unit?: string | null
	default_value?: string | null
	sort_order: number
}

export interface SpecTemplate {
	id: string
	product_type_id: string
	name: string
	sort_order: number
	is_active: boolean
	created_at: string
	spec_template_fields?: SpecTemplateField[]
}

export interface TemplateSpecEntry {
	key: string
	label: string
	value: string
	type: SpecFieldType
	unit?: string | null
	options?: string[] | null
}

export interface TemplateSpecifications {
	templateName?: string
	entries: TemplateSpecEntry[]
	custom: { label: string; value: string }[]
}

export interface ProductImage {
	id: string
	product_id: string
	image_url: string
	sort_order: number
	is_primary: boolean
	variant_color?: string | null
}

export interface ProductVariant {
	id: string
	product_id: string
	color: string | null
	swatch_hex?: string | null
	storage?: string | null
	ram?: string | null
	model_name?: string | null
	condition?: ProductCondition | null
	carrier_lock?: CarrierLockStatus | null
	image_url?: string | null
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
	product_type_id?: string | null
	spec_template_id?: string | null
	sku: string | null
	name: string
	brand: string | null
	condition: ProductCondition
	base_price: number
	purchase_price?: number | null
	discount_percent: number
	is_on_sale: boolean
	description: string | null
	is_wholesale: boolean
	lot_quantity?: number | null
	is_active: boolean
	mobile_specifications?: MobileSpecifications | null
	template_specifications?: TemplateSpecifications | null
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

export interface TaxRate {
	id: string
	country_code: string
	country_name: string
	tax_rate: number
	is_active: boolean
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
	condition: DeviceCondition
	description: string | null
	contact_phone: string | null
	contact_email: string | null
	status: SellPhoneStatus
	offered_price: number | null
	payout_amount?: number | null
	payout_reference?: string | null
	payout_notes?: string | null
	payout_confirmed_at?: string | null
	shipping_courier?: string | null
	shipping_tracking_number?: string | null
	rejection_reason?: string | null
	submitted_at: string
	updated_at: string
	sell_phone_images?: { id: string; image_url: string }[]
	sell_phone_status_history?: SellPhoneStatusHistoryEntry[]
	sell_phone_return_shipments?: SellPhoneReturnShipment | null
}

export interface ProductReview {
	id: string
	product_id: string
	user_id: string | null
	reviewer_name: string
	reviewer_email: string | null
	rating: number
	title: string | null
	comment: string
	status: ReviewStatus
	is_featured: boolean
	created_at: string
	updated_at: string
}

export interface StoreTestimonial {
	id: string
	user_id: string | null
	customer_name: string
	customer_email: string | null
	rating: number
	title: string | null
	comment: string
	status: ReviewStatus
	is_featured: boolean
	created_at: string
	updated_at: string
}

export interface SellPhoneStatusHistoryEntry {
	id: string
	request_id: string
	status: SellPhoneStatus
	note: string | null
	changed_by: SellPhoneStatusChangedBy
	created_at: string
}

export type ReturnLabelStatus = 'pending' | 'generated' | 'failed'

export interface SellPhoneReturnShipment {
	id: string
	request_id: string
	fee_amount: number
	address_line1: string | null
	address_line2: string | null
	city: string | null
	state_province: string | null
	postal_code: string | null
	country: string | null
	phone: string | null
	payment_provider: string | null
	payment_reference: string | null
	paid_at: string | null
	label_status: ReturnLabelStatus
	label_url: string | null
	tracking_number: string | null
	carrier: string | null
	created_at: string
	updated_at: string
}

export interface RepairQuoteItem {
	label: string
	amount: number
}

export interface RepairShippingOption {
	label: string
	cost: number
}

export interface RepairStatusHistoryEntry {
	id: string
	request_id: string
	status: RepairStatus
	note: string | null
	changed_by: SellPhoneStatusChangedBy
	created_at: string
}

export interface RepairImage {
	id: string
	request_id: string
	image_url: string
}

export interface RepairRequest {
	id: string
	user_id: string | null
	device_info: string | null
	status: RepairStatus
	device_category: string | null
	device_category_other: string | null
	issues: string[] | null
	issue_other: string | null
	device_brand: string | null
	device_model: string | null
	serial_number: string | null
	description: string | null
	service_method: RepairServiceMethod | null
	contact_name: string | null
	contact_email: string | null
	contact_phone: string | null
	contact_country_code: string | null
	address_line1: string | null
	address_line2: string | null
	city: string | null
	state_province: string | null
	postal_code: string | null
	country: string | null
	terms_accepted: boolean
	quote_items: RepairQuoteItem[] | null
	quote_total: number | null
	quote_currency: RepairCurrency
	quote_notes: string | null
	quote_sent_at: string | null
	shipping_options: RepairShippingOption[] | null
	selected_shipping_option: RepairShippingOption | null
	shipping_cost: number | null
	payment_provider: string | null
	payment_reference: string | null
	paid_at: string | null
	grand_total: number | null
	inbound_carrier: string | null
	inbound_tracking_number: string | null
	inbound_shipped_at: string | null
	outbound_carrier: string | null
	outbound_tracking_number: string | null
	outbound_label_url: string | null
	outbound_label_status: RepairLabelStatus
	shipped_back_at: string | null
	rejection_reason: string | null
	created_at: string
	updated_at: string
	repair_images?: RepairImage[]
	repair_status_history?: RepairStatusHistoryEntry[]
}

export interface RepairSettings {
	id: string
	mail_in_address: string | null
	updated_at: string
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

/** Whether a product currently has an active, admin-enabled discount. */
export function isProductOnSale(product: Product): boolean {
	return !!product.is_on_sale && Number(product.discount_percent) > 0
}

/** The regular (pre-discount) price for a product, optionally for a specific variant. */
export function getOriginalPrice(product: Product, variant?: ProductVariant | null): number {
	return Number(product.base_price) + Number(variant?.price_adjustment ?? 0)
}

/** The price a customer actually pays, after any active sale discount is applied. */
export function getDiscountedPrice(product: Product, variant?: ProductVariant | null): number {
	const original = getOriginalPrice(product, variant)
	if (!isProductOnSale(product)) return original
	const discounted = original * (1 - Number(product.discount_percent) / 100)
	return Math.round(discounted * 100) / 100
}