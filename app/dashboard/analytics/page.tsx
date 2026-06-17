import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

interface DayBucket { day: string; taps: number; reviews: number }

function BarChart({ data, maxVal, color }: { data: number[]; maxVal: number; color: string }) {
  return (
    <div className="flex items-end gap-0.5 h-16">
      {data.map((v, i) => {
        const pct = maxVal > 0 ? (v / maxVal) * 100 : 0
        return (
          <div key={i} className="flex-1 flex flex-col justify-end">
            <div className={"rounded-sm " + color} style={{ height: Math.max(pct, v > 0 ? 8 : 0) + "%" }} title={String(v)} />
          </div>
        )
      })}
    </div>
  )
}

export default async function AnalyticsPage() {
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
  const companyId = profile.company_id

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const [
    { data: tapRows },
    { data: reviewRows },
    { data: topEmployees },
  ] = await Promise.all([
    admin.from('taps')
      .select('tapped_at')
      .eq('company_id', companyId)
      .gte('tapped_at', thirtyDaysAgo.toISOString()),
    admin.from('reviews')
      .select('created_at')
      .eq('company_id', companyId)
      .gte('created_at', thirtyDaysAgo.toISOString()),
    admin.from('leaderboard')
      .select('employee_id, first_name, total_reviews, total_taps')
      .eq('company_id', companyId)
      .order('total_reviews', { ascending: false })
      .limit(5),
  ])

  // Build 30-day buckets
  const buckets: Record<string, DayBucket> = {}
  for (let i = 29; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
    const key = d.toISOString().slice(0, 10)
    buckets[key] = { day: key, taps: 0, reviews: 0 }
  }

  for (const t of (tapRows || [])) {
    const key = t.tapped_at.slice(0, 10)
    if (buckets[key]) buckets[key].taps++
  }
  for (const r of (reviewRows || [])) {
    const key = r.created_at.slice(0, 10)
    if (buckets[key]) buckets[key].reviews++
  }

  const days = Object.values(buckets)
  const tapData = days.map(d => d.taps)
  const reviewData = days.map(d => d.reviews)
  const maxTaps = Math.max(...tapData, 1)
  const maxReviews = Math.max(...reviewData, 1)
  const totalTaps = tapData.reduce((a, b) => a + b, 0)
  const totalReviews = reviewData.reduce((a, b) => a + b, 0)
  const convRate = totalTaps > 0 ? ((totalReviews / totalTaps) * 100).toFixed(1) : '0.0'

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white mb-1">Analytics</h2>
        <p className="text-gray-400 text-sm">Last 30 days</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-white">{totalTaps}</p>
          <p className="text-gray-400 text-sm mt-1">Card Taps</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-green-400">{totalReviews}</p>
          <p className="text-gray-400 text-sm mt-1">Reviews</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-400">{convRate}%</p>
          <p className="text-gray-400 text-sm mt-1">Conversion</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-400 mb-3">Card Taps (30 days)</p>
          <BarChart data={tapData} maxVal={maxTaps} color="bg-blue-500" />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>30d ago</span>
            <span>Today</span>
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <p className="text-sm font-medium text-gray-400 mb-3">Reviews Received (30 days)</p>
          <BarChart data={reviewData} maxVal={maxReviews} color="bg-green-500" />
          <div className="flex justify-between text-xs text-gray-600 mt-1">
            <span>30d ago</span>
            <span>Today</span>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
        <p className="text-sm font-medium text-white mb-3">Top Performers (30 days)</p>
        {(topEmployees || []).length === 0 && (
          <p className="text-gray-500 text-sm">No data yet.</p>
        )}
        <div className="space-y-3">
          {(topEmployees || []).map((emp: { employee_id: string; first_name: string; total_reviews: number; total_taps: number }, i: number) => {
            const empConv = emp.total_taps > 0 ? ((emp.total_reviews / emp.total_taps) * 100).toFixed(0) : '0'
            return (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">
                  {i + 1}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between mb-1">
                    <Link href={'/dashboard/employees/' + emp.employee_id}
                      className="text-sm text-white font-medium hover:text-green-400 transition-colors">
                      {emp.first_name}
                    </Link>
                    <span className="text-xs text-gray-400">{emp.total_reviews} reviews &middot; {empConv}% conv</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-1.5">
                    <div className="bg-green-500 h-1.5 rounded-full"
                      style={{ width: (totalReviews > 0 ? (emp.total_reviews / totalReviews) * 100 : 0) + "%" }} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
