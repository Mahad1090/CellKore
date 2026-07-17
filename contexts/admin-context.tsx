'use client'

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { roleHasPermission, type AdminPermission } from '@/lib/admin/rbac'
import type { AdminRole } from '@/lib/types'

export interface AdminUserSession {
	id: string
	email: string
	name: string
	role: AdminRole
}

interface AdminContextType {
	adminUser: AdminUserSession | null
	loading: boolean
	signOut: () => Promise<void>
	refresh: () => Promise<void>
	can: (permission: AdminPermission) => boolean
	isAuthenticated: boolean
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: React.ReactNode }) {
	const router = useRouter()
	const [adminUser, setAdminUser] = useState<AdminUserSession | null>(null)
	const [loading, setLoading] = useState(true)

	const refresh = useCallback(async () => {
		try {
			const res = await fetch('/api/admin/auth/me')
			if (res.ok) {
				const json = await res.json()
				setAdminUser(json.admin)
			} else {
				setAdminUser(null)
			}
		} catch {
			setAdminUser(null)
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		refresh()
	}, [refresh])

	const signOut = async () => {
		await fetch('/api/admin/auth/logout', { method: 'POST' }).catch(() => undefined)
		setAdminUser(null)
		router.push('/admin/login')
	}

	const can = (permission: AdminPermission) =>
		adminUser ? roleHasPermission(adminUser.role, permission) : false

	return (
		<AdminContext.Provider
			value={{ adminUser, loading, signOut, refresh, can, isAuthenticated: !!adminUser }}
		>
			{children}
		</AdminContext.Provider>
	)
}

export function useAdmin() {
	const context = useContext(AdminContext)
	if (context === undefined) {
		throw new Error('useAdmin must be used within an AdminProvider')
	}
	return context
}
