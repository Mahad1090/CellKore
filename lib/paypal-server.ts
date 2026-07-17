export function paypalApiBase(): string {
	return process.env.PAYPAL_ENV === 'live'
		? 'https://api-m.paypal.com'
		: 'https://api-m.sandbox.paypal.com'
}

export async function paypalAccessToken(): Promise<string> {
	const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
	const secret = process.env.PAYPAL_CLIENT_SECRET
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
