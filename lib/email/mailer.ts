import nodemailer from 'nodemailer'

export interface SendMailInput {
	to: string
	from: string
	subject: string
	html: string
	text?: string
	replyTo?: string
}

let transporter: nodemailer.Transporter | null | undefined = undefined

function getTransporter(): nodemailer.Transporter | null {
	if (typeof window !== 'undefined') return null
	if (transporter !== undefined) return transporter
	const host = process.env.SMTP_HOST
	const port = Number(process.env.SMTP_PORT ?? 587)
	const user = process.env.SMTP_USER
	const pass = process.env.SMTP_PASS
	if (!host || !user || !pass) {
		console.warn('[email] SMTP_HOST/SMTP_USER/SMTP_PASS not set in environment — emails will be skipped')
		transporter = null
		return transporter
	}
	try {
		transporter = nodemailer.createTransport({
			host,
			port,
			secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
			auth: { user, pass },
			tls: {
				rejectUnauthorized: false,
			},
		})
	} catch (err) {
		console.error('[email] failed to create nodemailer transporter:', err)
		transporter = null
	}
	return transporter ?? null
}

export async function sendMail(input: SendMailInput): Promise<void> {
	const t = getTransporter()
	if (!t) {
		console.error('[email] Cannot send email — SMTP transporter not configured.')
		return
	}
	try {
		const info = await t.sendMail({
			to: input.to,
			from: input.from,
			subject: input.subject,
			html: input.html,
			text: input.text,
			replyTo: input.replyTo,
		})
		console.log('[email] sent successfully:', info.messageId)
	} catch (err) {
		console.error('[email] send failed:', err instanceof Error ? err.message : err)
	}
}
