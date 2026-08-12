'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Upload, Check, X, ImageIcon, Loader2, MessageCircle, Search, Plus, HardDrive, Star, Gift, Info } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'
import { useToast } from '@/components/ui/toast'
import { PhoneInput } from '@/components/ui/phone-input'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'
import { fetchCmsPage } from '@/lib/data'
import { uploadSellPhoneImages, MAX_UPLOAD_BYTES } from '@/lib/storage'
import { isValidPhone } from '@/lib/tax'
import { PHONE_COUNTRIES } from '@/lib/phone-countries'
import { formatRequestId } from '@/lib/sell-request-contact'

const CONDITIONS = [
	{ value: 'excellent', label: 'Excellent (Like New)' },
	{ value: 'good', label: 'Good (Minor Wear)' },
	{ value: 'fair', label: 'Fair (Visible Wear)' },
	{ value: 'poor', label: 'Poor (Heavy Wear / Damage)' },
] as const

// Storage capacity choices shown as cards once a device type is picked.
const STORAGE_OPTIONS: Record<string, string[]> = {
	iphone: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'],
	galaxy: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'],
	ipad: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'],
	tablet: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'],
	laptop: ['256 GB', '512 GB', '1 TB', '2 TB'],
	other: ['64 GB', '128 GB', '256 GB', '512 GB', '1 TB'],
}

// "Are there any problems with your device?" picker. Selecting one or more
// (besides "None") auto-derives form.condition and form.damages so we don't
// need a separate manual condition dropdown.
const PROBLEM_OPTIONS = [
	{ id: 'none', title: 'None', description: 'Device works just like new!', severity: 'excellent' },
	{ id: 'screen_damage', title: 'Damaged Screen or Backplate', description: 'Cracked, scratched, or broken glass', severity: 'poor' },
	{ id: 'camera_issue', title: 'Issue with the Camera', description: 'Blurry or black dots on photos', severity: 'fair' },
	{ id: 'no_power', title: 'No Power', description: 'Does not power on or has water damage', severity: 'poor' },
	{ id: 'esim_only', title: 'eSIM only', description: 'Phone can only connect using eSIM', severity: 'good' },
	{ id: 'other', title: 'Other Issues', description: "Something else that isn't quite right", severity: 'fair' },
] as const

const CONDITION_RANK: Record<typeof CONDITIONS[number]['value'], number> = { excellent: 0, good: 1, fair: 2, poor: 3 }

// Cosmetic-only condition (deliberately ignores functional damage, which the
// problem cards above already capture). Feeds form.condition alongside the
// problem picker — whichever implies the worse condition wins.
const COSMETIC_OPTIONS = [
	{
		id: 'good',
		label: 'Good',
		description: 'Everyday Wear and Tear',
		stars: 2,
		condition: 'fair' as const,
		details: [
			"Scrapes or chips along the device's sides and corners",
			"Light scratches on the screen that don't interfere with everyday use",
			'Scuffing on the backplate',
		],
	},
	{
		id: 'very_good',
		label: 'Very Good',
		description: 'Well Kept with Minor Flaws',
		stars: 4,
		condition: 'good' as const,
		details: [
			'Minor scratches only visible under close inspection',
			'No dents, cracks, or chips',
			'Normal signs of handling with proper care',
		],
	},
	{
		id: 'like_new',
		label: 'Like new',
		description: 'Looks Like a New Device',
		stars: 5,
		condition: 'excellent' as const,
		details: [
			'No visible scratches or scuffs',
			'Screen and body in excellent condition',
			'Looks and feels like it just came out of the box',
		],
	},
	{
		id: 'brand_new',
		label: 'Brand New In-Box',
		description: 'In sealed packaging',
		stars: 0,
		condition: 'excellent' as const,
		details: [
			'Factory sealed, unopened box',
			'Includes all original accessories',
			'Full manufacturer warranty intact',
		],
	},
] as const

export default function SellYourPhonePage() {
	const { toast } = useToast()
	const { user } = useAuth()
	const [submitting, setSubmitting] = useState(false)
	const [submitted, setSubmitted] = useState(false)
	const [submittedRequestId, setSubmittedRequestId] = useState<string | null>(null)
	const [successCopy, setSuccessCopy] = useState<{ title: string; content: string } | null>(null)
	const [supportWhatsapp, setSupportWhatsapp] = useState<string | null>(null)
	const [files, setFiles] = useState<File[]>([])
	const [phoneCountry, setPhoneCountry] = useState(PHONE_COUNTRIES[0])
	const [agreedToPolicy, setAgreedToPolicy] = useState(false)
	const [form, setForm] = useState({
		brand: '',
		model: '',
		storage: '',
		condition: 'good' as 'excellent' | 'good' | 'fair' | 'poor',
		damages: '',
		comments: '',
		name: '',
		email: '',
		phone: '',
	})
	const [selectedDeviceType, setSelectedDeviceType] = useState<string | null>(null)
	const [selectedModel, setSelectedModel] = useState<string | null>(null)
	const [isModelConfirmed, setIsModelConfirmed] = useState(false)
	const [customBrand, setCustomBrand] = useState('')
	const [customModel, setCustomModel] = useState('')
	const [selectedStorage, setSelectedStorage] = useState<string | null>(null)
	const [selectedProblems, setSelectedProblems] = useState<string[]>([])
	const [selectedCosmetic, setSelectedCosmetic] = useState<string | null>(null)

	const selectStorage = (value: string) => {
		setSelectedStorage(value)
		setForm((f) => ({ ...f, storage: value }))
	}

	const toggleProblem = (id: string) => {
		setSelectedProblems((prev) => {
			if (id === 'none') return prev.includes('none') ? [] : ['none']
			const withoutNone = prev.filter((p) => p !== 'none')
			return withoutNone.includes(id) ? withoutNone.filter((p) => p !== id) : [...withoutNone, id]
		})
	}

	// Derive form.condition from whichever is worse: the cosmetic star rating,
	// or the functional problem cards. form.damages comes from the problems only
	// (cosmetic condition deliberately ignores damage).
	useEffect(() => {
		if (selectedProblems.length === 0 && !selectedCosmetic) return
		const chosenProblems = PROBLEM_OPTIONS.filter((p) => selectedProblems.includes(p.id))
		const cosmetic = COSMETIC_OPTIONS.find((c) => c.id === selectedCosmetic)
		const candidates: typeof CONDITIONS[number]['value'][] = [
			...chosenProblems.map((p) => p.severity),
			...(cosmetic ? [cosmetic.condition] : []),
		]
		const worst = candidates.reduce<typeof CONDITIONS[number]['value']>(
			(acc, c) => (CONDITION_RANK[c] > CONDITION_RANK[acc] ? c : acc),
			'excellent'
		)
		const damageText = selectedProblems.includes('none') ? '' : chosenProblems.map((p) => p.title).join(', ')
		setForm((f) => ({ ...f, condition: worst, damages: damageText }))
	}, [selectedProblems, selectedCosmetic])

	const DEVICE_TYPES = [
		{ id: 'iphone', label: 'Apple iPhone', brand: 'Apple', image: '/iphone_category.webp' },
		{ id: 'galaxy', label: 'Galaxy', brand: 'Samsung', image: '/samsung_category.webp' },
		{ id: 'ipad', label: 'Apple iPad', brand: 'Apple', image: '/ipad_category.webp' },
		{ id: 'laptop', label: 'Laptop', brand: '', image: '/laptop_category.webp' },
		{ id: 'tablet', label: 'Tablet', brand: '', image: '/tablets_category.webp' },
		{ id: 'other', label: 'Other', brand: '', image: '/other_phones_category.png' },
	]

	const MODELS_DATA: Record<string, { label: string; image: string }[]> = {
		iphone: [
			{ label: 'iPhone 17 Pro Max', image: '/iphone_17_group.png' },
			{ label: 'iPhone 17 Pro', image: '/iphone_17_group.png' },
			{ label: 'iPhone 17 Air', image: '/iphone_17_group.png' },
			{ label: 'iPhone 17', image: '/iphone_17_group.png' },
			{ label: 'iPhone 16 Pro Max', image: '/iphone_16_group.png' },
			{ label: 'iPhone 16 Pro', image: '/iphone_16_group.png' },
			{ label: 'iPhone 16 Plus', image: '/iphone_16_group.png' },
			{ label: 'iPhone 16', image: '/iphone_16_group.png' },
			{ label: 'iPhone 15 Pro Max', image: '/iphone_15_group.png' },
			{ label: 'iPhone 15 Pro', image: '/iphone_15_group.png' },
			{ label: 'iPhone 15 Plus', image: '/iphone_15_group.png' },
			{ label: 'iPhone 15', image: '/iphone_15_group.png' },
			{ label: 'iPhone 14 Pro Max', image: '/iphone_14_group.png' },
			{ label: 'iPhone 14 Pro', image: '/iphone_14_group.png' },
			{ label: 'iPhone 14 Plus', image: '/iphone_14_group.png' },
			{ label: 'iPhone 14', image: '/iphone_14_group.png' },
			{ label: 'iPhone SE 2022', image: '/iphone_se_group.png?v=5' },
			{ label: 'iPhone 13 Pro Max', image: '/iphone_13_pro_group.png?v=5' },
			{ label: 'iPhone 13 Pro', image: '/iphone_13_pro_group.png?v=5' },
			{ label: 'iPhone 13', image: '/iphone_13_group.png?v=5' },
			{ label: 'iPhone 13 Mini', image: '/iphone_13_group.png?v=5' },
			{ label: 'iPhone 12 Pro Max', image: '/iphone_12_pro_group.png?v=5' },
			{ label: 'iPhone 12 Pro', image: '/iphone_12_pro_group.png?v=5' },
			{ label: 'iPhone 12', image: '/iphone_12_group.png?v=5' },
			{ label: 'iPhone 12 Mini', image: '/iphone_12_group.png?v=5' },
			{ label: 'iPhone 11 Pro Max', image: '/iphone_11_pro_group.png?v=5' },
			{ label: 'iPhone 11 Pro', image: '/iphone_11_pro_group.png?v=5' },
			{ label: 'iPhone 11', image: '/iphone_11_group.png?v=5' },
			{ label: 'iPhone XR', image: '/iphone_xr_group.png?v=5' },
			{ label: 'iPhone XS Max', image: '/iphone_xs_group.png?v=5' },
			{ label: 'iPhone XS', image: '/iphone_xs_group.png?v=5' },
			{ label: 'iPhone X', image: '/iphone_x_group.png?v=5' },
			{ label: 'iPhone 8 Plus', image: '/iphone_8_group.png?v=5' },
			{ label: 'iPhone 8', image: '/iphone_8_group.png?v=5' },
			{ label: 'iPhone SE 2020', image: '/iphone_se_group.png?v=5' },
		],
		pixel: [
			{ label: 'Pixel 9 Pro XL', image: '/other_phones_category.png' },
			{ label: 'Pixel 9 Pro', image: '/other_phones_category.png' },
			{ label: 'Pixel 9', image: '/other_phones_category.png' },
			{ label: 'Pixel 8 Pro', image: '/other_phones_category.png' },
			{ label: 'Pixel 8', image: '/other_phones_category.png' },
			{ label: 'Pixel 7 Pro', image: '/other_phones_category.png' },
			{ label: 'Pixel 7', image: '/other_phones_category.png' },
		],
		galaxy: [
			{ label: 'Galaxy S25 Ultra', image: '/samsung_s25_ultra.png?v=5' },
			{ label: 'Galaxy S25+', image: '/samsung_s25_plus.png?v=5' },
			{ label: 'Galaxy S25', image: '/samsung_s25.png?v=5' },
			{ label: 'Galaxy Z Fold6', image: '/samsung_z_fold6.png?v=5' },
			{ label: 'Galaxy Z Flip6', image: '/samsung_z_flip6.png?v=5' },
			{ label: 'Galaxy S24 Ultra', image: '/samsung_s24_ultra.png?v=5' },
			{ label: 'Galaxy S24+', image: '/samsung_s24_plus.png?v=5' },
			{ label: 'Galaxy S24', image: '/samsung_s24.png?v=5' },
			{ label: 'Galaxy Z Fold5', image: '/samsung_z_fold5.png?v=5' },
			{ label: 'Galaxy Z Flip5', image: '/samsung_z_flip5.png?v=5' },
			{ label: 'Galaxy S23 Ultra', image: '/samsung_s23_ultra.png?v=5' },
			{ label: 'Galaxy S23+', image: '/samsung_s23_plus.png?v=5' },
			{ label: 'Galaxy S23', image: '/samsung_s23.png?v=5' },
			{ label: 'Galaxy Z Fold4', image: '/samsung_z_fold4.png?v=5' },
			{ label: 'Galaxy Z Flip4', image: '/samsung_z_flip4.png?v=5' },
			{ label: 'Galaxy S22 Ultra', image: '/samsung_s22_ultra.png?v=5' },
			{ label: 'Galaxy S22+', image: '/samsung_s22_plus.png?v=5' },
			{ label: 'Galaxy S22', image: '/samsung_s22.png?v=5' },
			{ label: 'Galaxy Z Fold3', image: '/samsung_z_fold3.png?v=5' },
			{ label: 'Galaxy Z Flip3', image: '/samsung_z_flip3.png?v=5' },
			{ label: 'Galaxy S21 Ultra', image: '/samsung_s21_ultra.png?v=5' },
			{ label: 'Galaxy S21+', image: '/samsung_s21_plus.png?v=5' },
			{ label: 'Galaxy S21', image: '/samsung_s21.png?v=5' },
			{ label: 'Galaxy Z Fold2', image: '/samsung_z_fold2.png?v=5' },
			{ label: 'Galaxy Z Flip', image: '/samsung_z_flip.png?v=5' },
			{ label: 'Galaxy S20 Ultra', image: '/samsung_s20_ultra.png?v=5' },
			{ label: 'Galaxy S20+', image: '/samsung_s20_plus.png?v=5' },
			{ label: 'Galaxy S20', image: '/samsung_s20.png?v=5' },
			{ label: 'Galaxy Note20 Ultra', image: '/samsung_note20_ultra.png?v=5' },
			{ label: 'Galaxy Note20', image: '/samsung_note20.png?v=5' },
			{ label: 'Galaxy S10+', image: '/samsung_s10_plus.png?v=5' },
			{ label: 'Galaxy S10', image: '/samsung_s10.png?v=5' },
			{ label: 'Galaxy S10e', image: '/samsung_s10e.png?v=5' },
			{ label: 'Galaxy Note10+', image: '/samsung_note10_plus.png?v=5' },
			{ label: 'Galaxy Note10', image: '/samsung_note10.png?v=5' },
			{ label: 'Galaxy S9+', image: '/samsung_s9_plus.png?v=5' },
			{ label: 'Galaxy S9', image: '/samsung_s9.png?v=5' },
			{ label: 'Galaxy Note9', image: '/samsung_note9.png?v=5' },
			{ label: 'Galaxy S8+', image: '/samsung_s8_plus.png?v=5' },
			{ label: 'Galaxy S8', image: '/samsung_s8.png?v=5' },
			{ label: 'Galaxy Note8', image: '/samsung_note8.png?v=5' },
			{ label: 'Galaxy S7 Edge', image: '/samsung_s7_edge.png?v=5' },
			{ label: 'Galaxy S7', image: '/samsung_s7.png?v=5' },
			{ label: 'Galaxy A54 5G', image: '/samsung_a54_5g.png?v=5' },
			{ label: 'Galaxy A34 5G', image: '/samsung_a34_5g.png?v=5' },
		],
		ipad: [
			{ label: 'iPad Pro 7 - 13" (M4)', image: '/ipad_pro_7_13_m4.png?v=5' },
			{ label: 'iPad Pro 7 - 11" (M4)', image: '/ipad_pro_7_11_m4.png?v=5' },
			{ label: 'iPad Air 7 - 13" (M3)', image: '/ipad_air_7_13_m3.png?v=5' },
			{ label: 'iPad Air 7 - 11" (M3)', image: '/ipad_air_7_11_m3.png?v=5' },
			{ label: 'iPad Pro 6 - 12.9" (M2)', image: '/ipad_pro_6_129_m2.png?v=5' },
			{ label: 'iPad Pro 6 - 11" (M2)', image: '/ipad_pro_6_11_m2.png?v=5' },
			{ label: 'iPad Air 6 - 13" (M2)', image: '/ipad_air_6_13_m2.png?v=5' },
			{ label: 'iPad Air 6 - 11" (M2)', image: '/ipad_air_6_11_m2.png?v=5' },
			{ label: 'iPad Pro 5 - 12.9" (M1)', image: '/ipad_pro_5_129_m1.png?v=5' },
			{ label: 'iPad Pro 5 - 11" (M1)', image: '/ipad_pro_5_11_m1.png?v=5' },
			{ label: 'iPad Air 5 - 10.9" (M1)', image: '/ipad_air_5_109_m1.png?v=5' },
			{ label: 'iPad Air 4 - 10.9" (A14)', image: '/ipad_air_4_109_a14.png?v=5' },
			{ label: 'iPad 10th gen - 10.9"', image: '/ipad_10th_gen_109.png?v=5' },
			{ label: 'iPad 9th gen - 10.2"', image: '/ipad_9th_gen_102.png?v=5' },
			{ label: 'iPad 8th gen - 10.2"', image: '/ipad_8th_gen_102.png?v=5' },
			{ label: 'iPad 7th gen - 10.2"', image: '/ipad_7th_gen_102.png?v=5' },
			{ label: 'iPad 6th gen - 9.7"', image: '/ipad_6th_gen_97.png?v=5' },
			{ label: 'iPad 5th gen - 9.7"', image: '/ipad_5th_gen_97.png?v=5' },
			{ label: 'iPad mini 6 - 8.3"', image: '/ipad_mini_6_83.png?v=5' },
			{ label: 'iPad mini 5 - 7.9"', image: '/ipad_mini_5_79.png?v=5' },
			{ label: 'iPad mini 4 - 7.9"', image: '/ipad_mini_4_79.png?v=5' },
			{ label: 'iPad mini 3 - 7.9"', image: '/ipad_mini_3_79.png?v=5' },
			{ label: 'iPad mini 2 - 7.9"', image: '/ipad_mini_2_79.png?v=5' },
			{ label: 'iPad mini 1 - 7.9"', image: '/ipad_mini_1_79.png?v=5' },
		],
		laptop: [
			{ label: 'MacBook Pro 16" (2024)', image: '/macbook_pro_16_2024.png?v=7' },
			{ label: 'MacBook Pro 14" (2024)', image: '/macbook_pro_14_2024.png?v=7' },
			{ label: 'MacBook Pro 16" (2023)', image: '/macbook_pro_16_2023.png?v=7' },
			{ label: 'MacBook Pro 14" (2023)', image: '/macbook_pro_14_2023.png?v=7' },
			{ label: 'MacBook Air 15" (2024)', image: '/macbook_air_15_2024.png?v=7' },
			{ label: 'MacBook Air 13" (2024)', image: '/macbook_air_13_2024.png?v=7' },
			{ label: 'MacBook Pro 16" (2021)', image: '/macbook_pro_16_2021.png?v=7' },
			{ label: 'MacBook Pro 14" (2021)', image: '/macbook_pro_14_2021.png?v=7' },
			{ label: 'MacBook Air 13" (2022)', image: '/macbook_air_13_2022.png?v=7' },
			{ label: 'MacBook Pro 13" (2022)', image: '/macbook_pro_13_2022.png?v=7' },
			{ label: 'MacBook Air 13" (2020)', image: '/macbook_air_13_2020.png?v=7' },
			{ label: 'MacBook Pro 13" (2020)', image: '/macbook_pro_13_2020.png?v=7' },
			{ label: 'MacBook Pro 16" (2019)', image: '/macbook_pro_16_2019.png?v=7' },
			{ label: 'MacBook Pro 15" (2019)', image: '/macbook_pro_15_2019.png?v=7' },
			{ label: 'MacBook Pro 13" (2019)', image: '/macbook_pro_13_2019.png?v=7' },
			{ label: 'MacBook Air 13" (2018)', image: '/macbook_air_13_2018.png?v=7' },
			{ label: 'MacBook 12" (2017)', image: '/macbook_12_2017.png?v=7' },
			{ label: 'MacBook 12" (2016)', image: '/macbook_12_2016.png?v=7' },
		],
		tablet: [
			{ label: 'Galaxy Tab S10 Ultra (2024)', image: '/tablet_galaxy_tab_s10_ultra_2024.png' },
			{ label: 'Galaxy Tab S10+ (2024)', image: '/tablet_galaxy_tab_s10_plus_2024.png' },
			{ label: 'Galaxy Tab S10 (2024)', image: '/tablet_galaxy_tab_s10_2024.png' },
			{ label: 'Galaxy Tab S9 Ultra (2023)', image: '/tablet_galaxy_tab_s9_ultra_2023.png' },
			{ label: 'Galaxy Tab S9+ (2023)', image: '/tablet_galaxy_tab_s9_plus_2023.png' },
			{ label: 'Galaxy Tab S9 (2023)', image: '/tablet_galaxy_tab_s9_2023.png' },
			{ label: 'Galaxy Tab S8 Ultra (2022)', image: '/tablet_galaxy_tab_s8_ultra_2022.png' },
			{ label: 'Galaxy Tab S8+ (2022)', image: '/tablet_galaxy_tab_s8_plus_2022.png' },
			{ label: 'Galaxy Tab S8 (2022)', image: '/tablet_galaxy_tab_s8_2022.png' },
			{ label: 'Galaxy Tab A8 (2021)', image: '/tablet_galaxy_tab_a8_2021.png' },
			{ label: 'Galaxy Tab A7 (2020)', image: '/tablet_galaxy_tab_a7_2020.png' },
			{ label: 'Galaxy Tab A7 Lite (2021)', image: '/tablet_galaxy_tab_a7_lite_2021.png' },
			{ label: 'Lenovo Tab P12 Pro (2024)', image: '/tablet_lenovo_p12_pro_2024.png' },
			{ label: 'Lenovo Tab P12 (2023)', image: '/tablet_lenovo_p12_2023.png' },
			{ label: 'Lenovo Tab Extreme (2023)', image: '/tablet_lenovo_extreme_2023.png' },
			{ label: 'Lenovo Tab P11 Pro (2022)', image: '/tablet_lenovo_p11_pro_2022.png' },
			{ label: 'Lenovo Tab P11 (2nd Gen) (2022)', image: '/tablet_lenovo_p11_2ndgen_2022.png' },
			{ label: 'Lenovo Tab M10 Plus (3rd Gen) (2022)', image: '/tablet_lenovo_m10_plus_3rdgen_2022.png' },
			{ label: 'Lenovo Tab M10 FHD Plus (2nd Gen) (2020)', image: '/tablet_lenovo_m10_fhd_plus_2ndgen_2020.png' },
			{ label: 'Lenovo Tab M8 (HD) (2019)', image: '/tablet_lenovo_m8_hd_2019.png' },
			{ label: 'OnePlus Pad 2 (2024)', image: '/tablet_oneplus_pad_2_2024.png' },
			{ label: 'OnePlus Pad (2023)', image: '/tablet_oneplus_pad_2023.png' },
			{ label: 'Xiaomi Pad 6S Pro 12.4 (2024)', image: '/tablet_xiaomi_pad_6s_pro_124_2024.png' },
			{ label: 'Xiaomi Pad 6 (2023)', image: '/tablet_xiaomi_pad_6_2023.png' },
			{ label: 'HONOR Pad 9 (2023)', image: '/tablet_honor_pad_9_2023.png' },
			{ label: 'HUAWEI MatePad 11.5"S (2024)', image: '/tablet_huawei_matepad_115s_2024.png' },
			{ label: 'HUAWEI MatePad 11 (2023)', image: '/tablet_huawei_matepad_11_2023.png' },
			{ label: 'realme Pad 2 (2023)', image: '/tablet_realme_pad_2_2023.png' },
		],
	}

	// Success-screen copy comes from the CMS, not hardcoded strings
	useEffect(() => {
		fetchCmsPage('sell-success')
			.then((page) =>
				setSuccessCopy(
					page
						? { title: page.title, content: page.content ?? '' }
						: null
				)
			)
			.catch(() => setSuccessCopy(null))

		supabase
			.from('country_contact_info')
			.select('whatsapp_number')
			.not('whatsapp_number', 'is', null)
			.limit(1)
			.maybeSingle()
			.then(
				({ data }) => setSupportWhatsapp(data?.whatsapp_number ?? null),
				() => setSupportWhatsapp(null)
			)
	}, [])

	const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
		setForm((f) => ({ ...f, [field]: e.target.value }))

	const handleFiles = (selected: FileList | null) => {
		if (!selected) return
		const next: File[] = [...files]
		for (const file of Array.from(selected)) {
			if (!file.type.startsWith('image/')) {
				toast({ title: 'Unsupported file', description: `${file.name} is not an image.`, variant: 'error' })
				continue
			}
			if (file.size > MAX_UPLOAD_BYTES) {
				toast({ title: 'File too large', description: `${file.name} exceeds the 5MB limit.`, variant: 'error' })
				continue
			}
			if (next.length >= 8) break
			next.push(file)
		}
		setFiles(next)
	}

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!form.brand.trim() || !form.model.trim()) {
			toast({ title: 'Missing details', description: 'Device brand and model are required.', variant: 'error' })
			return
		}
		if (!form.email.trim() && !form.phone.trim()) {
			toast({ title: 'Contact required', description: 'Provide an email or a phone number so we can send your quote.', variant: 'error' })
			return
		}
		if (form.phone.trim() && !isValidPhone(form.phone)) {
			toast({ title: 'Invalid phone', description: 'Please enter a valid phone number (10–15 digits).', variant: 'error' })
			return
		}
		if (!agreedToPolicy) {
			toast({ title: 'Policy acceptance required', description: 'Please accept the Sell Your Device policy to continue.', variant: 'error' })
			return
		}

		setSubmitting(true)
		try {
			const description = [
				form.storage && `Storage: ${form.storage}`,
				form.damages && `Damages: ${form.damages}`,
				form.comments && `Comments: ${form.comments}`,
				form.name && `Contact name: ${form.name}`,
			]
				.filter(Boolean)
				.join('\n')

			// Upload photos first (compressed client-side). If any upload fails the
			// helper rolls back already-uploaded files and throws — we then abort
			// without writing the request row.
			const requestId = crypto.randomUUID()
			const uploaded = await uploadSellPhoneImages(requestId, files)

			const { error: insertError } = await supabase.from('sell_phone_requests').insert({
				id: requestId,
				user_id: user?.id ?? null,
				device_brand: form.brand.trim(),
				device_model: form.model.trim(),
				condition: form.condition,
				description,
				contact_phone: form.phone.trim() ? `${phoneCountry.dial} ${form.phone.trim()}` : null,
				contact_email: form.email.trim() || null,
				status: 'submitted',
			})
			if (insertError) {
				// Roll back storage so no dead files remain
				if (uploaded.length > 0) {
					await supabase.storage
						.from('sell-phone-images')
						.remove(uploaded.map((u) => u.path))
						.catch(() => undefined)
				}
				throw insertError
			}

			if (uploaded.length > 0) {
				await supabase.from('sell_phone_images').insert(
					uploaded.map((u) => ({ request_id: requestId, image_url: u.publicUrl }))
				)
			}

			fetch('/api/sell-requests/notify-new', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ id: requestId }),
			}).catch(() => undefined)

			setSubmittedRequestId(requestId)
			setSubmitted(true)
			window.scrollTo({ top: 0, behavior: 'smooth' })
		} catch (err) {
			toast({
				title: 'Submission failed',
				description: err instanceof Error ? err.message : 'Please try again in a moment.',
				variant: 'error',
			})
		} finally {
			setSubmitting(false)
		}
	}

	if (submitted) {
		return (
			<main className="min-h-screen bg-background">
				<Navigation />
				<div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-24 text-center">
					<div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-8">
						<Check className="w-9 h-9 text-primary" />
					</div>
					<h1 className="text-3xl md:text-4xl font-bold text-foreground tracking-luxury uppercase mb-6">
						{successCopy?.title ?? 'Quote Request Received'}
					</h1>
					<p className="text-sm md:text-base text-foreground/75 leading-relaxed whitespace-pre-line mb-6">
						{successCopy?.content ??
							'Thank you for your submission. A CellKore support agent will contact you within 24 hours with an official quote.'}
					</p>
					<p className="text-xs text-muted-foreground mb-2 uppercase tracking-[0.14em] font-semibold">
						Initial request status: Under Review
					</p>
					<p className="text-xs text-muted-foreground mb-6 max-w-lg mx-auto leading-relaxed">
						Next: we&apos;ll review your submission and send you an offer. You can accept or decline it — if you accept, we&apos;ll ask you to send us your device, and process your payment once it&apos;s inspected.
					</p>
					{!user && submittedRequestId && (
						<div className="mb-10 mx-auto max-w-md rounded-2xl border border-border bg-secondary/40 p-5">
							<p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-1.5">Your Request ID</p>
							<p className="text-xs font-mono font-bold text-card-foreground break-all">{formatRequestId(submittedRequestId)}</p>
							<p className="text-[11px] text-muted-foreground mt-2">
								Save this ID — since you submitted without an account, you&apos;ll need it (with your email or phone) to check your status later.
							</p>
						</div>
					)}
					<div className="flex flex-wrap items-center justify-center gap-3">
						<Link
							href={user ? '/account?tab=sell' : `/sell/track${submittedRequestId ? `?id=${encodeURIComponent(formatRequestId(submittedRequestId))}` : ''}`}
							className="inline-block px-8 py-3.5 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-[0.18em] hover:opacity-90 transition-all"
						>
							Track My Request
						</Link>
						{supportWhatsapp && (
							<a
								href={`https://wa.me/${supportWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent('Hi, I just submitted a Sell Your Phone request and need help.')}`}
								target="_blank"
								rel="noreferrer"
								className="inline-flex items-center gap-2 px-8 py-3.5 border border-border rounded-full text-xs font-bold uppercase tracking-[0.18em] text-foreground/80 hover:border-primary hover:text-primary transition-all"
							>
								<MessageCircle className="w-4 h-4" />
								WhatsApp Support
							</a>
						)}
					</div>
				</div>
				<Footer />
			</main>
		)
	}

	const inputClass =
		'w-full px-4 py-3 border border-border rounded-xl bg-background text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-all'

	return (
		<main className="min-h-screen bg-background">
			<Navigation />

			<section className="relative text-white w-full min-h-[580px] md:min-h-[700px] py-24 md:py-36 overflow-hidden flex items-center justify-center text-center">
				<video
					key="sell-ur-phone-new"
					autoPlay
					loop
					muted
					playsInline
					preload="auto"
					src="/sell_ur_phone_banner.mp4?v=4"
					className="absolute inset-0 w-full h-full object-cover opacity-80 pointer-events-none z-0"
				/>
				<div className="absolute inset-0 bg-black/55 z-10" />
				<div className="relative z-20 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
					<h1 className="text-3xl md:text-5xl font-bold text-white drop-shadow-md leading-tight mb-3 uppercase">
						Sell your phone for extra cash!
					</h1>
					<p className="text-white/80 text-sm md:text-base font-light max-w-xl mx-auto leading-relaxed drop-shadow-sm mb-7">
						We&apos;ll pay you more money than any other trade-in offer.
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
						<a
							href="#sell-form"
							className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-[#599161] hover:bg-[#46754e] text-white font-bold text-xs uppercase tracking-wider transition-all shadow-lg hover:scale-[1.02] active:scale-95 w-full sm:w-auto"
						>
							Sell your device now
						</a>
					</div>
				</div>
			</section>

			{supportWhatsapp && (
				<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 relative z-30">
					<a
						href={`https://wa.me/${supportWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent("Hi, I'd like to sell my phone. Here are my device details and photos:")}`}
						target="_blank"
						rel="noreferrer"
						className="flex items-center justify-between gap-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-3xl px-6 py-5 shadow-lg transition-all"
					>
						<div className="flex items-center gap-3.5">
							<div className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
								<MessageCircle className="w-5 h-5" />
							</div>
							<div>
								<p className="text-xs font-bold uppercase tracking-[0.16em]">Prefer to chat instead?</p>
								<p className="text-[11px] text-white/85 mt-0.5">Sell via WhatsApp — send your device details and pictures directly to our team.</p>
							</div>
						</div>
						<span className="text-xs font-bold uppercase tracking-[0.14em] whitespace-nowrap">Chat Now →</span>
					</a>
				</div>
			)}

			<div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 pb-4 text-center">
				<Link
					href="/sell/track"
					className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-muted-foreground hover:text-primary underline underline-offset-4 transition-colors"
				>
					<Search className="w-4 h-4 text-primary" />
					Already submitted a request? Track it here
				</Link>
			</div>

			<form id="sell-form" onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 space-y-10">

				{/* Step 00: WHAT TYPE OF DEVICE DO YOU HAVE? */}
				<div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
					<div className="mb-6">
						<h2 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-black font-sans">What type of device do you have?</h2>
					</div>
					<div className="flex items-center gap-4 overflow-x-auto px-2 pt-2 pb-4 no-scrollbar">
						{DEVICE_TYPES.map((dt) => {
							const isActive = selectedDeviceType === dt.id;
							// "Other" has no title baked into its cover photo, so it needs an overlay label.
							const hasBakedTitle = dt.id !== 'other';
							return (
								<button
									type="button"
									key={dt.id}
									onClick={() => {
										setSelectedDeviceType(dt.id)
										setSelectedModel(null)
										setIsModelConfirmed(false)
										setCustomBrand(dt.brand)
										setCustomModel('')
										setSelectedStorage(null)
										setSelectedProblems([])
										setSelectedCosmetic(null)
										setForm(f => ({ ...f, brand: dt.brand, model: '', storage: '', condition: 'good', damages: '' }))
									}}
									className={`relative group rounded-2xl border bg-card w-[140px] sm:w-[170px] h-[190px] flex-shrink-0 shadow-sm transition-all duration-300 cursor-pointer overflow-hidden ${
										isActive
											? 'border-[#599161] ring-2 ring-[#599161]/20 scale-[1.02] shadow-lg'
											: 'border-border/80 hover:border-[#599161] hover:shadow-xl hover:-translate-y-1.5'
									}`}
								>
									<img
										src={dt.image}
										alt={dt.label}
										className={`w-full h-full object-cover transition-transform duration-500 ${
											dt.id === 'tablet' ? 'object-[center_30%]' : 'object-top'
										} ${
											dt.id === 'ipad'
												? 'scale-110 group-hover:scale-[1.15]'
												: dt.id === 'tablet'
												? 'scale-105 group-hover:scale-[1.10]'
												: 'scale-100 group-hover:scale-[1.05]'
										}`}
									/>
									{!hasBakedTitle && (
										<div className="absolute inset-x-0 bottom-0 pt-8 pb-3 px-2 text-center bg-gradient-to-t from-black/80 via-black/40 to-transparent">
											<span className="text-xs font-black uppercase tracking-wider text-white">{dt.label}</span>
										</div>
									)}
									{isActive && (
										<div className="absolute top-[-1px] right-[-1px] w-8 h-8 bg-[#599161] [clip-path:polygon(100%_0,0_0,100%_100%)] rounded-tr-[15px] pointer-events-none z-20">
											<Check className="absolute top-1 right-1 w-2.5 h-2.5 text-white" />
										</div>
									)}
								</button>
							)
						})}
					</div>
				</div>

				{/* Step 00b: PLEASE SELECT YOUR DEVICE'S MODEL */}
				{selectedDeviceType && selectedDeviceType !== 'other' && (
					<div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
						<div className="mb-6">
							<h2 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-black font-sans">Please select your device&apos;s model</h2>
						</div>
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
							{MODELS_DATA[selectedDeviceType]?.map((m) => {
								const isActive = selectedModel === m.label;
								return (
									<button
										type="button"
										key={m.label}
										onClick={() => {
											setSelectedModel(m.label)
											setForm(f => ({ ...f, model: m.label }))
											setIsModelConfirmed(true)
										}}
										className={`relative group flex flex-col items-center rounded-2xl border bg-card p-1.5 transition-all duration-200 cursor-pointer overflow-visible ${
											isActive
												? 'border-[#599161] ring-2 ring-[#599161]/10 scale-[1.02] shadow-sm'
												: 'border-zinc-200/80 hover:border-[#599161]/50'
										}`}
									>
										<div className="w-full aspect-square overflow-hidden bg-white flex items-center justify-center p-0.5 rounded-xl">
											<img
												src={m.image}
												alt={m.label}
												className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
											/>
										</div>
										<div className="w-full pt-3 pb-1 text-center border-t border-zinc-100 mt-2">
											<span className={`text-[10px] font-black uppercase tracking-wider block leading-snug line-clamp-2 px-0.5 ${
												isActive ? 'text-[#599161]' : 'text-black'
											}`}>{m.label}</span>
										</div>
										{isActive && (
											<div className="absolute top-[-1px] right-[-1px] w-8 h-8 bg-[#599161] [clip-path:polygon(100%_0,0_0,100%_100%)] rounded-tr-[15px] pointer-events-none z-20">
												<Check className="absolute top-1 right-1 w-2.5 h-2.5 text-white" />
											</div>
										)}
									</button>
								)
							})}
							{/* Other Model option */}
							<button
								type="button"
								onClick={() => {
									setSelectedModel('custom')
									setIsModelConfirmed(false)
								}}
								className={`relative group flex flex-col items-center rounded-2xl border bg-card p-1.5 transition-all duration-200 cursor-pointer overflow-visible ${
									selectedModel === 'custom'
										? 'border-[#599161] ring-2 ring-[#599161]/10 scale-[1.02] shadow-sm'
										: 'border-zinc-200/80 hover:border-[#599161]/50'
								}`}
							>
								<div className="w-full aspect-square overflow-hidden bg-white flex items-center justify-center p-2 rounded-xl text-muted-foreground/35 group-hover:text-[#599161] transition-colors">
									<Plus className="w-8 h-8" />
								</div>
								<div className="w-full pt-3 pb-1 text-center border-t border-zinc-100 mt-2">
									<span className={`text-[10px] font-black uppercase tracking-wider ${
										selectedModel === 'custom' ? 'text-[#599161]' : 'text-black'
									}`}>Other Model</span>
								</div>
								{selectedModel === 'custom' && (
									<div className="absolute top-[-1px] right-[-1px] w-8 h-8 bg-[#599161] [clip-path:polygon(100%_0,0_0,100%_100%)] rounded-tr-[15px] pointer-events-none z-20">
										<Check className="absolute top-1 right-1 w-2.5 h-2.5 text-white" />
									</div>
								)}
							</button>
						</div>

						{/* Custom Model input (inside standard type) */}
						{selectedModel === 'custom' && !isModelConfirmed && (
							<div className="mt-6 max-w-sm mx-auto p-5 bg-muted/20 border border-border rounded-2xl space-y-3">
								<label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">Enter Model Name</label>
								<input
									type="text"
									placeholder="e.g. iPhone SE 2020"
									value={customModel}
									onChange={(e) => setCustomModel(e.target.value)}
									className={inputClass}
								/>
								<button
									type="button"
									onClick={() => {
										if (!customModel.trim()) return;
										setForm(f => ({ ...f, model: customModel }))
										setIsModelConfirmed(true)
									}}
									className="w-full py-3 bg-[#4a8f9d] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer"
								>
									Confirm Model
								</button>
							</div>
						)}
					</div>
				)}

				{/* Step 00b: PLEASE SELECT YOUR DEVICE'S MODEL (Other Brand option) */}
				{selectedDeviceType === 'other' && (
					<div className="bg-card border border-border rounded-3xl p-8 shadow-sm">
						<div className="mb-6">
							<h2 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-black font-sans">Please select your device&apos;s model</h2>
						</div>
						<div className="grid grid-cols-2 sm:grid-cols-4 gap-4 justify-center">
							<button
								type="button"
								onClick={() => {
									setSelectedModel('custom')
									setIsModelConfirmed(false)
								}}
								className={`relative group flex flex-col items-center rounded-2xl border bg-card p-1.5 transition-all duration-200 cursor-pointer overflow-visible ${
									selectedModel === 'custom'
										? 'border-[#599161] ring-2 ring-[#599161]/10 scale-[1.02] shadow-sm'
										: 'border-zinc-200/80 hover:border-[#599161]/50'
								}`}
							>
								<div className="w-full aspect-square overflow-hidden bg-white flex items-center justify-center p-2 rounded-xl text-muted-foreground/35 group-hover:text-[#599161] transition-colors">
									<Search className="w-8 h-8" />
								</div>
								<div className="w-full pt-3 pb-1 text-center border-t border-zinc-100 mt-2">
									<span className={`text-[10px] font-black uppercase tracking-wider ${
										selectedModel === 'custom' ? 'text-[#599161]' : 'text-black'
									}`}>Choose your model</span>
								</div>
								{selectedModel === 'custom' && (
									<div className="absolute top-[-1px] right-[-1px] w-8 h-8 bg-[#599161] [clip-path:polygon(100%_0,0_0,100%_100%)] rounded-tr-[15px] pointer-events-none z-20">
										<Check className="absolute top-1 right-1 w-2.5 h-2.5 text-white" />
									</div>
								)}
							</button>
						</div>

						{/* Custom Model input (inside custom device brand) */}
						{selectedModel === 'custom' && !isModelConfirmed && (
							<div className="mt-6 max-w-md mx-auto p-5 bg-muted/20 border border-border rounded-2xl space-y-3">
								<div>
									<label className="text-[10px] font-bold uppercase tracking-wider text-black block mb-1">Brand</label>
									<input
										type="text"
										placeholder="e.g. Motorola, Google, OnePlus"
										value={customBrand}
										onChange={(e) => setCustomBrand(e.target.value)}
										className={inputClass}
									/>
								</div>
								<div>
									<label className="text-[10px] font-bold uppercase tracking-wider text-black block mb-1">Model Name</label>
									<input
										type="text"
										placeholder="e.g. Edge 40, OnePlus 11"
										value={customModel}
										onChange={(e) => setCustomModel(e.target.value)}
										className={inputClass}
									/>
								</div>
								<button
									type="button"
									onClick={() => {
										if (!customModel.trim()) return;
										setForm(f => ({ ...f, brand: customBrand || 'Other', model: customModel }))
										setIsModelConfirmed(true)
									}}
									className="w-full py-3 bg-[#599161] text-white rounded-xl text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer"
								>
									Confirm Details
								</button>
							</div>
						)}
					</div>
				)}

				{/* Show the remaining steps ONLY after the model is confirmed */}
				{isModelConfirmed && (
					<>
						{/* Device Details Form */}
						<div className="bg-card border border-border rounded-3xl p-7">
							<div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
								<span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center border border-emerald-500/30 shadow-sm">1</span>
								<div>
									<p className="text-[9.5px] uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400 font-black">Step 01</p>
									<h2 className="text-lg font-extrabold uppercase tracking-wide text-black">
										Device Details
									</h2>
								</div>
							</div>
							<div className="grid sm:grid-cols-2 gap-4">
								<input required placeholder="Brand (e.g. Apple)" value={form.brand} onChange={set('brand')} className={inputClass} />
								<input required placeholder="Model (e.g. iPhone 15 Pro)" value={form.model} onChange={set('model')} className={inputClass} />
							</div>

							{/* Storage capacity cards */}
							<div className="mt-6">
								<h3 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-black font-sans mb-4">Please select the storage capacity of your device</h3>
								<div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
									{(STORAGE_OPTIONS[selectedDeviceType ?? 'other'] ?? STORAGE_OPTIONS.other).map((opt) => (
										<button
											type="button"
											key={opt}
											onClick={() => selectStorage(opt)}
											className={`relative group flex flex-col items-center rounded-2xl border bg-card p-1.5 transition-all duration-200 cursor-pointer overflow-visible ${
												selectedStorage === opt
													? 'border-[#599161] ring-2 ring-[#599161]/10 scale-[1.02] shadow-sm'
													: 'border-zinc-200/80 hover:border-[#599161]/50'
											}`}
										>
											<div className="w-full aspect-[2/1] rounded-xl flex items-center justify-center bg-[#eaf2ed]">
												<HardDrive className={`w-6 h-6 ${selectedStorage === opt ? 'text-[#599161]' : 'text-[#599161]/45'}`} />
											</div>
											<div className="w-full pt-3 pb-2 text-center border-t border-zinc-100 mt-2">
												<span className={`text-xs font-black uppercase tracking-wider ${
													selectedStorage === opt ? 'text-[#599161]' : 'text-black'
												}`}>{opt}</span>
											</div>
											{selectedStorage === opt && (
												<div className="absolute top-[-1px] right-[-1px] w-7 h-7 bg-[#599161] [clip-path:polygon(100%_0,0_0,100%_100%)] rounded-tr-[15px] pointer-events-none z-20">
													<Check className="absolute top-1 right-1 w-2.5 h-2.5 text-white" />
												</div>
											)}
										</button>
									))}
								</div>
							</div>

							{/* Problems / condition picker — only once storage is picked */}
							{selectedStorage && (
							<div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
								<h3 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-black font-sans mb-4">Are there any problems with your device?</h3>
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
									{PROBLEM_OPTIONS.map((p) => {
										const isActive = selectedProblems.includes(p.id)
										return (
											<button
												type="button"
												key={p.id}
												onClick={() => toggleProblem(p.id)}
												className={`relative flex flex-col items-center justify-center text-center rounded-2xl border p-4 min-h-[104px] transition-all duration-200 cursor-pointer ${
													isActive
														? 'border-[#599161] ring-2 ring-[#599161]/10 bg-[#599161]/5'
														: 'border-zinc-200/80 hover:border-[#599161]/50 bg-card'
												}`}
											>
												<span className={`text-xs font-black uppercase tracking-wide mb-1.5 ${isActive ? 'text-[#599161]' : 'text-black'}`}>{p.title}</span>
												<span className="text-[11px] text-muted-foreground leading-snug">{p.description}</span>
												{isActive && (
													<div className="absolute top-[-1px] right-[-1px] w-7 h-7 bg-[#599161] [clip-path:polygon(100%_0,0_0,100%_100%)] rounded-tr-[15px] pointer-events-none">
														<Check className="absolute top-1 right-1 w-2.5 h-2.5 text-white" />
													</div>
												)}
											</button>
										)
									})}
								</div>
							</div>
							)}

							{/* Cosmetic condition picker — only once a problem answer is picked */}
							{selectedProblems.length > 0 && (
							<div className="mt-6 animate-in fade-in slide-in-from-top-2 duration-300">
								<h3 className="text-[11px] font-extrabold uppercase tracking-[0.2em] text-black font-sans mb-4">What is the cosmetic condition of your device? (Ignoring any damage)</h3>
								<div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
									{COSMETIC_OPTIONS.map((c) => {
										const isActive = selectedCosmetic === c.id
										return (
											<button
												type="button"
												key={c.id}
												onClick={() => setSelectedCosmetic(c.id)}
												className={`relative flex flex-col items-center rounded-2xl border bg-card p-1.5 transition-all duration-200 cursor-pointer overflow-visible ${
													isActive
														? 'border-[#599161] ring-2 ring-[#599161]/10 scale-[1.02] shadow-sm'
														: 'border-zinc-200/80 hover:border-[#599161]/50'
												}`}
											>
												<div className="w-full aspect-[2/1] rounded-xl flex items-center justify-center bg-[#eaf2ed] gap-0.5">
													{c.id === 'brand_new' ? (
														<Gift className={`w-6 h-6 ${isActive ? 'text-[#599161]' : 'text-[#599161]/45'}`} />
													) : (
														Array.from({ length: 5 }).map((_, i) => (
															<Star
																key={i}
																className={`w-3.5 h-3.5 ${
																	i < c.stars
																		? isActive ? 'fill-[#599161] text-[#599161]' : 'fill-[#599161]/45 text-[#599161]/45'
																		: 'text-zinc-300'
																}`}
															/>
														))
													)}
												</div>
												<div className="w-full pt-3 pb-2 text-center border-t border-zinc-100 mt-2">
													<span className={`text-xs font-black uppercase tracking-wider block ${isActive ? 'text-[#599161]' : 'text-black'}`}>{c.label}</span>
													<span className="text-[10px] text-muted-foreground block mt-0.5 leading-snug">{c.description}</span>
												</div>
												{isActive && (
													<div className="absolute top-[-1px] right-[-1px] w-7 h-7 bg-[#599161] [clip-path:polygon(100%_0,0_0,100%_100%)] rounded-tr-[15px] pointer-events-none z-20">
														<Check className="absolute top-1 right-1 w-2.5 h-2.5 text-white" />
													</div>
												)}
											</button>
										)
									})}
								</div>

								{selectedCosmetic && (() => {
									const c = COSMETIC_OPTIONS.find((o) => o.id === selectedCosmetic)!
									return (
										<div className="mt-4 bg-[#eaf2ed]/60 border border-[#599161]/25 rounded-2xl p-5 flex gap-3">
											<Info className="w-5 h-5 text-[#599161] shrink-0 mt-0.5" />
											<div>
												<p className="text-sm font-extrabold text-foreground mb-1.5">{c.label}</p>
												<ul className="space-y-1">
													{c.details.map((d) => (
														<li key={d} className="text-xs text-muted-foreground leading-relaxed flex gap-2">
															<span className="text-[#599161]">•</span>
															{d}
														</li>
													))}
												</ul>
											</div>
										</div>
									)
								})()}
							</div>
							)}

							{selectedCosmetic && (
							<textarea
								placeholder="Additional comments"
								value={form.comments}
								onChange={set('comments')}
								rows={2}
								className={`${inputClass} mt-6 resize-none animate-in fade-in slide-in-from-top-2 duration-300`}
							/>
							)}
						</div>

						{selectedCosmetic && (
						<>
						{/* Photos */}
						<div className="bg-card border border-border rounded-3xl p-7">
							<div className="flex items-center gap-3 mb-3 pb-3 border-b border-border/60">
								<span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center border border-emerald-500/30 shadow-sm">2</span>
								<div>
									<p className="text-[9.5px] uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400 font-black">Step 02</p>
									<h2 className="text-lg font-extrabold uppercase tracking-wide text-black">
										Device Photos
									</h2>
								</div>
							</div>
							<p className="text-xs text-muted-foreground mb-6">
								Up to 8 photos, 5MB each. Photos are compressed automatically before upload.
							</p>
							<label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl py-10 cursor-pointer hover:border-primary hover:bg-secondary/50 transition-all">
								<Upload className="w-6 h-6 text-muted-foreground mb-3" />
								<span className="text-xs font-semibold uppercase tracking-[0.14em] text-foreground/70">
									Click to select images
								</span>
								<input
									type="file"
									accept="image/*"
									multiple
									className="hidden"
									onChange={(e) => {
										handleFiles(e.target.files)
										e.target.value = ''
									}}
								/>
							</label>
							{files.length > 0 && (
								<div className="grid grid-cols-4 sm:grid-cols-6 gap-3 mt-5">
									{files.map((file, index) => (
										<div key={`${file.name}-${index}`} className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
											<img src={URL.createObjectURL(file)} alt="" className="w-full h-full object-cover" />
											<button
												type="button"
												onClick={() => setFiles(files.filter((_, i) => i !== index))}
												className="absolute top-1 right-1 p-1 rounded-full bg-background/90 border border-border opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
												aria-label="Remove photo"
											>
												<X className="w-3 h-3" />
											</button>
										</div>
									))}
								</div>
							)}
							{files.length === 0 && (
								<div className="flex items-center gap-2 mt-4 text-xs text-muted-foreground">
									<ImageIcon className="w-3.5 h-3.5" />
									Add at least one photo to continue to your contact details.
								</div>
							)}
						</div>

						{files.length > 0 && (
						<>
						{/* Contact */}
						<div className="bg-card border border-border rounded-3xl p-7 animate-in fade-in slide-in-from-top-2 duration-300">
							<div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/60">
								<span className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs flex items-center justify-center border border-emerald-500/30 shadow-sm">3</span>
								<div>
									<p className="text-[9.5px] uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-400 font-black">Step 03</p>
									<h2 className="text-lg font-extrabold uppercase tracking-wide text-black">
										Contact Information
									</h2>
								</div>
							</div>
							<div className="grid sm:grid-cols-2 gap-4">
								<input placeholder="Full name" value={form.name} onChange={set('name')} className={inputClass} />
								<input type="email" placeholder="Email address" value={form.email} onChange={set('email')} className={inputClass} />
								<PhoneInput
									country={phoneCountry}
									onCountryChange={setPhoneCountry}
									value={form.phone}
									onChange={(value) => setForm((f) => ({ ...f, phone: value }))}
									className="sm:col-span-2"
								/>
							</div>
						</div>

						<label className="flex items-start gap-3 bg-card border border-border rounded-3xl p-6 cursor-pointer">
							<input
								type="checkbox"
								checked={agreedToPolicy}
								onChange={(e) => setAgreedToPolicy(e.target.checked)}
								className="mt-0.5 w-4 h-4 accent-[var(--primary)] cursor-pointer shrink-0"
							/>
							<span className="text-xs text-foreground/80 leading-relaxed">
								I confirm the device details above are accurate and I agree to CellKore&apos;s{' '}
								<Link href="/terms" target="_blank" className="text-primary font-semibold hover:underline">
									Sell Your Device policy and Terms of Service
								</Link>
								, including that quotes are subject to in-person inspection and final pricing may adjust based on the device&apos;s actual condition.
							</span>
						</label>

						<button
							type="submit"
							disabled={submitting || !agreedToPolicy}
							className="w-full flex items-center justify-center gap-2 py-4 bg-primary text-primary-foreground rounded-full text-xs font-bold uppercase tracking-[0.2em] hover:opacity-90 hover:scale-[1.01] active:scale-95 transition-all cursor-pointer shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
						>
							{submitting && <Loader2 className="w-4 h-4 animate-spin" />}
							{submitting ? 'Submitting your request...' : 'Request My Quote'}
						</button>
						</>
						)}
						</>
						)}
					</>
				)}
			</form>

			<Footer />
		</main>
	)
}
