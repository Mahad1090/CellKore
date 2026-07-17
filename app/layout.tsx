import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Cormorant_Garamond, Jost } from 'next/font/google'
import './globals.css'
import { AuthProvider } from '@/contexts/auth-context'
import { ToastProvider } from '@/components/ui/toast'
import { MarketplaceProvider } from '@/contexts/marketplace-context'

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

export const metadata: Metadata = {
  title: 'CellKore - Premium Cell Phone Sales',
  description: 'Buy new and refurbished cell phones, accessories, and spare parts. Quality products at competitive prices.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
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
        <ToastProvider>
          <MarketplaceProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </MarketplaceProvider>
        </ToastProvider>
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
