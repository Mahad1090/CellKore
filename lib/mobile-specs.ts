/**
 * Canonical registry of mobile phone specification fields, grouped by category.
 * Single source of truth for the admin spec editor (components/admin/mobile-specs-form.tsx)
 * and the customer-facing product page (app/products/[id]/page.tsx).
 */

export type SpecFieldType = 'text' | 'number' | 'select' | 'checkbox'

export interface SpecField {
	key: string
	label: string
	type: SpecFieldType
	options?: string[]
	unit?: string
}

export interface SpecCategory {
	id: string
	label: string
	fields: SpecField[]
}

export interface MobileSpecifications {
	[categoryId: string]: Record<string, string> | { key: string; value: string }[] | undefined
	custom?: { key: string; value: string }[]
}

const text = (key: string, label: string, unit?: string): SpecField => ({ key, label, type: 'text', unit })
const num = (key: string, label: string, unit?: string): SpecField => ({ key, label, type: 'number', unit })
const check = (key: string, label: string): SpecField => ({ key, label, type: 'checkbox' })
const select = (key: string, label: string, options: string[]): SpecField => ({ key, label, type: 'select', options })

export const MOBILE_SPEC_CATEGORIES: SpecCategory[] = [
	{
		id: 'general',
		label: 'General',
		fields: [
			text('brand', 'Brand'),
			text('model', 'Model'),
			text('series', 'Series'),
			text('releaseDate', 'Release Date'),
			text('launchPrice', 'Launch Price'),
			text('operatingSystem', 'Operating System'),
			text('buildMaterial', 'Build Material'),
			text('dimensions', 'Dimensions'),
			text('weight', 'Weight', 'g'),
			text('colors', 'Colors'),
			select('waterResistance', 'Water Resistance (IP Rating)', ['None', 'IP54', 'IP67', 'IP68']),
		],
	},
	{
		id: 'display',
		label: 'Display',
		fields: [
			text('displayType', 'Display Type'),
			num('screenSize', 'Screen Size', 'inches'),
			text('resolution', 'Resolution'),
			num('pixelDensity', 'Pixel Density (PPI)'),
			select('refreshRate', 'Refresh Rate', ['60Hz', '90Hz', '120Hz', '144Hz']),
			text('peakBrightness', 'Peak Brightness', 'nits'),
			check('hdrSupport', 'HDR Support'),
			check('alwaysOnDisplay', 'Always-On Display'),
			text('screenProtection', 'Screen Protection'),
		],
	},
	{
		id: 'performance',
		label: 'Performance',
		fields: [
			text('chipset', 'Chipset'),
			text('cpu', 'CPU'),
			text('gpu', 'GPU'),
			text('aiEngine', 'AI Engine / Neural Engine'),
			text('manufacturingProcess', 'Manufacturing Process'),
		],
	},
	{
		id: 'memory',
		label: 'Memory',
		fields: [
			text('ram', 'RAM', 'GB'),
			text('internalStorage', 'Internal Storage', 'GB'),
			text('storageType', 'Storage Type'),
			text('expandableStorage', 'Expandable Storage'),
		],
	},
	{
		id: 'battery',
		label: 'Battery',
		fields: [
			num('batteryCapacity', 'Battery Capacity', 'mAh'),
			text('batteryType', 'Battery Type'),
			text('wiredCharging', 'Wired Charging'),
			text('wirelessCharging', 'Wireless Charging'),
			check('reverseWirelessCharging', 'Reverse Wireless Charging'),
		],
	},
	{
		id: 'rearCamera',
		label: 'Rear Camera',
		fields: [
			text('mainCamera', 'Main Camera'),
			text('ultraWideCamera', 'Ultra Wide Camera'),
			text('telephotoCamera', 'Telephoto Camera'),
			text('periscopeCamera', 'Periscope Camera'),
			text('macroCamera', 'Macro Camera'),
			text('depthSensor', 'Depth Sensor'),
			check('ois', 'Optical Image Stabilization (OIS)'),
			check('autofocus', 'Autofocus'),
			text('flash', 'Flash'),
			text('opticalZoom', 'Optical Zoom'),
			text('digitalZoom', 'Digital Zoom'),
			text('videoRecording', 'Video Recording'),
		],
	},
	{
		id: 'frontCamera',
		label: 'Front Camera',
		fields: [
			text('frontCamera', 'Front Camera'),
			check('frontAutofocus', 'Autofocus'),
			check('portraitMode', 'Portrait Mode'),
			text('frontVideoRecording', 'Video Recording'),
		],
	},
	{
		id: 'connectivity',
		label: 'Connectivity',
		fields: [
			text('simType', 'SIM Type'),
			check('eSim', 'eSIM'),
			check('twoG', '2G'),
			check('threeG', '3G'),
			check('fourG', '4G'),
			check('fiveG', '5G'),
			text('wifi', 'Wi-Fi'),
			text('bluetooth', 'Bluetooth'),
			check('nfc', 'NFC'),
			check('gps', 'GPS'),
			text('usbType', 'USB Type'),
			text('usbVersion', 'USB Version'),
			check('otg', 'OTG'),
			check('uwb', 'UWB'),
		],
	},
	{
		id: 'audio',
		label: 'Audio',
		fields: [
			check('stereoSpeakers', 'Stereo Speakers'),
			check('dolbyAtmos', 'Dolby Atmos'),
			check('headphoneJack', 'Headphone Jack'),
			text('microphones', 'Microphones'),
		],
	},
	{
		id: 'sensors',
		label: 'Sensors',
		fields: [
			text('fingerprintSensor', 'Fingerprint Sensor'),
			check('faceUnlock', 'Face Unlock'),
			check('accelerometer', 'Accelerometer'),
			check('gyroscope', 'Gyroscope'),
			check('compass', 'Compass'),
			check('ambientLightSensor', 'Ambient Light Sensor'),
			check('proximitySensor', 'Proximity Sensor'),
			check('barometer', 'Barometer'),
		],
	},
	{
		id: 'software',
		label: 'Software Support',
		fields: [
			text('currentOsVersion', 'Current OS Version'),
			text('guaranteedOsUpdates', 'Guaranteed OS Updates'),
			text('securityUpdates', 'Security Updates'),
		],
	},
	{
		id: 'boxContents',
		label: 'Box Contents',
		fields: [
			check('boxPhone', 'Phone'),
			check('boxUsbCable', 'USB Cable'),
			check('boxChargerIncluded', 'Charger Included'),
			check('boxSimTool', 'SIM Tool'),
			check('boxDocumentation', 'Documentation'),
		],
	},
]

export const BRAND_FEATURE_CATEGORIES: Record<string, SpecCategory> = {
	samsung: {
		id: 'samsungFeatures',
		label: 'Samsung Features',
		fields: [
			text('oneUiVersion', 'One UI Version'),
			check('samsungDex', 'Samsung DeX'),
			check('wirelessDex', 'Wireless DeX'),
			check('sPenSupport', 'S Pen Support'),
			check('galaxyAi', 'Galaxy AI'),
			check('circleToSearch', 'Circle to Search'),
			text('knoxSecurity', 'Knox Security'),
			check('secureFolder', 'Secure Folder'),
			check('samsungWallet', 'Samsung Wallet'),
			check('smartThings', 'SmartThings'),
			check('samsungHealth', 'Samsung Health'),
			check('bixby', 'Bixby'),
		],
	},
	apple: {
		id: 'appleFeatures',
		label: 'Apple Features',
		fields: [
			check('appleIntelligence', 'Apple Intelligence'),
			check('dynamicIsland', 'Dynamic Island'),
			check('faceId', 'Face ID'),
			check('actionButton', 'Action Button'),
			check('cameraControlButton', 'Camera Control Button'),
			check('magSafe', 'MagSafe'),
			check('ceramicShield', 'Ceramic Shield'),
			check('trueTone', 'True Tone'),
			check('proMotion', 'ProMotion'),
			check('lidarScanner', 'LiDAR Scanner'),
			check('airDrop', 'AirDrop'),
			check('airPlay', 'AirPlay'),
			check('findMy', 'Find My'),
			check('emergencySos', 'Emergency SOS via Satellite'),
			check('crashDetection', 'Crash Detection'),
			check('siri', 'Siri'),
			check('applePay', 'Apple Pay'),
			check('liveActivities', 'Live Activities'),
			check('standByMode', 'StandBy Mode'),
		],
	},
}

/**
 * Case-insensitive substring match on the product's brand field.
 * Add future brands (Pixel, Xiaomi, Oppo, Vivo, OnePlus, Motorola, ...) as
 * additional entries in BRAND_FEATURE_CATEGORIES — no other code changes needed.
 */
export function getBrandFeatureCategories(brand: string | null | undefined): SpecCategory[] {
	if (!brand) return []
	const normalized = brand.trim().toLowerCase()
	return Object.entries(BRAND_FEATURE_CATEGORIES)
		.filter(([key]) => normalized.includes(key))
		.map(([, category]) => category)
}

export function getCategoriesForBrand(brand: string | null | undefined): SpecCategory[] {
	return [...MOBILE_SPEC_CATEGORIES, ...getBrandFeatureCategories(brand)]
}

/** True if the category has at least one non-empty value in the given specs object. */
export function categoryHasValues(specs: MobileSpecifications, category: SpecCategory): boolean {
	const values = specs[category.id]
	if (!values || Array.isArray(values)) return false
	return category.fields.some((field) => (values[field.key] ?? '').toString().trim() !== '')
}

/** Reads a category's field values, or an empty object if unset. */
export function getCategoryValues(specs: MobileSpecifications, categoryId: string): Record<string, string> {
	const values = specs[categoryId]
	return values && !Array.isArray(values) ? values : {}
}
