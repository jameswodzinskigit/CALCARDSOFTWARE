import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Header from '@/components/layout/Header'
import Leaderboard from '@/components/dashboard/Leaderboard'

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, company_id, companies(name)')
    .eq('id', user.id)
    .single()

  if (!profile) redirect('/login')

  const admin = await createAdminClient()
  const companyName = ((Array.isArray(profile.companies) ? profile.companies[0] : profile.companies) as { name: string } | null)?.name || ''

  const [
    { count: totalReviews },
    { data: badges },
    { data: recentTaps },
  ] = await Promise.all([
    admin.from('reviews').select('*', { count: 'exact', head: true }).eq('employee_id', profile.id),
    admin.from('badges').select('badge_type, earned_at').eq('employee_id', profile.id).order('earned_at', { ascending: false }),
    admin.from('taps').select('tapped_at, device_type').eq('employee_id', profile.id).order('tapped_at', { ascending: false }).limit(10),
  ])

  // Leaderboard for this company
  const { data: reviews } = await admin
    .from('reviews')
    .select('employee_id, profiles(first_name, last_name)')
    .eq('company_id', profile.company_id)
    .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

  const counts: Record<string, { name: string; count: number }> = {}
  reviews?.forEach((r) => {
    if (!r.employee_id) return
    const p = (Array.isArray(r.profiles) ? r.profiles[0] : r.profiles) as { first_name: string; last_name: string } | null
    if (!counts[r.employee_id]) counts[r.employee_id] = { name: `${p?.first_name} ${p?.last_name}`.trim(), count: 0 }
    counts[r.employee_id].count++
  })

  const leaderboardEntries = Object.entries(counts)
    .map(([id, v]) => ({ employee_id: id, name: v.name, review_count: v.count }))
    .sort((a, b) => b.review_count - a.review_count)
    .map((e, i) => ({ ...e, rank: i + 1 }))

  const badgeLabels: Record<string, string> = {
    review_1: '🎖 First Review',
    review_10: '🌟 10 Reviews',
    review_25: '💎 25 Reviews',
    review_50: '🏆 50 Reviews',
    review_100: '👑 100 Reviews',
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <Header title="My Profile" subtitle={companyName} />
      <main className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Profile Card */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-white">
              {profile.first_name?.[0]?.toUpperCase()}
            </span>
          </div>
          <h2 className="text-white text-xl font-bold">{profile.first_name} {profile.last_name}</h2>
          <p className="text-gray-400 text-sm">{companyName}</p>
          <div className="mt-4 inline-flex items-center gap-2 bg-green-500/10 text-green-400 px-4 py-2 rounded-full">
            <span className="text-xl font-bold">{totalReviews || 0}</span>
            <span className="text-sm">Total Reviews</span>
          </div>
        </div>

        {/* Badges */}
        {badges && badges.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <h3 className="text-white font-semibold mb-4">Badges Earned</h3>
            <div className="flex flex-wrap gap-3">
              {badges.map((badge) => (
                <div key={badge.badge_type} className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2">
                  <p className="text-sm text-white">{badgeLabels[badge.badge_type] || badge.badge_type}</p>
                  <p className="text-xs text-gray-500">{new Date(badge.earned_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Leaderboard */}
        <Leaderboard entries={leaderboardEntries} period="monthly" />

        {/* Recent Taps */}
        {recentTaps && recentTaps.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="p-5 border-b border-gray-800">
              <h3 className="text-white font-semibold">Recent Card Taps</h3>
            </div>
            <div className="divide-y divide-gray-800">
              {recentTaps.map((tap, i) => (
                <div key={i} className="flex items-center justify-between px-5 py-3">
                  <span className="text-gray-400 text-sm capitalize">{tap.device_type || 'unknown'}</span>
                  <span className="text-gray-500 text-xs">{new Date(tap.tapped_at).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
