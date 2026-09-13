import type { Metadata } from 'next'
import SellYourPhonePageClient from './sell-client'

export const metadata: Metadata = {
	title: 'Sell Your Device for Cash',
	description: 'Get a fast, fair quote for your phone, tablet, or laptop. Ship it to CellKore, get inspected, and receive payment — no haggling, no hassle.',
	alternates: { canonical: '/sell' },
}

export default function SellYourPhonePage() {
	return <SellYourPhonePageClient />
}
