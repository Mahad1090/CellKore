// Test/live credential switching for Canada Post + UPS, mirroring the
// NEXT_PUBLIC_PAYMENTS_ENV pattern in lib/payments-env.ts: one env var picks
// the mode, every credential/base-URL is read as an explicit *_TEST / *_LIVE
// pair so either carrier can differ by host, by credentials, or both without
// any code change.

function isLive(envVar: string | undefined): boolean {
	return envVar === 'live'
}

export type CanadaPostMode = 'test' | 'live'

function resolveCanadaPostMode(override?: CanadaPostMode): CanadaPostMode {
	return override ?? (isLive(process.env.CANADA_POST_ENV) ? 'live' : 'test')
}

// Canada Post's current (OAuth2/JSON) developer platform uses a single
// host for both sandbox and production — the environment is determined
// entirely by which API Key/Secret Key pair (client_id/client_secret)
// requests the OAuth2 token, not by the URL. `mode` lets a caller force
// test/live independent of CANADA_POST_ENV (used to run rating on live
// while shipment/label creation stays on test, for now).
export function canadaPostCredentials(mode?: CanadaPostMode): { apiKey: string; secretKey: string; customerNumber: string } {
	const live = resolveCanadaPostMode(mode) === 'live'
	const apiKey = live ? process.env.CANADA_POST_API_KEY_LIVE : process.env.CANADA_POST_API_KEY_TEST
	const secretKey = live ? process.env.CANADA_POST_SECRET_KEY_LIVE : process.env.CANADA_POST_SECRET_KEY_TEST
	const customerNumber = live ? process.env.CANADA_POST_CUSTOMER_NUMBER_LIVE : process.env.CANADA_POST_CUSTOMER_NUMBER_TEST
	if (!apiKey || !secretKey || !customerNumber) {
		throw new Error('Canada Post is not configured (missing API key/secret key/customer number)')
	}
	return { apiKey, secretKey, customerNumber }
}

// UPS's developer portal issues one client_id/client_secret per app —
// there is no separate sandbox credential set like some other carriers.
// The same app credentials and account (shipper) number work against
// both hosts; UPS_ENV only switches which host is called (CIE/sandbox
// vs production).
export function upsApiBase(): string {
	return isLive(process.env.UPS_ENV) ? 'https://onlinetools.ups.com' : 'https://wwwcie.ups.com'
}

export function upsCredentials(): { clientId: string; clientSecret: string; accountNumber: string } {
	const clientId = process.env.UPS_CLIENT_ID
	const clientSecret = process.env.UPS_CLIENT_SECRET
	const accountNumber = process.env.UPS_ACCOUNT_NUMBER
	if (!clientId || !clientSecret || !accountNumber) {
		throw new Error('UPS is not configured (missing client credentials or account number)')
	}
	return { clientId, clientSecret, accountNumber }
}

// Stallion issues a single bearer token per account — no separate
// sandbox/live token pair like Canada Post. STALLION_ENV only switches
// which host that same token is sent to, since sandbox and production are
// fully separate hosts (not just a key prefix) on Stallion's V5 API.
export function stallionApiBase(): string {
	return isLive(process.env.STALLION_ENV) ? 'https://ship.stallion.ca/api/v5' : 'https://sandbox.stallion.ca/api/v5'
}

export function stallionApiKey(): string {
	const key = process.env.STALLION_API_KEY
	if (!key) {
		throw new Error('Stallion is not configured (missing STALLION_API_KEY)')
	}
	return key
}

export function shippingLabelsBucket(): string {
	return process.env.SHIPPING_LABELS_BUCKET || 'shipping-labels'
}
