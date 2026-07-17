'use client'

import { LogOut, ExternalLink, UserCircle2 } from 'lucide-react'
import Link from 'next/link'
import { useAdmin } from '@/contexts/admin-context'

const ROLE_LABELS: Record<string, string> = {
	super_admin: 'Super Admin',
	editor: 'Editor',
	support: 'Support',
}

export function AdminHeader() {
	const { adminUser, signOut } = useAdmin()

	return (
		<header className="sticky top-0 z-40 bg-background/90 backdrop-blur-xl border-b border-border px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
			<div className="min-w-0">
				<h1 className="text-sm font-bold text-foreground tracking-wide truncate">Administration</h1>
				<p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Manage your storefront</p>
			</div>
			<div className="flex items-center gap-3">
				<Link
					href="/"
					target="_blank"
					className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-border text-[10px] font-semibold uppercase tracking-[0.14em] text-foreground/70 hover:border-primary hover:text-foreground transition-all"
				>
					<ExternalLink className="w-3 h-3" />
					View Store
				</Link>
				{adminUser && (
					<div className="flex items-center gap-2.5 pl-2">
						<UserCircle2 className="w-7 h-7 text-muted-foreground" />
						<div className="hidden md:block">
							<p className="text-xs font-semibold text-foreground leading-tight">{adminUser.name}</p>
							<p className="text-[10px] text-muted-foreground">{ROLE_LABELS[adminUser.role] ?? adminUser.role}</p>
						</div>
					</div>
				)}
				<button
					onClick={() => signOut()}
					className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-primary text-primary-foreground text-[10px] font-semibold uppercase tracking-[0.14em] hover:opacity-90 transition-all cursor-pointer"
				>
					<LogOut className="w-3 h-3" />
					Sign Out
				</button>
			</div>
		</header>
	)
}
