'use client'

import React from 'react'

export const adminInput =
	'w-full px-3.5 py-2.5 border border-border rounded-xl bg-background text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary focus:ring-1 focus:ring-ring transition-all'

export const adminButton =
	'inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-primary-foreground text-[11px] font-bold uppercase tracking-[0.16em] hover:opacity-90 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'

export const adminButtonGhost =
	'inline-flex items-center gap-2 px-5 py-2.5 rounded-full border border-border text-[11px] font-bold uppercase tracking-[0.16em] text-foreground/75 hover:border-primary hover:text-foreground transition-all cursor-pointer disabled:opacity-50'

export function PageTitle({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: React.ReactNode }) {
	return (
		<div className="flex flex-wrap items-end justify-between gap-4 mb-8">
			<div>
				<h1 className="text-2xl font-bold text-foreground tracking-wide">{title}</h1>
				{subtitle && <p className="text-xs text-muted-foreground mt-1.5">{subtitle}</p>}
			</div>
			{actions && <div className="flex items-center gap-3">{actions}</div>}
		</div>
	)
}

export function Panel({ title, children, className = '' }: { title?: string; children: React.ReactNode; className?: string }) {
	return (
		<div className={`bg-card border border-border rounded-3xl overflow-hidden ${className}`}>
			{title && (
				<div className="px-6 py-4 border-b border-border">
					<h2 className="text-xs font-bold uppercase tracking-[0.18em] text-card-foreground">{title}</h2>
				</div>
			)}
			<div className="p-6">{children}</div>
		</div>
	)
}

const STATUS_STYLES: Record<string, string> = {
	// order statuses
	pending: 'bg-secondary text-foreground/75',
	paid: 'bg-primary/10 text-primary',
	processing: 'bg-secondary text-foreground',
	shipped: 'bg-primary/10 text-primary',
	delivered: 'bg-primary text-primary-foreground',
	cancelled: 'bg-destructive/10 text-destructive',
	// payment
	unpaid: 'bg-secondary text-foreground/75',
	refunded: 'bg-secondary text-foreground/75',
	failed: 'bg-destructive/10 text-destructive',
	// queues
	new: 'bg-primary/10 text-primary',
	responded: 'bg-secondary text-foreground/70',
	submitted: 'bg-primary/10 text-primary',
	reviewed: 'bg-secondary text-foreground',
	quoted: 'bg-primary/10 text-primary',
	contacted: 'bg-secondary text-foreground',
	closed: 'bg-secondary text-foreground/60',
}

export function StatusBadge({ value }: { value: string }) {
	return (
		<span
			className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.1em] capitalize ${
				STATUS_STYLES[value] ?? 'bg-secondary text-foreground/75'
			}`}
		>
			{value.replace(/_/g, ' ')}
		</span>
	)
}

export function EmptyState({ message }: { message: string }) {
	return (
		<div className="text-center py-16 border border-dashed border-border rounded-2xl">
			<p className="text-sm text-muted-foreground">{message}</p>
		</div>
	)
}

/** Theme-compliant modal shell (no native popups). */
export function Modal({
	open,
	onClose,
	title,
	children,
	wide = false,
}: {
	open: boolean
	onClose: () => void
	title: string
	children: React.ReactNode
	wide?: boolean
}) {
	if (!open) return null
	return (
		<div className="fixed inset-0 z-[9000] flex items-center justify-center p-4">
			<div className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose} />
			<div
				className={`relative bg-card border border-border rounded-3xl shadow-2xl w-full ${
					wide ? 'max-w-4xl' : 'max-w-xl'
				} max-h-[88vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 fade-in duration-200`}
			>
				<div className="sticky top-0 bg-card/95 backdrop-blur px-7 py-5 border-b border-border flex items-center justify-between">
					<h3 className="text-sm font-bold uppercase tracking-[0.16em] text-card-foreground">{title}</h3>
					<button
						onClick={onClose}
						className="p-1.5 rounded-full hover:bg-muted text-muted-foreground transition-colors cursor-pointer"
						aria-label="Close"
					>
						✕
					</button>
				</div>
				<div className="p-7">{children}</div>
			</div>
		</div>
	)
}
