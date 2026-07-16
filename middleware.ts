import { NextRequest, NextResponse } from 'next/server'

// Routes that don't require authentication
const publicAdminRoutes = ['/admin/login']

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if it's an admin route
  if (pathname.startsWith('/admin')) {
    // If it's a public admin route, allow access
    if (publicAdminRoutes.includes(pathname)) {
      return NextResponse.next()
    }

    // For other admin routes, we'll let the client component handle auth
    // The client-side component will redirect to login if not authenticated
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}
