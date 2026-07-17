'use client'

import { useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { adminInput, adminButtonGhost } from '@/components/admin/ui'
import { Accordion } from '@/components/ui/accordion'
import {
	getCategoriesForBrand,
	getCategoryValues,
	type MobileSpecifications,
	type SpecField,
} from '@/lib/mobile-specs'

const fieldLabel = 'text-xs font-medium text-foreground/80 mb-1.5 block'

function FieldInput({
	field,
	value,
	onChange,
}: {
	field: SpecField
	value: string
	onChange: (value: string) => void
}) {
	if (field.type === 'checkbox') {
		return (
			<label className="flex items-center gap-2.5 cursor-pointer h-full">
				<input
					type="checkbox"
					checked={value === 'Yes'}
					onChange={(e) => onChange(e.target.checked ? 'Yes' : '')}
					className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
				/>
				<span className="text-xs font-semibold text-foreground">{field.label}</span>
			</label>
		)
	}

	return (
		<div>
			<label className={fieldLabel}>
				{field.label}
				{field.unit ? <span className="text-muted-foreground normal-case"> ({field.unit})</span> : null}
			</label>
			{field.type === 'select' ? (
				<select value={value} onChange={(e) => onChange(e.target.value)} className={`${adminInput} cursor-pointer`}>
					<option value="">—</option>
					{field.options?.map((option) => (
						<option key={option} value={option}>{option}</option>
					))}
				</select>
			) : (
				<input
					type={field.type === 'number' ? 'number' : 'text'}
					value={value}
					onChange={(e) => onChange(e.target.value)}
					className={adminInput}
				/>
			)}
		</div>
	)
}

export function MobileSpecsForm({
	value,
	brand,
	onChange,
}: {
	value: MobileSpecifications
	brand: string
	onChange: (next: MobileSpecifications) => void
}) {
	const [openItems, setOpenItems] = useState<string[]>(['general'])
	const categories = getCategoriesForBrand(brand)
	const custom = value.custom ?? []

	const setFieldValue = (categoryId: string, fieldKey: string, fieldValue: string) => {
		onChange({
			...value,
			[categoryId]: { ...getCategoryValues(value, categoryId), [fieldKey]: fieldValue },
		})
	}

	const setCustom = (next: { key: string; value: string }[]) => {
		onChange({ ...value, custom: next })
	}

	return (
		<div className="space-y-4">
			<Accordion
				openItems={openItems}
				onOpenItemsChange={setOpenItems}
				items={categories.map((category) => ({
					value: category.id,
					header: category.label,
					content: (
						<div className="grid sm:grid-cols-2 gap-4">
							{category.fields.map((field) => (
								<FieldInput
									key={field.key}
									field={field}
									value={getCategoryValues(value, category.id)[field.key] ?? ''}
									onChange={(fieldValue) => setFieldValue(category.id, field.key, fieldValue)}
								/>
							))}
						</div>
					),
				}))}
			/>

			<div>
				<div className="flex items-center justify-between mb-3">
					<label className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground block">
						Custom Specifications
					</label>
					<button
						type="button"
						onClick={() => setCustom([...custom, { key: '', value: '' }])}
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
								value={row.key}
								onChange={(e) => {
									const next = [...custom]
									next[index] = { ...row, key: e.target.value }
									setCustom(next)
								}}
								className={`${adminInput} w-44`}
							/>
							<input
								placeholder="Value"
								value={row.value}
								onChange={(e) => {
									const next = [...custom]
									next[index] = { ...row, value: e.target.value }
									setCustom(next)
								}}
								className={`${adminInput} flex-1 min-w-[140px]`}
							/>
							<button
								type="button"
								onClick={() => setCustom(custom.filter((_, i) => i !== index))}
								className="p-2.5 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
								aria-label="Remove custom specification"
							>
								<Trash2 className="w-4 h-4" />
							</button>
						</div>
					))}
					{custom.length === 0 && (
						<p className="text-xs text-muted-foreground">No custom specifications — use this for anything not covered above.</p>
					)}
				</div>
			</div>
		</div>
	)
}
