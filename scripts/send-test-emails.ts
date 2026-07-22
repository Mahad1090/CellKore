// One-off dev utility: sends one sample of every CellKore transactional
// email to a given address so the HTML templates can be eyeballed in a
// real inbox. Reads SMTP_* from .env.local directly since this runs
// outside the Next.js server. Usage: npx tsx scripts/send-test-emails.ts <to-email>
import fs from 'node:fs'
import path from 'node:path'

const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
	for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
		const trimmed = line.trim()
		if (!trimmed || trimmed.startsWith('#')) continue
		const idx = trimmed.indexOf('=')
		if (idx === -1) continue
		const key = trimmed.slice(0, idx).trim()
		let value = trimmed.slice(idx + 1).trim()
		if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
			value = value.slice(1, -1)
		}
		if (!process.env[key]) process.env[key] = value
	}
}

async function main() {
	const to = process.argv[2]
	if (!to) {
		console.error('Usage: npx tsx scripts/send-test-emails.ts <to-email>')
		process.exit(1)
	}

	const { sendOrderConfirmationEmail, sendNewOrderAdminAlert, sendOrderStatusEmail } = await import('../lib/email/orders')
	const {
		sendSellRequestStatusEmail,
		sendNewSellRequestAdminAlert,
		sendSellRequestCustomerDecisionAdminAlert,
		sendSellRequestShipmentAdminAlert,
	} = await import('../lib/email/sell-requests')
	const { notifyRepairStatusChange } = await import('../lib/repair-notifications')
	const { sendNewRepairRequestAdminAlert } = await import('../lib/email/repair')
	const { sendNewInquiryAdminAlert } = await import('../lib/email/inquiries')
	const { sendMail } = await import('../lib/email/mailer')
	const { FROM_SYSTEM } = await import('../lib/email/addresses')

	console.log(`Sending sample emails to ${to} ...`)

	// Orders
	const sampleItems = [
		{ name: 'iPhone 15 Pro — 256GB Space Black', quantity: 1, unitPrice: 899 },
		{ name: 'MagSafe Charger', quantity: 2, unitPrice: 39 },
	]
	const sampleAddress = {
		line1: '221B Baker Street',
		city: 'Toronto',
		stateProvince: 'ON',
		postalCode: 'M4B 1B3',
		country: 'CA',
	}
	await sendOrderConfirmationEmail({
		to,
		reference: 'CK-2026-00042',
		items: sampleItems,
		subtotal: 977,
		discount: 30,
		tax: 52.16,
		extras: 10,
		total: 1009.16,
		marketplace: 'US',
		shippingAddress: sampleAddress,
	})
	await sendNewOrderAdminAlert({
		reference: 'CK-2026-00042',
		subtotal: 977,
		discount: 30,
		tax: 52.16,
		extras: 10,
		total: 1009.16,
		marketplace: 'US',
		itemCount: 2,
		customerEmail: to,
		shippingAddress: sampleAddress,
	})
	await sendOrderStatusEmail({ to, reference: 'CK-2026-00042', status: 'shipped' })

	// Sell Requests
	await sendSellRequestStatusEmail(
		{
			id: 'sample-sell-id',
			contact_email: to,
			device_brand: 'Samsung',
			device_model: 'Galaxy S23 Ultra',
			offered_price: 420,
		},
		'approved'
	)
	await sendNewSellRequestAdminAlert({
		id: 'sample-sell-id',
		device_brand: 'Samsung',
		device_model: 'Galaxy S23 Ultra',
		contact_email: to,
		contact_phone: '+1 555 0100',
	})
	await sendSellRequestCustomerDecisionAdminAlert(
		{ id: 'sample-sell-id', device_brand: 'Samsung', device_model: 'Galaxy S23 Ultra', offered_price: 420 },
		'accept'
	)
	await sendSellRequestShipmentAdminAlert({
		id: 'sample-sell-id',
		device_brand: 'Samsung',
		device_model: 'Galaxy S23 Ultra',
		courier: 'UPS',
		tracking: '1Z999AA10123456784',
	})

	// Repair Requests
	await notifyRepairStatusChange(
		{
			id: 'sample-repair-id',
			contact_email: to,
			contact_phone: '+1 555 0100',
			device_brand: 'Apple',
			device_model: 'iPhone 14',
			quote_items: [
				{ label: 'Screen Replacement', amount: 129 },
				{ label: 'Battery Replacement', amount: 49 },
			],
			quote_total: 178,
			quote_currency: 'USD',
		},
		'quote_sent'
	)
	await sendNewRepairRequestAdminAlert({
		id: 'sample-repair-id',
		device_brand: 'Apple',
		device_model: 'iPhone 14',
		device_category: 'phone',
		issues: ['Cracked Screen', 'Battery Drain'],
		service_method: 'mail_in',
		contact_name: 'Jordan Rivera',
		contact_email: to,
		contact_phone: '+1 555 0100',
	})

	// Contact / Inquiries
	await sendNewInquiryAdminAlert({
		name: 'Jordan Rivera',
		email: to,
		phone: '+1 555 0100',
		country: 'US',
		message: 'Hi, I have a question about wholesale pricing on bulk iPhone lots.',
	})

	// Plain sanity-check send using the raw mailer, in case any template call above silently no-ops
	await sendMail({
		to,
		from: FROM_SYSTEM,
		subject: 'CellKore SMTP Test',
		html: '<p>If you can read this, SMTP delivery is working.</p>',
	})

	console.log('Done. Check the inbox (and spam folder) for ~10 emails.')
}

main().catch((err) => {
	console.error(err)
	process.exit(1)
})
