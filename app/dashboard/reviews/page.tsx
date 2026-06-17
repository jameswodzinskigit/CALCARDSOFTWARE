import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ShareRatingCard from '@/components/dashboard/ShareRatingCard'
import Link from 'next/link'

const STAR = '⭐'
const PAGE_SIZE = 20

const RATING_OPTS = [
  { label: 'All', value: '' },
  { label: '5★', value: '5' },
  { label: '4★', value: '4' },
  { label: '3★', value: '3' },
  { label: '2★', value: '2' },
  { label: '1★', value: '1' },
]

export default async function DashboardReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; rating?: string }>
}) {
  const { page: pageParam, rating: ratingParam } = await searchParams
  const page = Math.max(1, parseInt(pageParam || '1', 10))
  const ratingFilter = ratingParam ? parseInt(ratingParam, 10) : null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) redirect('/login')

  const admin = await createAdminClient()
  const companyId = profile.company_id
  const offset = (page - 1) * PAGE_SIZE

  // Fetch stats on ALL reviews (for KPI row)
  const { data: allRatingRows } = await admin
    .from('reviews')
    .select('rating')
    .eq('company_id', companyId)

  const allRatings = (allRatingRows || []) as Array<{ rating: number | null }>
  const totalCount = allRatings.length
  const avgRating = totalCount
    ? (allRatings.reduce((s, r) => s + (r.rating || 5), 0) / totalCount).toFixed(1)
    : '—'
  const fiveStars = allRatings.filter(r => r.rating === 5).length
  const positivePct = totalCount > 0 ? Math.round((allRatings.filter(r => (r.rating || 0) >= 4).length / totalCount) * 100) : 0

  // Paginated + filtered query
  let query = admin
    .from('reviews')
    .select('id, reviewer_name, rating, body, reviewed_at, attribution_method, profiles:employee_id(first_name)', { count: 'exact' })
    .eq('company_id', companyId)
    .order('reviewed_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  if (ratingFilter) {
    query = query.eq('rating', ratingFilter)
  }

  const { data: reviews, count: filteredCount } = await query

  const allReviews = (reviews || []) as Array<{
    id: string; reviewer_name: string | null; rating: number | null; body: string | null
    reviewed_at: string; attribution_method: string | null; profiles: { first_name: string } | null
  }>
  const attributed = allReviews.filter(r => r.attribution_method).length

  const { data: profileFull } = await supabase
    .from('profiles')
    .select('companies(name)')
    .eq('id', user.id)
    .single()
  const companyRaw = Array.isArray(profileFull?.companies) ? profileFull.companies[0] : profileFull?.companies
  const companyName = (companyRaw as { name: string } | null)?.name || 'Your Business'

  const totalPages = Math.ceil((filteredCount || 0) / PAGE_SIZE)
  const hasPrev = page > 1
  const hasNext = page < totalPages

  function pageHref(p: number) {
    const params = new URLSearchParams()
    params.set('page', String(p))
    if (ratingParam) params.set('rating', ratingParam)
    return '/dashboard/reviews?' + params.toString()
  }

  function ratingHref(r: string) {
    const params = new URLSearchParams()
    params.set('page', '1')
    if (r) params.set('rating', r)
    return '/dashboard/reviews?' + params.toString()
  }

  return (
    <div className="space-y-6 page-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-white font-bold text-xl">Reviews</h1>
          <p className="text-gray-500 text-sm mt-0.5">Your Google reviews</p>
        </div>
        {totalCount > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <ShareRatingCard companyName={companyName} avgRating={avgRating} totalReviews={totalCount} positivePct={positivePct} />
            <a
              href="/api/export/reviews"
              download
              className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2 h-10"
            >
              ⬇ Export CSV
            </a>
          </div>
        )}
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center card-hover">
          <p className="text-yellow-400 text-xl md:text-2xl font-bold">{avgRating}</p>
          <p className="text-gray-500 text-xs mt-1">Avg Rating</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center card-hover">
          <p className="text-green-400 text-xl md:text-2xl font-bold">{fiveStars}</p>
          <p className="text-gray-500 text-xs mt-1">5-Star Reviews</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center card-hover">
          <p className="text-white text-xl md:text-2xl font-bold">{totalCount}</p>
          <p className="text-gray-500 text-xs mt-1">Total Reviews</p>
        </div>
      </div>

      {/* Rating filter chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {RATING_OPTS.map(opt => {
          const active = (ratingParam || '') === opt.value
          return (
            <Link
              key={opt.value}
              href={ratingHref(opt.value)}
              className={'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ' +
                (active
                  ? 'text-white border-transparent'
                  : 'bg-gray-800 text-gray-400 hover:text-white border-gray-700')}
              style={active ? { backgroundColor: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' } : {}}
            >
              {opt.label}
            </Link>
          )
        })}
      </div>

      {/* Review list */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="divide-y divide-gray-800">
          {allReviews.length > 0 ? allReviews.map((review) => {
            const stars = review.rating ?? 5
            return (
              <div key={review.id} className="p-4 md:p-5 hover:bg-gray-800/30 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-yellow-400 text-sm">{STAR.repeat(Math.min(stars, 5))}</span>
                      <span className="text-white text-sm font-medium">{review.reviewer_name || 'Anonymous'}</span>
                      {review.profiles?.first_name && (
                        <>
                          <span className="text-gray-500 text-xs">→</span>
                          <span className="text-green-400 text-sm font-medium">{review.profiles.first_name}</span>
                        </>
                      )}
                    </div>
                    {review.body && (
                      <p className="text-gray-300 text-sm leading-relaxed">{review.body}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
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
                        <span className="text-xs px-2 py-0.5 rounded-full bg-red-900/40 text-red-400">Low rating</span>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-500 text-xs flex-shrink-0">
                    {new Date(review.reviewed_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )
          }) : (
            <div className="py-16 text-center">
              <p className="text-4xl mb-3">⭐</p>
              <p className="text-white font-semibold">No reviews {ratingFilter ? `with ${ratingFilter}★ rating` : 'yet'}</p>
              <p className="text-gray-500 text-sm mt-1">
                {ratingFilter ? 'Try a different filter' : 'Tap your NFC cards after jobs to start collecting reviews'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-500 text-sm">
            Page {page} of {totalPages} &middot; {filteredCount || 0} reviews
          </p>
          <div className="flex items-center gap-2">
            {hasPrev ? (
              <Link href={pageHref(page - 1)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-colors">
                ← Prev
              </Link>
            ) : (
              <span className="px-4 py-2 bg-gray-900 text-gray-700 text-sm rounded-lg cursor-not-allowed">← Prev</span>
            )}
            {hasNext ? (
              <Link href={pageHref(page + 1)} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-sm font-medium rounded-lg transition-colors">
                Next →
              </Link>
            ) : (
              <span className="px-4 py-2 bg-gray-900 text-gray-700 text-sm rounded-lg cursor-not-allowed">Next →</span>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
