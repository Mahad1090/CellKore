/**
 * @supabase/supabase-js prints a console.warn on every module load when Node.js <= 20
 * is detected (see node_modules/@supabase/supabase-js/src/index.ts). It floods the dev
 * log on every recompile. Silence just that message; leave all other warnings intact.
 */
export async function register() {
	if (process.env.NEXT_RUNTIME !== 'nodejs') return

	const originalWarn = console.warn
	console.warn = (...args: unknown[]) => {
		if (typeof args[0] === 'string' && args[0].includes('Node.js 20 and below are deprecated')) return
		originalWarn(...args)
	}
}
