'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2, Lock, ShieldCheck } from 'lucide-react'
import { useAdmin } from '@/contexts/admin-context'
import { adminInput, adminButton } from '@/components/admin/ui'

export default function AdminLoginPage() {
	return (
		<Suspense fallback={null}>
			<LoginForm />
		</Suspense>
	)
}

function LoginForm() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const { refresh } = useAdmin()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [error, setError] = useState<string | null>(null)
	const [loading, setLoading] = useState(false)

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		setError(null)
		setLoading(true)
		try {
			const res = await fetch('/api/admin/auth/login', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ email, password }),
			})
			const json = await res.json()
			if (!res.ok) {
				setError(json.error ?? 'Sign-in failed')
				return
			}
			await refresh()
			router.push(searchParams.get('next') || '/admin/dashboard')
		} catch {
			setError('Unable to reach the server. Please try again.')
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="min-h-screen flex items-center justify-center bg-background p-4">
			<div className="w-full max-w-md">
				<div className="border-beam-container">
					<div className="border-beam-glow" />
					<div className="border-beam-inner p-9">
						<div className="flex flex-col items-center mb-8">
							<div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg">
								<ShieldCheck className="w-6 h-6 text-primary-foreground" />
							</div>
							<h1 className="text-xl font-bold text-card-foreground tracking-wide">CellKore Admin</h1>
							<p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground mt-1.5">
								Authorized Personnel Only
							</p>
						</div>

						<form onSubmit={handleSubmit} className="space-y-4">
							<input
								type="email"
								required
								placeholder="Email address"
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className={adminInput}
								autoComplete="username"
							/>
							<input
								type="password"
								required
								placeholder="Password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className={adminInput}
								autoComplete="current-password"
							/>

							{error && (
								<div className="px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-xs">
									{error}
								</div>
							)}

							<button type="submit" disabled={loading} className={`${adminButton} w-full justify-center py-3.5`}>
								{loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-3.5 h-3.5" />}
								{loading ? 'Signing in...' : 'Sign In'}
							</button>
						</form>
					</div>
				</div>
			</div>
		</div>
	)
}
