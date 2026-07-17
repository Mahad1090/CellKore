'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import { Loader2 } from 'lucide-react'
import { isValidPhone } from '@/lib/tax'

export function SignUpForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [country, setCountry] = useState('US')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { signUp } = useAuth()

  const inputClass =
    'w-full px-4 py-3 border border-border rounded-xl bg-background text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-all'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!isValidPhone(phone)) {
      setError('Please enter a valid phone number (10–15 digits).')
      return
    }

    setLoading(true)
    const { error } = await signUp(email, password, fullName, phone, country)

    if (error) {
      setError(error.message)
    } else {
      setSuccess(true)
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div className="bg-card border border-border rounded-3xl p-8 max-w-md mx-auto shadow-lg">
        <h2 className="text-3xl font-bold text-card-foreground mb-2">Check your email</h2>
        <p className="text-muted-foreground mb-6">
          We've sent a confirmation link to your email address. Please click the link to complete your registration.
        </p>
        <Link href="/auth/signin">
          <Button className="w-full bg-primary hover:opacity-90 text-primary-foreground font-semibold py-3 rounded-xl transition-all">
            Go to Sign In
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-card border border-border rounded-3xl p-8 max-w-md mx-auto shadow-lg">
      <h2 className="text-3xl font-bold text-card-foreground mb-2">Create Account</h2>
      <p className="text-muted-foreground mb-6">Join CellKore today</p>

      {error && (
        <div className="bg-destructive/10 text-destructive border border-destructive/30 rounded-xl p-4 mb-4 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="fullName" className="block text-sm font-semibold text-foreground/80 mb-2">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            className={inputClass}
            placeholder="John Doe"
          />
        </div>

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
            minLength={6}
            className={inputClass}
            placeholder="••••••••"
          />
          <p className="text-xs text-muted-foreground mt-1.5">Must be at least 6 characters</p>
        </div>

        <div>
          <label htmlFor="country" className="block text-sm font-semibold text-foreground/80 mb-2">
            Country
          </label>
          <select
            id="country"
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            required
            className={`${inputClass} cursor-pointer`}
          >
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div>
          <label htmlFor="phone" className="block text-sm font-semibold text-foreground/80 mb-2">
            Phone Number
          </label>
          <input
            id="phone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            className={inputClass}
            placeholder="(555) 123-4567"
          />
        </div>

        <Button
          type="submit"
          className="w-full bg-primary hover:opacity-90 text-primary-foreground font-semibold py-3 rounded-xl transition-all"
          disabled={loading}
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
          {loading ? 'Creating account...' : 'Sign Up'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground mt-8">
        Already have an account?{' '}
        <Link href="/auth/signin" className="text-primary hover:opacity-80 hover:underline font-medium">
          Sign in
        </Link>
      </p>
    </div>
  )
}
