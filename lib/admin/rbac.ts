import type { AdminRole } from '@/lib/types'

export type AdminPermission =
	| 'products:read'
	| 'products:write'
	| 'categories:write'
	| 'wholesale:write'
	| 'cms:write'
	| 'orders:read'
	| 'orders:write'
	| 'sell-requests:read'
	| 'sell-requests:write'
	| 'repair-requests:read'
	| 'repair-requests:write'
	| 'inquiries:read'
	| 'inquiries:write'
	| 'settings:write'
	| 'admin-users:write'
	| 'analytics:read'
	| 'newsletter:read'

export function normalizeAdminRole(role: AdminRole | string): AdminRole {
	return role === 'super_admin' ? 'super_admin' : 'admin'
}

/**
 * Role capability matrix:
 *  - super_admin: everything, including admin account management
 *  - admin: everything except creating/updating/deleting admin accounts
 */
const MATRIX: Record<AdminPermission, AdminRole[]> = {
	'products:read': ['super_admin', 'admin'],
	'products:write': ['super_admin', 'admin'],
	'categories:write': ['super_admin', 'admin'],
	'wholesale:write': ['super_admin', 'admin'],
	'cms:write': ['super_admin', 'admin'],
	'orders:read': ['super_admin', 'admin'],
	'orders:write': ['super_admin', 'admin'],
	'sell-requests:read': ['super_admin', 'admin'],
	'sell-requests:write': ['super_admin', 'admin'],
	'repair-requests:read': ['super_admin', 'admin'],
	'repair-requests:write': ['super_admin', 'admin'],
	'inquiries:read': ['super_admin', 'admin'],
	'inquiries:write': ['super_admin', 'admin'],
	'settings:write': ['super_admin', 'admin'],
	'admin-users:write': ['super_admin'],
	'analytics:read': ['super_admin', 'admin'],
	'newsletter:read': ['super_admin', 'admin'],
}

export function roleHasPermission(role: AdminRole | string, permission: AdminPermission): boolean {
	return MATRIX[permission]?.includes(normalizeAdminRole(role)) ?? false
}
