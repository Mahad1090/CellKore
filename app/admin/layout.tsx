'use client'

import { usePathname } from 'next/navigation'
import { AdminProvider } from '@/contexts/admin-context'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
	const pathname = usePathname()
	const isLogin = pathname === '/admin/login'

	return (
		<AdminProvider>
			<div className="admin-theme-wrapper min-h-screen bg-background">
				{isLogin ? (
					children
				) : (
					<div className="flex min-h-screen">
						<AdminSidebar />
						<div className="flex-1 flex flex-col min-w-0">
							<AdminHeader />
							<main className="flex-1 p-6 lg:p-8 overflow-x-hidden">{children}</main>
						</div>
					</div>
				)}
			</div>
		</AdminProvider>
	)
}
