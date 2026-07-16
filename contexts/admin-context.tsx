'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { adminSignOut, getAdminUser } from '@/lib/admin-auth'

interface AdminUser {
  email: string
  name: string
  loginTime: string
  token: string
}

interface AdminContextType {
  adminUser: AdminUser | null
  loading: boolean
  signOut: () => Promise<void>
  isAuthenticated: boolean
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAdminAuth()
  }, [])

  const checkAdminAuth = () => {
    try {
      const user = getAdminUser()
      if (user) {
        setAdminUser(user)
      } else {
        setAdminUser(null)
      }
    } catch (error) {
      console.error('Error checking admin auth:', error)
      setAdminUser(null)
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    await adminSignOut()
    setAdminUser(null)
  }

  const value = {
    adminUser,
    loading,
    signOut,
    isAuthenticated: !!adminUser
  }

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const context = useContext(AdminContext)
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider')
  }
  return context
}
