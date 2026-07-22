import type { RepairQuoteItem, RepairRequest, RepairStatus } from '@/lib/types'
import { sendMail } from '@/lib/email/mailer'
import { FROM_SUPPORT, REPLY_TO_SUPPORT } from '@/lib/email/addresses'
import { renderEmailLayout, renderInfoRow, renderSectionCard, formatCurrency, siteUrl } from '@/lib/email/template'

const STATUS_MESSAGES: Record<RepairStatus, string> = {
	submitted: 'We\'ve received your repair request and our team is reviewing it.',
	quote_sent: 'We\'ve prepared a repair quote for your device — please review and respond.',
	quote_accepted: 'Thanks for accepting the quote. Please proceed to payment to continue.',
	payment_confirmed: 'Payment received — thank you.',
	awaiting_device: 'We\'re waiting to receive your device. Please ship it using the instructions on your request page.',
	device_shipped: 'Thanks — we\'ve logged your shipment details and are awaiting your device.',
	device_received: 'Your device has arrived and is queued for repair.',
	in_repair: 'Your device is now being repaired.',
	repaired: 'Repairs are complete — your device is being prepared for return shipment.',
	shipped_back: 'Your repaired device is on its way back to you!',
	completed: 'Your repair is complete. Thanks for choosing CellKore!',
	rejected: 'Unfortunately we were unable to move forward with this repair request.',
	cancelled: 'This repair request has been cancelled.',
}

type RepairNotifyRef = Pick<RepairRequest, 'id' | 'contact_email' | 'contact_phone'> &
	Partial<
		Pick<
			RepairRequest,
			| 'device_brand'
			| 'device_model'
			| 'quote_items'
			| 'quote_total'
			| 'quote_currency'
			| 'inbound_carrier'
			| 'inbound_tracking_number'
			| 'outbound_carrier'
			| 'outbound_tracking_number'
		>
	>

function deviceLine(request: RepairNotifyRef): string {
	return `${request.device_brand ?? ''} ${request.device_model ?? ''}`.trim() || 'Your device'
}

function quoteHtml(items: RepairQuoteItem[], total: number, currency: 'USD' | 'CAD'): string {
	const rows = items
		.map(
			(i) => `<tr><td style="padding:6px 0;color:#44403c;">${i.label}</td><td style="padding:6px 0;text-align:right;color:#111111;font-weight:600;">${formatCurrency(i.amount, currency)}</td></tr>`
		)
		.join('')
	return renderSectionCard(`
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;">${rows}</table>
		<div style="height:1px;background:#e7e5e4;margin:8px 0;"></div>
		<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
			<td style="font-weight:800;color:#111111;">Total</td>
			<td style="text-align:right;font-weight:800;color:#111111;">${formatCurrency(total, currency)}</td>
		</tr></table>
	`)
}

/**
 * Called at every repair status transition (customer and admin routes
 * alike). Fire-and-forget — sendMail already swallows failures, so this
 * never blocks the status-change flow that triggered it.
 */
export async function notifyRepairStatusChange(
	request: RepairNotifyRef,
	newStatus: RepairStatus
): Promise<void> {
	if (!request.contact_email) return

	const extras: string[] = []
	if ((newStatus === 'quote_sent' || newStatus === 'quote_accepted') && request.quote_items?.length && request.quote_total != null) {
		extras.push(quoteHtml(request.quote_items, Number(request.quote_total), (request.quote_currency ?? 'USD') as 'USD' | 'CAD'))
	}
	if (newStatus === 'device_shipped' && request.inbound_carrier && request.inbound_tracking_number) {
		extras.push(renderSectionCard(`${renderInfoRow('Courier', request.inbound_carrier)}${renderInfoRow('Tracking #', request.inbound_tracking_number)}`))
	}
	if (newStatus === 'shipped_back' && request.outbound_carrier && request.outbound_tracking_number) {
		extras.push(renderSectionCard(`${renderInfoRow('Courier', request.outbound_carrier)}${renderInfoRow('Tracking #', request.outbound_tracking_number)}`))
	}

	await sendMail({
		to: request.contact_email,
		from: FROM_SUPPORT,
		replyTo: REPLY_TO_SUPPORT,
		subject: `Repair Update — ${deviceLine(request)}`,
		html: renderEmailLayout({
			eyebrow: 'Repair Services',
			heading: 'Your repair request has been updated',
			bodyHtml: `
				${renderInfoRow('Device', deviceLine(request))}
				<p style="margin:14px 0 0;">${STATUS_MESSAGES[newStatus]}</p>
				${extras.join('')}
			`,
			action: { label: 'View Request', url: `${siteUrl()}/repair/status` },
		}),
	})
}
