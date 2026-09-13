import type { Metadata } from 'next'
import HomeClient from './home-client'

export const metadata: Metadata = {
	title: 'Premium New & Refurbished Phones, Tablets, Laptops & More',
	description: 'Shop premium new and refurbished phones, tablets, laptops, and smartwatches. Sell your device for cash, book expert repairs, or buy wholesale bulk lots — all in one place.',
	alternates: { canonical: '/' },
}

export default function Home() {
	return <HomeClient />
}
