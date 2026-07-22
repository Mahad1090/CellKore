'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import {
	Pencil, Trash2, Loader2, Plus, GripVertical, Search, Sparkles,
	Laptop, Smartphone, Tablet, Watch, Headphones, Gamepad2, Camera,
	BatteryCharging, ShieldCheck, Cable, Wrench, Boxes, Cpu
} from 'lucide-react'
import { EmptyState, Modal, adminButton, adminButtonGhost, adminInput } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import type { ProductType, SpecFieldType, SpecTemplate, SpecTemplateField } from '@/lib/types'

interface FieldRow {
	key: string
	label: string
	field_type: SpecFieldType
	options: string
	unit: string
	default_value: string
}

interface TemplateForm {
	id?: string
	name: string
	product_type_id: string
	is_active: boolean
	fields: FieldRow[]
}

const EMPTY: TemplateForm = { name: '', product_type_id: '', is_active: true, fields: [] }

// ── 1-Click Starter Kits for ALL Product Categories ──────────────────────────
const STARTER_KITS: { id: string; name: string; icon: any; fields: FieldRow[] }[] = [
	{
		id: 'phone',
		name: 'Smartphone Starter Kit (Full Specs)',
		icon: Smartphone,
		fields: [
			// General
			{ key: 'brand', label: 'Brand', field_type: 'text', options: '', unit: '', default_value: '' },
			{ key: 'model', label: 'Model Name', field_type: 'text', options: '', unit: '', default_value: '' },
			{ key: 'series', label: 'Series', field_type: 'text', options: '', unit: '', default_value: '' },
			{ key: 'releaseDate', label: 'Release Date', field_type: 'text', options: '', unit: '', default_value: '' },
			{ key: 'operatingSystem', label: 'Operating System', field_type: 'text', options: '', unit: '', default_value: 'iOS / Android' },
			{ key: 'buildMaterial', label: 'Build Material', field_type: 'text', options: '', unit: '', default_value: 'Glass Front/Back, Titanium/Aluminum Frame' },
			{ key: 'dimensions', label: 'Dimensions', field_type: 'text', options: '', unit: 'mm', default_value: '' },
			{ key: 'weight', label: 'Weight', field_type: 'number', options: '', unit: 'g', default_value: '' },
			{ key: 'colors', label: 'Colors', field_type: 'text', options: '', unit: '', default_value: '' },
			{ key: 'waterResistance', label: 'Water Resistance (IP Rating)', field_type: 'select', options: 'None, IP54, IP67, IP68', unit: '', default_value: 'IP68' },
			// Display
			{ key: 'displayType', label: 'Display Type', field_type: 'select', options: 'AMOLED, OLED, Super Retina XDR, IPS LCD', unit: '', default_value: 'OLED' },
			{ key: 'screenSize', label: 'Screen Size', field_type: 'number', options: '', unit: 'inches', default_value: '6.7' },
			{ key: 'resolution', label: 'Resolution', field_type: 'text', options: '', unit: '', default_value: '2796 x 1290' },
			{ key: 'pixelDensity', label: 'Pixel Density', field_type: 'number', options: '', unit: 'PPI', default_value: '460' },
			{ key: 'refreshRate', label: 'Refresh Rate', field_type: 'select', options: '60Hz, 90Hz, 120Hz, 144Hz', unit: 'Hz', default_value: '120Hz' },
			{ key: 'peakBrightness', label: 'Peak Brightness', field_type: 'text', options: '', unit: 'nits', default_value: '2000 nits' },
			{ key: 'hdrSupport', label: 'HDR Support', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			{ key: 'alwaysOnDisplay', label: 'Always-On Display', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			{ key: 'screenProtection', label: 'Screen Protection', field_type: 'text', options: '', unit: '', default_value: 'Ceramic Shield / Gorilla Glass Armor' },
			// Performance
			{ key: 'chipset', label: 'Chipset / Processor', field_type: 'text', options: '', unit: '', default_value: 'Apple A17 Pro / Snapdragon 8 Gen 3' },
			{ key: 'cpu', label: 'CPU', field_type: 'text', options: '', unit: '', default_value: 'Octa-core' },
			{ key: 'gpu', label: 'GPU', field_type: 'text', options: '', unit: '', default_value: '' },
			{ key: 'aiEngine', label: 'AI Engine / Neural Engine', field_type: 'text', options: '', unit: '', default_value: '' },
			// Memory
			{ key: 'ram', label: 'RAM', field_type: 'select', options: '4 GB, 6 GB, 8 GB, 12 GB, 16 GB', unit: 'GB', default_value: '8 GB' },
			{ key: 'internalStorage', label: 'Internal Storage', field_type: 'select', options: '128 GB, 256 GB, 512 GB, 1 TB', unit: 'GB', default_value: '256 GB' },
			{ key: 'storageType', label: 'Storage Type', field_type: 'select', options: 'NVMe, UFS 4.0, UFS 3.1', unit: '', default_value: 'UFS 4.0' },
			{ key: 'expandableStorage', label: 'Expandable Storage', field_type: 'text', options: '', unit: '', default_value: 'No' },
			// Battery
			{ key: 'batteryCapacity', label: 'Battery Capacity', field_type: 'number', options: '', unit: 'mAh', default_value: '4422' },
			{ key: 'batteryType', label: 'Battery Type', field_type: 'text', options: '', unit: '', default_value: 'Li-Ion non-removable' },
			{ key: 'wiredCharging', label: 'Wired Charging Speed', field_type: 'text', options: '', unit: 'W', default_value: '25W' },
			{ key: 'wirelessCharging', label: 'Wireless Charging', field_type: 'text', options: '', unit: 'W', default_value: '15W MagSafe / Qi2' },
			{ key: 'reverseWirelessCharging', label: 'Reverse Wireless Charging', field_type: 'checkbox', options: '', unit: '', default_value: 'No' },
			// Rear Camera
			{ key: 'mainCamera', label: 'Main Camera Resolution', field_type: 'text', options: '', unit: 'MP', default_value: '48 MP, f/1.7, OIS' },
			{ key: 'ultraWideCamera', label: 'Ultra Wide Camera', field_type: 'text', options: '', unit: 'MP', default_value: '12 MP, f/2.2' },
			{ key: 'telephotoCamera', label: 'Telephoto Camera', field_type: 'text', options: '', unit: 'MP', default_value: '12 MP, 5x Optical Zoom' },
			{ key: 'ois', label: 'Optical Image Stabilization (OIS)', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			{ key: 'videoRecording', label: 'Video Recording', field_type: 'select', options: '4K at 60fps, 4K at 120fps, 8K at 30fps', unit: '', default_value: '4K at 60fps' },
			// Front Camera
			{ key: 'frontCamera', label: 'Front Camera', field_type: 'text', options: '', unit: 'MP', default_value: '12 MP, f/1.9, PDAF' },
			{ key: 'portraitMode', label: 'Front Portrait Mode', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			// Connectivity
			{ key: 'simType', label: 'SIM Type', field_type: 'select', options: 'Nano-SIM + eSIM, Dual eSIM, Dual Nano-SIM', unit: '', default_value: 'Nano-SIM + eSIM' },
			{ key: 'fiveG', label: '5G Support', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			{ key: 'wifi', label: 'Wi-Fi', field_type: 'select', options: 'Wi-Fi 6, Wi-Fi 6E, Wi-Fi 7', unit: '', default_value: 'Wi-Fi 6E' },
			{ key: 'bluetooth', label: 'Bluetooth Version', field_type: 'text', options: '', unit: '', default_value: '5.3' },
			{ key: 'nfc', label: 'NFC Support', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			{ key: 'usbType', label: 'USB Port Type', field_type: 'select', options: 'USB-C (USB 3.2), USB-C (USB 2.0), Lightning', unit: '', default_value: 'USB-C (USB 3.2)' },
			// Audio & Security
			{ key: 'stereoSpeakers', label: 'Stereo Speakers', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			{ key: 'fingerprintSensor', label: 'Fingerprint Sensor', field_type: 'select', options: 'Under Display Ultrasonic, Side-Mounted, None', unit: '', default_value: 'None' },
			{ key: 'faceUnlock', label: 'Face Unlock / Face ID', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
		],
	},
	{
		id: 'apple_phone',
		name: 'iPhone / Apple Full Spec Kit',
		icon: Cpu,
		fields: [
			// General & Build
			{ key: 'brand', label: 'Brand', field_type: 'text', options: '', unit: '', default_value: 'Apple' },
			{ key: 'model', label: 'Model Name', field_type: 'text', options: '', unit: '', default_value: 'iPhone 16 Pro Max' },
			{ key: 'series', label: 'Series', field_type: 'text', options: '', unit: '', default_value: 'iPhone' },
			{ key: 'operatingSystem', label: 'Operating System', field_type: 'select', options: 'iOS 18, iOS 17, iOS 16', unit: '', default_value: 'iOS 18' },
			{ key: 'buildMaterial', label: 'Build Material', field_type: 'text', options: '', unit: '', default_value: 'Grade 5 Titanium Frame, Textured Matte Glass Back' },
			{ key: 'ceramicShield', label: 'Ceramic Shield Protection', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			{ key: 'waterResistance', label: 'Water Resistance', field_type: 'select', options: 'IP68 (6m up to 30 mins)', unit: '', default_value: 'IP68 (6m up to 30 mins)' },
			// Display & UI Features
			{ key: 'displayType', label: 'Display Type', field_type: 'text', options: '', unit: '', default_value: 'Super Retina XDR OLED' },
			{ key: 'screenSize', label: 'Screen Size', field_type: 'number', options: '', unit: 'inches', default_value: '6.9' },
			{ key: 'resolution', label: 'Resolution', field_type: 'text', options: '', unit: '', default_value: '2868 x 1320' },
			{ key: 'pixelDensity', label: 'Pixel Density', field_type: 'number', options: '', unit: 'PPI', default_value: '460' },
			{ key: 'proMotion', label: 'ProMotion (120Hz Adaptive)', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			{ key: 'dynamicIsland', label: 'Dynamic Island', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			{ key: 'alwaysOnDisplay', label: 'Always-On Display', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			{ key: 'peakBrightness', label: 'Peak Brightness', field_type: 'text', options: '', unit: 'nits', default_value: '2000 nits Outdoor' },
			// Apple Hardware Controls & AI
			{ key: 'chipset', label: 'Chipset / Processor', field_type: 'text', options: '', unit: '', default_value: 'Apple A18 Pro (3nm)' },
			{ key: 'neuralEngine', label: 'Neural Engine / NPU', field_type: 'text', options: '', unit: '', default_value: '16-core Neural Engine' },
			{ key: 'appleIntelligence', label: 'Apple Intelligence Support', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			{ key: 'actionButton', label: 'Action Button', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			{ key: 'cameraControl', label: 'Camera Control Button', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			// Memory & Storage
			{ key: 'ram', label: 'RAM', field_type: 'select', options: '8 GB, 6 GB', unit: 'GB', default_value: '8 GB' },
			{ key: 'internalStorage', label: 'Internal Storage', field_type: 'select', options: '128 GB, 256 GB, 512 GB, 1 TB', unit: 'GB', default_value: '256 GB' },
			{ key: 'storageType', label: 'Storage Type', field_type: 'text', options: '', unit: '', default_value: 'NVMe' },
			// Battery & Charging
			{ key: 'batteryCapacity', label: 'Battery Capacity', field_type: 'number', options: '', unit: 'mAh', default_value: '4685' },
			{ key: 'magSafe', label: 'MagSafe Wireless Charging (25W)', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			{ key: 'wiredCharging', label: 'Wired Fast Charging', field_type: 'text', options: '', unit: 'W', default_value: '50% in 30 mins' },
			{ key: 'qi2Charging', label: 'Qi2 Wireless Charging', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			// Camera System
			{ key: 'mainCamera', label: 'Fusion Main Camera', field_type: 'text', options: '', unit: '', default_value: '48 MP, f/1.78, 2nd Gen Sensor-Shift OIS' },
			{ key: 'ultraWideCamera', label: 'Ultra Wide Camera', field_type: 'text', options: '', unit: '', default_value: '48 MP, f/2.2, 120° FOV, Macro' },
			{ key: 'telephotoCamera', label: 'Telephoto Camera', field_type: 'text', options: '', unit: '', default_value: '12 MP, 5x Optical Zoom (120mm)' },
			{ key: 'lidarScanner', label: 'LiDAR Scanner', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			{ key: 'videoRecording', label: 'Video Recording', field_type: 'select', options: '4K Dolby Vision at 120 fps, 4K Dolby Vision at 60 fps', unit: '', default_value: '4K Dolby Vision at 120 fps' },
			{ key: 'spatialVideo', label: 'Spatial Video & Photos (for Vision Pro)', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			{ key: 'frontCamera', label: 'Front TrueDepth Camera', field_type: 'text', options: '', unit: '', default_value: '12 MP, f/1.9, Autofocus' },
			// Security & Connectivity
			{ key: 'faceId', label: 'Face ID (TrueDepth)', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			{ key: 'simType', label: 'SIM Support', field_type: 'select', options: 'eSIM Only (US), Nano-SIM + eSIM (Global)', unit: '', default_value: 'eSIM Only (US)' },
			{ key: 'emergencySos', label: 'Emergency SOS via Satellite', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			{ key: 'crashDetection', label: 'Crash Detection', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			{ key: 'usbType', label: 'USB Port Type', field_type: 'select', options: 'USB-C (USB 3 - 10Gbps), USB-C (USB 2 - 480Mbps)', unit: '', default_value: 'USB-C (USB 3 - 10Gbps)' },
			{ key: 'wifi', label: 'Wi-Fi', field_type: 'select', options: 'Wi-Fi 7, Wi-Fi 6E', unit: '', default_value: 'Wi-Fi 7' },
			{ key: 'uwb', label: 'Ultra Wideband (UWB 2nd Gen)', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
		],
	},
	{
		id: 'laptop',
		name: 'Laptop Starter Kit',
		icon: Laptop,
		fields: [
			{ key: 'processor', label: 'Processor (CPU)', field_type: 'text', options: '', unit: '', default_value: 'Intel Core i7 / Apple M3' },
			{ key: 'ram', label: 'RAM', field_type: 'select', options: '8 GB, 16 GB, 32 GB, 64 GB', unit: 'GB', default_value: '16 GB' },
			{ key: 'storage', label: 'Storage (SSD)', field_type: 'select', options: '256 GB, 512 GB, 1 TB, 2 TB', unit: 'GB', default_value: '512 GB' },
			{ key: 'gpu', label: 'Graphics (GPU)', field_type: 'text', options: '', unit: '', default_value: 'Integrated / Dedicated GPU' },
			{ key: 'screenSize', label: 'Screen Size', field_type: 'number', options: '', unit: 'inches', default_value: '15.6' },
			{ key: 'resolution', label: 'Resolution', field_type: 'select', options: '1920x1080 (FHD), 2560x1600 (QHD+), 3840x2160 (4K), Liquid Retina XDR', unit: '', default_value: '1920x1080 (FHD)' },
			{ key: 'refreshRate', label: 'Refresh Rate', field_type: 'select', options: '60Hz, 90Hz, 120Hz, 144Hz, 165Hz, 240Hz', unit: 'Hz', default_value: '60Hz' },
			{ key: 'os', label: 'Operating System', field_type: 'select', options: 'Windows 11 Home, Windows 11 Pro, macOS, ChromeOS, Linux', unit: '', default_value: 'Windows 11 Home' },
			{ key: 'battery', label: 'Battery Capacity', field_type: 'text', options: '', unit: 'Wh', default_value: '70 Wh' },
			{ key: 'weight', label: 'Weight', field_type: 'number', options: '', unit: 'kg', default_value: '1.6' },
			{ key: 'ports', label: 'Ports & Slots', field_type: 'text', options: '', unit: '', default_value: 'Thunderbolt 4, USB-C, HDMI, 3.5mm Jack' },
		],
	},
	{
		id: 'tablet',
		name: 'Tablet Starter Kit',
		icon: Tablet,
		fields: [
			{ key: 'processor', label: 'Processor / Chip', field_type: 'text', options: '', unit: '', default_value: 'Apple M2 / Snapdragon 8 Gen 2' },
			{ key: 'ram', label: 'RAM', field_type: 'select', options: '4 GB, 8 GB, 16 GB', unit: 'GB', default_value: '8 GB' },
			{ key: 'storage', label: 'Storage', field_type: 'select', options: '64 GB, 128 GB, 256 GB, 512 GB, 1 TB', unit: 'GB', default_value: '128 GB' },
			{ key: 'displaySize', label: 'Display Size', field_type: 'number', options: '', unit: 'inches', default_value: '11.0' },
			{ key: 'resolution', label: 'Resolution', field_type: 'text', options: '', unit: '', default_value: '2388 x 1668' },
			{ key: 'stylusSupport', label: 'Stylus Support', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			{ key: 'cellularOption', label: 'Connectivity', field_type: 'select', options: 'Wi-Fi Only, Wi-Fi + 5G Cellular', unit: '', default_value: 'Wi-Fi Only' },
			{ key: 'batteryLife', label: 'Battery Life', field_type: 'text', options: '', unit: 'hours', default_value: '10 hours' },
		],
	},
	{
		id: 'watch',
		name: 'Smartwatch Starter Kit',
		icon: Watch,
		fields: [
			{ key: 'caseSize', label: 'Case Size', field_type: 'select', options: '40mm, 41mm, 44mm, 45mm, 49mm', unit: 'mm', default_value: '45mm' },
			{ key: 'caseMaterial', label: 'Case Material', field_type: 'select', options: 'Aluminum, Stainless Steel, Titanium', unit: '', default_value: 'Aluminum' },
			{ key: 'displayType', label: 'Display Type', field_type: 'text', options: '', unit: '', default_value: 'Always-On Retina LTPO OLED' },
			{ key: 'connectivity', label: 'Connectivity', field_type: 'select', options: 'GPS Only, GPS + Cellular', unit: '', default_value: 'GPS Only' },
			{ key: 'batteryLife', label: 'Battery Life', field_type: 'text', options: '', unit: 'hours', default_value: '18 hours' },
			{ key: 'waterResistance', label: 'Water Resistance', field_type: 'select', options: '50m Water Resistant, 100m (EN13319)', unit: '', default_value: '50m Water Resistant' },
			{ key: 'sensors', label: 'Sensors', field_type: 'text', options: '', unit: '', default_value: 'Heart Rate, SpO2, ECG, Temperature, Accelerometer' },
		],
	},
	{
		id: 'audio',
		name: 'Audio & Headphones Starter Kit',
		icon: Headphones,
		fields: [
			{ key: 'formFactor', label: 'Form Factor', field_type: 'select', options: 'True Wireless In-Ear, Over-Ear, On-Ear, Portable Speaker', unit: '', default_value: 'True Wireless In-Ear' },
			{ key: 'connectionType', label: 'Connection Type', field_type: 'select', options: 'Bluetooth 5.3, 3.5mm Wired, USB-C, 2.4GHz Wireless', unit: '', default_value: 'Bluetooth 5.3' },
			{ key: 'ancSupport', label: 'Active Noise Cancellation (ANC)', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			{ key: 'batteryLife', label: 'Total Playtime (with Case)', field_type: 'text', options: '', unit: 'hours', default_value: '30 hours' },
			{ key: 'driverSize', label: 'Driver Size', field_type: 'number', options: '', unit: 'mm', default_value: '11' },
			{ key: 'waterResistance', label: 'Water Resistance', field_type: 'select', options: 'IPX4, IPX7, IP54, None', unit: '', default_value: 'IPX4' },
		],
	},
	{
		id: 'gaming',
		name: 'Gaming Consoles Starter Kit',
		icon: Gamepad2,
		fields: [
			{ key: 'platform', label: 'Gaming Platform', field_type: 'select', options: 'PlayStation 5, Xbox Series X, Nintendo Switch, Handheld PC', unit: '', default_value: 'PlayStation 5' },
			{ key: 'storageCapacity', label: 'Internal Storage', field_type: 'select', options: '512 GB, 825 GB, 1 TB, 2 TB', unit: 'GB', default_value: '1 TB' },
			{ key: 'maxResolution', label: 'Max Output Resolution', field_type: 'select', options: '1080p FHD, 1440p QHD, 4K UHD, 8K HDR', unit: '', default_value: '4K UHD' },
			{ key: 'maxFrameRate', label: 'Max Frame Rate', field_type: 'select', options: '60 fps, 120 fps', unit: 'fps', default_value: '120 fps' },
			{ key: 'discDrive', label: 'Edition Type', field_type: 'select', options: 'Disc Drive Included, Digital Edition (No Disc)', unit: '', default_value: 'Digital Edition (No Disc)' },
		],
	},
	{
		id: 'camera',
		name: 'Cameras & Drones Starter Kit',
		icon: Camera,
		fields: [
			{ key: 'sensorResolution', label: 'Sensor Resolution', field_type: 'number', options: '', unit: 'MP', default_value: '24' },
			{ key: 'videoResolution', label: 'Max Video Resolution', field_type: 'select', options: '1080p 60fps, 4K 60fps, 4K 120fps, 8K 30fps', unit: '', default_value: '4K 60fps' },
			{ key: 'maxFlightTime', label: 'Flight / Recording Time', field_type: 'number', options: '', unit: 'minutes', default_value: '34' },
			{ key: 'opticalZoom', label: 'Optical Zoom', field_type: 'text', options: '', unit: '', default_value: '3x' },
			{ key: 'stabilization', label: 'Gimbal / Image Stabilization', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
		],
	},
	{
		id: 'power',
		name: 'Chargers & Power Starter Kit',
		icon: BatteryCharging,
		fields: [
			{ key: 'wattage', label: 'Max Output Wattage', field_type: 'number', options: '', unit: 'W', default_value: '65' },
			{ key: 'powerBankCapacity', label: 'Battery Capacity (Power Bank)', field_type: 'number', options: '', unit: 'mAh', default_value: '10000' },
			{ key: 'ports', label: 'Output Ports', field_type: 'text', options: '', unit: '', default_value: '2x USB-C, 1x USB-A' },
			{ key: 'fastChargingStandard', label: 'Fast Charging Standard', field_type: 'select', options: 'Power Delivery 3.0 (PD), Quick Charge 4.0, GaN Tech', unit: '', default_value: 'Power Delivery 3.0 (PD)' },
			{ key: 'magsafeSupport', label: 'MagSafe / Magnetic Wireless', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			{ key: 'cableIncluded', label: 'Cable Included', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
		],
	},
	{
		id: 'cases',
		name: 'Cases & Protection Starter Kit',
		icon: ShieldCheck,
		fields: [
			{ key: 'compatibleModel', label: 'Compatible Device Model', field_type: 'text', options: '', unit: '', default_value: 'iPhone 15 Pro Max' },
			{ key: 'material', label: 'Material', field_type: 'select', options: 'Silicone, TPU + Polycarbonate, Genuine Leather, Kevlar Fiber', unit: '', default_value: 'Silicone' },
			{ key: 'dropProtection', label: 'Drop Protection Rating', field_type: 'select', options: '6 ft, 10 ft, 13 ft, Military Grade (MIL-STD-810G)', unit: '', default_value: '10 ft' },
			{ key: 'magsafeCompatible', label: 'MagSafe Compatible', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
			{ key: 'screenProtectorIncluded', label: 'Screen Protector Included', field_type: 'checkbox', options: '', unit: '', default_value: 'No' },
		],
	},
	{
		id: 'cables',
		name: 'Cables & Adapters Starter Kit',
		icon: Cable,
		fields: [
			{ key: 'connectorA', label: 'Connector A', field_type: 'select', options: 'USB-C, USB-A, Thunderbolt 4, Lightning', unit: '', default_value: 'USB-C' },
			{ key: 'connectorB', label: 'Connector B', field_type: 'select', options: 'USB-C, Lightning, HDMI, DisplayPort, 3.5mm', unit: '', default_value: 'USB-C' },
			{ key: 'cableLength', label: 'Cable Length', field_type: 'text', options: '', unit: 'm', default_value: '1.8m (6ft)' },
			{ key: 'maxPowerRating', label: 'Max Charging Power Rating', field_type: 'number', options: '', unit: 'W', default_value: '100' },
			{ key: 'dataSpeed', label: 'Data Transfer Speed', field_type: 'select', options: '480 Mbps (USB 2.0), 10 Gbps (USB 3.2), 40 Gbps (USB4/TB4)', unit: '', default_value: '10 Gbps (USB 3.2)' },
			{ key: 'braided', label: 'Nylon Braided Cable', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
		],
	},
	{
		id: 'repair',
		name: 'Repair Parts & Tools Starter Kit',
		icon: Wrench,
		fields: [
			{ key: 'compatibleDevice', label: 'Target Device / Model', field_type: 'text', options: '', unit: '', default_value: 'iPhone 14 / 14 Plus' },
			{ key: 'partType', label: 'Part Category', field_type: 'select', options: 'Screen & Digitizer Assembly, Battery, Charging Port Flex, Rear Glass, Camera Module', unit: '', default_value: 'Screen & Digitizer Assembly' },
			{ key: 'qualityGrade', label: 'Quality Grade', field_type: 'select', options: 'OEM Original, Premium OLED Aftermarket, Refurbished Genuine', unit: '', default_value: 'OEM Original' },
			{ key: 'warranty', label: 'Warranty Period', field_type: 'select', options: '90 Days, 6 Months, 1 Year, Lifetime', unit: '', default_value: '1 Year' },
			{ key: 'toolkitIncluded', label: 'Adhesive & Tools Included', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
		],
	},
	{
		id: 'wholesale',
		name: 'Wholesale Lots Starter Kit',
		icon: Boxes,
		fields: [
			{ key: 'lotQuantity', label: 'Total Lot Quantity', field_type: 'number', options: '', unit: 'units', default_value: '10' },
			{ key: 'conditionGrade', label: 'Tested Grade / Condition', field_type: 'select', options: 'Grade A (Like New), Grade B (Light Wear), Mixed CPO, As-Is / Parts Only', unit: '', default_value: 'Grade A (Like New)' },
			{ key: 'carrierStatus', label: 'Carrier Lock Status', field_type: 'select', options: 'Factory Unlocked, Carrier Locked (T-Mobile/AT&T), Mixed', unit: '', default_value: 'Factory Unlocked' },
			{ key: 'accessoriesStatus', label: 'Included Packaging', field_type: 'select', options: 'Handset Only (Handbag), Retail Boxed, Generic Boxed', unit: '', default_value: 'Handset Only (Handbag)' },
			{ key: 'manifestIncluded', label: 'Full IMEI Manifest Included', field_type: 'checkbox', options: '', unit: '', default_value: 'Yes' },
		],
	},
]

function slugifyKey(label: string): string {
	const words = label.trim().split(/[^a-zA-Z0-9]+/).filter(Boolean)
	if (words.length === 0) return ''
	return words.map((word, i) => (i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())).join('')
}

function fieldsToRows(fields?: SpecTemplateField[]): FieldRow[] {
	return (fields ?? [])
		.slice()
		.sort((a, b) => a.sort_order - b.sort_order)
		.map((f) => ({ key: f.key, label: f.label, field_type: f.field_type, options: (f.options ?? []).join(', '), unit: f.unit ?? '', default_value: f.default_value ?? '' }))
}

export default function SpecTemplatesPanel({ triggerAdd }: { triggerAdd: number }) {
	const { toast, confirm } = useToast()
	const { can } = useAdmin()
	const [templates, setTemplates] = useState<SpecTemplate[] | null>(null)
	const [productTypes, setProductTypes] = useState<ProductType[]>([])
	const [editing, setEditing] = useState<TemplateForm | null>(null)
	const [saving, setSaving] = useState(false)
	const [search, setSearch] = useState('')
	const [selectedTypeFilter, setSelectedTypeFilter] = useState('')
	const prevTrigger = useRef(0)
	const dragIndex = useRef<number | null>(null)

	const load = useCallback(() => {
		fetch('/api/admin/spec-templates').then((r) => r.json()).then((j) => setTemplates(j.specTemplates ?? [])).catch(() => setTemplates([]))
		fetch('/api/admin/product-types').then((r) => r.json()).then((j) => setProductTypes(j.productTypes ?? [])).catch(() => setProductTypes([]))
	}, [])

	useEffect(load, [load])

	useEffect(() => {
		if (triggerAdd !== prevTrigger.current) {
			prevTrigger.current = triggerAdd
			if (triggerAdd > 0) setEditing(EMPTY)
		}
	}, [triggerAdd])

	const typeName = (typeId: string) => productTypes.find((t) => t.id === typeId)?.name ?? '—'

	const setFieldRow = (index: number, next: Partial<FieldRow>) => {
		if (!editing) return
		const fields = [...editing.fields]
		fields[index] = { ...fields[index], ...next }
		setEditing({ ...editing, fields })
	}

	const applyStarterKit = (kitId: string) => {
		const kit = STARTER_KITS.find((k) => k.id === kitId)
		if (!kit || !editing) return
		setEditing({
			...editing,
			name: editing.name || kit.name.replace(' Starter Kit', ' Specs').replace(' (Full Specs)', ''),
			fields: kit.fields.map((f) => ({ ...f })),
		})
		toast({ title: `${kit.name} Applied!`, description: `${kit.fields.length} spec fields loaded into the form.`, variant: 'success' })
	}

	// ── Drag reorder for templates ──────────────────────────────────────────
	const onDragStart = (e: React.DragEvent, index: number) => {
		dragIndex.current = index
		e.dataTransfer.effectAllowed = 'move'
	}

	const onDrop = async (e: React.DragEvent, dropIndex: number) => {
		e.preventDefault()
		if (dragIndex.current === null || dragIndex.current === dropIndex || !templates) return
		const reordered = [...templates]
		const [moved] = reordered.splice(dragIndex.current, 1)
		reordered.splice(dropIndex, 0, moved)
		setTemplates(reordered)
		dragIndex.current = null
		await Promise.all(
			reordered.map((t, i) =>
				fetch(`/api/admin/spec-templates/${t.id}`, {
					method: 'PATCH',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({ sort_order: i }),
				})
			)
		).catch(() => toast({ title: 'Failed to save order', variant: 'error' }))
	}

	const save = async () => {
		if (!editing) return
		if (!editing.name.trim() || !editing.product_type_id) { toast({ title: 'Name and Product Type are required', variant: 'error' }); return }
		setSaving(true)
		try {
			const payload = {
				...editing,
				fields: editing.fields.filter((f) => f.label.trim()).map((f) => ({
					key: f.key.trim() || slugifyKey(f.label),
					label: f.label.trim(),
					field_type: f.field_type,
					options: f.field_type === 'select' ? f.options.split(',').map((o) => o.trim()).filter(Boolean) : null,
					unit: f.unit.trim() || null,
					default_value: f.default_value.trim() || null,
				})),
			}
			const res = await fetch(editing.id ? `/api/admin/spec-templates/${editing.id}` : '/api/admin/spec-templates', { method: editing.id ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: editing.id ? 'Template updated' : 'Template created', variant: 'success' })
			setEditing(null); load()
		} catch (err) {
			toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally { setSaving(false) }
	}

	const remove = async (template: SpecTemplate) => {
		const ok = await confirm({ title: 'Delete spec template?', description: `"${template.name}" will be removed.`, confirmLabel: 'Delete', destructive: true })
		if (!ok) return
		const res = await fetch(`/api/admin/spec-templates/${template.id}`, { method: 'DELETE' })
		const json = await res.json()
		if (res.ok) { toast({ title: 'Template deleted', variant: 'success' }); load() }
		else toast({ title: 'Cannot delete', description: json.error, variant: 'error' })
	}

	const filteredTemplates = (templates ?? []).filter((t) => {
		if (search.trim() && !t.name.toLowerCase().includes(search.toLowerCase())) return false
		if (selectedTypeFilter && t.product_type_id !== selectedTypeFilter) return false
		return true
	})

	const writable = can('categories:write')
	const label = 'text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block'

	return (
		<div className="space-y-4">
			{/* Filter Bar */}
			<div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-[#E9ECEA] shadow-3xs">
				<div className="flex flex-wrap items-center gap-2 flex-1">
					<div className="relative flex-1 min-w-[200px] max-w-sm">
						<Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
						<input
							placeholder="Search spec templates..."
							value={search}
							onChange={(e) => setSearch(e.target.value)}
							className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-[#E9ECEA] bg-[#F7F7F5] text-xs focus:outline-none focus:border-[#599161] focus:bg-white transition-all font-sans"
						/>
					</div>
					<select
						value={selectedTypeFilter}
						onChange={(e) => setSelectedTypeFilter(e.target.value)}
						className="px-3 py-1.5 rounded-xl border border-[#E9ECEA] bg-[#F7F7F5] text-xs focus:outline-none focus:border-[#599161] bg-white cursor-pointer font-sans font-semibold"
					>
						<option value="">All Product Types</option>
						{productTypes.map((pt) => (
							<option key={pt.id} value={pt.id}>{pt.name}</option>
						))}
					</select>
					{(search || selectedTypeFilter) && (
						<button
							type="button"
							onClick={() => { setSearch(''); setSelectedTypeFilter('') }}
							className="text-xs text-muted-foreground hover:text-destructive transition-colors px-2 py-1 cursor-pointer"
						>
							Clear Filter
						</button>
					)}
				</div>
			</div>

			{templates === null ? <TableShimmer /> : filteredTemplates.length === 0 ? <EmptyState message="No spec templates match your filter." /> : (
				<div className="border border-border rounded-3xl overflow-hidden bg-card overflow-x-auto">
					<table className="w-full text-sm min-w-[560px]">
						<thead>
							<tr className="bg-secondary text-left">
								<th className="w-8 px-3 py-3.5" />
								{['Template Name', 'Product Type', 'Fields Count', 'Status', ''].map((h) => (
									<th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">{h}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{filteredTemplates.map((template, index) => (
								<tr
									key={template.id}
									draggable
									onDragStart={(e) => onDragStart(e, index)}
									onDragOver={(e) => e.preventDefault()}
									onDrop={(e) => onDrop(e, index)}
									className="border-t border-border hover:bg-muted/40 transition-colors"
								>
									<td className="pl-3 pr-1 py-3.5 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing">
										<GripVertical className="w-4 h-4" />
									</td>
									<td className="px-5 py-3.5 font-medium text-card-foreground">{template.name}</td>
									<td className="px-5 py-3.5 text-foreground/75">
										<span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#F7F7F5] border border-[#E9ECEA]">
											{typeName(template.product_type_id)}
										</span>
									</td>
									<td className="px-5 py-3.5 text-foreground/75 font-semibold">{template.spec_template_fields?.length ?? 0} fields</td>
									<td className="px-5 py-3.5">
										<span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.1em] ${template.is_active ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground/60'}`}>
											{template.is_active ? 'Active' : 'Hidden'}
										</span>
									</td>
									<td className="px-5 py-3.5">
										{writable && (
											<div className="flex items-center gap-1.5 justify-end">
												<button onClick={() => setEditing({ id: template.id, name: template.name, product_type_id: template.product_type_id, is_active: template.is_active, fields: fieldsToRows(template.spec_template_fields) })} className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-all cursor-pointer" aria-label="Edit"><Pencil className="w-4 h-4" /></button>
												<button onClick={() => remove(template)} className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer" aria-label="Delete"><Trash2 className="w-4 h-4" /></button>
											</div>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{editing && (
				<Modal open onClose={() => setEditing(null)} title={editing.id ? 'Edit Spec Template' : 'Create Spec Template'} wide>
					<div className="space-y-6">
						{/* 1-Click Starter Kits Dropdown Toolbar */}
						<div className="bg-[#EEF7F0]/60 border border-[#C8E6CE] rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
							<div>
								<p className="text-xs font-bold text-[#599161] uppercase tracking-wider">
									1-Click Category Starter Kits
								</p>
								<p className="text-[11px] text-muted-foreground mt-0.5">Auto-populate template fields for any product category in 1 click.</p>
							</div>
							<select
								defaultValue=""
								onChange={(e) => {
									if (e.target.value) {
										applyStarterKit(e.target.value)
										e.target.value = ''
									}
								}}
								className="w-full sm:w-72 px-3.5 py-2 rounded-xl border border-[#C8E6CE] bg-white text-xs font-semibold text-foreground/80 focus:outline-none focus:border-[#599161] cursor-pointer shadow-3xs"
							>
								<option value="" disabled>Select a Starter Kit to Auto-Fill...</option>
								{STARTER_KITS.map((kit) => (
									<option key={kit.id} value={kit.id}>
										{kit.name} ({kit.fields.length} fields)
									</option>
								))}
							</select>
						</div>

						<div className="grid sm:grid-cols-2 gap-4">
							<div><label className={label}>Template Name</label><input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={adminInput} placeholder="e.g. Laptop Specs, Smartphone Specs" /></div>
							<div>
								<label className={label}>Product Type</label>
								<select value={editing.product_type_id} onChange={(e) => setEditing({ ...editing, product_type_id: e.target.value })} className={`${adminInput} cursor-pointer`}>
									<option value="">Select a product type</option>
									{productTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
								</select>
							</div>
							<label className="flex items-center gap-2.5 cursor-pointer col-span-2"><input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="w-4 h-4 accent-[var(--primary)] cursor-pointer" /><span className="text-xs font-semibold text-foreground">Active</span></label>
						</div>

						<div>
							<div className="flex items-center justify-between mb-3">
								<label className={label}>Fields Definition ({editing.fields.length} fields)</label>
								<button type="button" onClick={() => setEditing({ ...editing, fields: [...editing.fields, { key: '', label: '', field_type: 'text', options: '', unit: '', default_value: '' }] })} className={`${adminButtonGhost} px-3.5 py-1.5`}><Plus className="w-3 h-3" />Add Field</button>
							</div>
							{editing.fields.length > 0 && (
								<div className="border border-border rounded-2xl overflow-hidden overflow-x-auto max-h-[420px] overflow-y-auto">
									<table className="w-full text-sm min-w-[780px]">
										<thead className="sticky top-0 bg-secondary z-10"><tr className="text-left">{['Label', 'Type', 'Options', 'Unit', 'Default Value', ''].map((h) => <th key={h} className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">{h}</th>)}</tr></thead>
										<tbody>
											{editing.fields.map((field, index) => (
												<tr key={index} className="border-t border-border">
													<td className="px-3 py-2"><input value={field.label} onChange={(e) => setFieldRow(index, { label: e.target.value, key: field.key || slugifyKey(e.target.value) })} className={adminInput} placeholder="Material" /></td>
													<td className="px-3 py-2"><select value={field.field_type} onChange={(e) => setFieldRow(index, { field_type: e.target.value as SpecFieldType })} className={`${adminInput} cursor-pointer`}><option value="text">Text</option><option value="number">Number</option><option value="select">Select</option><option value="checkbox">Checkbox</option></select></td>
													<td className="px-3 py-2"><input value={field.options} onChange={(e) => setFieldRow(index, { options: e.target.value })} className={adminInput} placeholder={field.field_type === 'select' ? 'Option A, Option B' : '—'} disabled={field.field_type !== 'select'} /></td>
													<td className="px-3 py-2"><input value={field.unit} onChange={(e) => setFieldRow(index, { unit: e.target.value })} className={adminInput} placeholder="e.g. GB, inches, mAh" /></td>
													<td className="px-3 py-2">
														{field.field_type === 'checkbox' ? (
															<label className="flex items-center justify-center h-full cursor-pointer"><input type="checkbox" checked={field.default_value === 'Yes'} onChange={(e) => setFieldRow(index, { default_value: e.target.checked ? 'Yes' : '' })} className="w-4 h-4 accent-[var(--primary)] cursor-pointer" /></label>
														) : field.field_type === 'select' ? (
															<select value={field.default_value} onChange={(e) => setFieldRow(index, { default_value: e.target.value })} className={`${adminInput} cursor-pointer`}><option value="">—</option>{field.options.split(',').map((o) => o.trim()).filter(Boolean).map((opt) => <option key={opt} value={opt}>{opt}</option>)}</select>
														) : (
															<input type={field.field_type === 'number' ? 'number' : 'text'} value={field.default_value} onChange={(e) => setFieldRow(index, { default_value: e.target.value })} className={adminInput} placeholder="Optional" />
														)}
													</td>
													<td className="px-3 py-2"><button type="button" onClick={() => setEditing({ ...editing, fields: editing.fields.filter((_, i) => i !== index) })} className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer" aria-label="Remove field"><Trash2 className="w-4 h-4" /></button></td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>
						<div className="flex justify-end gap-3 pt-4 border-t border-border">
							<button onClick={() => setEditing(null)} className={adminButtonGhost}>Cancel</button>
							<button onClick={save} disabled={saving} className={adminButton}>{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}Save Template</button>
						</div>
					</div>
				</Modal>
			)}
		</div>
	)
}
