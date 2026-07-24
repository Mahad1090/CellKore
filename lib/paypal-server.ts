import { paymentsLive, paypalWebhookId } from './payments-env'

export function paypalApiBase(): string {
	return paymentsLive() ? 'https://api-m.paypal.com' : 'https://api-m.sandbox.paypal.com'
}

export async function paypalAccessToken(): Promise<string> {
	const clientId = paymentsLive()
		? process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID_LIVE
		: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID_TEST
	const secret = paymentsLive() ? process.env.PAYPAL_CLIENT_SECRET_LIVE : process.env.PAYPAL_CLIENT_SECRET_TEST
	if (!clientId || !secret) throw new Error('PayPal is not configured')

	const res = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
		method: 'POST',
		headers: {
			Authorization: `Basic ${Buffer.from(`${clientId}:${secret}`).toString('base64')}`,
			'Content-Type': 'application/x-www-form-urlencoded',
		},
		body: 'grant_type=client_credentials',
	})
	if (!res.ok) throw new Error('PayPal authentication failed')
	const json = await res.json()
	return json.access_token as string
}

/**
 * Verifies a PayPal webhook notification via PayPal's own verification API
 * (unlike Stripe, PayPal webhook signatures can't be checked locally — they
 * require calling back to PayPal with the transmission headers + the
 * webhook id registered for this app).
 */
export async function verifyPaypalWebhookSignature(headers: Headers, rawBody: string): Promise<boolean> {
	const webhookId = paypalWebhookId()
	if (!webhookId) return false

	let webhookEvent: unknown
	try {
		webhookEvent = JSON.parse(rawBody)
	} catch {
		return false
	}

	const accessToken = await paypalAccessToken()
	const res = await fetch(`${paypalApiBase()}/v1/notifications/verify-webhook-signature`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
		body: JSON.stringify({
			auth_algo: headers.get('paypal-auth-algo'),
			cert_url: headers.get('paypal-cert-url'),
			transmission_id: headers.get('paypal-transmission-id'),
			transmission_sig: headers.get('paypal-transmission-sig'),
			transmission_time: headers.get('paypal-transmission-time'),
			webhook_id: webhookId,
			webhook_event: webhookEvent,
		}),
	})
	if (!res.ok) return false
	const json = await res.json()
	return json.verification_status === 'SUCCESS'
}
