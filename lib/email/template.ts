export const BRAND_COLOR = '#5a9263'
export const BRAND_COLOR_DARK = '#477650'

export function siteUrl(): string {
	return process.env.NEXT_PUBLIC_SITE_URL || 'https://cellkore.com'
}

export function logoUrl(): string {
	// PNG, not the site's .webp — many email clients (notably Outlook) don't
	// render WebP and silently fall back to the alt text instead.
	return `${siteUrl()}/cellkore_logo_email.png`
}

export function formatCurrency(amount: number, currency: 'USD' | 'CAD' = 'USD'): string {
	return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

interface EmailAction {
	label: string
	url: string
}

/**
 * Shared branded wrapper for every outgoing email — mirrors the storefront's
 * visual language (rounded cards, uppercase tracked eyebrows, pill CTAs,
 * brand green) using table-based markup + inline styles so it renders
 * consistently across webmail clients, not just modern browsers.
 */
export function renderEmailLayout(opts: {
	eyebrow?: string
	heading: string
	bodyHtml: string
	action?: EmailAction
}): string {
	const { eyebrow, heading, bodyHtml, action } = opts
	return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#f2f3f1;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f2f3f1;padding:36px 16px;">
		<tr>
			<td align="center">
				<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">
					<tr>
						<td style="padding:0 4px 20px;text-align:center;">
							<img src="${logoUrl()}" width="96" height="96" alt="CellKore" style="display:inline-block;border-radius:20px;" />
						</td>
					</tr>
					<tr>
						<td style="background:#ffffff;border-radius:22px;overflow:hidden;border:1px solid #e5e7eb;box-shadow:0 1px 3px rgba(0,0,0,0.04);">
							<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
								<tr>
									<td style="height:5px;background:${BRAND_COLOR};line-height:0;font-size:0;">&nbsp;</td>
								</tr>
								<tr>
									<td style="padding:36px 36px 8px;">
										${eyebrow ? `<p style="margin:0 0 10px;font-size:10px;font-weight:800;letter-spacing:0.24em;text-transform:uppercase;color:${BRAND_COLOR};">${eyebrow}</p>` : ''}
										<h1 style="margin:0 0 18px;font-size:22px;line-height:1.35;color:#111111;font-weight:800;">${heading}</h1>
										<div style="font-size:14px;line-height:1.7;color:#44403c;">${bodyHtml}</div>
										${
											action
												? `<div style="margin-top:30px;"><a href="${action.url}" style="display:inline-block;background:${BRAND_COLOR};color:#ffffff;text-decoration:none;padding:13px 28px;border-radius:999px;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;">${action.label}</a></div>`
												: ''
										}
									</td>
								</tr>
								<tr>
									<td style="padding:24px 36px;background:#fafaf9;border-top:1px solid #f0efed;">
										<p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#78716c;">CellKore</p>
										<p style="margin:0;font-size:11px;color:#a8a29e;line-height:1.6;">Premium Electronics Hub &middot; This is an automated message — for help, contact <a href="mailto:support@cellkore.com" style="color:${BRAND_COLOR};text-decoration:none;">support@cellkore.com</a></p>
									</td>
								</tr>
							</table>
						</td>
					</tr>
				</table>
			</td>
		</tr>
	</table>
</body>
</html>`
}

export function renderInfoRow(label: string, value: string): string {
	return `<p style="margin:0 0 8px;"><span style="color:#78716c;">${label}:</span> <strong style="color:#111111;">${value}</strong></p>`
}

export function renderSectionCard(html: string): string {
	return `<div style="margin:16px 0;padding:18px 20px;background:#fafaf9;border:1px solid #f0efed;border-radius:14px;">${html}</div>`
}

export function renderDivider(): string {
	return `<div style="height:1px;background:#f0efed;margin:16px 0;"></div>`
}

export interface EmailOrderItem {
	name: string
	quantity: number
	unitPrice: number
}

/** Line-item table matching the storefront's order-summary styling. */
export function renderOrderItemsTable(items: EmailOrderItem[], currency: 'USD' | 'CAD'): string {
	const rows = items
		.map(
			(i) => `
				<tr>
					<td style="padding:10px 0;border-bottom:1px solid #f0efed;color:#111111;font-weight:600;">${i.name}</td>
					<td style="padding:10px 0;border-bottom:1px solid #f0efed;color:#78716c;text-align:center;white-space:nowrap;">&times;${i.quantity}</td>
					<td style="padding:10px 0;border-bottom:1px solid #f0efed;color:#111111;text-align:right;white-space:nowrap;">${formatCurrency(i.unitPrice * i.quantity, currency)}</td>
				</tr>`
		)
		.join('')
	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px;margin:4px 0;">${rows}</table>`
}

/** Subtotal / discount / tax / extras / total breakdown, right-aligned like a receipt. */
export function renderOrderSummary(summary: {
	subtotal: number
	discount?: number
	tax?: number
	extras?: number
	total: number
	currency: 'USD' | 'CAD'
}): string {
	const { subtotal, discount = 0, tax = 0, extras = 0, total, currency } = summary
	const line = (label: string, value: string, opts?: { bold?: boolean; negative?: boolean }) => `
		<tr>
			<td style="padding:4px 0;color:${opts?.bold ? '#111111' : '#78716c'};font-size:${opts?.bold ? '14px' : '13px'};font-weight:${opts?.bold ? '800' : '400'};">${label}</td>
			<td style="padding:4px 0;text-align:right;color:${opts?.bold ? '#111111' : '#44403c'};font-size:${opts?.bold ? '15px' : '13px'};font-weight:${opts?.bold ? '800' : '600'};">${opts?.negative ? '&minus;' : ''}${value}</td>
		</tr>`
	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
		${line('Subtotal', formatCurrency(subtotal, currency))}
		${discount > 0 ? line('Discount', formatCurrency(discount, currency), { negative: true }) : ''}
		${tax > 0 ? line('Tax', formatCurrency(tax, currency)) : ''}
		${extras > 0 ? line('Gift Options', formatCurrency(extras, currency)) : ''}
		<tr><td colspan="2" style="padding-top:8px;"><div style="height:1px;background:#e7e5e4;"></div></td></tr>
		${line('Total', formatCurrency(total, currency), { bold: true })}
	</table>`
}

export function renderAddress(address: {
	line1: string
	line2?: string | null
	city: string
	stateProvince?: string | null
	postalCode?: string | null
	country: string
}): string {
	return `<p style="margin:0;color:#44403c;">
		${address.line1}${address.line2 ? `<br/>${address.line2}` : ''}<br/>
		${address.city}${address.stateProvince ? `, ${address.stateProvince}` : ''} ${address.postalCode ?? ''}<br/>
		${address.country}
	</p>`
}
