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
