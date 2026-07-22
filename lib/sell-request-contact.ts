/** Normalizes an email/phone lookup value and checks it against a stored contact record. */
export function matchesContact(
	record: { contact_email: string | null; contact_phone: string | null },
	contact: string
): boolean {
	const value = contact.trim().toLowerCase()
	if (!value) return false
	if (record.contact_email && record.contact_email.trim().toLowerCase() === value) return true
	const valueDigits = contact.replace(/\D/g, '')
	if (valueDigits.length >= 7 && record.contact_phone && record.contact_phone.replace(/\D/g, '') === valueDigits) return true
	return false
}

/** Formats a sell request ID with the standard CK- prefix (e.g., CK-AD2ADFAB-6A4F-4CF4-B949-7FB4A9160A0C). */
export function formatRequestId(id: string | null | undefined): string {
	if (!id) return ''
	const clean = id.trim().replace(/^CK-/i, '')
	return `CK-${clean.toUpperCase()}`
}

/** Normalizes a request ID input by removing any leading CK- prefix and converting to lowercase UUID format. */
export function normalizeRequestId(id: string | null | undefined): string {
	if (!id) return ''
	return id.trim().replace(/^CK-/i, '').toLowerCase()
}

