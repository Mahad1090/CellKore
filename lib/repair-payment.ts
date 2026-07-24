import type { SupabaseClient } from '@supabase/supabase-js'
import { notifyRepairStatusChange } from '@/lib/repair-notifications'

/**
 * Marks a repair request as paid. Called from the Stripe webhook, the
 * PayPal capture route, and the PayPal webhook backstop once payment is
 * confirmed, so all payment paths stay in sync. Records a
 * 'payment_confirmed' timeline entry, then auto-advances to
 * 'awaiting_device' since the only remaining step before the customer
 * ships is confirming payment.
 *
 * Idempotent: the PayPal capture route and the PayPal webhook backstop can
 * both fire for the same payment, and this isn't safe to run twice (it
 * would duplicate timeline entries and re-send the status notification).
 */
export async function markRepairPaid(
	service: SupabaseClient,
	requestId: string,
	paymentProvider: string,
	paymentReference: string
): Promise<void> {
	const { data: existing } = await service
		.from('repair_requests')
		.select('id, contact_email, contact_phone, device_brand, device_model, quote_total, shipping_cost, paid_at')
		.eq('id', requestId)
		.maybeSingle()
	if (!existing || existing.paid_at) return

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
