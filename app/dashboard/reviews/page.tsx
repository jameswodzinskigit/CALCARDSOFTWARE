import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getActiveCompanyId } from '@/utils/active-company'
import ShareRatingCard from '@/components/dashboard/ShareRatingCard'
import SetupBanner from '@/components/ui/SetupBanner'
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
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  const companyId = await getActiveCompanyId(profile?.company_id, profile?.role)
  if (!companyId) redirect('/login')

  const admin = await createAdminClient()
  const offset = (page - 1) * PAGE_SIZE

  // Fetch company details (name + google_place_id)
  const { data: company } = await admin
    .from('companies')
    .select('name, google_place_id')
    .eq('id', companyId)
    .single()

  const companyName = company?.name || 'Your Business'

  // If Google not linked, show setup state
  if (!company?.google_place_id) {
    return (
      <div className="space-y-6 page-fade-in">
        <div>
          <h1 className="text-white font-bold text-xl">Reviews</h1>
          <p className="text-gray-500 text-sm mt-0.5">Your Google reviews</p>
        </div>
        <SetupBanner
          icon="📍"
          title="Google Business connection not set up yet"
          description="Your account manager is finishing your Google Business Profile connection. Once linked, your reviews will appear here automatically — nothing else needed on your end."
          variant="info"
        />
      </div>
    )
  }

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
            </a