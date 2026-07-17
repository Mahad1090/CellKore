/** Tailwind pulse shimmer placeholders sized to match final layouts (no content shift). */

export function ProductCardShimmer() {
	return (
		<div className="border-beam-container">
			<div className="border-beam-inner overflow-hidden">
				<div className="animate-pulse">
					<div className="aspect-square bg-muted" />
					<div className="p-5 space-y-3">
						<div className="h-3 bg-muted rounded-full w-1/3" />
						<div className="h-4 bg-muted rounded-full w-3/4" />
						<div className="h-4 bg-muted rounded-full w-1/2" />
					</div>
				</div>
			</div>
		</div>
	)
}

export function GridShimmer({ count = 8 }: { count?: number }) {
	return (
		<div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
			{Array.from({ length: count }).map((_, i) => (
				<ProductCardShimmer key={i} />
			))}
		</div>
	)
}

export function DetailShimmer() {
	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse">
			<div className="grid md:grid-cols-2 gap-12">
				<div className="aspect-square bg-muted rounded-3xl" />
				<div className="space-y-5">
					<div className="h-3 bg-muted rounded-full w-1/4" />
					<div className="h-8 bg-muted rounded-full w-3/4" />
					<div className="h-6 bg-muted rounded-full w-1/3" />
					<div className="h-24 bg-muted rounded-2xl" />
					<div className="h-12 bg-muted rounded-full" />
				</div>
			</div>
		</div>
	)
}

export function TableShimmer({ rows = 6 }: { rows?: number }) {
	return (
		<div className="animate-pulse space-y-3">
			<div className="h-10 bg-muted rounded-xl" />
			{Array.from({ length: rows }).map((_, i) => (
				<div key={i} className="h-14 bg-muted/60 rounded-xl" />
			))}
		</div>
	)
}

export function FormShimmer() {
	return (
		<div className="animate-pulse space-y-4">
			{Array.from({ length: 5 }).map((_, i) => (
				<div key={i} className="h-12 bg-muted rounded-xl" />
			))}
		</div>
	)
}
