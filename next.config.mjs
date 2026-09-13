/** @type {import('next').NextConfig} */
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
]

// Account/checkout/admin flows have no unique public content to rank for —
// keep them out of search results via the X-Robots-Tag response header so
// this applies even to the many client-component pages that can't export
// a `metadata` object themselves.
const noindexPaths = [
  '/admin',
  '/admin/:path*',
  '/account',
  '/account/:path*',
  '/cart',
  '/checkout',
  '/checkout/:path*',
  '/wishlist',
  '/auth/:path*',
  '/sell/track',
  '/repair/status',
  '/newsletter/unsubscribe',
]

const nextConfig = {
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        // Media files are occasionally replaced under the same name, so cap
        // the cache at a day and let clients revalidate in the background.
        source: '/:file*.(mp4|webp|jpg|jpeg|png|svg|ico)',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=86400, stale-while-revalidate=604800' }],
      },
      ...noindexPaths.map((source) => ({
        source,
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      })),
    ]
  },
}

export default nextConfig
