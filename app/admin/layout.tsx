'use client'

import { ProtectedAdminRoute } from '@/components/admin/protected-admin-route'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ProtectedAdminRoute>
      {children}
    </ProtectedAdminRoute>
  )
}
