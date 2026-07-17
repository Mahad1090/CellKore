'use client'

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react'

type ToastVariant = 'success' | 'error' | 'info'

interface ToastItem {
	id: number
	title: string
	description?: string
	variant: ToastVariant
	action?: { label: string; onClick: () => void }
}

interface ConfirmOptions {
	title: string
	description?: string
	confirmLabel?: string
	cancelLabel?: string
	destructive?: boolean
}

interface ToastContextType {
	toast: (t: Omit<ToastItem, 'id'>) => void
	confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

let nextId = 1

export function ToastProvider({ children }: { children: React.ReactNode }) {
	const [toasts, setToasts] = useState<ToastItem[]>([])
	const [confirmState, setConfirmState] = useState<
		(ConfirmOptions & { resolve: (v: boolean) => void }) | null
	>(null)
	const timers = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map())

	const dismiss = useCallback((id: number) => {
		setToasts((prev) => prev.filter((t) => t.id !== id))
		const timer = timers.current.get(id)
		if (timer) clearTimeout(timer)
		timers.current.delete(id)
	}, [])

	const toast = useCallback(
		(t: Omit<ToastItem, 'id'>) => {
			const id = nextId++
			setToasts((prev) => [...prev.slice(-4), { ...t, id }])
			timers.current.set(id, setTimeout(() => dismiss(id), 6000))
		},
		[dismiss]
	)

	const confirm = useCallback((options: ConfirmOptions) => {
		return new Promise<boolean>((resolve) => {
			setConfirmState({ ...options, resolve })
		})
	}, [])

	useEffect(() => {
		const map = timers.current
		return () => map.forEach((timer) => clearTimeout(timer))
	}, [])

	const resolveConfirm = (value: boolean) => {
		confirmState?.resolve(value)
		setConfirmState(null)
	}

	const icons: Record<ToastVariant, React.ReactNode> = {
		success: <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0" />,
		error: <AlertTriangle className="w-4.5 h-4.5 text-destructive shrink-0" />,
		info: <Info className="w-4.5 h-4.5 text-primary shrink-0" />,
	}

	return (
		<ToastContext.Provider value={{ toast, confirm }}>
			{children}

			{/* Toast stack */}
			<div className="fixed bottom-6 right-6 z-[10000] flex flex-col gap-3 w-[min(92vw,380px)]">
				{toasts.map((t) => (
					<div
						key={t.id}
						className="flex items-start gap-3 bg-card/95 backdrop-blur-xl border border-border rounded-2xl shadow-[0_16px_40px_-12px_rgba(0,0,0,0.25)] px-5 py-4 animate-in slide-in-from-bottom-4 fade-in duration-300"
						role="status"
					>
						{icons[t.variant]}
						<div className="flex-1 min-w-0">
							<p className="text-sm font-medium text-card-foreground tracking-wide">{t.title}</p>
							{t.description && (
								<p className="text-xs text-muted-foreground mt-1 leading-relaxed">{t.description}</p>
							)}
							{t.action && (
								<button
									onClick={() => {
										t.action?.onClick()
										dismiss(t.id)
									}}
									className="mt-2 text-xs font-semibold text-primary uppercase tracking-[0.14em] hover:opacity-80 transition-opacity cursor-pointer"
								>
									{t.action.label}
								</button>
							)}
						</div>
						<button
							onClick={() => dismiss(t.id)}
							className="p-1 rounded-full hover:bg-muted transition-colors text-muted-foreground cursor-pointer"
							aria-label="Dismiss notification"
						>
							<X className="w-3.5 h-3.5" />
						</button>
					</div>
				))}
			</div>

			{/* Confirm modal */}
			{confirmState && (
				<div className="fixed inset-0 z-[10001] flex items-center justify-center p-4">
					<div
						className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
						onClick={() => resolveConfirm(false)}
					/>
					<div className="relative bg-card border border-border rounded-3xl shadow-2xl max-w-md w-full p-8 animate-in zoom-in-95 fade-in duration-200">
						<h3 className="text-lg font-heading text-card-foreground">{confirmState.title}</h3>
						{confirmState.description && (
							<p className="text-sm text-muted-foreground mt-3 leading-relaxed">
								{confirmState.description}
							</p>
						)}
						<div className="flex justify-end gap-3 mt-8">
							<button
								onClick={() => resolveConfirm(false)}
								className="px-5 py-2.5 rounded-full border border-border text-xs font-semibold uppercase tracking-[0.14em] text-foreground hover:bg-muted transition-colors cursor-pointer"
							>
								{confirmState.cancelLabel ?? 'Cancel'}
							</button>
							<button
								onClick={() => resolveConfirm(true)}
								className={`px-5 py-2.5 rounded-full text-xs font-semibold uppercase tracking-[0.14em] transition-all cursor-pointer ${
									confirmState.destructive
										? 'bg-destructive text-white hover:opacity-90'
										: 'bg-primary text-primary-foreground hover:opacity-90'
								}`}
							>
								{confirmState.confirmLabel ?? 'Confirm'}
							</button>
						</div>
					</div>
				</div>
			)}
		</ToastContext.Provider>
	)
}

export function useToast() {
	const context = useContext(ToastContext)
	if (context === undefined) {
		throw new Error('useToast must be used within a ToastProvider')
	}
	return context
}
