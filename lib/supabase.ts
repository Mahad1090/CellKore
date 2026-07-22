import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

export const supabase = createClient(
	supabaseUrl ?? 'http://localhost:54321',
	supabaseAnonKey ?? 'anon-key-not-configured'
)

console.log("URL:", process.env.NEXT_PUBLIC_SUPABASE_URL)
console.log("KEY EXISTS:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
console.log("KEY PREFIX:", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.slice(0, 20))