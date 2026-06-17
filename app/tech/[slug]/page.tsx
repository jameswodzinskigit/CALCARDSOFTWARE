import { createAdminClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

interface Props { params: Promise<{ slug: string }> }

const MILESTONE_STEPS = [1, 5, 10, 25, 50, 100, 250, 500]

function nextMilestone(count: number) {
  return MILESTONE_STEPS.find(m => m > count) ?? null
}

const BADGE_LABELS: Record<string, { icon: string; label: string }> = {
  first_review: { icon: '⭐', label: 'First Review' },
  ten_reviews: { icon: '🏅', label: '10 Reviews' },
  fifty_reviews: { icon: '🥈', label: '50 Reviews' },
  hundred_reviews: { icon: '🥇', label: '100 Reviews' },
  five_star_champion: { icon: '👑', label: '5-Star Champion' },
  review_king: { icon: '🏆', label: 'Review King' },
  tap_master: { icon: '📲', label: 'Tap Master' },
  speed_demon: { icon: '⚡', label: 'Speed Demon' },
}

export default async function TechScorecard({ params }: Props) {
  const { slug } = await params
  const supabase = await createAdminClient()

  const { data: card } = await supabase
    .from('cards')
    .select('*, employee:profiles(id, first_name, last_name, company_id, avatar_url), company:companies(name, logo_url)')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!card) notFound()

  const employee = card.employee as {
    id: string; first_name: string; last_name: string; company_id: string; avatar_url: string | null
  }
  const company = card.company as { name: string; logo_url: string | null }
  const firstName = employee?.first_name || 'Technician'

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { count: totalReviews },
    { count: monthlyReviews },
    { count: weekReviews },
    { data: recentReviews },
    { data: badges },
    { data: leaderboard },
  ] = await Promise.all([
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('employee_id', employee.id),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('employee_id', employee.id).gte('reviewed_at', monthStart),
    supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('employee_id', employee.id).gte('reviewed_at', weekStart),
    supabase.from('reviews').select('reviewer_name, rating, body, reviewed_at').eq('employee_id', employee.id).order('reviewed_at', { ascending: false }).limit(5),
    supabase.from('badges').select('badge_type').eq('employee_id', employee.id),
    supabase.from('leaderboard').select('employee_id, total_reviews').eq('company_id', employee.company_id).order('total_reviews', { ascending: false }),
  ])

  const total = totalReviews ?? 0
  const monthly = monthlyReviews ?? 0
  const weekly = weekReviews ?? 0
  const reviews = (recentReviews || []) as Array<{
    reviewer_name: string | null; rating: number | null; body: string | null; reviewed_at: string
  }>
  const earnedBadges = (badges || []).map((b: any) => b.badge_type as string)
  const leaderRows = (leaderboard || []) as Array<{ employee_id: string; total_reviews: number }>

  const rank = leaderRows.findIndex(r => r.employee_id === employee.id) + 1
  const totalTeam = leaderRows.length

  const next = nextMilestone(total)
  const prevMilestone = MILESTONE_STEPS.filter(m => m <= total).pop() ?? 0
  const milestoneProgress = next ? Math.round(((total - prevMilestone) / (next - prevMilestone)) * 100) : 100

  const monthName = now.toLocaleString('default', { month: 'long' })

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 px-4 py-8">
      <div className="max-w-md mx-auto space-y-4">

        {company.logo_url && (
          <div className="text-center mb-1">
            <img src={company.logo_url} alt={company.name} className="h-8 w-auto mx-auto object-contain opacity-70" />
          </div>
        )}

        {/* Profile card */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 text-center">
          {employee.avatar_url ? (
            <img
              src={employee.avatar_url}
              alt={firstName}
              className="w-20 h-20 rounded-full object-cover mx-auto mb-3 border-2 border-green-500/30"
            />
          ) : (
            <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-white">{firstName.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <h1 className="text-white font-bold text-xl">{firstName} {employee.last_name}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{company.name}</p>
          {rank > 0 && (
            <p className="text-green-400 text-sm font-semibold mt-2">
              #{rank} on the team &middot; {totalTeam} technicians
            </p>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-white font-bold text-2xl">{total}</p>
            <p className="text-gray-500 text-xs mt-1">Total Reviews</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-green-400 font-bold text-2xl">{monthly}</p>
            <p className="text-gray-500 text-xs mt-1">{monthName}</p>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <p className="text-blue-400 font-bold text-2xl">{weekly}</p>
            <p className="text-gray-500 text-xs mt-1">This Week</p>
          </div>
        </div>

        {/* Milestone progress */}
        {next !== null ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white text-sm font-semibold">Next Milestone</p>
              <p className="text-gray-400 text-sm">{total} / {next}</p>
            </div>
            <div className="h-3 bg-gray-800 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full transition-all" style={{ width: `${milestoneProgress}%` }} />
            </div>
            <p className="text-gray-500 text-xs mt-2">
              {next - total} more review{next - total !== 1 ? 's' : ''} to unlock the next badge
            </p>
          </div>
        ) : (
          <div className="bg-green-900/20 border border-green-800 rounded-xl p-5 text-center">
            <p className="text-green-400 font-bold text-lg">&#127942; All milestones achieved!</p>
            <p className="text-gray-400 text-sm mt-1">{total} reviews and counting</p>
          </div>
        )}

        {/* Badges */}
        {earnedBadges.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h2 className="text-white font-semibold text-sm mb-3">Badges Earned</h2>
            <div className="flex flex-wrap gap-2">
              {earnedBadges.map(key => {
                const def = BADGE_LABELS[key]
                if (!def) return null
                return (
                  <div key={key} className="flex items-center gap-1.5 bg-gray-800 border border-gray-700 rounded-full px-3 py-1.5">
                    <span className="text-sm">{def.icon}</span>
                    <span className="text-white text-xs font-medium">{def.label}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Recent reviews */}
        {reviews.length > 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-800">
              <h2 className="text-white font-semibold text-sm">Recent Reviews</h2>
            </div>
            <div className="divide-y divide-gray-800">
              {reviews.map((r, i) => (
                <div key={i} className="px-5 py-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-yellow-400 text-sm">{'⭐'.repeat(Math.min(r.rating ?? 5, 5))}</span>
                    <span className="text-gray-400 text-xs">{r.reviewer_name || 'Anonymous'}</span>
                    <span className="text-gray-600 text-xs ml-auto">
                      {new Date(r.reviewed_at).toLocaleDateString()}
                    </span>
                  </div>
                  {r.body && (
                    <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">{r.body}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-xl py-12 text-center">
            <p className="text-4xl mb-3">&#11088;</p>
            <p className="text-white font-semibold">No reviews yet</p>
            <p className="text-gray-500 text-sm mt-1">Tap your NFC card after every job to start collecting Google reviews!</p>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 text-center">
          <p className="text-gray-400 text-sm mb-3">Tap your card after each job to request a review</p>
          <Link
            href={'/u/' + slug}
            className="inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors"
          >
            &#11088; Preview My Review Card
          </Link>
        </div>

        <p className="text-center text-xs text-gray-700 pb-4">Powered by CalCard &middot; {company.name}</p>
      </div>
    </div>
  )
}
