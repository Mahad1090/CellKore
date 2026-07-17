import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Service-role Supabase client for trusted server-side operations
 * (webhooks, admin APIs). Bypasses RLS — never expose to the browser.
 */
export function createServiceClient(): SupabaseClient {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
	if (!url || !serviceKey) {
		throw new Error('Supabase service credentials are not configured')
	}
	return createClient(url, serviceKey, {
		auth: { persistSession: false, autoRefreshToken: false },
	})
}

/** Anon-key server client, subject to RLS — for public storefront reads. */
export function createAnonServerClient(): SupabaseClient {
	const url = process.env.NEXT_PUBLIC_SUPABASE_URL
	const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
	if (!url || !anonKey) {
		throw new Error('Supabase credentials are not configured')
	}
	return createClient(url, anonKey, {
		auth: { persistSession: false, autoRefreshToken: false },
	})
}

/** Human-readable order reference, e.g. CK-2026-98273. Never expose UUIDs to clients. */
export function generateOrderReference(): string {
	const digits = Math.floor(10000 + Math.random() * 90000)
	return `CK-${new Date().getFullYear()}-${digits}`
}
