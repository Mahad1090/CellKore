// Test/live credential switching for Stripe, mirroring the CANADA_POST_ENV
// pattern in lib/shipping/env.ts and the shared NEXT_PUBLIC_PAYMENTS_ENV
// switch in lib/paypal-server.ts. NEXT_PUBLIC_PAYMENTS_ENV is one switch for
// both providers — it must be NEXT_PUBLIC_ since the PayPal client id is
// read directly in the browser bundle (components/paypal-button.tsx,
// app/checkout/page.tsx).

export function paymentsLive(): boolean {
	return process.env.NEXT_PUBLIC_PAYMENTS_ENV === 'live'
}

export function stripeSecretKey(): string | undefined {
	return paymentsLive() ? process.env.STRIPE_SECRET_KEY_LIVE : process.env.STRIPE_SECRET_KEY_TEST
}

export function stripeWebhookSecret(): string | undefined {
	return paymentsLive() ? process.env.STRIPE_WEBHOOK_SECRET_LIVE : process.env.STRIPE_WEBHOOK_SECRET_TEST
}

export function paypalWebhookId(): string | undefined {
	return paymentsLive() ? process.env.PAYPAL_WEBHOOK_ID_LIVE : process.env.PAYPAL_WEBHOOK_ID_TEST
}
