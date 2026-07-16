'use client'

import { useEffect, useState, ReactNode } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { AdminSidebar } from './admin-sidebar'
import { AdminHeader } from './admin-header'
import { getAdminUser } from '@/lib/admin-auth'

export function ProtectedAdminRoute({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    // Check if on login page
    if (pathname === '/admin/login') {
      setLoading(false)
      return
    }

    // Check authentication status
    const user = getAdminUser()
    const isAuth = !!user
    setIsAuthenticated(isAuth)
    setLoading(false)

    // Redirect to login if not authenticated
    if (!isAuth) {
      router.push('/admin/login')
    }
  }, [mounted, pathname, router])

  // If on login page, render children without layout
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  if (!mounted || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-900">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 rounded-lg mb-4">
            <div className="w-6 h-6 border-3 border-blue-300 border-t-white rounded-full animate-spin" />
          </div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  return (
    <div className="flex h-screen bg-slate-900">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AdminHeader />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
