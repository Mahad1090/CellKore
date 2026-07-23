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

export interface AdminBadgeCounts {
	sellRequests: number
	orders: number
	inquiries: number
	repairs: number
	reviews: number
}

interface AdminContextType {
	adminUser: AdminUserSession | null
	badgeCounts: AdminBadgeCounts
	loading: boolean
	signOut: () => Promise<void>
	refresh: () => Promise<void>
	can: (permission: AdminPermission) => boolean
	isAuthenticated: boolean
	sidebarOpen: boolean
	setSidebarOpen: (open: boolean) => void
	sidebarCollapsed: boolean
	setSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>
	toggleSidebar: () => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function AdminProvider({ children }: { children: React.ReactNode }) {
	const router = useRouter()
	const [adminUser, setAdminUser] = useState<AdminUserSession | null>(null)
	const [badgeCounts, setBadgeCounts] = useState<AdminBadgeCounts>({
		sellRequests: 0,
		orders: 0,
		inquiries: 0,
		repairs: 0,
		reviews: 0,
	})
	const [loading, setLoading] = useState(true)
	const [sidebarOpen, setSidebarOpen] = useState(false)
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

	const loadBadges = useCallback(async () => {
		try {
			const res = await fetch('/api/admin/badges')
			if (res.ok) {
				const json = await res.json()
				if (json.counts) setBadgeCounts(json.counts)
			}
		} catch {
			// ignore fetch errors
		}
	}, [])

	const refresh = useCallback(async () => {
		try {
			const res = await fetch('/api/admin/auth/me')
			if (res.ok) {
				const json = await res.json()
				setAdminUser(json.admin)
				loadBadges()
			} else {
				setAdminUser(null)
			}
		} catch {
			setAdminUser(null)
		} finally {
			setLoading(false)
		}
	}, [loadBadges])

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

	const toggleSidebar = () => {
		setSidebarOpen((prev) => !prev)
		setSidebarCollapsed((prev) => !prev)
	}

	return (
		<AdminContext.Provider
			value={{
				adminUser,
				badgeCounts,
				loading,
				signOut,
				refresh,
				can,
				isAuthenticated: !!adminUser,
				sidebarOpen,
				setSidebarOpen,
				sidebarCollapsed,
				setSidebarCollapsed,
				toggleSidebar,
			}}
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
