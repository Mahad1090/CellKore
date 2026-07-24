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
