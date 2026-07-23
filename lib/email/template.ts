export const BRAND_COLOR = '#5a9263'
export const BRAND_COLOR_DARK = '#477650'

export function siteUrl(): string {
	return process.env.NEXT_PUBLIC_SITE_URL || 'https://cellkore.com'
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
 * Shared branded wrapper for every outgoing email — matches the user's reference email layout
 * with top shipping bar, logo header, pill eyebrow, banner picture container, catchy CTA box without arrow,
 * fixed non-stretchy gift icon, CellKore logo green branding (#5a9263), and multi-column footer.
 */
export function renderEmailLayout(opts: {
	eyebrow?: string
	heading: string
	bodyHtml: string
	imageUrl?: string
	action?: EmailAction
}): string {
	const { eyebrow = 'NEWSLETTER & NEW ARRIVALS', heading, bodyHtml, imageUrl, action } = opts

	const actionLabel = action?.label?.trim() || 'EXPLORE COLLECTION'

	return `<!doctype html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<style>
		body { margin: 0; padding: 0; background-color: #f4f6f4; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
		a { color: #5a9263; text-decoration: none; }
		a:hover { text-decoration: underline; }
		h1 a { color: #111827 !important; text-decoration: none !important; }
	</style>
</head>
<body style="margin:0;padding:0;background-color:#f4f6f4;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

	<!-- Main Wrapper -->
	<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f6f4;padding:32px 16px 48px;">
		<tr>
			<td align="center">
				<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;">
					
					<!-- Brand Logo Header -->
					<tr>
						<td style="padding:0 0 28px;text-align:center;">
							<a href="${siteUrl()}" target="_blank" style="display:inline-block;text-decoration:none;">
								<img src="${logoUrl()}" width="110" height="110" alt="CellKore" style="display:inline-block;border-radius:24px;" />
							</a>
							<p style="margin:6px 0 0;font-size:12px;color:#6b7280;font-weight:600;letter-spacing:0.02em;">
								Premium Devices. Trusted Worldwide.
							</p>
						</td>
					</tr>

					<!-- Main Email Card -->
					<tr>
						<td style="background-color:#ffffff;border-radius:28px;overflow:hidden;border:1px solid #e5e8e5;box-shadow:0 4px 20px rgba(0,0,0,0.03);">
							<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
								
								<!-- Content Body Area -->
								<tr>
									<td style="padding:40px 40px 24px;">
										
										<!-- Eyebrow Badge -->
										${
											eyebrow
												? `<div style="margin-bottom:18px;">
														<span style="display:inline-block;padding:6px 16px;background:#eef7f0;color:#5a9263;font-size:10px;font-weight:800;letter-spacing:0.22em;text-transform:uppercase;border-radius:999px;border:1px solid #c8e6ce;">
															&bull; ${eyebrow}
														</span>
													</div>`
												: ''
										}
										
										<!-- Main Heading -->
										<h1 style="margin:0 0 10px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;font-size:30px;line-height:1.25;color:#111827;font-weight:800;letter-spacing:-0.02em;">
											${heading}
										</h1>

										<!-- Banner Image Attachment -->
										${
											imageUrl
												? `<div style="margin:24px 0;border-radius:20px;overflow:hidden;border:1px solid #e5e8e5;">
														<img src="${imageUrl}" alt="Newsletter preview" style="display:block;width:100%;height:auto;border-radius:20px;" />
													</div>`
												: ''
										}

										<!-- Body Message Content -->
										<div style="font-size:15px;line-height:1.75;color:#374151;font-weight:400;margin-top:16px;">
											${bodyHtml}
										</div>

										<!-- Catchy CTA Announcement Box (Fixed Non-Stretchy Icon & Brand Green Button) -->
										${
											action
												? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:36px;background:#f2f8f4;border:1px solid #c8e6ce;border-radius:22px;padding:20px 22px;">
														<tr>
															<td>
																<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
																	<tr>
																		<td style="vertical-align:middle;">
																			<table role="presentation" cellpadding="0" cellspacing="0">
																				<tr>
																					<td style="width:44px;min-width:44px;vertical-align:middle;">
																						<div style="width:44px;height:44px;min-width:44px;min-height:44px;max-width:44px;max-height:44px;border-radius:50%;background:#5a9263;text-align:center;line-height:44px;">
																							<span style="font-size:20px;line-height:44px;">&#127873;</span>
																						</div>
																					</td>
																					<td style="padding-left:14px;vertical-align:middle;">
																						<p style="margin:0;font-size:13px;font-weight:800;color:#111827;letter-spacing:-0.01em;">
																							Exclusive New Arrival Collection
																						</p>
																						<p style="margin:2px 0 0;font-size:11px;color:#6b7280;font-weight:500;">
																							Tap below to discover new inventory &amp; exclusive deals.
																						</p>
																					</td>
																				</tr>
																			</table>
																		</td>
																		<td align="right" style="vertical-align:middle;padding-left:16px;">
																			<a href="${action.url}" target="_blank" style="display:inline-block;padding:12px 24px;font-size:11px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;color:#5a9263;text-decoration:none;border-radius:999px;background:#ffffff;border:2px solid #5a9263;white-space:nowrap;">
																				${actionLabel}
																			</a>
																		</td>
																	</tr>
																</table>
															</td>
														</tr>
													</table>`
												: ''
										}
									</td>
								</tr>

								<!-- Multi-column Footer Card Section -->
								<tr>
									<td style="padding:32px 40px;background:#f8faf8;border-top:1px solid #eaf0eb;">
										<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
											<tr>
												<td width="60%" style="vertical-align:top;padding-right:20px;">
													<img src="${logoUrl()}" width="70" height="70" alt="CellKore" style="display:block;border-radius:14px;margin-bottom:12px;" />
													<p style="margin:0 0 4px;font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#111827;">ABOUT CELLKORE</p>
													<p style="margin:0;font-size:11px;color:#6b7280;line-height:1.6;font-weight:500;">
														CellKore is your trusted store for premium electronics. We bring you top-quality devices, unbeatable prices, and exceptional service.
													</p>
												</td>
												<td width="40%" style="vertical-align:top;">
													<p style="margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:0.16em;text-transform:uppercase;color:#111827;">NEED HELP?</p>
													<p style="margin:0 0 4px;font-size:11px;font-weight:600;color:#5a9263;">
														<a href="mailto:support@cellkore.com" style="color:#5a9263;text-decoration:none;">support@cellkore.com</a>
													</p>
													<p style="margin:0 0 4px;font-size:11px;color:#6b7280;font-weight:500;">
														+1 (234) 567-8900
													</p>
													<p style="margin:0;font-size:11px;color:#6b7280;font-weight:500;">
														<a href="${siteUrl()}" style="color:#6b7280;text-decoration:none;">www.cellkore.com</a>
													</p>
												</td>
											</tr>
										</table>
									</td>
								</tr>
							</table>
						</td>
					</tr>

					<!-- Bottom Copyright Footnote -->
					<tr>
						<td style="padding:24px 0 0;text-align:center;">
							<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
								<tr>
									<td align="center" style="font-size:11px;color:#9ca3af;font-weight:500;">
										&copy; ${new Date().getFullYear()} CellKore. All rights reserved. &nbsp;&middot;&nbsp; 
										<a href="${siteUrl()}/privacy-policy" style="color:#6b7280;text-decoration:none;">Unsubscribe</a> &nbsp;|&nbsp; 
										<a href="${siteUrl()}/terms" style="color:#6b7280;text-decoration:none;">Manage Preferences</a>
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
