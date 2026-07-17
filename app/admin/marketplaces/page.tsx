'use client'

import { useEffect, useState } from 'react'
import { Save, Loader2 } from 'lucide-react'
import { PageTitle, Panel, adminButton, adminInput } from '@/components/admin/ui'
import { FormShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import type { CountryContactInfo } from '@/lib/types'

const COUNTRY_LABELS: Record<string, string> = { US: 'United States Office', CA: 'Canada Office' }

export default function AdminMarketplacesPage() {
	const { toast } = useToast()
	const { can } = useAdmin()
	const [contacts, setContacts] = useState<CountryContactInfo[] | null>(null)
	const [saving, setSaving] = useState(false)

	useEffect(() => {
		fetch('/api/admin/contact-info')
			.then((res) => res.json())
			.then((json) => {
				const list: CountryContactInfo[] = json.contacts ?? []
				for (const country of ['US', 'CA']) {
					if (!list.some((c) => c.country === country)) {
						list.push({ id: country, country, whatsapp_number: '', email: '', landline: '' })
					}
				}
				setContacts(list.filter((c) => c.country === 'US' || c.country === 'CA'))
			})
			.catch(() => setContacts([]))
	}, [])

	const update = (country: string, field: keyof CountryContactInfo, value: string) =>
		setContacts((prev) => (prev ?? []).map((c) => (c.country === country ? { ...c, [field]: value } : c)))

	const save = async () => {
		setSaving(true)
		try {
			const res = await fetch('/api/admin/contact-info', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ contacts }),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: 'Contact info saved', variant: 'success' })
		} catch (err) {
			toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSaving(false)
		}
	}

	const writable = can('settings:write')
	const label = 'text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block'

	return (
		<div>
			<PageTitle
				title="Marketplace Offices"
				subtitle="Contact channels shown to customers per country"
				actions={
					writable && (
						<button onClick={save} disabled={saving || !contacts} className={adminButton}>
							{saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
							Save Changes
						</button>
					)
				}
			/>

			{contacts === null ? (
				<FormShimmer />
			) : (
				<div className="grid md:grid-cols-2 gap-6 max-w-4xl">
					{contacts.map((contact) => (
						<Panel key={contact.country} title={COUNTRY_LABELS[contact.country] ?? contact.country}>
							<div className="space-y-4">
								<div>
									<label className={label}>WhatsApp Number</label>
									<input
										value={contact.whatsapp_number ?? ''}
										onChange={(e) => update(contact.country, 'whatsapp_number', e.target.value)}
										className={adminInput}
										placeholder="+1 555 000 0000"
										disabled={!writable}
									/>
								</div>
								<div>
									<label className={label}>Email</label>
									<input
										value={contact.email ?? ''}
										onChange={(e) => update(contact.country, 'email', e.target.value)}
										className={adminInput}
										placeholder="support@cellkore.com"
										disabled={!writable}
									/>
								</div>
								<div>
									<label className={label}>Landline</label>
									<input
										value={contact.landline ?? ''}
										onChange={(e) => update(contact.country, 'landline', e.target.value)}
										className={adminInput}
										placeholder="+1 555 111 2222"
										disabled={!writable}
									/>
								</div>
							</div>
						</Panel>
					))}
				</div>
			)}
		</div>
	)
}
