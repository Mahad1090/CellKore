import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Debug: Log environment variables (remove in production)
if (typeof window !== 'undefined') {
	console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Missing')
	console.log('Supabase Anon Key:', supabaseAnonKey ? 'Set' : 'Missing')
}

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
	from: (table: string) => ({
		select: (columns?: string) => ({
			order: (column: string, options?: any) => ({
				limit: (count: number) => Promise.resolve({ data: [], error: null })
			}),
			limit: (count: number) => Promise.resolve({ data: [], error: null }),
			single: () => Promise.resolve({ data: null, error: null })
		}),
		insert: (values: any) => Promise.resolve({ data: null, error: null }),
		update: (values: any) => Promise.resolve({ data: null, error: null }),
		delete: () => Promise.resolve({ data: null, error: null })
	})
})

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = isSupabaseConfigured
	? createClient(supabaseUrl!, supabaseAnonKey!)
	: createFallbackSupabaseClient()
