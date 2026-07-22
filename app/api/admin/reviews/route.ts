import { NextRequest, NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin/session'
import { createServiceClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
	const auth = await requireAdmin(request, 'reviews:write')
	if ('error' in auth) return auth.error

	const service = createServiceClient()
	const [productReviewsResult, testimonialsResult] = await Promise.all([
		service
			.from('product_reviews')
			.select('id, product_id, user_id, reviewer_name, reviewer_email, rating, title, comment, status, is_featured, created_at, updated_at, products ( id, name, brand )')
			.order('created_at', { ascending: false }),
		service
			.from('store_testimonials')
			.select('id, user_id, customer_name, customer_email, rating, title, comment, status, is_featured, created_at, updated_at')
			.order('created_at', { ascending: false }),
	])

	if (productReviewsResult.error) return NextResponse.json({ error: productReviewsResult.error.message }, { status: 500 })
	if (testimonialsResult.error) return NextResponse.json({ error: testimonialsResult.error.message }, { status: 500 })

	const productReviews = productReviewsResult.data ?? []
	const testimonials = testimonialsResult.data ?? []

	return NextResponse.json({
		productReviews,
		testimonials,
		stats: {
			productReviewsTotal: productReviews.length,
			productReviewsPending: productReviews.filter((item) => item.status === 'pending').length,
			productReviewsApproved: productReviews.filter((item) => item.status === 'approved').length,
			testimonialsTotal: testimonials.length,
			testimonialsPending: testimonials.filter((item) => item.status === 'pending').length,
			testimonialsApproved: testimonials.filter((item) => item.status === 'approved').length,
		},
	})
}
