'use client'

import { supabase } from '@/lib/supabase'

export const SELL_PHONE_BUCKET = 'sell-phone-images'
export const PRODUCT_IMAGES_BUCKET = 'product-images'

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024 // block files > 5MB

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-+|-+$/g, '')
		.slice(0, 48) || 'item'
}

function sanitizeFilename(name: string): string {
	const dot = name.lastIndexOf('.')
	const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase().replace(/[^a-z0-9]/g, '') : 'jpg'
	const base = slugify(dot >= 0 ? name.slice(0, dot) : name)
	return `${base}.${ext || 'jpg'}`
}

/**
 * Compress an image client-side (canvas re-encode, max 1600px edge) so slow
 * networks don't time out during upload.
 */
export async function compressImage(file: File, maxEdge = 1600, quality = 0.82): Promise<Blob> {
	if (!file.type.startsWith('image/')) return file
	const bitmap = await createImageBitmap(file).catch(() => null)
	if (!bitmap) return file

	const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height))
	const width = Math.round(bitmap.width * scale)
	const height = Math.round(bitmap.height * scale)

	const canvas = document.createElement('canvas')
	canvas.width = width
	canvas.height = height
	const ctx = canvas.getContext('2d')
	if (!ctx) return file
	ctx.drawImage(bitmap, 0, 0, width, height)
	bitmap.close()

	const blob = await new Promise<Blob | null>((resolve) =>
		canvas.toBlob(resolve, 'image/jpeg', quality)
	)
	if (!blob) return file
	return blob.size < file.size ? blob : file
}

export interface UploadedImage {
	path: string
	publicUrl: string
}

/**
 * Upload sell-request photos following the convention
 * `requests/[request_id]/[timestamp]-[filename]`. If any upload fails, all
 * already-uploaded files are removed so no dead files remain, and the error
 * is rethrown so the caller can abort the request insert.
 */
export async function uploadSellPhoneImages(requestId: string, files: File[]): Promise<UploadedImage[]> {
	const uploaded: UploadedImage[] = []
	try {
		for (const file of files) {
			const blob = await compressImage(file)
			const path = `requests/${requestId}/${Date.now()}-${sanitizeFilename(file.name)}`
			const { error } = await supabase.storage
				.from(SELL_PHONE_BUCKET)
				.upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false })
			if (error) throw error
			const { data } = supabase.storage.from(SELL_PHONE_BUCKET).getPublicUrl(path)
			uploaded.push({ path, publicUrl: data.publicUrl })
		}
		return uploaded
	} catch (err) {
		if (uploaded.length > 0) {
			await supabase.storage
				.from(SELL_PHONE_BUCKET)
				.remove(uploaded.map((u) => u.path))
				.catch(() => undefined)
		}
		throw err
	}
}

/**
 * Product image folders: one folder per product named `[slug]-[id]`, with a
 * `variants/[color]` subfolder for variant-specific shots.
 */
export function productImagePath(
	productName: string,
	productId: string,
	filename: string,
	variantColor?: string
): string {
	const folder = `products/${slugify(productName)}-${productId}`
	const sub = variantColor ? `/variants/${slugify(variantColor)}` : ''
	return `${folder}${sub}/${Date.now()}-${sanitizeFilename(filename)}`
}

export function categoryImagePath(categorySlug: string, filename: string): string {
	return `categories/${slugify(categorySlug)}/${Date.now()}-${sanitizeFilename(filename)}`
}

/** Admin uploads go through the RBAC-guarded API (service role), not the anon client. */
export async function uploadViaAdminApi(path: string, file: File): Promise<string> {
	if (file.size > MAX_UPLOAD_BYTES) {
		throw new Error('File exceeds the 5MB upload limit')
	}
	const blob = await compressImage(file)
	const form = new FormData()
	form.append('path', path)
	form.append('file', new File([blob], file.name, { type: blob.type || 'image/jpeg' }))
	const res = await fetch('/api/admin/storage/upload', { method: 'POST', body: form })
	const json = await res.json()
	if (!res.ok) throw new Error(json.error || 'Upload failed')
	return json.publicUrl as string
}
