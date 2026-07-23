'use client'

import { Suspense, useEffect, useState, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MailX, CheckCircle2, Loader2, ArrowLeft } from 'lucide-react'
import { Navigation } from '@/components/navigation'
import { Footer } from '@/components/footer'

function UnsubscribeForm() {
	const searchParams = useSearchParams()
	const initialEmail = (searchParams.get('email') ?? '').trim()

	const [email, setEmail] = useState(initialEmail)
	const [loading, setLoading] = useState(false)
	const [unsubscribed, setUnsubscribed] = useState(false)
	const [errorMsg, setErrorMsg] = useState<string | null>(null)
	const hasAutoProcessed = useRef(false)

	const doUnsubscribe = async (targetEmail: string) => {
		const cleaned = targetEmail.trim().toLowerCase()
		if (!/^\S+@\S+\.\S+$/.test(cleaned)) {
			setErrorMsg('Please enter a valid email address.')
			return
		}

		setLoading(true)
		setErrorMsg(null)

		try {
			const res = await fetch('/api/newsletter/unsubscribe', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email: cleaned }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error || 'Unsubscribe request failed')

			setUnsubscribed(true)
		} catch (err) {
			setErrorMsg(err instanceof Error ? err.message : 'Failed to unsubscribe. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	// Auto-process unsubscribe if email parameter is present in URL
	useEffect(() => {
		if (initialEmail && !hasAutoProcessed.current) {
			hasAutoProcessed.current = true
			doUnsubscribe(initialEmail)
		}
	}, [initialEmail])

	const handleFormSubmit = (e: React.FormEvent) => {
		e.preventDefault()
		doUnsubscribe(email)
	}

	return (
		<div className="max-w-xl mx-auto px-4 py-16 sm:py-24">
			<div className="bg-card border border-border rounded-3xl p-8 sm:p-12 shadow-sm text-center font-sans space-y-6">
				{loading ? (
					<div className="py-12 space-y-4">
						<Loader2 className="w-10 h-10 animate-spin mx-auto text-[#599161]" />
						<p className="text-sm font-semibold text-muted-foreground">
							Unsubscribing <strong className="text-foreground">{email}</strong>...
						</p>
					</div>
				) : unsubscribed ? (
					<div className="space-y-4">
						<div className="w-16 h-16 mx-auto rounded-full bg-[#EEF7F0] border border-[#C8E6CE] flex items-center justify-center text-[#599161]">
							<CheckCircle2 className="w-8 h-8" />
						</div>
						<h1 className="text-2xl font-serif font-bold text-foreground">
							Successfully Unsubscribed
						</h1>
						<p className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
							<strong className="text-foreground">{email}</strong> has been removed from all CellKore newsletter and promotional email lists.
						</p>
						<div className="pt-4">
							<Link
								href="/"
								className="inline-flex items-center gap-2 px-6 py-3 bg-[#599161] hover:bg-[#46754e] text-white text-xs font-bold uppercase tracking-[0.16em] rounded-2xl transition-all shadow-sm cursor-pointer"
							>
								<ArrowLeft className="w-4 h-4" /> Return to Store
							</Link>
						</div>
					</div>
				) : (
					<div className="space-y-6">
						<div className="w-14 h-14 mx-auto rounded-full bg-rose-500/10 text-rose-600 flex items-center justify-center">
							<MailX className="w-7 h-7" />
						</div>

						<div className="space-y-2">
							<h1 className="text-2xl sm:text-3xl font-serif font-bold text-foreground">
								Unsubscribe from Newsletter
							</h1>
							<p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
								Confirm your email address below to unsubscribe from CellKore newsletter updates.
							</p>
						</div>

						{errorMsg && (
							<div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-600 font-semibold">
								{errorMsg}
							</div>
						)}

						<form onSubmit={handleFormSubmit} className="space-y-4 text-left">
							<div>
								<label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground block mb-2">
									Your Email Address
								</label>
								<input
									type="email"
									required
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="email@example.com"
									className="w-full px-4 py-3 rounded-xl border border-border bg-background text-foreground text-xs font-medium focus:border-primary focus:outline-none transition-colors"
								/>
							</div>

							<button
								type="submit"
								disabled={loading}
								className="w-full py-3.5 px-6 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs uppercase tracking-[0.16em] rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm disabled:opacity-50"
							>
								Confirm Unsubscribe
							</button>
						</form>

						<div className="pt-2">
							<Link href="/" className="text-xs font-semibold text-muted-foreground hover:text-foreground underline">
								Never mind, take me back to CellKore
							</Link>
						</div>
					</div>
				)}
			</div>
		</div>
	)
}

export default function NewsletterUnsubscribePage() {
	return (
		<main className="min-h-screen bg-background flex flex-col justify-between">
			<Navigation />
			<Suspense
				fallback={
					<div className="max-w-xl mx-auto py-24 text-center">
						<Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
					</div>
				}
			>
				<UnsubscribeForm />
			</Suspense>
			<Footer />
		</main>
	)
}
