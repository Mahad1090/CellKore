'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Loader2, ShieldAlert } from 'lucide-react'
import { PageTitle, EmptyState, Modal, adminButton, adminButtonGhost, adminInput } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import { normalizeAdminRole } from '@/lib/admin/rbac'
import type { AdminUser, AdminRole } from '@/lib/types'

const ROLES: { value: AdminRole; label: string; description: string }[] = [
	{ value: 'super_admin', label: 'Super Admin', description: 'Full access, including admin account management' },
	{ value: 'admin', label: 'Admin', description: 'Full access except creating, editing, or deleting admin accounts' },
]

interface AdminForm {
	id?: string
	full_name: string
	email: string
	password: string
	role: AdminRole
}

const EMPTY: AdminForm = { full_name: '', email: '', password: '', role: 'admin' }

export default function AdminUsersPage() {
	const { toast, confirm } = useToast()
	const { adminUser, can } = useAdmin()
	const [admins, setAdmins] = useState<AdminUser[] | null>(null)
	const [editing, setEditing] = useState<AdminForm | null>(null)
	const [saving, setSaving] = useState(false)

	const load = useCallback(() => {
		fetch('/api/admin/admin-users')
			.then((res) => res.json())
			.then((json) => setAdmins(json.admins ?? []))
			.catch(() => setAdmins([]))
	}, [])

	useEffect(load, [load])

	if (adminUser && !can('admin-users:write')) {
		return (
			<div>
				<PageTitle title="Admin Users" />
				<div className="flex items-center gap-3 p-6 bg-secondary border border-border rounded-3xl max-w-lg">
					<ShieldAlert className="w-5 h-5 text-destructive shrink-0" />
					<p className="text-sm text-foreground/75">Only super admins can manage admin accounts.</p>
				</div>
			</div>
		)
	}

	const save = async () => {
		if (!editing) return
		setSaving(true)
		try {
			const body: Record<string, string> = {
				full_name: editing.full_name,
				email: editing.email,
				role: editing.role,
			}
			if (editing.password) body.password = editing.password
			if (!editing.id && !editing.password) {
				toast({ title: 'Password required', description: 'New admins need an initial password (8+ characters).', variant: 'error' })
				return
			}
			const res = await fetch(editing.id ? `/api/admin/admin-users/${editing.id}` : '/api/admin/admin-users', {
				method: editing.id ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(editing.id ? body : { ...body, password: editing.password }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: editing.id ? 'Admin updated' : 'Admin created', variant: 'success' })
			setEditing(null)
			load()
		} catch (err) {
			toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSaving(false)
		}
	}

	const remove = async (admin: AdminUser) => {
		const ok = await confirm({
			title: 'Delete admin account?',
			description: `${admin.full_name} (${admin.email}) will immediately lose access to the admin panel.`,
			confirmLabel: 'Delete',
			destructive: true,
		})
		if (!ok) return
		const res = await fetch(`/api/admin/admin-users/${admin.id}`, { method: 'DELETE' })
		const json = await res.json()
		if (res.ok) {
			toast({ title: 'Admin deleted', variant: 'success' })
			load()
		} else {
			toast({ title: 'Delete failed', description: json.error, variant: 'error' })
		}
	}

	const label = 'text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block'

	const openEditor = (admin: AdminUser) =>
		setEditing({
			id: admin.id,
			full_name: admin.full_name,
			email: admin.email,
			password: '',
			role: normalizeAdminRole(admin.role),
		})

	return (
		<div>
			<PageTitle
				title="Admin Users"
				subtitle="Accounts and role assignments (super admin only)"
				actions={
					<button onClick={() => setEditing(EMPTY)} className={adminButton}>
						<Plus className="w-3.5 h-3.5" />
						Add Admin
					</button>
				}
			/>

			{admins === null ? (
				<TableShimmer />
			) : admins.length === 0 ? (
				<EmptyState message="No admin accounts found." />
			) : (
				<div className="border border-border rounded-3xl overflow-hidden bg-card overflow-x-auto max-w-4xl">
					<table className="w-full text-sm min-w-[600px]">
						<thead>
							<tr className="bg-secondary text-left">
								{['Name', 'Email', 'Role', 'Created', ''].map((h) => (
									<th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">{h}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{admins.map((admin) => (
								<tr key={admin.id} className="border-t border-border hover:bg-muted/40 transition-colors">
									<td className="px-5 py-3.5 font-medium text-card-foreground">
										{admin.full_name}
										{admin.id === adminUser?.id && (
											<span className="ml-2 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-bold uppercase tracking-wider">You</span>
										)}
									</td>
									<td className="px-5 py-3.5 text-foreground/75">{admin.email}</td>
									<td className="px-5 py-3.5">
										<span className="inline-block px-2.5 py-1 rounded-full bg-secondary text-[10px] font-semibold uppercase tracking-[0.1em] text-foreground/80">
											{ROLES.find((r) => r.value === admin.role)?.label ?? admin.role}
										</span>
									</td>
									<td className="px-5 py-3.5 text-foreground/75 text-xs">
										{new Date(admin.created_at).toLocaleDateString()}
									</td>
									<td className="px-5 py-3.5">
										<div className="flex items-center gap-1.5 justify-end">
											<button
												onClick={() => openEditor(admin)}
												className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-all cursor-pointer"
												aria-label="Edit"
											>
												<Pencil className="w-4 h-4" />
											</button>
											{admin.id !== adminUser?.id && (
												<button
													onClick={() => remove(admin)}
													className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
													aria-label="Delete"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											)}
										</div>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{editing && (
				<Modal open onClose={() => setEditing(null)} title={editing.id ? 'Edit Admin' : 'Create Admin'}>
					<div className="space-y-4">
						<div>
							<label className={label}>Full Name</label>
							<input value={editing.full_name} onChange={(e) => setEditing({ ...editing, full_name: e.target.value })} className={adminInput} />
						</div>
						<div>
							<label className={label}>Email</label>
							<input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} className={adminInput} />
						</div>
						<div>
							<label className={label}>{editing.id ? 'New Password (leave blank to keep current)' : 'Password'}</label>
							<input
								type="password"
								value={editing.password}
								onChange={(e) => setEditing({ ...editing, password: e.target.value })}
								className={adminInput}
								placeholder="Minimum 8 characters"
								autoComplete="new-password"
							/>
						</div>
						<div>
							<label className={label}>Role</label>
							<div className="space-y-2.5">
								{ROLES.map((role) => (
									<label
										key={role.value}
										className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
											editing.role === role.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
										}`}
									>
										<input
											type="radio"
											checked={editing.role === role.value}
											onChange={() => setEditing({ ...editing, role: role.value })}
											className="mt-0.5 accent-[var(--primary)] cursor-pointer"
										/>
										<div>
											<p className="text-xs font-bold text-card-foreground">{role.label}</p>
											<p className="text-[11px] text-muted-foreground mt-0.5">{role.description}</p>
										</div>
									</label>
								))}
							</div>
						</div>
						<div className="flex justify-end gap-3 pt-4 border-t border-border">
							<button onClick={() => setEditing(null)} className={adminButtonGhost}>Cancel</button>
							<button onClick={save} disabled={saving} className={adminButton}>
								{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
								Save Admin
							</button>
						</div>
					</div>
				</Modal>
			)}
		</div>
	)
}
