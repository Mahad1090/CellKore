import { sendMail } from './mailer'
import { FROM_SYSTEM, REPLY_TO_SUPPORT } from './addresses'
import { renderEmailLayout, siteUrl } from './template'

export async function sendWelcomeNewsletterEmail(email: string): Promise<void> {
	const unsubscribeUrl = `${siteUrl()}/newsletter/unsubscribe?email=${encodeURIComponent(email)}`

	const html = renderEmailLayout({
		eyebrow: 'SUBSCRIPTION CONFIRMED',
		heading: 'Welcome to CellKore',
		recipientEmail: email,
		unsubscribeUrl,
		imageUrl: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
		bodyHtml: `
			<p style="font-size:14px;line-height:1.75;color:#374151;margin:0 0 16px;font-weight:700;">
				Hello,
			</p>
			<p style="font-size:14px;line-height:1.75;color:#374151;margin:0 0 16px;">
				Your subscription to <strong style="color:#5a9263;">CellKore</strong> has been confirmed. Thank you for joining us.
			</p>
			<p style="font-size:14px;line-height:1.75;color:#4b5563;margin:0 0 16px;">
				You will now receive email notifications regarding new certified device arrivals, inventory updates, special offers, and service announcements.
			</p>
			<p style="font-size:14px;line-height:1.75;color:#4b5563;margin:0;">
				If you have any questions, feel free to reply directly to this email or reach out to our team at <a href="mailto:support@cellkore.com" style="color:#5a9263;font-weight:600;text-decoration:none;">support@cellkore.com</a>.
			</p>
		`,
		action: {
			label: 'VISIT CELLKORE STORE',
			url: `${siteUrl()}/products`,
		},
	})

	await sendMail({
		to: email,
		from: FROM_SYSTEM,
		replyTo: REPLY_TO_SUPPORT,
		subject: 'Subscription Confirmed — Welcome to CellKore',
		html,
	})
}
