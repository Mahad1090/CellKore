import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminToken, ADMIN_COOKIE } from '@/lib/admin/session'

const PUBLIC_ADMIN_ROUTES = ['/admin/login']
const PUBLIC_ADMIN_APIS = ['/api/admin/auth/login']

export async function proxy(request: NextRequest) {
	const { pathname } = request.nextUrl

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
	matcher: ['/admin/:path*', '/api/admin/:path*'],
}
