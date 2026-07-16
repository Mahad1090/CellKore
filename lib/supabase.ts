import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const createFallbackSupabaseClient = () => ({
	auth: {
		getSession: async () => ({ data: { session: null }, error: null }),
		onAuthStateChange: () => ({
			data: {
				subscription: {
					unsubscribe: () => {},
				},
			},
		}),
		signInWithPassword: async () => ({
			data: { user: null, session: null },
			error: { message: 'Supabase is not configured.' },
		}),
		signUp: async () => ({
			data: { user: null, session: null },
			error: { message: 'Supabase is not configured.' },
		}),
		signOut: async () => ({
			error: { message: 'Supabase is not configured.' },
		}),
		getUser: async () => ({
			data: { user: null },
			error: null,
		}),
	},
})

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
	? createClient(supabaseUrl, supabaseAnonKey)
	: createFallbackSupabaseClient()
