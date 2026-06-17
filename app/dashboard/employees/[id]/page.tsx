import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { BadgePill } from '@/components/badges/BadgePill'
import ImageUploader from '@/components/dashboard/ImageUploader'

type LeaderboardRow = {
  employee_id: string
  first_name: string
  position: string | null
  total_reviews: number
  five_star_reviews: number
  avg_rating: number
  reviews_this_month: number
  reviews_this_week: number
  reviews_today: number
  total_taps: number
  conversion_rate: number
  company_id: string
}

type TapRow = {
  id: string
  tapped_at: string
  device_type: string | null
  city: string | null
  region: string | null
  country: string | null
}

type ReviewRow = {
  id: string
  reviewer_name: string | null
  rating: number
  body: string | null
  reviewed_at: string
}

type BadgeRow = {
  id: string
  badge_type: string
  earned_at: string
}

const STARS = [1, 2, 3, 4, 5]

function StarRating({ rating }: { rating: number }) {
  return (
    <span className="text-yellow-400 text-sm">
      {STARS.map((s) => (
        <span key={s}>{s <= rating ? '★' : '☆'}</span>
      ))}
    </span>
  )
}

export default async function EmployeeProfilePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id: employeeId } = await params

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) redirect('/login')

  const admin = await createAdminClient()
  const isOwner = profile.role === 'owner'

  const [
    { data: leaderboardRow },
    { data: badges },
    { data: recentTaps },
    { data: recentReviews },
    { data: empProfile },
  ] = await Promise.all([
    admin.from('leaderboard')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('company_id', profile.company_id)
      .single(),
    admin.from('badges')
      .select('id, badge_type, earned_at')
      .eq('employee_id', employeeId)
      .order('earned_at', { ascending: false }),
    admin.from('taps')
      .select('id, tapped_at, device_type, city, region, country')
      .eq('employee_id', employeeId)
      .eq('company_id', profile.company_id)
      .order('tapped_at', { ascending: false })
      .limit(20),
    admin.from('reviews')
      .select('id, reviewer_name, rating, body, reviewed_at')
      .eq('employee_id', employeeId)
      .eq('company_id', profile.company_id)
      .order('reviewed_at', { ascending: false })
      .limit(10),
    admin.from('profiles')
      .select('avatar_url')
      .eq('id', employeeId)
      .single(),
  ])

  const emp = leaderboardRow as LeaderboardRow | null
  if (!emp) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-gray-400">Employee not found or not in your company.</p>
        <Link href="/dashboard/leaderboard" className="text-green-400 hover:text-green-300 text-sm">
          Back to Leaderboard
        </Link>
      </div>
    )
  }

  const taps = (recentTaps || []) as TapRow[]
  const reviews = (recentReviews || []) as ReviewRow[]
  const earnedBadges = (badges || []) as BadgeRow[]
  const avatarUrl = (empProfile as { avatar_url: string | null } | null)?.avatar_url || null

  const locationSet = new Set<string>()
  const uniqueLocations: string[] = []
  for (const t of taps) {
    if (t.city && t.region) {
      const loc = t.city + ', ' + t.region
      if (!locationSet.has(loc)) {
        locationSet.add(loc)
        uniqueLocations.push(loc)
      }
    }
  }

  const convColor = emp.conversion_rate >= 50
    ? 'text-green-400'
    : emp.conversion_rate >= 25
      ? 'text-yellow-400'
      : 'text-gray-400'

  return (
    <div className="space-y-6">
      <Link href="/dashboard/leaderboard"
        className="inline-flex items-center gap-1 text-gray-400 hover:text-white text-sm transition-colors">
        &#8592; Back to Leaderboard
      </Link>

      {/* Header card */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="flex items-start gap-4">
          {isOwner ? (
            <ImageUploader
              currentUrl={avatarUrl}
              type="avatar"
              id={employeeId}
              shape="circle"
              size="lg"
              fallbackLabel={emp.first_name[0]?.toUpperCase() || '?'}
            />
          ) : avatarUrl ? (
            <img src={avatarUrl} alt={emp.first_name} className="w-16 h-16 rounded-full object-cover border-2 border-gray-700 flex-shrink-0" />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
              {emp.first_name[0]?.toUpperCase()}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white">{emp.first_name}</h1>
            {emp.position && <p className="text-gray-400 mt-0.5">{emp.position}</p>}
            {isOwner && <p className="text-gray-600 text-xs mt-1">Click photo to update</p>}
            {earnedBadges.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {earnedBadges.map((b) => (
                  <BadgePill key={b.id} type={b.badge_type} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{emp.total_reviews}</p>
          <p className="text-gray-400 text-sm mt-1">Total Reviews</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-blue-400">{emp.total_taps}</p>
          <p className="text-gray-400 text-sm mt-1">Card Taps</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className={"text-2xl font-bold " + convColor}>{emp.conversion_rate}%</p>
          <p className="text-gray-400 text-sm mt-1">Conversion</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">
            {emp.avg_rating ? emp.avg_rating.toFixed(1) : '—'}
          </p>
          <p className="text-gray-400 text-sm mt-1">Avg Rating</p>
        </div>
      </div>

      {/* Period breakdown */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-white font-semibold mb-4">Activity Breakdown</h2>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Today</p>
            <p className="text-xl font-bold text-white">{emp.reviews_today}</p>
            <p className="text-gray-500 text-xs">reviews</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">This Week</p>
            <p className="text-xl font-bold text-white">{emp.reviews_this_week}</p>
            <p className="text-gray-500 text-xs">reviews</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">This Month</p>
            <p className="text-xl font-bold text-white">{emp.reviews_this_month}</p>
            <p className="text-gray-500 text-xs">reviews</p>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-gray-800 grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">5-Star Reviews</p>
            <p className="text-xl font-bold text-yellow-400">{emp.five_star_reviews}</p>
          </div>
          <div>
            <p className="text-gray-400 text-xs uppercase tracking-wide mb-1">Other Ratings</p>
            <p className="text-xl font-bold text-gray-400">{emp.total_reviews - emp.five_star_reviews}</p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Reviews */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-gray-800">
            <h2 className="text-white font-semibold">Recent Reviews</h2>
          </div>
          {reviews.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No reviews yet</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {reviews.map((r) => (
                <div key={r.id} className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <StarRating rating={r.rating} />
                    <span className="text-gray-500 text-xs">
                      {new Date(r.reviewed_at).toLocaleDateString()}
                    </span>
                  </div>
                  {r.body && (
                    <p className="text-gray-300 text-sm leading-relaxed italic mt-1">
                      &ldquo;{r.body.length > 120 ? r.body.slice(0, 120) + '…' : r.body}&rdquo;
                    </p>
                  )}
                  <p className="text-gray-500 text-xs mt-1">{r.reviewer_name || 'Anonymous'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tap Activity + Locations */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-gray-800">
            <h2 className="text-white font-semibold">Recent Tap Activity</h2>
          </div>
          {taps.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">No taps recorded yet</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {taps.slice(0, 10).map((t) => (
                <div key={t.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-base">{t.device_type === 'mobile' ? '📱' : '💻'}</span>
                    <div>
                      {(t.city && t.region) ? (
                        <p className="text-white text-sm">{t.city}, {t.region}</p>
                      ) : (
                        <p className="text-gray-500 text-sm">Location unknown</p>
                      )}
                      <p className="text-gray-500 text-xs">{t.device_type || 'unknown'} device</p>
                    </div>
                  </div>
                  <span className="text-gray-500 text-xs">
                    {new Date(t.tapped_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
          {uniqueLocations.length > 0 && (
            <div className="p-4 border-t border-gray-800">
              <p className="text-gray-400 text-xs uppercase tracking-wide mb-2">All Tap Locations</p>
              <div className="flex flex-wrap gap-2">
                {uniqueLocations.map((loc) => (
                  <span key={loc} className="bg-gray-800 text-gray-300 text-xs px-2 py-1 rounded-full">
                    &#128205; {loc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
