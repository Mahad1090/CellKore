// Mock data for admin panel - used for demo purposes
// In production, these would be fetched from Supabase

export const mockCategories = [
  { id: '1', name: 'Smartphones', slug: 'smartphones', sort_order: 1, is_active: true },
  { id: '2', name: 'Tablets', slug: 'tablets', sort_order: 2, is_active: true },
  { id: '3', name: 'Accessories', slug: 'accessories', sort_order: 3, is_active: true },
]

export const mockMarketplaces = [
  {
    id: '1',
    country: 'United States',
    city: 'New York',
    whatsapp: '+1-555-0100',
    email: 'us@cellkore.com',
    landline: '+1-555-0101',
  },
  {
    id: '2',
    country: 'Canada',
    city: 'Toronto',
    whatsapp: '+1-416-555-0100',
    email: 'ca@cellkore.com',
    landline: '+1-416-555-0101',
  },
]

export const mockWholesaleTiers = [
  {
    id: '1',
    product_id: '1',
    product_name: 'iPhone 14 Pro',
    min_quantity: 1,
    max_quantity: 5,
    price_per_unit: 899,
  },
  {
    id: '2',
    product_id: '1',
    product_name: 'iPhone 14 Pro',
    min_quantity: 6,
    max_quantity: 20,
    price_per_unit: 849,
  },
  {
    id: '3',
    product_id: '2',
    product_name: 'Samsung Galaxy S24',
    min_quantity: 1,
    max_quantity: 10,
    price_per_unit: 799,
  },
]

export const mockSellRequests = [
  {
    id: '1',
    phone_model: 'iPhone 13',
    phone_condition: 'Good',
    customer_phone: '+1-555-0100',
    status: 'Contacted',
    offered_price: 450,
    submitted_at: '2024-01-10',
  },
  {
    id: '2',
    phone_model: 'Samsung Galaxy S22',
    phone_condition: 'Fair',
    customer_phone: '+1-555-0101',
    status: 'Quoted',
    offered_price: 380,
    submitted_at: '2024-01-11',
  },
  {
    id: '3',
    phone_model: 'Google Pixel 7',
    phone_condition: 'Excellent',
    customer_phone: '+1-555-0102',
    status: 'Submitted',
    offered_price: null,
    submitted_at: '2024-01-12',
  },
]

export const mockInquiries = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    subject: 'Product Inquiry',
    message: 'What is the warranty on your phones?',
    status: 'New',
    submitted_at: '2024-01-12',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    subject: 'Bulk Purchase',
    message: 'Interested in wholesale pricing for 50 units',
    status: 'Responded',
    submitted_at: '2024-01-11',
  },
]

export const mockCMSPages = [
  { id: '1', title: 'About Us', slug: 'about', content: 'About CellKore...', is_published: true },
  { id: '2', title: 'Terms of Service', slug: 'terms', content: 'Terms...', is_published: true },
  { id: '3', title: 'Privacy Policy', slug: 'privacy', content: 'Privacy...', is_published: true },
]

export const mockOrders = [
  {
    id: '1',
    order_number: 'ORD-001',
    customer_name: 'John Doe',
    total_amount: 999,
    status: 'Delivered',
    created_at: '2024-01-05',
  },
  {
    id: '2',
    order_number: 'ORD-002',
    customer_name: 'Jane Smith',
    total_amount: 1899,
    status: 'Processing',
    created_at: '2024-01-10',
  },
  {
    id: '3',
    order_number: 'ORD-003',
    customer_name: 'Bob Johnson',
    total_amount: 799,
    status: 'Shipped',
    created_at: '2024-01-11',
  },
]

export const mockSocialLinks = [
  { id: '1', platform: 'Facebook', url: 'https://facebook.com/cellkore', is_active: true },
  { id: '2', platform: 'Instagram', url: 'https://instagram.com/cellkore', is_active: true },
  { id: '3', platform: 'Twitter', url: 'https://twitter.com/cellkore', is_active: false },
]

export const mockAnalytics = {
  totalRevenue: 45000,
  totalOrders: 156,
  averageOrderValue: 288.46,
  totalCustomers: 89,
  newCustomersThisMonth: 14,
  topProducts: [
    { name: 'iPhone 14 Pro', sales: 42 },
    { name: 'Samsung Galaxy S24', sales: 28 },
    { name: 'Google Pixel 8', sales: 16 },
  ],
  ordersByStatus: {
    pending: 12,
    processing: 8,
    shipped: 35,
    delivered: 101,
  },
}
