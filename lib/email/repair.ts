import { sendMail } from './mailer'
import { FROM_SYSTEM, ADMIN_SUPPORT_EMAIL } from './addresses'
import { renderEmailLayout, renderInfoRow, renderSectionCard, siteUrl } from './template'

export async function sendNewRepairRequestAdminAlert(request: {
	id: string
	device_brand?: string | null
	device_model?: string | null
	device_category?: string | null
	issues?: string[] | null
	description?: string | null
	service_method?: string | null
	contact_name?: string | null
	contact_email?: string | null
	contact_phone?: string | null
}): Promise<void> {
	const device = `${request.device_brand ?? ''} ${request.device_model ?? ''}`.trim() || 'Device'
	await sendMail({
		to: ADMIN_SUPPORT_EMAIL,
		from: FROM_SYSTEM,
		subject: `New Repair Request — ${device}`,
		html: renderEmailLayout({
			eyebrow: 'Repair Services',
			heading: 'New repair request submitted',
			bodyHtml: renderSectionCard(`
				${renderInfoRow('Device', device)}
				${request.device_category ? renderInfoRow('Category', request.device_category) : ''}
				${request.issues?.length ? renderInfoRow('Issues', request.issues.join(', ')) : ''}
				${request.service_method ? renderInfoRow('Service Method', request.service_method === 'mail_in' ? 'Mail-In' : 'Drop-Off') : ''}
				${request.contact_name ? renderInfoRow('Name', request.contact_name) : ''}
				${request.contact_email ? renderInfoRow('Email', request.contact_email) : ''}
				${request.contact_phone ? renderInfoRow('Phone', request.contact_phone) : ''}
				${request.description ? `<div style="margin-top:10px;padding-top:10px;border-top:1px solid #e7e5e4;white-space:pre-line;color:#57534e;">${request.description}</div>` : ''}
			`),
			action: { label: 'Review Request', url: `${siteUrl()}/admin/repair-requests` },
		}),
	})
}
