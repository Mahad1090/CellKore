import { createServiceClient } from '@/lib/supabase-server'
import { shippingLabelsBucket } from '@/lib/shipping/env'

/**
 * Uploads a generated carrier label (server-side, service-role) into the
 * public shipping-labels bucket, following the same
 * `[folder]/[id]/[timestamp]-[name]` convention used by
 * lib/storage.ts's client-side upload helpers. `pathPrefix` identifies
 * the owning record, e.g. `orders/[order_id]`, `repair/[request_id]`,
 * `sell-returns/[request_id]`.
 */
export async function uploadShippingLabel(
	pathPrefix: string,
	bytes: Buffer,
	contentType: string
): Promise<string> {
	const service = createServiceClient()
	const bucket = shippingLabelsBucket()
	const ext = contentType === 'application/pdf' ? 'pdf' : contentType.startsWith('image/') ? contentType.split('/')[1] : 'bin'
	const path = `${pathPrefix}/${Date.now()}.${ext}`

	const { error } = await service.storage.from(bucket).upload(path, bytes, { contentType, upsert: false })
	if (error) throw error

	const { data } = service.storage.from(bucket).getPublicUrl(path)
	return data.publicUrl
}

const SIGNED_URL_TTL_SECONDS = 300

/** Recovers the bucket-relative object path from a stored (formerly-public) label URL. */
function objectPathFromStoredUrl(stored: string): string | null {
	const marker = `/storage/v1/object/public/${shippingLabelsBucket()}/`
	const idx = stored.indexOf(marker)
	const path = idx >= 0 ? stored.slice(idx + marker.length) : stored
	if (!path || path.includes('..')) return null
	return path
}

/**
 * Exchanges a stored label URL for a short-lived signed URL. The
 * shipping-labels bucket is private, so the stored "public" URL no longer
 * resolves on its own — callers must authorize the request (admin, or the
 * request's owning customer) before calling this.
 */
export async function signShippingLabelUrl(stored: string): Promise<string | null> {
	const path = objectPathFromStoredUrl(stored)
	if (!path) return null
	const service = createServiceClient()
	const { data, error } = await service.storage
		.from(shippingLabelsBucket())
		.createSignedUrl(path, SIGNED_URL_TTL_SECONDS)
	if (error || !data) return null
	return data.signedUrl
}
