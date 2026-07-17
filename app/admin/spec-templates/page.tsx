'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react'
import { PageTitle, EmptyState, Modal, adminButton, adminButtonGhost, adminInput } from '@/components/admin/ui'
import { TableShimmer } from '@/components/shimmer'
import { useToast } from '@/components/ui/toast'
import { useAdmin } from '@/contexts/admin-context'
import type { ProductType, SpecFieldType, SpecTemplate, SpecTemplateField } from '@/lib/types'

interface FieldRow {
	key: string
	label: string
	field_type: SpecFieldType
	options: string
	unit: string
	default_value: string
}

interface TemplateForm {
	id?: string
	name: string
	product_type_id: string
	is_active: boolean
	sort_order: number
	fields: FieldRow[]
}

const EMPTY: TemplateForm = { name: '', product_type_id: '', is_active: true, sort_order: 0, fields: [] }

function slugifyKey(label: string): string {
	const words = label
		.trim()
		.split(/[^a-zA-Z0-9]+/)
		.filter(Boolean)
	if (words.length === 0) return ''
	return words
		.map((word, i) => (i === 0 ? word.toLowerCase() : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()))
		.join('')
}

function fieldsToRows(fields?: SpecTemplateField[]): FieldRow[] {
	return (fields ?? [])
		.slice()
		.sort((a, b) => a.sort_order - b.sort_order)
		.map((f) => ({
			key: f.key,
			label: f.label,
			field_type: f.field_type,
			options: (f.options ?? []).join(', '),
			unit: f.unit ?? '',
			default_value: f.default_value ?? '',
		}))
}

export default function AdminSpecTemplatesPage() {
	const { toast, confirm } = useToast()
	const { can } = useAdmin()
	const [templates, setTemplates] = useState<SpecTemplate[] | null>(null)
	const [productTypes, setProductTypes] = useState<ProductType[]>([])
	const [editing, setEditing] = useState<TemplateForm | null>(null)
	const [saving, setSaving] = useState(false)

	const load = useCallback(() => {
		fetch('/api/admin/spec-templates')
			.then((res) => res.json())
			.then((json) => setTemplates(json.specTemplates ?? []))
			.catch(() => setTemplates([]))
		fetch('/api/admin/product-types')
			.then((res) => res.json())
			.then((json) => setProductTypes(json.productTypes ?? []))
			.catch(() => setProductTypes([]))
	}, [])

	useEffect(load, [load])

	const typeName = (typeId: string) => productTypes.find((t) => t.id === typeId)?.name ?? '—'

	const save = async () => {
		if (!editing) return
		if (!editing.name.trim() || !editing.product_type_id) {
			toast({ title: 'Name and Product Type are required', variant: 'error' })
			return
		}
		setSaving(true)
		try {
			const payload = {
				...editing,
				fields: editing.fields
					.filter((f) => f.label.trim())
					.map((f) => ({
						key: f.key.trim() || slugifyKey(f.label),
						label: f.label.trim(),
						field_type: f.field_type,
						options: f.field_type === 'select' ? f.options.split(',').map((o) => o.trim()).filter(Boolean) : null,
						unit: f.unit.trim() || null,
						default_value: f.default_value.trim() || null,
					})),
			}
			const res = await fetch(editing.id ? `/api/admin/spec-templates/${editing.id}` : '/api/admin/spec-templates', {
				method: editing.id ? 'PUT' : 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
			})
			const json = await res.json()
			if (!res.ok) throw new Error(json.error)
			toast({ title: editing.id ? 'Template updated' : 'Template created', variant: 'success' })
			setEditing(null)
			load()
		} catch (err) {
			toast({ title: 'Save failed', description: err instanceof Error ? err.message : undefined, variant: 'error' })
		} finally {
			setSaving(false)
		}
	}

	const remove = async (template: SpecTemplate) => {
		const ok = await confirm({
			title: 'Delete spec template?',
			description: `"${template.name}" will be removed. Deletion is blocked while products are still assigned to it.`,
			confirmLabel: 'Delete',
			destructive: true,
		})
		if (!ok) return
		const res = await fetch(`/api/admin/spec-templates/${template.id}`, { method: 'DELETE' })
		const json = await res.json()
		if (res.ok) {
			toast({ title: 'Template deleted', variant: 'success' })
			load()
		} else {
			toast({ title: 'Cannot delete', description: json.error, variant: 'error' })
		}
	}

	const writable = can('categories:write')
	const label = 'text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground mb-2 block'

	const setFieldRow = (index: number, next: Partial<FieldRow>) => {
		if (!editing) return
		const fields = [...editing.fields]
		fields[index] = { ...fields[index], ...next }
		setEditing({ ...editing, fields })
	}

	return (
		<div>
			<PageTitle
				title="Spec Templates"
				subtitle="Reusable spec field lists, attached to a Product Type"
				actions={
					writable && (
						<button onClick={() => setEditing(EMPTY)} className={adminButton}>
							<Plus className="w-3.5 h-3.5" />
							Add Template
						</button>
					)
				}
			/>

			{templates === null ? (
				<TableShimmer />
			) : templates.length === 0 ? (
				<EmptyState message="No spec templates yet." />
			) : (
				<div className="border border-border rounded-3xl overflow-hidden bg-card overflow-x-auto">
					<table className="w-full text-sm min-w-[560px]">
						<thead>
							<tr className="bg-secondary text-left">
								{['Name', 'Product Type', 'Fields', 'Status', ''].map((h) => (
									<th key={h} className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-[0.14em] text-foreground/70">{h}</th>
								))}
							</tr>
						</thead>
						<tbody>
							{templates.map((template) => (
								<tr key={template.id} className="border-t border-border hover:bg-muted/40 transition-colors">
									<td className="px-5 py-3.5 font-medium text-card-foreground">{template.name}</td>
									<td className="px-5 py-3.5 text-foreground/75">{typeName(template.product_type_id)}</td>
									<td className="px-5 py-3.5 text-foreground/75">{template.spec_template_fields?.length ?? 0}</td>
									<td className="px-5 py-3.5">
										<span
											className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.1em] ${
												template.is_active ? 'bg-primary/10 text-primary' : 'bg-secondary text-foreground/60'
											}`}
										>
											{template.is_active ? 'Active' : 'Hidden'}
										</span>
									</td>
									<td className="px-5 py-3.5">
										{writable && (
											<div className="flex items-center gap-1.5 justify-end">
												<button
													onClick={() =>
														setEditing({
															id: template.id,
															name: template.name,
															product_type_id: template.product_type_id,
															is_active: template.is_active,
															sort_order: template.sort_order,
															fields: fieldsToRows(template.spec_template_fields),
														})
													}
													className="p-2 rounded-full text-muted-foreground hover:text-primary hover:bg-muted transition-all cursor-pointer"
													aria-label="Edit"
												>
													<Pencil className="w-4 h-4" />
												</button>
												<button
													onClick={() => remove(template)}
													className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
													aria-label="Delete"
												>
													<Trash2 className="w-4 h-4" />
												</button>
											</div>
										)}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}

			{editing && (
				<Modal open onClose={() => setEditing(null)} title={editing.id ? 'Edit Spec Template' : 'Create Spec Template'} wide>
					<div className="space-y-6">
						<div className="grid sm:grid-cols-2 gap-4">
							<div>
								<label className={label}>Name</label>
								<input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className={adminInput} placeholder="Basic Case Specs" />
							</div>
							<div>
								<label className={label}>Product Type</label>
								<select
									value={editing.product_type_id}
									onChange={(e) => setEditing({ ...editing, product_type_id: e.target.value })}
									className={`${adminInput} cursor-pointer`}
								>
									<option value="">Select a product type</option>
									{productTypes.map((t) => (
										<option key={t.id} value={t.id}>{t.name}</option>
									))}
								</select>
							</div>
							<div>
								<label className={label}>Sort Order</label>
								<input type="number" value={editing.sort_order} onChange={(e) => setEditing({ ...editing, sort_order: Number(e.target.value) })} className={adminInput} />
							</div>
							<label className="flex items-center gap-2.5 cursor-pointer mt-6">
								<input type="checkbox" checked={editing.is_active} onChange={(e) => setEditing({ ...editing, is_active: e.target.checked })} className="w-4 h-4 accent-[var(--primary)] cursor-pointer" />
								<span className="text-xs font-semibold text-foreground">Active</span>
							</label>
						</div>

						<div>
							<div className="flex items-center justify-between mb-3">
								<label className={label}>Fields</label>
								<button
									type="button"
									onClick={() =>
										setEditing({
											...editing,
											fields: [...editing.fields, { key: '', label: '', field_type: 'text', options: '', unit: '', default_value: '' }],
										})
									}
									className={`${adminButtonGhost} px-3.5 py-1.5`}
								>
									<Plus className="w-3 h-3" />
									Add Field
								</button>
							</div>
							{editing.fields.length > 0 && (
								<div className="border border-border rounded-2xl overflow-hidden overflow-x-auto">
									<table className="w-full text-sm min-w-[780px]">
										<thead>
											<tr className="bg-secondary text-left">
												<th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Label</th>
												<th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Type</th>
												<th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Options</th>
												<th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Unit</th>
												<th className="px-3 py-2.5 text-[10px] font-bold uppercase tracking-[0.12em] text-foreground/70">Default Value</th>
												<th className="w-12" />
											</tr>
										</thead>
										<tbody>
											{editing.fields.map((field, index) => (
												<tr key={index} className="border-t border-border">
													<td className="px-3 py-2">
														<input
															value={field.label}
															onChange={(e) => setFieldRow(index, { label: e.target.value, key: field.key || slugifyKey(e.target.value) })}
															className={adminInput}
															placeholder="Material"
														/>
													</td>
													<td className="px-3 py-2">
														<select
															value={field.field_type}
															onChange={(e) => setFieldRow(index, { field_type: e.target.value as SpecFieldType })}
															className={`${adminInput} cursor-pointer`}
														>
															<option value="text">Text</option>
															<option value="number">Number</option>
															<option value="select">Select</option>
															<option value="checkbox">Checkbox</option>
														</select>
													</td>
													<td className="px-3 py-2">
														<input
															value={field.options}
															onChange={(e) => setFieldRow(index, { options: e.target.value })}
															className={adminInput}
															placeholder={field.field_type === 'select' ? 'Option A, Option B' : '—'}
															disabled={field.field_type !== 'select'}
														/>
													</td>
													<td className="px-3 py-2">
														<input
															value={field.unit}
															onChange={(e) => setFieldRow(index, { unit: e.target.value })}
															className={adminInput}
															placeholder="e.g. grams"
														/>
													</td>
													<td className="px-3 py-2">
														{field.field_type === 'checkbox' ? (
															<label className="flex items-center justify-center h-full cursor-pointer">
																<input
																	type="checkbox"
																	checked={field.default_value === 'Yes'}
																	onChange={(e) => setFieldRow(index, { default_value: e.target.checked ? 'Yes' : '' })}
																	className="w-4 h-4 accent-[var(--primary)] cursor-pointer"
																/>
															</label>
														) : field.field_type === 'select' ? (
															<select
																value={field.default_value}
																onChange={(e) => setFieldRow(index, { default_value: e.target.value })}
																className={`${adminInput} cursor-pointer`}
															>
																<option value="">—</option>
																{field.options.split(',').map((o) => o.trim()).filter(Boolean).map((option) => (
																	<option key={option} value={option}>{option}</option>
																))}
															</select>
														) : (
															<input
																type={field.field_type === 'number' ? 'number' : 'text'}
																value={field.default_value}
																onChange={(e) => setFieldRow(index, { default_value: e.target.value })}
																className={adminInput}
																placeholder="Optional"
															/>
														)}
													</td>
													<td className="px-3 py-2">
														<button
															type="button"
															onClick={() => setEditing({ ...editing, fields: editing.fields.filter((_, i) => i !== index) })}
															className="p-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
															aria-label="Remove field"
														>
															<Trash2 className="w-4 h-4" />
														</button>
													</td>
												</tr>
											))}
										</tbody>
									</table>
								</div>
							)}
						</div>

						<div className="flex justify-end gap-3 pt-4 border-t border-border">
							<button onClick={() => setEditing(null)} className={adminButtonGhost}>Cancel</button>
							<button onClick={save} disabled={saving} className={adminButton}>
								{saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
								Save Template
							</button>
						</div>
					</div>
				</Modal>
			)}
		</div>
	)
}
