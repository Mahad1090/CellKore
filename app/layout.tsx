import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Jost } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'
import { ToastProvider } from '@/components/ui/toast'
import { MarketplaceProvider } from '@/contexts/marketplace-context'
import { WhatsAppButton } from '@/components/whatsapp-button'
import { siteUrl } from '@/lib/email/template'

const cormorant = Cormorant_Garamond({
  variable: '--font-heading',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
  preload: true,
})

const jost = Jost({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  display: 'swap',
  preload: true,
})

const SITE_URL = siteUrl()

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'CellKore - Premium Cell Phone Sales',
    template: '%s | CellKore',
  },
  description: 'Buy new and refurbished cell phones, accessories, and spare parts. Quality products at competitive prices — plus device repair, trade-in, and wholesale bulk pricing.',
  generator: 'v0.app',
  alternates: {
    canonical: '/',
  },
  icons: {
    icon: '/cellkore_apple_green.webp',
    apple: '/cellkore_apple_green.webp',
  },
  openGraph: {
    type: 'website',
    siteName: 'CellKore',
    title: 'CellKore - Premium Cell Phone Sales',
    description: 'Buy new and refurbished cell phones, accessories, and spare parts. Quality products at competitive prices — plus device repair, trade-in, and wholesale bulk pricing.',
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CellKore - Premium Cell Phone Sales',
    description: 'Buy new and refurbished cell phones, accessories, and spare parts. Quality products at competitive prices.',
  },
  // Fill in with the verification code from Google Search Console
  // (Settings > Ownership verification > HTML tag) once you add the
  // property — leaving this unset means the site isn't verified yet.
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
}

const organizationSchema = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: 'CellKore',
  url: SITE_URL,
  logo: `${SITE_URL}/cellkore_apple_green.webp`,
  sameAs: [] as string[],
}

const websiteSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'CellKore',
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/products?search={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
}

// The storefront theme is fixed and identical regardless of the browser's
// light/dark preference.
export const viewport: Viewport = {
  colorScheme: 'light',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${jost.variable} bg-background`}>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        <ToastProvider>
          <MarketplaceProvider>
            <AuthProvider>
              {children}
              <WhatsAppButton />
            </AuthProvider>
          </MarketplaceProvider>
        </ToastProvider>
      </body>
    </html>
  )
}
