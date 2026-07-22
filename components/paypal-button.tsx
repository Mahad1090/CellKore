'use client'

import { useEffect, useRef } from 'react'

declare global {
	interface Window {
		paypal?: any
	}
}

/** Renders PayPal's smart button SDK for a one-off payment, given order create/approve callbacks. */
export function PayPalButton({
	createOrder,
	onApprove,
	onError,
}: {
	createOrder: () => Promise<string>
	onApprove: (orderId: string) => Promise<void>
	onError?: (message: string) => void
}) {
	const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID
	const containerRef = useRef<HTMLDivElement>(null)
	const rendered = useRef(false)

	useEffect(() => {
		if (!clientId || rendered.current) return

		const renderButtons = () => {
			if (rendered.current || !containerRef.current || !window.paypal) return
			rendered.current = true
			window.paypal
				.Buttons({
					style: { layout: 'horizontal', shape: 'pill', tagline: false, height: 44 },
					createOrder: async () => {
						try {
							return await createOrder()
						} catch (err) {
							onError?.(err instanceof Error ? err.message : 'Unable to start PayPal')
							throw err
						}
					},
					onApprove: async (data: { orderID: string }) => {
						await onApprove(data.orderID)
					},
					onError: () => {
						onError?.('The PayPal flow was interrupted.')
					},
				})
				.render(containerRef.current)
		}

		if (window.paypal) {
			renderButtons()
			return
		}
		const script = document.createElement('script')
		script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&currency=USD&intent=capture`
		script.onload = renderButtons
		document.body.appendChild(script)
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [clientId])

	if (!clientId) return null
	return <div ref={containerRef} />
}
