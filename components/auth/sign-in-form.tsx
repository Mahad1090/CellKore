'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export function SignInForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { signIn } = useAuth()
  const router = useRouter()

  const inputClass =
    'w-full px-4 py-3 border border-border rounded-xl bg-background text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-all'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await signIn(email, password)

    if (error) {
      setError(error.message)
    } else {
      router.push('/')
      router.refresh()
    }

    setLoading(false)
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-8 max-w-md mx-auto shadow-lg">
      <h2 className="text-3xl font-bold text-card-foreground mb-2">Sign In</h2>
      <p className="text-muted-foreground mb-6">Welcome back to CellKore</p>

      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/30 rounded-xl p-4 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="block text-sm font-semibold text-foreground/80 mb-2">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={inputClass}
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-semibold text-foreground/80 mb-2">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className={inputClass}
            placeholder="••••••••"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:opacity-90 text-primary-foreground font-semibold py-3 rounded-xl transition-all"
          disabled={loading}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {loading ? 'Signing in...' : 'Sign In'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Don't have an account?{' '}
        <Link href="/auth/signup" className="text-primary hover:opacity-80 hover:underline font-medium">
          Sign up
        </Link>
      </p>
    </div>
  )
}
