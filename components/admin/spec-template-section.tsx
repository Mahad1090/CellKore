'use client'

import { Plus, Trash2 } from 'lucide-react'
import { adminInput, adminButtonGhost } from '@/components/admin/ui'
import type { SpecTemplate, TemplateSpecEntry } from '@/lib/types'

const label = 'text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block'
const fieldLabel = 'text-xs font-medium text-foreground/80 mb-1.5 block'

function EntryInput({ entry, onChange }: { entry: TemplateSpecEntry; onChange: (value: string) => void }) {
	if (entry.type === 'checkbox') {
		return (
			<label className="flex items-center gap-2.5 cursor-pointer h-full">
				<input
					type="checkbox"
					checked={entry.value === 'Yes'}
					onChange={(e) => onChange(e.target.checked ? 'Yes' : '')}
					className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
				/>
				<span className="text-xs font-semibold text-foreground">{entry.label}</span>
			</label>
		)
	}

	return (
		<div>
			<label className={fieldLabel}>
				{entry.label}
				{entry.unit ? <span className="text-muted-foreground normal-case"> ({entry.unit})</span> : null}
			</label>
			{entry.type === 'select' ? (
				<select value={entry.value} onChange={(e) => onChange(e.target.value)} className={`${adminInput} cursor-pointer`}>
					<option value="">—</option>
					{entry.options?.map((option) => (
						<option key={option} value={option}>{option}</option>
					))}
				</select>
			) : (
				<input
					type={entry.type === 'number' ? 'number' : 'text'}
					value={entry.value}
					onChange={(e) => onChange(e.target.value)}
					className={adminInput}
				/>
			)}
		</div>
	)
}

export function SpecTemplateSection({
	templates,
	selectedTemplateId,
	onSelectTemplate,
	onImport,
	entries,
	onEntriesChange,
	custom,
	onCustomChange,
}: {
	templates: SpecTemplate[]
	selectedTemplateId: string
	onSelectTemplate: (templateId: string) => void
	onImport: (withValues: boolean) => void
	entries: TemplateSpecEntry[]
	onEntriesChange: (next: TemplateSpecEntry[]) => void
	custom: { label: string; value: string }[]
	onCustomChange: (next: { label: string; value: string }[]) => void
}) {
	return (
		<div className="space-y-5">
			<div>
				<label className={label}>Spec Template</label>
				<div className="flex flex-wrap items-center gap-2.5">
					<select
						value={selectedTemplateId}
						onChange={(e) => onSelectTemplate(e.target.value)}
						className={`${adminInput} w-auto min-w-[220px] cursor-pointer`}
					>
						<option value="">No template</option>
						{templates.map((t) => (
							<option key={t.id} value={t.id}>{t.name}</option>
						))}
					</select>
					{selectedTemplateId && (
						<>
							<button type="button" onClick={() => onImport(true)} className={`${adminButtonGhost} px-3.5 py-2`}>
								Import with Values
							</button>
							<button type="button" onClick={() => onImport(false)} className={`${adminButtonGhost} px-3.5 py-2`}>
								Import Blank (Spec Only)
							</button>
						</>
					)}
				</div>
				<p className="text-xs text-muted-foreground mt-2">
					Importing replaces the fields below with this template's — the admin's saved default
					values are used with "Import with Values", or left blank with "Import Blank".
				</p>
			</div>

			{entries.length > 0 && (
				<div className="grid sm:grid-cols-2 gap-4">
					{entries.map((entry, index) => (
						<div key={entry.key} className="relative pr-7">
							<EntryInput
								entry={entry}
								onChange={(value) => {
									const next = [...entries]
									next[index] = { ...entry, value }
									onEntriesChange(next)
								}}
							/>
							<button
								type="button"
								onClick={() => onEntriesChange(entries.filter((_, i) => i !== index))}
								className="absolute top-0 right-0 p-1.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
								aria-label={`Remove ${entry.label} for this product`}
								title="Remove for this product only"
							>
								<Trash2 className="w-3.5 h-3.5" />
							</button>
						</div>
					))}
				</div>
			)}

			<div>
				<div className="flex items-center justify-between mb-3">
					<label className={label}>Custom Specifications</label>
					<button
						type="button"
						onClick={() => onCustomChange([...custom, { label: '', value: '' }])}
						className={`${adminButtonGhost} px-3.5 py-1.5`}
					>
						<Plus className="w-3 h-3" />
						Add Custom Spec
					</button>
				</div>
				<div className="space-y-2.5">
					{custom.map((row, index) => (
						<div key={index} className="flex flex-wrap gap-2.5 items-center">
							<input
								placeholder="Spec name"
								value={row.label}
								onChange={(e) => {
									const next = [...custom]
									next[index] = { ...row, label: e.target.value }
									onCustomChange(next)
								}}
								className={`${adminInput} w-44`}
							/>
							<input
								placeholder="Value"
								value={row.value}
								onChange={(e) => {
									const next = [...custom]
									next[index] = { ...row, value: e.target.value }
									onCustomChange(next)
								}}
								className={`${adminInput} flex-1 min-w-[140px]`}
							/>
							<button
								type="button"
								onClick={() => onCustomChange(custom.filter((_, i) => i !== index))}
								className="p-2.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
								aria-label="Remove custom specification"
							>
								<Trash2 className="w-4 h-4" />
							</button>
						</div>
					))}
					{custom.length === 0 && (
						<p className="text-xs text-muted-foreground">No custom specifications yet.</p>
					)}
				</div>
			</div>
		</div>
	)
}
