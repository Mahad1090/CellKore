/**
 * Node-only setup (DNS resolution order, Canada Post token warm-up, the
 * @supabase/supabase-js console.warn silencer) lives in instrumentation-node.ts,
 * not here — Next.js still statically bundles this file's imports for the
 * Edge runtime even though this function returns early there, so anything
 * that touches a Node builtin ('node:dns') has to be kept out of this file's
 * import graph entirely (a same-file dynamic `import('node:dns')` is not
 * enough; the bundler traces those too) rather than merely guarded at
 * runtime. This is the pattern Next.js documents for instrumentation.ts.
 */
export async function register() {
	if (process.env.NEXT_RUNTIME !== 'nodejs') return

	const { register: registerNode } = await import('./instrumentation-node')
	registerNode()
}
