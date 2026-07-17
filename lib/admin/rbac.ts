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
	| 'inquiries:read'
	| 'inquiries:write'
	| 'settings:write'
	| 'admin-users:write'
	| 'analytics:read'
	| 'newsletter:read'

/**
 * Role capability matrix:
 *  - super_admin: everything, incl. system config and admin accounts
 *  - editor: catalog/wholesale/CMS writes; read-only orders & inquiries
 *  - support: sell-request / inquiry / order status writes; read-only catalog
 */
const MATRIX: Record<AdminPermission, AdminRole[]> = {
	'products:read': ['super_admin', 'editor', 'support'],
	'products:write': ['super_admin', 'editor'],
	'categories:write': ['super_admin', 'editor'],
	'wholesale:write': ['super_admin', 'editor'],
	'cms:write': ['super_admin', 'editor'],
	'orders:read': ['super_admin', 'editor', 'support'],
	'orders:write': ['super_admin', 'support'],
	'sell-requests:read': ['super_admin', 'editor', 'support'],
	'sell-requests:write': ['super_admin', 'support'],
	'inquiries:read': ['super_admin', 'editor', 'support'],
	'inquiries:write': ['super_admin', 'support'],
	'settings:write': ['super_admin'],
	'admin-users:write': ['super_admin'],
	'analytics:read': ['super_admin', 'editor', 'support'],
	'newsletter:read': ['super_admin', 'editor', 'support'],
}

export function roleHasPermission(role: AdminRole, permission: AdminPermission): boolean {
	return MATRIX[permission]?.includes(role) ?? false
}
