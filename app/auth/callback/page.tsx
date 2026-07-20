'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'

export default function AuthCallbackPage() {
  const router = useRouter()
  const { loading, user } = useAuth()

  useEffect(() => {
    if (!loading) {
      router.replace(user ? '/' : '/auth/signin')
    }
  }, [loading, user, router])

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  )
}
