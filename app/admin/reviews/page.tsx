import { createAdminClient } from '@/utils/supabase/server'
import ReviewReplyButton from '@/components/admin/ReviewReplyButton'

const STAR = '⭐'

export default async function AdminReviewsPage() {
  const supabase = await createAdminClient()

  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      id, reviewer_name, rating, body, reviewed_at,
      attribution_method, source,
      reply_text, replied_at,
      profiles:employee_id ( first_name ),
      companies:company_id ( name )
    `)
    .order('reviewed_at', { ascending: false })
    .limit(100)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-xl">All Reviews</h2>
        <span className="text-gray-400 text-sm">{reviews?.length ?? 0} most recent</span>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="divide-y divide-gray-800">
          {reviews?.map((review) => {
            const employee = review.profiles as { first_name: string } | null
            const company = review.companies as { name: string } | null
            const stars = review.rating ?? 5

            return (
              <div key={review.id} className="p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-yellow-400 text-sm">{STAR.repeat(Math.min(stars, 5))}</span>
                      <span className="text-white text-sm font-medium">{review.reviewer_name || 'Anonymous'}</span>
                      <span className="text-gray-500 text-xs">→</span>
                      <span className="text-green-400 text-sm font-medium">{employee?.first_name ?? 'Unattributed'}</span>
                      <span className="text-gray-500 text-xs">at {company?.name ?? '—'}</span>
                    </div>
                    {review.body && (
                      <p className="text-gray-300 text-sm leading-relaxed line-clamp-3">{review.body}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      {review.attribution_method && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-400">
                          {review.attribution_method === 'tap_1hr' ? '🎯 tap (1hr)' :
                           review.attribution_method === 'tap_2hr' ? '🎯 tap (2hr)' :
                           review.attribution_method === 'name_match' ? '📝 name match' : review.attribution_method}
                        </span>
                      )}
                      {!review.attribution_method && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-500">unattributed</span>
                      )}
                      {stars <= 2 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-400">Private — low rating</span>
                      )}
                      {review.reply_text && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/40 text-blue-400">✓ Replied</span>
                      )}
                    </div>
                    <ReviewReplyButton
                      reviewId={review.id}
                      existingReply={review.reply_text}
                      repliedAt={review.replied_at}
                    />
                  </div>
                  <p className="text-gray-500 text-xs flex-shrink-0">
                    {new Date(review.reviewed_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )
          })}
          {!reviews?.length && (
            <div className="p-12 text-center text-gray-500">No reviews yet</div>
          )}
        </div>
      </div>
    </div>
  )
}
