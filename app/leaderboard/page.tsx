import { createAdminClient } from '@/utils/supabase/server'

type LeaderboardRow = {
  employee_id: string
  first_name: string
  company_id: string
  total_reviews: number
  five_star_reviews: number
  avg_rating: number
  reviews_this_month: number
}

const medalEmoji: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' }

function rowBg(rank: number) {
  if (rank === 1) return 'bg-yellow-500/5'
  if (rank <= 3) return 'bg-gray-800/20'
  return 'hover:bg-gray-800/30 transition-colors'
}

function avatarBg(rank: number) {
  if (rank === 1) return 'bg-gradient-to-br from-yellow-400 to-yellow-600'
  if (rank === 2) return 'bg-gradient-to-br from-gray-300 to-gray-500'
  if (rank === 3) return 'bg-gradient-to-br from-amber-600 to-amber-800'
  return 'bg-gradient-to-br from-green-500 to-green-700'
}

export default async function PlatformLeaderboardPage() {
  const supabase = await createAdminClient()

  const [
    { data: rows },
    { data: companies },
    { count: totalCompanies },
    { count: totalReviews },
    { count: totalTaps },
  ] = await Promise.all([
    supabase.from('leaderboard').select('*').order('total_reviews', { ascending: false }).limit(25),
    supabase.from('companies').select('id, name'),
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('taps').select('*', { count: 'exact', head: true }),
  ])

  const companyMap = Object.fromEntries((companies || []).map((c: { id: string; name: string }) => [c.id, c.name]))
  const top = (rows as LeaderboardRow[] ?? []).filter(r => r.total_reviews > 0)

  return (
    <div className="min-h-screen bg-gray-950 px-4 py-12">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-4 py-1.5 mb-4">
            <span className="text-green-400 text-xs font-semibold tracking-wide uppercase">CalCard Platform</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">Top Performers</h1>
          <p className="text-gray-400">The best review-getters across all CalCard companies</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Companies', value: totalCompanies || 0, icon: '🏢' },
            { label: 'Total Reviews', value: totalReviews || 0, icon: '⭐' },
            { label: 'Card Taps', value: totalTaps || 0, icon: '📲' },
          ].map(({ label, value, icon }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
              <p className="text-2xl mb-1">{icon}</p>
              <p className="text-white text-xl font-bold">{value.toLocaleString()}</p>
              <p className="text-gray-500 text-xs">{label}</p>
            </div>
          ))}
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-gray-800">
            <h2 className="text-white font-semibold">All-Time Rankings</h2>
          </div>
          {top.length === 0 ? (
            <div className="p-12 text-center text-gray-500">No reviews recorded yet</div>
          ) : (
            <div className="divide-y divide-gray-800">
              {top.map((row, idx) => {
                const rank = idx + 1
                return (
                  <div key={row.employee_id} className={"flex items-center gap-4 px-5 py-4 " + rowBg(rank)}>
                    <div className="w-8 text-center flex-shrink-0">
                      {medalEmoji[rank] ? (
                        <span className="text-xl">{medalEmoji[rank]}</span>
                      ) : (
                        <span className="text-gray-500 font-mono text-sm">#{rank}</span>
                      )}
                    </div>
                    <div className={"w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0 " + avatarBg(rank)}>
                      {row.first_name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-medium text-sm">{row.first_name}</p>
                      <p className="text-gray-500 text-xs truncate">{companyMap[row.company_id] || 'Unknown'}</p>
                    </div>
                    <div className="flex items-center gap-4 text-right flex-shrink-0">
                      <div>
                        <p className="text-green-400 font-bold text-lg leading-none">{row.total_reviews}</p>
                        <p className="text-gray-600 text-xs">reviews</p>
                      </div>
                      {row.avg_rating > 0 && (
                        <div className="hidden md:block">
                          <p className="text-yellow-400 font-medium text-sm leading-none">{row.avg_rating} avg</p>
                          <p className="text-gray-600 text-xs">rating</p>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="text-center">
          <p className="text-gray-600 text-sm">
            Want your team on this board?{' '}
            <a href="https://cal.marketing" className="text-green-400 hover:text-green-300">Get CalCard</a>
          </p>
        </div>
      </div>
    </div>
  )
}
