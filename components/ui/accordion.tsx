'use client'

import type { ReactNode } from 'react'
import { Accordion as BaseAccordion } from '@base-ui/react/accordion'
import { ChevronDown } from 'lucide-react'

export function Accordion({
	items,
	openItems,
	onOpenItemsChange,
	className = '',
}: {
	items: { value: string; header: ReactNode; content: ReactNode }[]
	openItems: string[]
	onOpenItemsChange: (values: string[]) => void
	className?: string
}) {
	return (
		<BaseAccordion.Root
			multiple
			value={openItems}
			onValueChange={(value) => onOpenItemsChange(value as string[])}
			className={`border border-border rounded-2xl overflow-hidden divide-y divide-border ${className}`}
		>
			{items.map((item) => (
				<BaseAccordion.Item key={item.value} value={item.value}>
					<BaseAccordion.Header>
						<BaseAccordion.Trigger className="group flex w-full items-center justify-between gap-4 px-5 py-3.5 bg-secondary text-left text-xs font-bold uppercase tracking-[0.16em] text-foreground cursor-pointer hover:bg-secondary/70 transition-colors">
							{item.header}
							<ChevronDown className="w-4 h-4 shrink-0 transition-transform duration-200 group-data-[panel-open]:rotate-180" />
						</BaseAccordion.Trigger>
					</BaseAccordion.Header>
					<BaseAccordion.Panel className="h-[var(--accordion-panel-height)] overflow-hidden transition-[height] duration-200 ease-out data-[ending-style]:h-0 data-[starting-style]:h-0">
						<div className="p-5">{item.content}</div>
					</BaseAccordion.Panel>
				</BaseAccordion.Item>
			))}
		</BaseAccordion.Root>
	)
}
