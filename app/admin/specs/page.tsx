'use client'

import { useState } from 'react'
import { PageTitle, adminButton } from '@/components/admin/ui'
import { Plus } from 'lucide-react'
import { useAdmin } from '@/contexts/admin-context'
import SpecTemplatesPanel from '@/components/admin/spec-templates-panel'

export default function AdminSpecsPage() {
	const { can } = useAdmin()
	const [triggerAdd, setTriggerAdd] = useState(0)

	const writable = can('categories:write')

	return (
		<div>
			<PageTitle
				title="Spec Templates"
				subtitle="Manage reusable spec field templates for any product category"
				actions={
					writable && (
						<button onClick={() => setTriggerAdd((n) => n + 1)} className={adminButton}>
							<Plus className="w-3.5 h-3.5" />
							Add Template
						</button>
					)
				}
			/>

			<SpecTemplatesPanel triggerAdd={triggerAdd} />
		</div>
	)
}
