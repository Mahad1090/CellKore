import type { Transporter } from 'nodemailer'

let transporter: Transporter | null | undefined

/**
 * Single shared SMTP transporter built from env vars. Returns null (instead
 * of throwing) when SMTP isn't configured yet, so every call site can stay
 * fire-and-forget — a missing mail config should never break a checkout,
 * status update, or form submission.
 */
function getTransporter(): Transporter | null {
	if (typeof window !== 'undefined') return null
	if (transporter !== undefined) return transporter
	const host = process.env.SMTP_HOST
	const port = Number(process.env.SMTP_PORT ?? 587)
	const user = process.env.SMTP_USER
	const pass = process.env.SMTP_PASS
	if (!host || !user || !pass) {
		console.warn('[email] SMTP_HOST/SMTP_USER/SMTP_PASS not set — emails will be skipped')
		transporter = null
		return transporter
	}
	try {
		// Dynamic require for Node.js server environment compatibility
		const nodemailer = require('nodemailer')
		transporter = nodemailer.createTransport({
			host,
			port,
			secure: process.env.SMTP_SECURE ? process.env.SMTP_SECURE === 'true' : port === 465,
			auth: { user, pass },
		})
	} catch (err) {
		console.warn('[email] failed to load nodemailer:', err)
		transporter = null
	}
	return transporter ?? null
}

export interface SendMailInput {
	to: string
	from: string
	subject: string
	html: string
	text?: string
	replyTo?: string
}

/**
 * Fire-and-forget email send: logs and swallows failures rather than
 * throwing, so a bounced/misconfigured mailbox never breaks the order,
 * repair, sell-request, or inquiry flow that triggered it.
 */
export async function sendMail(input: SendMailInput): Promise<void> {
	const t = getTransporter()
	if (!t) return
	try {
		await t.sendMail({
			to: input.to,
			from: input.from,
			subject: input.subject,
			html: input.html,
			text: input.text,
			replyTo: input.replyTo,
		})
	} catch (err) {
		console.error('[email] send failed:', err instanceof Error ? err.message : err)
	}
}
