import type { PackageInput } from '@/lib/shipping/types'

/**
 * Fallback package used for any item missing weight/dimensions data,
 * since backfilling lib.shipping.products is gradual. Deliberately a
 * simple constant, not carrier-specific — tune once real catalog data
 * shows it's off.
 */
export const DEFAULT_PACKAGE: PackageInput = {
	weightKg: 0.5,
	lengthCm: 20,
	widthCm: 15,
	heightCm: 8,
}

export interface PackageLineItem {
	quantity: number
	weightKg?: number | null
	lengthCm?: number | null
	widthCm?: number | null
	heightCm?: number | null
}

/**
 * v1 heuristic: sum per-item weight, and derive one bounding box via
 * max length, max width, and stacked height. This is not true
 * multi-item box-packing — it deliberately overestimates volume for
 * multi-item carts so quotes stay conservative rather than optimistic.
 */
export function computePackageForItems(items: PackageLineItem[]): PackageInput {
	if (items.length === 0) return { ...DEFAULT_PACKAGE }

	let weightKg = 0
	let lengthCm = 0
	let widthCm = 0
	let heightCm = 0

	for (const item of items) {
		const qty = Math.max(1, Math.floor(item.quantity))
		const w = item.weightKg ?? DEFAULT_PACKAGE.weightKg
		const l = item.lengthCm ?? DEFAULT_PACKAGE.lengthCm
		const wd = item.widthCm ?? DEFAULT_PACKAGE.widthCm
		const h = item.heightCm ?? DEFAULT_PACKAGE.heightCm

		weightKg += w * qty
		lengthCm = Math.max(lengthCm, l)
		widthCm = Math.max(widthCm, wd)
		heightCm += h * qty
	}

	return {
		weightKg: Math.round(weightKg * 1000) / 1000,
		lengthCm: Math.round(lengthCm * 100) / 100,
		widthCm: Math.round(widthCm * 100) / 100,
		heightCm: Math.round(heightCm * 100) / 100,
	}
}
