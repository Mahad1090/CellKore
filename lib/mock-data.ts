export interface ProductVariant {
  id: string
  color: string
  storage?: string
  ram?: string
  price: number
  originalPrice?: number
  inStock: boolean
  stockCount?: number
}

export interface Product {
  id: string
  name: string
  category: string
  country?: 'US' | 'Canada'
  price: number
  originalPrice?: number
  image: string
  images?: string[]
  rating: number
  reviews: number
  inStock: boolean
  description?: string
  condition?: 'new' | 'refurbished' | 'used'
  warranty?: string
  variants?: ProductVariant[]
  specs?: Record<string, string>
  specifications?: {
    display?: Record<string, string>
    memory?: Record<string, string>
    performance?: Record<string, string>
    camera?: Record<string, string>
    battery?: Record<string, string>
    connectivity?: Record<string, string>
    generalFeatures?: Record<string, string>
  }
}

export interface Category {
  id: string
  name: string
  icon: string
  description: string
  count: number
}

export const CATEGORIES: Category[] = [
  {
    id: 'iphone',
    name: 'iPhone',
    icon: '📱',
    description: 'Latest and refurbished iPhones',
    count: 45,
  },
  {
    id: 'samsung',
    name: 'Samsung',
    icon: '📱',
    description: 'Samsung Galaxy series',
    count: 38,
  },
  {
    id: 'android',
    name: 'Android',
    icon: '🤖',
    description: 'Various Android devices',
    count: 52,
  },
  {
    id: 'accessories',
    name: 'Accessories',
    icon: '🎧',
    description: 'Phone cases, chargers, and more',
    count: 120,
  },
  {
    id: 'spare-parts',
    name: 'Spare Parts',
    icon: '🔧',
    description: 'Batteries, screens, and components',
    count: 89,
  },
  {
    id: 'other-brands',
    name: 'Other Brands',
    icon: '📱',
    description: 'Other phone brands',
    count: 25,
  },
]

export const FEATURED_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro Max',
    category: 'iphone',
    price: 1199,
    originalPrice: 1299,
    image: 'https://images.unsplash.com/photo-1592286927505-1def25115558?w=500&q=80',
    images: [
      'https://images.unsplash.com/photo-1592286927505-1def25115558?w=500&q=80',
      'https://images.unsplash.com/photo-1611532736579-6b16e2b50449?w=500&q=80',
    ],
    rating: 4.8,
    reviews: 342,
    inStock: true,
    condition: 'new',
    country: 'US',
    description: 'Latest iPhone 15 Pro Max with advanced camera system',
    warranty: '1 Year Apple Care+',
    variants: [
      { id: 'v1-1', color: 'Titanium Black', storage: '256GB', ram: '8GB', price: 1199, inStock: true, stockCount: 12 },
      { id: 'v1-2', color: 'Titanium Black', storage: '512GB', ram: '8GB', price: 1299, inStock: true, stockCount: 8 },
      { id: 'v1-3', color: 'Titanium Black', storage: '1TB', ram: '8GB', price: 1399, inStock: true, stockCount: 5 },
      { id: 'v1-4', color: 'Titanium Blue', storage: '256GB', ram: '8GB', price: 1199, inStock: true, stockCount: 15 },
      { id: 'v1-5', color: 'Titanium Blue', storage: '512GB', ram: '8GB', price: 1299, inStock: true, stockCount: 10 },
      { id: 'v1-6', color: 'Titanium Gold', storage: '256GB', ram: '8GB', price: 1199, inStock: true, stockCount: 7 },
      { id: 'v1-7', color: 'Titanium White', storage: '256GB', ram: '8GB', price: 1199, inStock: false, stockCount: 0 },
    ],
    specifications: {
      generalFeatures: {
        'Release Date': 'September 2023',
        'SIM Support': 'Nano-SIM and eSIM',
        'Phone Dimensions': '159.9 × 77.8 × 8.25 mm',
        'Phone Weight': '221g',
        'Operating System': 'iOS 17',
      },
      display: {
        'Screen Size': '6.7 inches',
        'Screen Resolution': '2796 × 1290 pixels',
        'Screen Type': 'OLED Super Retina XDR',
        'Screen Refresh Rate': '120Hz ProMotion',
        'Screen Protection': 'Ceramic Shield',
      },
      memory: {
        'RAM': '8GB',
        'Internal Storage': '256GB / 512GB / 1TB',
        'Storage Types': 'NVMe',
      },
      performance: {
        'Processor': 'Apple A17 Pro',
        'GPU': '6-core',
        'Antutu': 'Not Specified',
      },
      camera: {
        'Front Camera': '12MP f/1.9 Ultra Wide',
        'Front Flash Light': 'Yes',
        'Front Video Recording': '4K @ 60fps',
        'Back Camera': '48MP f/1.78 Main + 12MP f/2.8 Tele + 12MP f/2.8 Ultra Wide',
        'Back Flash Light': 'Yes',
        'Back Video Recording': '4K @ 60fps, 1080p @ 240fps',
      },
      battery: {
        'Battery Type': 'Li-Ion',
        'Battery Capacity': '4685mAh',
        'Battery Charging Time': '~30 minutes (0-50% with 20W adapter)',
      },
      connectivity: {
        'Bluetooth': 'Bluetooth 5.3',
        '3G': 'Yes',
        '4G/LTE': 'Yes',
        '5G': 'Yes',
        'Wi-Fi': 'Wi-Fi 6E',
        'NFC': 'Yes',
        'USB': 'USB Type-C',
      },
    },
  },
  {
    id: '2',
    name: 'Samsung Galaxy S24 Ultra',
    category: 'samsung',
    price: 1299,
    originalPrice: 1399,
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf7ce3f1c?w=500&q=80',
    images: [
      'https://images.unsplash.com/photo-1610945415295-d9bbf7ce3f1c?w=500&q=80',
      'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=500&q=80',
    ],
    rating: 4.7,
    reviews: 289,
    inStock: true,
    condition: 'new',
    country: 'US',
    description: 'Galaxy S24 Ultra with stunning AMOLED display',
    warranty: '1 Year Samsung Care+',
    variants: [
      { id: 'v2-1', color: 'Phantom Black', storage: '256GB', ram: '12GB', price: 1199, inStock: true, stockCount: 10 },
      { id: 'v2-2', color: 'Phantom Black', storage: '512GB', ram: '12GB', price: 1299, inStock: true, stockCount: 8 },
      { id: 'v2-3', color: 'Titanium Gray', storage: '256GB', ram: '12GB', price: 1199, inStock: true, stockCount: 6 },
      { id: 'v2-4', color: 'Titanium Gold', storage: '512GB', ram: '12GB', price: 1299, inStock: true, stockCount: 5 },
      { id: 'v2-5', color: 'Titanium Violet', storage: '256GB', ram: '12GB', price: 1199, inStock: false, stockCount: 0 },
    ],
    specifications: {
      generalFeatures: {
        'Release Date': 'January 2024',
        'SIM Support': 'Nano-SIM and eSIM',
        'Phone Dimensions': '162.8 × 77.6 × 8.8 mm',
        'Phone Weight': '232g',
        'Operating System': 'Android 14 (One UI 6)',
      },
      display: {
        'Screen Size': '6.8 inches',
        'Screen Resolution': '3120 × 1440 pixels',
        'Screen Type': 'Dynamic AMOLED 2X',
        'Screen Refresh Rate': '1-120Hz Adaptive',
        'Screen Protection': 'Gorilla Glass Armor',
      },
      memory: {
        'RAM': '12GB',
        'Internal Storage': '256GB / 512GB',
        'MicroSD': 'No',
      },
      performance: {
        'Processor': 'Snapdragon 8 Gen 3 Leading Version',
        'GPU': 'Adreno 8',
      },
      camera: {
        'Front Camera': '32MP f/2.2',
        'Back Camera': '200MP f/1.8 + 50MP f/1.8 + 10MP f/2.4 + 10MP f/2.4',
        'Back Video Recording': '8K @ 30fps, 4K @ 60fps',
      },
      battery: {
        'Battery Capacity': '5000mAh',
        'Battery Type': 'Li-Ion',
      },
      connectivity: {
        '5G': 'Yes',
        '4G/LTE': 'Yes',
        'Wi-Fi': 'Wi-Fi 7',
        'Bluetooth': 'Bluetooth 5.4',
        'NFC': 'Yes',
      },
    },
  },
  {
    id: '3',
    name: 'iPhone 14 Pro Refurbished',
    category: 'iphone',
    price: 799,
    originalPrice: 999,
    image: 'https://images.unsplash.com/photo-1592286927505-1def25115558?w=500&q=80',
    rating: 4.5,
    reviews: 156,
    inStock: true,
    condition: 'refurbished',
    country: 'Canada',
    description: 'Refurbished iPhone 14 Pro in excellent condition',
    specs: {
      'Storage': '128GB',
      'Color': 'Space Black',
      'Screen': '6.1 inch Super Retina XDR',
    },
    warranty: '6 Month Warranty',
  },
  {
    id: '4',
    name: 'Google Pixel 8 Pro',
    category: 'android',
    price: 999,
    originalPrice: 1099,
    image: 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=500&q=80',
    rating: 4.6,
    reviews: 198,
    inStock: true,
    condition: 'new',
    country: 'Canada',
    description: 'Pixel 8 Pro with AI-powered camera',
    specs: {
      'Storage': '256GB',
      'Color': 'Obsidian',
      'Screen': '6.7 inch OLED',
    },
    warranty: '1 Year Manufacturer',
  },
  {
    id: '5',
    name: 'Premium Phone Case Bundle',
    category: 'accessories',
    price: 49.99,
    image: 'https://images.unsplash.com/photo-1603561596411-07134e71a2a9?w=500&q=80',
    rating: 4.4,
    reviews: 89,
    inStock: true,
    condition: 'new',
    description: 'Set of 3 premium protective cases',
    warranty: 'Lifetime coverage',
  },
  {
    id: '6',
    name: 'Universal Fast Charger 65W',
    category: 'accessories',
    price: 39.99,
    originalPrice: 49.99,
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&q=80',
    rating: 4.7,
    reviews: 234,
    inStock: true,
    condition: 'new',
    description: 'Fast charger compatible with all devices',
    warranty: '2 Year Warranty',
  },
]

export const ALL_PRODUCTS: Product[] = [
  ...FEATURED_PRODUCTS,
  {
    id: '7',
    name: 'iPhone 13 Mini Used',
    category: 'iphone',
    price: 499,
    image: 'https://images.unsplash.com/photo-1592286927505-1def25115558?w=500&q=80',
    rating: 4.2,
    reviews: 67,
    inStock: true,
    condition: 'used',
    country: 'US',
    description: 'Used iPhone 13 Mini in good condition',
  },
  {
    id: '8',
    name: 'Samsung Galaxy A54',
    category: 'samsung',
    price: 449,
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf7ce3f1c?w=500&q=80',
    rating: 4.3,
    reviews: 112,
    inStock: true,
    condition: 'new',
    country: 'Canada',
    description: 'Mid-range Samsung Galaxy A54',
  },
  {
    id: '9',
    name: 'OnePlus 12',
    category: 'android',
    price: 749,
    image: 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=500&q=80',
    rating: 4.6,
    reviews: 145,
    inStock: true,
    condition: 'new',
    country: 'US',
    description: 'OnePlus 12 with flagship specs',
  },
  {
    id: '10',
    name: 'iPhone Battery Replacement Kit',
    category: 'spare-parts',
    price: 29.99,
    image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=500&q=80',
    rating: 4.5,
    reviews: 78,
    inStock: true,
    condition: 'new',
    description: 'Original iPhone battery replacement kit',
  },
  {
    id: '11',
    name: 'Screen Protector Pack (5)',
    category: 'accessories',
    price: 15.99,
    image: 'https://images.unsplash.com/photo-1603561596411-07134e71a2a9?w=500&q=80',
    rating: 4.4,
    reviews: 156,
    inStock: true,
    condition: 'new',
    description: 'Pack of 5 tempered glass screen protectors',
  },
]

export interface Marketplace {
  id: string
  name: string
  location: string
  address: string
  phone: string
  email: string
  image: string
  rating: number
  reviews: number
  featured?: boolean
}

export const MARKETPLACES: Marketplace[] = [
  {
    id: 'us-1',
    name: 'CellKore Manhattan',
    location: 'New York, NY',
    address: '123 5th Avenue, New York, NY 10016',
    phone: '(212) 555-0123',
    email: 'manhattan@cellkore.com',
    image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=500&q=80',
    rating: 4.8,
    reviews: 456,
    featured: true,
  },
  {
    id: 'us-2',
    name: 'CellKore Los Angeles',
    location: 'Los Angeles, CA',
    address: '456 Hollywood Blvd, Los Angeles, CA 90028',
    phone: '(323) 555-0456',
    email: 'la@cellkore.com',
    image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=500&q=80',
    rating: 4.7,
    reviews: 378,
    featured: true,
  },
  {
    id: 'us-3',
    name: 'CellKore Chicago',
    location: 'Chicago, IL',
    address: '789 Michigan Ave, Chicago, IL 60611',
    phone: '(312) 555-0789',
    email: 'chicago@cellkore.com',
    image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=500&q=80',
    rating: 4.6,
    reviews: 312,
  },
  {
    id: 'ca-1',
    name: 'CellKore Toronto',
    location: 'Toronto, ON',
    address: '321 Yonge Street, Toronto, ON M5B 1S7',
    phone: '(416) 555-0321',
    email: 'toronto@cellkore.com',
    image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=500&q=80',
    rating: 4.7,
    reviews: 289,
    featured: true,
  },
  {
    id: 'ca-2',
    name: 'CellKore Vancouver',
    location: 'Vancouver, BC',
    address: '654 Granville Street, Vancouver, BC V6C 2G8',
    phone: '(604) 555-0654',
    email: 'vancouver@cellkore.com',
    image: 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=500&q=80',
    rating: 4.5,
    reviews: 198,
  },
]

export interface WholesaleManifestRow {
  id: string
  model: string
  capacity: string
  carrier: string
  grade: 'A' | 'B' | 'C' | 'D'
  quantity: number
}

export interface WholesaleListing {
  id: string
  name: string
  image: string
  price: number
  quantity: number
  condition: 'New' | 'Refurbished' | 'Used'
  description: string
  manifestRows: WholesaleManifestRow[]
}

export const WHOLESALE_LISTINGS: WholesaleListing[] = [
  {
    id: 'wh-iphone-15-pro-max',
    name: 'iPhone 15 Pro Max',
    image: 'https://images.unsplash.com/photo-1592286927505-1def25115558?w=500&q=80',
    price: 950,
    quantity: 20,
    condition: 'New',
    description: 'High-demand flagship inventory with multiple storage and carrier splits.',
    manifestRows: [
      { id: 'wh-1', model: 'iPhone 15 Pro Max', capacity: '256GB', carrier: 'Unlocked', grade: 'A', quantity: 7 },
      { id: 'wh-2', model: 'iPhone 15 Pro Max', capacity: '512GB', carrier: 'Unlocked', grade: 'A', quantity: 5 },
      { id: 'wh-3', model: 'iPhone 15 Pro Max', capacity: '1TB', carrier: 'Unlocked', grade: 'A', quantity: 3 },
      { id: 'wh-4', model: 'iPhone 15 Pro Max', capacity: '256GB', carrier: 'Verizon', grade: 'B', quantity: 5 },
    ],
  },
  {
    id: 'wh-iphone-14-pro',
    name: 'iPhone 14 Pro',
    image: 'https://images.unsplash.com/photo-1592286927505-1def25115558?w=500&q=80',
    price: 650,
    quantity: 18,
    condition: 'Refurbished',
    description: 'Refurbished wholesale lot with mixed grades for resale and replacement units.',
    manifestRows: [
      { id: 'wh-5', model: 'iPhone 14 Pro', capacity: '128GB', carrier: 'Unlocked', grade: 'B', quantity: 6 },
      { id: 'wh-6', model: 'iPhone 14 Pro', capacity: '256GB', carrier: 'Unlocked', grade: 'B', quantity: 4 },
      { id: 'wh-7', model: 'iPhone 14 Pro', capacity: '128GB', carrier: 'AT&T', grade: 'C', quantity: 5 },
      { id: 'wh-8', model: 'iPhone 14 Pro', capacity: '256GB', carrier: 'T-Mobile', grade: 'C', quantity: 3 },
    ],
  },
  {
    id: 'wh-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra',
    image: 'https://images.unsplash.com/photo-1610945415295-d9bbf7ce3f1c?w=500&q=80',
    price: 1020,
    quantity: 16,
    condition: 'New',
    description: 'Premium Android wholesale stock with strong margins and fast turnover.',
    manifestRows: [
      { id: 'wh-9', model: 'Samsung Galaxy S24 Ultra', capacity: '256GB', carrier: 'Unlocked', grade: 'A', quantity: 5 },
      { id: 'wh-10', model: 'Samsung Galaxy S24 Ultra', capacity: '512GB', carrier: 'Unlocked', grade: 'A', quantity: 4 },
      { id: 'wh-11', model: 'Samsung Galaxy S24 Ultra', capacity: '256GB', carrier: 'Verizon', grade: 'A', quantity: 3 },
      { id: 'wh-12', model: 'Samsung Galaxy S24 Ultra', capacity: '512GB', carrier: 'AT&T', grade: 'B', quantity: 4 },
    ],
  },
  {
    id: 'wh-pixel-8-pro',
    name: 'Google Pixel 8 Pro',
    image: 'https://images.unsplash.com/photo-1511707267537-b85faf00021e?w=500&q=80',
    price: 780,
    quantity: 12,
    condition: 'New',
    description: 'Clean Android inventory for stores focused on AI camera devices.',
    manifestRows: [
      { id: 'wh-13', model: 'Google Pixel 8 Pro', capacity: '128GB', carrier: 'Unlocked', grade: 'A', quantity: 4 },
      { id: 'wh-14', model: 'Google Pixel 8 Pro', capacity: '256GB', carrier: 'Unlocked', grade: 'A', quantity: 3 },
      { id: 'wh-15', model: 'Google Pixel 8 Pro', capacity: '128GB', carrier: 'T-Mobile', grade: 'B', quantity: 3 },
      { id: 'wh-16', model: 'Google Pixel 8 Pro', capacity: '256GB', carrier: 'AT&T', grade: 'B', quantity: 2 },
    ],
  },
]
