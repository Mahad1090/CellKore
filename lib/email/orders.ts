import { sendMail } from './mailer'
import { FROM_ORDERS, FROM_SYSTEM, REPLY_TO_ORDERS, ADMIN_ORDERS_EMAIL } from './addresses'
import {
	renderEmailLayout,
	renderInfoRow,
	renderSectionCard,
	renderOrderItemsTable,
	renderOrderSummary,
	renderAddress,
	siteUrl,
	type EmailOrderItem,
} from './template'
import type { OrderStatus } from '@/lib/types'
import type { ShippingAddressInput } from '@/lib/checkout-server'

export type OrderEmailItem = EmailOrderItem

const ORDER_STATUS_MESSAGES: Record<OrderStatus, string> = {
	pending: 'Your order has been received and is awaiting payment confirmation.',
	paid: 'Payment has been confirmed for your order.',
	processing: 'Your order is now being prepared for shipment.',
	shipped: 'Your order is on its way!',
	delivered: 'Your order has been delivered. Thanks for shopping with CellKore!',
	cancelled: 'Your order has been cancelled.',
}

export async function sendOrderConfirmationEmail(order: {
	to: string
	reference: string
	items: OrderEmailItem[]
	subtotal: number
	discount?: number
	tax?: number
	extras?: number
	total: number
	marketplace: 'US' | 'CA'
	shippingAddress?: ShippingAddressInput
}): Promise<void> {
	const currency = order.marketplace === 'CA' ? 'CAD' : 'USD'
	await sendMail({
		to: order.to,
		from: FROM_ORDERS,
		replyTo: REPLY_TO_ORDERS,
		subject: `Order Confirmed — ${order.reference}`,
		html: renderEmailLayout({
			eyebrow: 'Order Confirmed',
			heading: 'Thanks for your order!',
			bodyHtml: `
				${renderInfoRow('Order Reference', order.reference)}
				${renderSectionCard(`
					${renderOrderItemsTable(order.items, currency)}
					${renderOrderSummary({ subtotal: order.subtotal, discount: order.discount, tax: order.tax, extras: order.extras, total: order.total, currency })}
				`)}
				${
					order.shippingAddress
						? `<p style="margin:20px 0 8px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#78716c;">Shipping To</p>${renderAddress(order.shippingAddress)}`
						: ''
				}
				<p style="margin:20px 0 0;">We'll email you again once your order ships.</p>
			`,
			action: { label: 'Track Your Order', url: `${siteUrl()}/account?tab=orders` },
		}),
	})
}

export async function sendNewOrderAdminAlert(order: {
	reference: string
	subtotal: number
	discount?: number
	tax?: number
	extras?: number
	total: number
	marketplace: 'US' | 'CA'
	itemCount: number
	customerEmail?: string | null
	shippingAddress?: ShippingAddressInput
}): Promise<void> {
	const currency = order.marketplace === 'CA' ? 'CAD' : 'USD'
	await sendMail({
		to: ADMIN_ORDERS_EMAIL,
		from: FROM_SYSTEM,
		subject: `New Order — ${order.reference}`,
		html: renderEmailLayout({
			eyebrow: 'New Order',
			heading: 'New order received',
			bodyHtml: `
				${renderInfoRow('Reference', order.reference)}
				${renderInfoRow('Marketplace', order.marketplace)}
				${renderInfoRow('Items', String(order.itemCount))}
				${order.customerEmail ? renderInfoRow('Customer', order.customerEmail) : ''}
				${renderSectionCard(renderOrderSummary({ subtotal: order.subtotal, discount: order.discount, tax: order.tax, extras: order.extras, total: order.total, currency }))}
				${order.shippingAddress ? `<p style="margin:20px 0 8px;font-size:11px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase;color:#78716c;">Ship To</p>${renderAddress(order.shippingAddress)}` : ''}
			`,
			action: { label: 'View in Admin', url: `${siteUrl()}/admin/orders` },
		}),
	})
}

export async function sendOrderStatusEmail(order: {
	to: string
	reference: string
	status: OrderStatus
}): Promise<void> {
	await sendMail({
		to: order.to,
		from: FROM_ORDERS,
		replyTo: REPLY_TO_ORDERS,
		subject: `Order Update — ${order.reference}`,
		html: renderEmailLayout({
			eyebrow: 'Order Update',
			heading: `Order ${order.status[0].toUpperCase()}${order.status.slice(1)}`,
			bodyHtml: `
				${renderInfoRow('Order Reference', order.reference)}
				<p style="margin:16px 0 0;">${ORDER_STATUS_MESSAGES[order.status]}</p>
			`,
			action: { label: 'View Order', url: `${siteUrl()}/account?tab=orders` },
		}),
	})
}
