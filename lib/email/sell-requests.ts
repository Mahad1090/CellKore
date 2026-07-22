import { sendMail } from './mailer'
import { FROM_SUPPORT, FROM_SYSTEM, REPLY_TO_SUPPORT, ADMIN_SUPPORT_EMAIL } from './addresses'
import { renderEmailLayout, renderInfoRow, renderSectionCard, formatCurrency, siteUrl } from './template'
import type { SellPhoneStatus } from '@/lib/types'

const STATUS_MESSAGES: Record<SellPhoneStatus, string> = {
	submitted: 'We\'ve received your sell request and our team is reviewing it.',
	approved: 'We\'ve prepared an offer for your device — please review and accept or decline it.',
	offer_accepted: 'You accepted the offer. Please ship your device to us using the instructions on your request page.',
	shipment_submitted: 'Thanks — we\'ve logged your shipment details and are awaiting your package.',
	awaiting_package: 'We\'re waiting to receive your package.',
	under_inspection: 'Your device has arrived and is now under inspection.',
	quoted: 'We\'ve prepared a quote for your device.',
	payment_confirmed: 'Your payout has been sent — thanks for selling with CellKore!',
	rejected: 'Unfortunately we were unable to move forward with this request.',
	cancelled: 'This sell request has been cancelled.',
}

interface SellRequestRef {
	id: string
	contact_email?: string | null
	device_brand?: string | null
	device_model?: string | null
	condition?: string | null
	offered_price?: number | null
	payout_amount?: number | null
	rejection_reason?: string | null
}

function deviceLine(request: { device_brand?: string | null; device_model?: string | null }): string {
	return `${request.device_brand ?? ''} ${request.device_model ?? ''}`.trim() || 'Your device'
}

export async function sendSellRequestStatusEmail(
	request: SellRequestRef,
	status: SellPhoneStatus
): Promise<void> {
	if (!request.contact_email) return
	const details: string[] = [renderInfoRow('Device', deviceLine(request))]
	if (request.condition) details.push(renderInfoRow('Condition', request.condition))
	if (status === 'approved' && request.offered_price != null) {
		details.push(renderInfoRow('Offered Price', formatCurrency(Number(request.offered_price))))
	}
	if (status === 'payment_confirmed' && request.payout_amount != null) {
		details.push(renderInfoRow('Payout Amount', formatCurrency(Number(request.payout_amount))))
	}
	if (status === 'rejected' && request.rejection_reason) {
		details.push(renderInfoRow('Reason', request.rejection_reason))
	}
	await sendMail({
		to: request.contact_email,
		from: FROM_SUPPORT,
		replyTo: REPLY_TO_SUPPORT,
		subject: `Sell Request Update — ${deviceLine(request)}`,
		html: renderEmailLayout({
			eyebrow: 'Sell Your Device',
			heading: 'Your sell request has been updated',
			bodyHtml: `
				<p style="margin:0 0 14px;">${STATUS_MESSAGES[status]}</p>
				${renderSectionCard(details.join(''))}
			`,
			action: { label: 'View Request', url: `${siteUrl()}/sell/track` },
		}),
	})
}

export async function sendNewSellRequestAdminAlert(request: {
	id: string
	device_brand: string
	device_model: string
	condition?: string | null
	description?: string | null
	contact_email?: string | null
	contact_phone?: string | null
}): Promise<void> {
	await sendMail({
		to: ADMIN_SUPPORT_EMAIL,
		from: FROM_SYSTEM,
		subject: `New Sell Request — ${request.device_brand} ${request.device_model}`,
		html: renderEmailLayout({
			eyebrow: 'Sell Requests',
			heading: 'New sell request submitted',
			bodyHtml: renderSectionCard(`
				${renderInfoRow('Device', `${request.device_brand} ${request.device_model}`)}
				${request.condition ? renderInfoRow('Condition', request.condition) : ''}
				${request.contact_email ? renderInfoRow('Email', request.contact_email) : ''}
				${request.contact_phone ? renderInfoRow('Phone', request.contact_phone) : ''}
				${request.description ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #e7e5e4;white-space:pre-line;color:#57534e;">${request.description}</div>` : ''}
			`),
			action: { label: 'Review Request', url: `${siteUrl()}/admin/sell-requests` },
		}),
	})
}

export async function sendSellRequestCustomerDecisionAdminAlert(request: {
	id: string
	device_brand?: string | null
	device_model?: string | null
	offered_price?: number | null
}, decision: 'accept' | 'reject'): Promise<void> {
	await sendMail({
		to: ADMIN_SUPPORT_EMAIL,
		from: FROM_SYSTEM,
		subject: `Sell Offer ${decision === 'accept' ? 'Accepted' : 'Declined'} — ${deviceLine(request)}`,
		html: renderEmailLayout({
			eyebrow: 'Sell Requests',
			heading: `Customer ${decision === 'accept' ? 'accepted' : 'declined'} the offer`,
			bodyHtml: renderSectionCard(`
				${renderInfoRow('Device', deviceLine(request))}
				${request.offered_price != null ? renderInfoRow('Offered Price', formatCurrency(Number(request.offered_price))) : ''}
			`),
			action: { label: 'View Request', url: `${siteUrl()}/admin/sell-requests` },
		}),
	})
}

export async function sendSellRequestShipmentAdminAlert(request: {
	id: string
	device_brand?: string | null
	device_model?: string | null
	courier: string
	tracking: string
}): Promise<void> {
	await sendMail({
		to: ADMIN_SUPPORT_EMAIL,
		from: FROM_SYSTEM,
		subject: `Device Shipped — ${deviceLine(request)}`,
		html: renderEmailLayout({
			eyebrow: 'Sell Requests',
			heading: 'Customer shipped their device',
			bodyHtml: renderSectionCard(`
				${renderInfoRow('Device', deviceLine(request))}
				${renderInfoRow('Courier', request.courier)}
				${renderInfoRow('Tracking #', request.tracking)}
			`),
			action: { label: 'View Request', url: `${siteUrl()}/admin/sell-requests` },
		}),
	})
}
