import { setDefaultResultOrder } from 'node:dns'
import { warmCanadaPostToken } from '@/lib/shipping/canada-post'

/**
 * @supabase/supabase-js prints a console.warn on every module load when Node.js <= 20
 * is detected (see node_modules/@supabase/supabase-js/src/index.ts). It floods the dev
 * log on every recompile. Silence just that message; leave all other warnings intact.
 */
export function register() {
	// Some carrier API hosts (e.g. Canada Post's api.canadapost-postescanada.ca,
	// served from CloudFront with both A and AAAA records) resolve fast over
	// IPv6 via `curl` on this network but take 10-40s per request through
	// Node's fetch (undici), which tries IPv6 first and waits out a slow/dead
	// route before falling back to the working IPv4 address. Forcing IPv4
	// first for DNS resolution avoids that fallback delay app-wide — measured
	// combined Canada Post + UPS rate lookups dropping from ~30s to ~2s.
	setDefaultResultOrder('ipv4first')

	// Warms the Canada Post OAuth token cache once at server startup so a
	// customer's first rate request doesn't pay for both a token fetch and
	// the rating call inside the same request. Fire-and-forget — must not
	// block or fail server startup.
	warmCanadaPostToken()

	const originalWarn = console.warn
	console.warn = (...args: unknown[]) => {
		if (typeof args[0] === 'string' && args[0].includes('Node.js 20 and below are deprecated')) return
		originalWarn(...args)
	}
}
