import type { SupabaseClient } from '@supabase/supabase-js'
import { notifyRepairStatusChange } from '@/lib/repair-notifications'

/**
 * Marks a repair request as paid. Called from both the Stripe webhook
 * and the PayPal capture route once payment is confirmed, so the two
 * payment paths stay in sync. Records a 'payment_confirmed' timeline
 * entry, then auto-advances to 'awaiting_device' since the only
 * remaining step before the customer ships is confirming payment.
 */
export async function markRepairPaid(
	service: SupabaseClient,
	requestId: string,
	paymentProvider: string,
	paymentReference: string
): Promise<void> {
	const { data: existing } = await service
		.from('repair_requests')
		.select('id, contact_email, contact_phone, quote_total, shipping_cost')
		.eq('id', requestId)
		.maybeSingle()
	if (!existing) return

	const now = new Date().toISOString()
	await service
		.from('repair_requests')
		.update({
			payment_provider: paymentProvider,
			payment_reference: paymentReference,
			paid_at: now,
			status: 'awaiting_device',
			updated_at: now,
		})
		.eq('id', requestId)

	await service.from('repair_status_history').insert([
		{ request_id: requestId, status: 'payment_confirmed', note: `Paid via ${paymentProvider}`, changed_by: 'system' },
		{ request_id: requestId, status: 'awaiting_device', note: null, changed_by: 'system' },
	])

	await notifyRepairStatusChange(existing, 'awaiting_device')
}
