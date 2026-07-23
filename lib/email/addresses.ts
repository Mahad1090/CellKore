// Sender identities and admin recipient addresses. All overridable via env.
//
// Hostinger (and most SMTP providers) reject a From address that isn't the
// authenticated mailbox — so every email actually sends as noreply@, with a
// Reply-To header pointing at the human-monitored inbox (orders@/support@)
// so customer replies still land in the right place. If you ever add SMTP
// credentials for orders@/support@ directly (or a relay that allows
// verified aliases), just override EMAIL_FROM_ORDERS/EMAIL_FROM_SUPPORT to
// send as those addresses directly instead of via Reply-To.
export const FROM_ORDERS = process.env.EMAIL_FROM_ORDERS || 'CellKore Orders <noreply@cellkore.com>'
export const FROM_SUPPORT = process.env.EMAIL_FROM_SUPPORT || 'CellKore Support <noreply@cellkore.com>'
export const FROM_SYSTEM = process.env.EMAIL_FROM_SYSTEM || 'CellKore <noreply@cellkore.com>'
export const FROM_INFO = process.env.EMAIL_FROM_INFO || 'CellKore <noreply@cellkore.com>'

export const REPLY_TO_ORDERS = process.env.EMAIL_REPLY_TO_ORDERS || 'orders@cellkore.com'
export const REPLY_TO_SUPPORT = process.env.EMAIL_REPLY_TO_SUPPORT || 'support@cellkore.com'
export const REPLY_TO_SYSTEM = process.env.EMAIL_REPLY_TO_SUPPORT || 'support@cellkore.com'

export const ADMIN_ORDERS_EMAIL = process.env.ADMIN_ORDERS_EMAIL || 'orders@cellkore.com'
export const ADMIN_SUPPORT_EMAIL = process.env.ADMIN_SUPPORT_EMAIL || 'support@cellkore.com'
