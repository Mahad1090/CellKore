import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, ADMIN_COOKIE } from '@/lib/admin/session'

const PUBLIC_ADMIN_ROUTES = ['/admin/login']
const PUBLIC_ADMIN_APIS = ['/api/admin/auth/login']

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl

	// Canonicalize the host: www.cellkore.com (or any other www.* variant)
	// permanently redirects to the bare apex domain, so search engines and
	// visitors only ever see one canonical version of the site.
	const host = request.headers.get('host') || ''
	if (host.startsWith('www.')) {
		const url = request.nextUrl.clone()
		// Set hostname/port separately (not the combined `host` setter) — the
		// latter can leave a stale port behind depending on how the request
		// arrived, producing an incorrect redirect like https://apex:3000/.
		url.hostname = host.slice(4).split(':')[0]
		url.port = ''
		url.protocol = 'https'
		return NextResponse.redirect(url, 308)
	}

	const isAdminPage = pathname.startsWith('/admin')
	const isAdminApi = pathname.startsWith('/api/admin')
	if (!isAdminPage && !isAdminApi) return NextResponse.next()

	if (PUBLIC_ADMIN_ROUTES.includes(pathname) || PUBLIC_ADMIN_APIS.includes(pathname)) {
		return NextResponse.next()
	}

	const token = request.cookies.get(ADMIN_COOKIE)?.value
	const session = token ? await verifyAdminToken(token) : null

	if (!session) {
		if (isAdminApi) {
			return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
		}
		const loginUrl = new URL('/admin/login', request.url)
		loginUrl.searchParams.set('next', pathname)
		return NextResponse.redirect(loginUrl)
	}

	// Fine-grained role checks (incl. admin_users existence) happen inside each
	// /api/admin route via requireAdmin(); the proxy gate blocks anonymous
	// access and expired tokens at the edge.
	return NextResponse.next()
}

export const config = {
	// Runs on every request (excluding static assets/Next internals) so the
	// www-canonicalization redirect above applies site-wide, not just admin
	// routes; the admin-auth check further up still only acts on admin paths.
	matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
