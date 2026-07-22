import type { RepairRequest, RepairStatus } from '@/lib/types'

/**
 * Called at every repair status transition (customer and admin routes
 * alike). Not yet wired to a real email provider — no email-sending
 * infrastructure exists in this codebase yet. Swap this function's body
 * for a call to Resend / SMTP (or whichever provider is chosen) once
 * credentials exist. Callers already treat this as fire-and-forget, so
 * no other code changes are needed when this becomes a real integration.
 */
export async function notifyRepairStatusChange(
	_request: Pick<RepairRequest, 'id' | 'contact_email' | 'contact_phone'>,
	_newStatus: RepairStatus
): Promise<void> {
	return
}
