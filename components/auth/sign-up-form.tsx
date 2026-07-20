'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/auth-context'
import Link from 'next/link'
import { ChevronDown, Loader2, Search } from 'lucide-react'
import { isValidPhone } from '@/lib/tax'
import { PHONE_COUNTRIES } from '@/lib/phone-countries'

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path fill="#4285F4" d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.47a5.54 5.54 0 0 1-2.4 3.63v3.02h3.88c2.27-2.09 3.57-5.17 3.57-8.84Z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.96-1.07 7.95-2.9l-3.88-3.02c-1.08.72-2.45 1.15-4.07 1.15-3.13 0-5.78-2.11-6.73-4.96H1.26v3.12A12 12 0 0 0 12 24Z" />
      <path fill="#FBBC05" d="M5.27 14.27a7.2 7.2 0 0 1 0-4.54V6.61H1.26a12 12 0 0 0 0 10.78l4.01-3.12Z" />
      <path fill="#EA4335" d="M12 4.77c1.77 0 3.35.61 4.6 1.8l3.44-3.44C17.95 1.19 15.23 0 12 0A12 12 0 0 0 1.26 6.61l4.01 3.12C6.22 6.88 8.87 4.77 12 4.77Z" />
    </svg>
  )
}

export function SignUpForm() {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [phone, setPhone] = useState('')
  const [phoneCountry, setPhoneCountry] = useState(PHONE_COUNTRIES[0])
  const [phoneMenuOpen, setPhoneMenuOpen] = useState(false)
  const [phoneSearch, setPhoneSearch] = useState('')
  const phoneMenuRef = useRef<HTMLDivElement>(null)
  const [country, setCountry] = useState('US')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const { signUp, signInWithGoogle } = useAuth()

  const handleGoogleSignUp = async () => {
    setGoogleLoading(true)
    setError(null)
    const { error } = await signInWithGoogle()
    if (error) {
      setError(error.message)
      setGoogleLoading(false)
    }
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (phoneMenuRef.current && !phoneMenuRef.current.contains(event.target as Node)) {
        setPhoneMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const filteredPhoneCountries = useMemo(() => {
    const q = phoneSearch.trim().toLowerCase()
    if (!q) return PHONE_COUNTRIES
    return PHONE_COUNTRIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.dial.includes(q) || c.code.toLowerCase() === q
    )
  }, [phoneSearch])

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
    const fullPhone = `${phoneCountry.dial} ${phone.trim()}`
    const { error } = await signUp(email, password, fullName, fullPhone, country)

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

      <Button
        type="button"
        variant="outline"
        onClick={handleGoogleSignUp}
        disabled={googleLoading}
        className="w-full py-3 rounded-xl font-semibold gap-2.5"
      >
        {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
        Continue with Google
      </Button>

      <div className="flex items-center gap-3 my-6">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs text-muted-foreground uppercase tracking-wider">or</span>
        <div className="h-px flex-1 bg-border" />
      </div>

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
          <div className="flex border border-border rounded-xl bg-background focus-within:border-primary focus-within:ring-1 focus-within:ring-ring transition-all overflow-visible">
            <div className="relative shrink-0" ref={phoneMenuRef}>
              <button
                type="button"
                onClick={() => setPhoneMenuOpen((open) => !open)}
                className="flex items-center gap-2 h-full pl-4 pr-3 py-3 text-sm text-foreground rounded-l-xl hover:bg-muted transition-colors cursor-pointer border-r border-border"
              >
                <phoneCountry.Flag className="w-5 h-3.5 rounded-[2px] shadow-sm shrink-0" />
                <span className="hidden sm:inline whitespace-nowrap">{phoneCountry.name}</span>
                <span className="font-semibold whitespace-nowrap">{phoneCountry.dial}</span>
                <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
              </button>
              {phoneMenuOpen && (
                <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-2xl shadow-xl overflow-hidden z-50 w-72 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="p-2 border-b border-border sticky top-0 bg-card">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                      <input
                        autoFocus
                        type="text"
                        value={phoneSearch}
                        onChange={(e) => setPhoneSearch(e.target.value)}
                        placeholder="Search country or code..."
                        className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-border bg-background focus:outline-none focus:border-primary"
                      />
                    </div>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {filteredPhoneCountries.length === 0 ? (
                      <p className="px-4 py-6 text-center text-sm text-muted-foreground">No countries found</p>
                    ) : (
                      filteredPhoneCountries.map((c) => (
                        <button
                          key={c.code}
                          type="button"
                          onClick={() => {
                            setPhoneCountry(c)
                            setPhoneMenuOpen(false)
                            setPhoneSearch('')
                          }}
                          className={`w-full text-left px-4 py-2.5 text-sm transition-colors cursor-pointer flex items-center gap-2.5 ${
                            c.code === phoneCountry.code ? 'bg-secondary text-primary' : 'text-foreground/80 hover:bg-muted'
                          }`}
                        >
                          <c.Flag className="w-5 h-3.5 rounded-[2px] shadow-sm shrink-0" />
                          <span className="flex-1 truncate">{c.name}</span>
                          <span className="font-semibold text-muted-foreground">{c.dial}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              className="flex-1 min-w-0 px-4 py-3 bg-transparent text-sm text-foreground placeholder-muted-foreground focus:outline-none rounded-r-xl"
              placeholder={phoneCountry.format}
            />
          </div>
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
