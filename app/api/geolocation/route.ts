import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function clientIpFrom(request: NextRequest): string | null {
	const forwarded = request.headers.get('x-forwarded-for')
	if (forwarded) return forwarded.split(',')[0].trim()
	return request.headers.get('x-real-ip')
}

export async function GET(request: NextRequest) {
	// Hosting-provider geo headers first (Vercel / Cloudflare) — no network call needed.
	const headerCountry =
		request.headers.get('x-vercel-ip-country') || request.headers.get('cf-ipcountry')

	let country: string | null = headerCountry

	if (!country) {
		const ip = clientIpFrom(request)
		try {
			const controller = new AbortController()
			const timer = setTimeout(() => controller.abort(), 4000)
			const res = await fetch(`https://ipapi.co/${ip ? `${ip}/` : ''}country/`, {
				signal: controller.signal,
				headers: { 'User-Agent': 'cellkore-geolocation' },
			})
			clearTimeout(timer)
			if (res.ok) {
				const text = (await res.text()).trim()
				if (/^[A-Z]{2}$/.test(text)) country = text
			}
		} catch {
			// detection failed — fall through to default below
		}
	}

	const countryCode = country === 'US' || country === 'CA' ? country : country ? 'INT' : 'US'
	return NextResponse.json({ countryCode })
}
