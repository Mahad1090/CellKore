'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, HelpCircle, MessageSquare, ArrowRight, PhoneCall } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'

interface FaqItem {
	id: string
	question: string
	answer: string
}

const FALLBACK_FAQS: FaqItem[] = [
	{
		id: 'faq-1',
		question: 'HOW LONG WILL IT TAKE TO RECEIVE MY ORDER?',
		answer:
			'Ready-to-ship items are processed in 1-2 business days before dispatch. Express shipping delivers within 2-4 business days across US and Canada. Once your order ships, you will receive an email with live tracking details.',
	},
	{
		id: 'faq-2',
		question: 'WHAT IS CELLKORE AND HOW ARE DEVICES TESTED?',
		answer:
			'CellKore is your premium certified electronics hub. Every refurbished phone, tablet, and accessory undergoes a rigorous 90-point technical hardware diagnostic and battery health test before being listed.',
	},
	{
		id: 'faq-3',
		question: 'WHAT IS YOUR RETURN & WARRANTY POLICY?',
		answer:
			'We stand behind every product sold. All devices come with a 30-day CellKore Warranty. Eligible returns are processed within 3-5 business days upon receiving the item back at our facility.',
	},
]

export default function FaqPage() {
	const [faqs, setFaqs] = useState<FaqItem[]>(FALLBACK_FAQS)
	const [openId, setOpenId] = useState<string | null>('faq-1')

	useEffect(() => {
		fetch('/api/cms/pages/faq')
			.then((res) => res.json())
			.then((json) => {
				if (json.page?.content) {
					try {
						const parsed = JSON.parse(json.page.content)
						if (Array.isArray(parsed) && parsed.length > 0) {
							setFaqs(parsed)
							setOpenId(parsed[0].id)
						}
					} catch {
						// Keep fallback
					}
				}
			})
			.catch(() => {})
	}, [])

	return (
		<main className="min-h-screen bg-background text-foreground flex flex-col">
			<Navigation />

			{/* Hero Header */}
			<div className="bg-secondary/40 border-b border-border py-16 px-4 sm:px-6 lg:px-8 text-center">
				<div className="max-w-3xl mx-auto space-y-3">
					<div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#EEF7F0] border border-[#C8E6CE] text-[#599161] text-[11px] font-bold uppercase tracking-[0.18em]">
						<HelpCircle className="w-3.5 h-3.5" />
						Customer Support & FAQ
					</div>
					<h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-luxury text-foreground">
						Frequently Asked Questions
					</h1>
					<p className="text-sm text-muted-foreground leading-relaxed max-w-xl mx-auto">
						Have a question about orders, shipping, device conditions, or warranties? Find quick answers below.
					</p>
				</div>
			</div>

			{/* Accordion Content */}
			<div className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-4">
				{faqs.map((item, index) => {
					const isOpen = openId === item.id
					return (
						<div
							key={item.id || index}
							className="border border-border/80 rounded-2xl overflow-hidden bg-card transition-all shadow-3xs"
						>
							<button
								onClick={() => setOpenId(isOpen ? null : item.id)}
								className="w-full text-left p-5 sm:p-6 flex items-center justify-between gap-4 cursor-pointer hover:bg-muted/30 transition-colors"
							>
								<div className="flex items-center gap-3.5">
									<span className="w-7 h-7 rounded-lg bg-primary/10 text-primary font-black text-xs flex items-center justify-center shrink-0">
										?
									</span>
									<span className="font-extrabold text-sm sm:text-base uppercase tracking-wider text-foreground">
										{item.question}
									</span>
								</div>
								<ChevronDown
									className={`w-5 h-5 text-muted-foreground transition-transform duration-300 shrink-0 ${
										isOpen ? 'rotate-180 text-primary' : ''
									}`}
								/>
							</button>
							{isOpen && (
								<div className="px-6 pb-6 pt-2 border-t border-border/40 text-sm leading-relaxed text-foreground/80 font-normal">
									{item.answer}
								</div>
							)}
						</div>
					)
				})}

				{/* Help Box */}
				<div className="mt-12 p-8 rounded-3xl bg-secondary border border-border text-center space-y-4">
					<h3 className="text-base font-extrabold uppercase tracking-wider text-foreground">
						Still have questions?
					</h3>
					<p className="text-xs text-muted-foreground max-w-md mx-auto">
						Our customer support team is available to assist you with device specifications, trade-in valuations, or active order tracking.
					</p>
					<div className="flex flex-wrap items-center justify-center gap-4 pt-2">
						<Link
							href="/contact"
							className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-[0.16em] rounded-full hover:opacity-90 transition-all shadow-sm"
						>
							<MessageSquare className="w-4 h-4" />
							Contact Support
						</Link>
					</div>
				</div>
			</div>

			<Footer />
		</main>
	)
}
