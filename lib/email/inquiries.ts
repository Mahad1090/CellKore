import { sendMail } from './mailer'
import { FROM_SYSTEM, ADMIN_SUPPORT_EMAIL } from './addresses'
import { renderEmailLayout, renderInfoRow, renderSectionCard, siteUrl } from './template'

export async function sendNewInquiryAdminAlert(inquiry: {
	name: string
	email: string
	phone?: string | null
	country?: string | null
	message: string
}): Promise<void> {
	await sendMail({
		to: ADMIN_SUPPORT_EMAIL,
		from: FROM_SYSTEM,
		subject: `New Contact Inquiry — ${inquiry.name}`,
		html: renderEmailLayout({
			eyebrow: 'Contact Form',
			heading: 'New contact form submission',
			bodyHtml: renderSectionCard(`
				${renderInfoRow('Name', inquiry.name)}
				${renderInfoRow('Email', inquiry.email)}
				${inquiry.phone ? renderInfoRow('Phone', inquiry.phone) : ''}
				${inquiry.country ? renderInfoRow('Country', inquiry.country) : ''}
				<div style="margin-top:10px;padding-top:10px;border-top:1px solid #e7e5e4;white-space:pre-line;color:#57534e;">${inquiry.message}</div>
			`),
			action: { label: 'View Inbox', url: `${siteUrl()}/admin/inquiries` },
		}),
	})
}
