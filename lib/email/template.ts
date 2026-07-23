export const BRAND_COLOR = '#5a9263'
export const BRAND_COLOR_DARK = '#477650'

export function siteUrl(): string {
	if (process.env.NEXT_PUBLIC_SITE_URL && process.env.NEXT_PUBLIC_SITE_URL.trim() !== '') {
		return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
	}
	return 'https://cellkore.com'
}

export function logoUrl(): string {
	return `${siteUrl()}/cellkore_logo_email.png?v=${Date.now()}`
}

export function formatCurrency(amount: number, currency: 'USD' | 'CAD' = 'USD'): string {
	return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount)
}

interface EmailAction {
	label: string
	url: string
}

/**
 * Render exact pixel-perfect email layout matching the user's reference mockup.
 */
export function renderEmailLayout(opts: {
	eyebrow?: string
	heading: string
	bodyHtml: string
	imageUrl?: string
	action?: EmailAction
	recipientEmail?: string
	unsubscribeUrl?: string
	socialLinks?: { platform: string; url: string }[]
}): string {
	const { eyebrow = 'SUBSCRIPTION CONFIRMED', heading, bodyHtml, imageUrl, action, recipientEmail, unsubscribeUrl } = opts

	const unsubLink = unsubscribeUrl
		? unsubscribeUrl
		: recipientEmail
		? `${siteUrl()}/newsletter/unsubscribe?email=${encodeURIComponent(recipientEmail)}`
		: `${siteUrl()}/newsletter/unsubscribe`

	// Format heading: if heading includes CellKore, style it in logo green
	const formattedHeading = heading.includes('CellKore')
		? heading.replace('CellKore', '<span style="color:#5a9263;">CellKore</span>')
		: heading

	return `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<style>
		body { margin: 0; padding: 0; background-color: #f5f6f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
		a { color: #5a9263; text-decoration: none; }
		a:hover { text-decoration: underline; }
		h1 a { color: #111827 !important; text-decoration: none !important; }
	</style>
</head>
<body style="margin:0;padding:0;background-color:#f5f6f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

	<!-- Main Wrapper Table -->
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f6f5;padding:36px 16px 48px;">
		<tr>
			<td align="center">
				<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;">
					
					<!-- Top Brand Logo Header -->
					<tr>
						<td style="padding:0 0 28px;text-align:center;">
							<a href="${siteUrl()}" target="_blank" style="display:inline-block;text-decoration:none;">
								<img src="${logoUrl()}" width="120" height="120" alt="CellKore" style="display:inline-block;border-radius:24px;" />
							</a>
							<p style="margin:8px 0 0;font-size:12px;color:#6b7280;font-weight:600;letter-spacing:0.02em;">
								Premium Devices. Trusted Worldwide.
							</p>
						</td>
					</tr>

					<!-- Main White Email Card -->
					<tr>
						<td style="background-color:#ffffff;border-radius:24px;overflow:hidden;border:1px solid #e5e8e5;box-shadow:0 4px 20px rgba(0,0,0,0.03);">
							<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
								
								<!-- Content Body Area -->
								<tr>
									<td style="padding:40px 40px 32px;">
										
										<!-- Eyebrow Pill Badge -->
										${
											eyebrow
												? `<div style="margin-bottom:18px;">
														<table role="presentation" cellpadding="0" cellspacing="0">
															<tr>
																<td style="padding:6px 14px;background:#eef7f0;border:1px solid #c8e6ce;border-radius:999px;">
																	<table role="presentation" cellpadding="0" cellspacing="0">
																		<tr>
																			<td style="vertical-align:middle;padding-right:6px;">
																				<div style="width:16px;height:16px;border-radius:50%;background:#5a9263;text-align:center;line-height:16px;">
																					<span style="color:#ffffff;font-size:10px;font-weight:900;line-height:16px;display:block;">&#10003;</span>
																				</div>
																			</td>
																			<td style="vertical-align:middle;font-size:10px;font-weight:800;letter-spacing:0.12em;text-transform:uppercase;color:#5a9263;">
																				${eyebrow}
																			</td>
																		</tr>
																	</table>
																</td>
															</tr>
														</table>
													</div>`
												: ''
										}
										
										<!-- Main Heading -->
										<h1 style="margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:32px;line-height:1.2;color:#111827;font-weight:800;letter-spacing:-0.02em;">
											${formattedHeading}
										</h1>

										<!-- Heading Accent Bar -->
										<div style="width:40px;height:3px;background:#5a9263;border-radius:99px;margin:12px 0 24px;"></div>

										<!-- Banner Image -->
										${
											imageUrl
												? `<div style="margin:0 0 28px;border-radius:18px;overflow:hidden;border:1px solid #e5e8e5;">
														<img src="${imageUrl}" alt="CellKore Showcase" style="display:block;width:100%;height:auto;border-radius:18px;" />
													</div>`
												: ''
										}

										<!-- Body Message Content -->
										<div style="font-size:14px;line-height:1.75;color:#374151;font-weight:400;">
											${bodyHtml}
										</div>

										<!-- 3-Column Feature Pillars Bar -->
										<div style="margin:32px 0 28px;padding:24px 8px;border-top:1px solid #e5e8e5;border-bottom:1px solid #e5e8e5;">
											<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
												<tr>
													<td width="33%" align="center" style="vertical-align:top;padding:0 6px;">
														<div style="width:38px;height:38px;border-radius:50%;background:#ffffff;border:1.5px solid #5a9263;margin:0 auto 10px;line-height:38px;text-align:center;font-size:16px;">
															<span style="display:inline-block;line-height:38px;">&#128230;</span>
														</div>
														<p style="margin:0 0 4px;font-size:12px;font-weight:800;color:#111827;letter-spacing:-0.01em;">Premium Devices</p>
														<p style="margin:0;font-size:11px;color:#6b7280;line-height:1.4;font-weight:400;">Carefully selected high-quality devices.</p>
													</td>
													<td width="1%" style="border-right:1px solid #e5e8e5;"></td>
													<td width="32%" align="center" style="vertical-align:top;padding:0 6px;">
														<div style="width:38px;height:38px;border-radius:50%;background:#ffffff;border:1.5px solid #5a9263;margin:0 auto 10px;line-height:38px;text-align:center;font-size:16px;">
															<span style="display:inline-block;line-height:38px;">&#128737;</span>
														</div>
														<p style="margin:0 0 4px;font-size:12px;font-weight:800;color:#111827;letter-spacing:-0.01em;">Trusted Worldwide</p>
														<p style="margin:0;font-size:11px;color:#6b7280;line-height:1.4;font-weight:400;">Thousands of happy customers globally.</p>
													</td>
													<td width="1%" style="border-right:1px solid #e5e8e5;"></td>
													<td width="33%" align="center" style="vertical-align:top;padding:0 6px;">
														<div style="width:38px;height:38px;border-radius:50%;background:#ffffff;border:1.5px solid #5a9263;margin:0 auto 10px;line-height:38px;text-align:center;font-size:16px;">
															<span style="display:inline-block;line-height:38px;">&#127911;</span>
														</div>
														<p style="margin:0 0 4px;font-size:12px;font-weight:800;color:#111827;letter-spacing:-0.01em;">Here to Help</p>
														<p style="margin:0;font-size:11px;color:#6b7280;line-height:1.4;font-weight:400;">Dedicated support when you need it.</p>
													</td>
												</tr>
											</table>
										</div>

										<!-- Bottom Action Container (2 Columns: Store & Unsubscribe, NO ARROWS) -->
										<div style="margin-top:32px;background:#f4f9f5;border:1.5px solid #c8e6ce;border-radius:20px;padding:18px 24px;">
											<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
												<tr>
													<td width="48%" style="vertical-align:middle;padding:4px 4px;">
														<a href="${action?.url || siteUrl() + '/products'}" target="_blank" style="display:block;text-decoration:none;">
															<table role="presentation" cellpadding="0" cellspacing="0">
																<tr>
																	<td style="vertical-align:middle;padding-right:12px;">
																		<div style="width:42px;height:42px;border-radius:50%;background:#ffffff;border:1.5px solid #5a9263;text-align:center;line-height:42px;">
																			<img src="https://img.icons8.com/ios/50/5a9263/shopping-bag.png" width="20" height="20" alt="Store" style="display:inline-block;vertical-align:middle;margin-top:-2px;" />
																		</div>
																	</td>
																	<td style="vertical-align:middle;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#111827;">
																		VISIT CELLKORE STORE
																	</td>
																</tr>
															</table>
														</a>
													</td>
													<td width="4%" align="center" style="color:#c8e6ce;font-size:20px;font-weight:300;">|</td>
													<td width="48%" style="vertical-align:middle;padding:4px 4px 4px 16px;">
														<a href="${unsubLink}" target="_blank" style="display:block;text-decoration:none;">
															<table role="presentation" cellpadding="0" cellspacing="0">
																<tr>
																	<td style="vertical-align:middle;padding-right:12px;">
																		<div style="width:42px;height:42px;border-radius:50%;background:#ffffff;border:1.5px solid #5a9263;text-align:center;line-height:42px;">
																			<img src="https://img.icons8.com/ios/50/5a9263/mail.png" width="20" height="20" alt="Unsubscribe" style="display:inline-block;vertical-align:middle;margin-top:-2px;" />
																		</div>
																	</td>
																	<td style="vertical-align:middle;font-size:11px;font-weight:800;letter-spacing:0.08em;text-transform:uppercase;color:#111827;">
																		UNSUBSCRIBE FROM NEWSLETTER
																	</td>
																</tr>
															</table>
														</a>
													</td>
												</tr>
											</table>
										</div>

									</td>
								</tr>

								<!-- Multi-column Footer Section -->
								<tr>
									<td style="padding:32px 40px;background:#fafafa;border-top:1px solid #eeeeee;">
										<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
											<tr>
												<td width="55%" style="vertical-align:top;padding-right:24px;">
													<img src="${logoUrl()}" width="60" height="60" alt="CellKore" style="display:block;border-radius:14px;margin-bottom:12px;" />
													<p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#111827;">ABOUT CELLKORE</p>
													<p style="margin:0;font-size:11px;color:#6b7280;line-height:1.6;font-weight:400;">
														CellKore is your trusted store for premium electronics. We bring you top quality devices, unbeatable prices, and exceptional service.
													</p>
												</td>
												<td width="45%" style="vertical-align:top;padding-left:16px;border-left:1px solid #eeeeee;">
													<p style="margin:0 0 10px;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#111827;">NEED HELP?</p>
													
													<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
														<tr>
															<td style="padding-right:8px;vertical-align:middle;">
																<img src="https://img.icons8.com/ios/50/5a9263/mail.png" width="14" height="14" alt="Email" style="display:block;" />
															</td>
															<td style="font-size:11px;font-weight:600;vertical-align:middle;">
																<a href="mailto:support@cellkore.com" style="color:#5a9263;text-decoration:none;">support@cellkore.com</a>
															</td>
														</tr>
													</table>

													<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:6px;">
														<tr>
															<td style="padding-right:8px;vertical-align:middle;">
																<img src="https://img.icons8.com/ios/50/5a9263/phone.png" width="14" height="14" alt="Phone" style="display:block;" />
															</td>
															<td style="font-size:11px;color:#4b5563;font-weight:500;vertical-align:middle;">
																+1 (234) 567 8900
															</td>
														</tr>
													</table>

													<table role="presentation" cellpadding="0" cellspacing="0" style="margin-bottom:14px;">
														<tr>
															<td style="padding-right:8px;vertical-align:middle;">
																<img src="https://img.icons8.com/ios/50/5a9263/domain.png" width="14" height="14" alt="Website" style="display:block;" />
															</td>
															<td style="font-size:11px;color:#4b5563;font-weight:500;vertical-align:middle;">
																<a href="${siteUrl()}" style="color:#4b5563;text-decoration:none;">www.cellkore.com</a>
															</td>
														</tr>
													</table>

													<!-- Official Social Media Logos (Dynamic from Store Links, Twitter removed) -->
													<table role="presentation" cellpadding="0" cellspacing="0">
														<tr>
															${
																(opts.socialLinks && opts.socialLinks.length > 0
																	? opts.socialLinks
																	: [
																			{ platform: 'facebook', url: 'https://facebook.com' },
																			{ platform: 'instagram', url: 'https://instagram.com' },
																			{ platform: 'whatsapp', url: 'https://wa.me/1234567890' }
																	  ]
																)
																	.filter((item) => item.platform?.toLowerCase() !== 'twitter' && item.platform?.toLowerCase() !== 'x')
																	.map((item) => {
																		const p = item.platform.toLowerCase()
																		let icon = 'https://img.icons8.com/color/48/domain.png'
																		if (p.includes('facebook')) icon = 'https://img.icons8.com/color/48/facebook-new.png'
																		else if (p.includes('instagram')) icon = 'https://img.icons8.com/color/48/instagram-new.png'
																		else if (p.includes('whatsapp')) icon = 'https://img.icons8.com/color/48/whatsapp.png'
																		else if (p.includes('youtube')) icon = 'https://img.icons8.com/color/48/youtube-play.png'
																		else if (p.includes('tiktok')) icon = 'https://img.icons8.com/color/48/tiktok.png'
																		else if (p.includes('linkedin')) icon = 'https://img.icons8.com/color/48/linkedin.png'

																		return `<td style="padding-right:10px;">
																			<a href="${item.url}" target="_blank" style="display:inline-block;text-decoration:none;">
																				<img src="${icon}" width="24" height="24" alt="${item.platform}" style="display:block;border:0;" />
																			</a>
																		</td>`
																	})
																	.join('')
															}
														</tr>
													</table>
												</td>
											</tr>
										</table>
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
	sku?: string
	qty: number
	price: number
	image_url?: string
}

export function renderOrderItemsTable(items: EmailOrderItem[], currency: 'USD' | 'CAD' = 'USD'): string {
	if (!items || items.length === 0) return ''
	const rows = items
		.map(
			(item) => `
		<tr>
			<td style="padding:10px 0;border-bottom:1px solid #f0efed;">
				<p style="margin:0;font-weight:600;color:#111111;font-size:14px;">${item.name}</p>
				${item.sku ? `<p style="margin:2px 0 0;font-size:11px;color:#78716c;">SKU: ${item.sku}</p>` : ''}
			</td>
			<td align="center" style="padding:10px 0;border-bottom:1px solid #f0efed;font-size:13px;color:#444444;">
				${item.qty}
			</td>
			<td align="right" style="padding:10px 0;border-bottom:1px solid #f0efed;font-weight:600;font-size:14px;color:#111111;">
				${formatCurrency(item.price * item.qty, currency)}
			</td>
		</tr>`
		)
		.join('')

	return `
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:12px 0;">
		<thead>
			<tr style="border-bottom:1.5px solid #e7e5e4;">
				<th align="left" style="padding:6px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#78716c;">Item</th>
				<th align="center" style="padding:6px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#78716c;">Qty</th>
				<th align="right" style="padding:6px 0;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;color:#78716c;">Total</th>
			</tr>
		</thead>
		<tbody>${rows}</tbody>
	</table>`
}

export function renderOrderSummary(opts: {
	subtotal: number
	discount?: number
	tax?: number
	extras?: number
	total: number
	currency?: 'USD' | 'CAD'
}): string {
	const currency = opts.currency || 'USD'
	return `
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;font-size:13px;color:#444444;">
		<tr>
			<td style="padding:4px 0;">Subtotal</td>
			<td align="right" style="padding:4px 0;font-weight:500;">${formatCurrency(opts.subtotal, currency)}</td>
		</tr>
		${
			opts.discount
				? `<tr>
			<td style="padding:4px 0;color:#dc2626;">Discount</td>
			<td align="right" style="padding:4px 0;color:#dc2626;font-weight:500;">-${formatCurrency(opts.discount, currency)}</td>
		</tr>`
				: ''
		}
		${
			opts.tax
				? `<tr>
			<td style="padding:4px 0;">Tax</td>
			<td align="right" style="padding:4px 0;font-weight:500;">${formatCurrency(opts.tax, currency)}</td>
		</tr>`
				: ''
		}
		${
			opts.extras
				? `<tr>
			<td style="padding:4px 0;">Shipping / Fees</td>
			<td align="right" style="padding:4px 0;font-weight:500;">${formatCurrency(opts.extras, currency)}</td>
		</tr>`
				: ''
		}
		<tr style="border-top:1.5px solid #111111;">
			<td style="padding:8px 0;font-size:15px;font-weight:800;color:#111111;">Total</td>
			<td align="right" style="padding:8px 0;font-size:15px;font-weight:800;color:#5a9263;">${formatCurrency(opts.total, currency)}</td>
		</tr>
	</table>`
}

export function renderAddress(addr?: any): string {
	if (!addr) return '<p style="margin:0;color:#78716c;">No shipping address provided.</p>'
	const lines = [
		addr.fullName || addr.full_name || addr.name,
		addr.company,
		addr.addressLine1 || addr.address_line_1 || addr.street,
		addr.addressLine2 || addr.address_line_2,
		[addr.city, addr.state || addr.province, addr.postalCode || addr.postal_code || addr.zip].filter(Boolean).join(', '),
		addr.country,
		addr.phone ? `Phone: ${addr.phone}` : null,
	].filter(Boolean)

	return lines.map((l) => `<p style="margin:0 0 2px;color:#444444;font-size:13px;">${l}</p>`).join('')
}
