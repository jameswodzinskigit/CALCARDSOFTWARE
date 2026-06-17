import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import BadgesPanel from './BadgesPanel'
import { getActiveCompanyId } from '@/utils/active-company'

type Period = 'daily' | 'weekly' | 'monthly' | 'all'
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
}

const medalEmoji: Record<number, string> = { 1: String.fromCodePoint(129351), 2: String.fromCodePoint(129352), 3: String.fromCodePoint(129353) }
const PERIODS: Period[] = ['daily', 'weekly', 'monthly', 'all']

function periodLabel(p: Period) {
  return { daily: 'Today', weekly: 'This Week', monthly: 'This Month', all: 'All Time' }[p]
}

function reviewCountForPeriod(row: LeaderboardRow, period: Period) {
  if (period === 'daily')   return row.reviews_today
  if (period === 'weekly')  return row.reviews_this_week
  if (period === 'monthly') return row.reviews_this_month
  return row.total_reviews
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>
}) {
  const { period = 'monthly' } = await searchParams
  const activePeriod = (PERIODS.includes(period as Period) ? period : 'monthly') as Period

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
  const { data: coData } = await admin.from('companies').select('feature_leaderboard').eq('id', companyId).single()
  const features = coData as { feature_leaderboard: boolean } | null
  if (!features?.feature_leaderboard) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">Leaderboard is not enabled for your account. Contact your CalCard administrator.</p>
      </div>
    )
  }

  const [{ data: rows }, { data: badges }] = await Promise.all([
    admin.from('leaderboard').select('*').eq('company_id', companyId),
    admin.from('badges').select('badge_type').eq('company_id', companyId),
  ])

  const sorted = (rows as LeaderboardRow[] ?? [])
    .sort((a, b) => reviewCountForPeriod(b, activePeriod) - reviewCountForPeriod(a, activePeriod))
    .filter(r => reviewCountForPeriod(r, activePeriod) > 0 || activePeriod === 'all')

  const earnedKeys = (badges || []).map((b: any) => b.badge_type)

  // Find employee of the month (highest monthly reviews)
  const monthlySorted = (rows as LeaderboardRow[] ?? [])
    .filter(r => r.reviews_this_month > 0)
    .sort((a, b) => b.reviews_this_month - a.reviews_this_month)
  const topEmployee = monthlySorted[0] || null
  const monthName = new Date().toLocaleString('default', { month: 'long' })

  return (
    <div className="space-y-6 page-fade-in">
      <div>
        <h1 className="text-white font-bold text-xl">Leaderboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Team review rankings and achievements</p>
      </div>

      {/* Employee of the Month spotlight */}
      {topEmployee && (
        <div className="rounded-xl p-5 border flex items-center gap-4 card-hover" style={{ borderColor: 'var(--brand-primary)', backgroundColor: 'var(--brand-primary)' + '0d' }}>
          <span className="text-4xl">🏆</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--brand-primary)' }}>
              {monthName} Top Performer
            </p>
            <p className="text-white font-bold text-lg">{topEmployee.first_name}</p>
            <p className="text-gray-400 text-sm">{topEmployee.reviews_this_month} reviews this month · {topEmployee.avg_rating ? topEmployee.avg_rating + '★ avg' : ''}</p>
          </div>
          <div className="text-center flex-shrink-0">
            <p className="text-3xl font-bold" style={{ color: 'var(--brand-primary)' }}>{topEmployee.reviews_this_month}</p>
            <p className="text-gray-500 text-xs">reviews</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {PERIODS.map((p) => (
          <a key={p} href={'/dashboard/leaderboard?period=' + p}
            className={'px-4 py-2 rounded-lg text-sm font-medium transition-colors h-10 flex items-center ' +
              (activePeriod === p ? 'text-white' : 'bg-gray-800 text-gray-400 hover:text-white')}
            style={activePeriod === p ? { backgroundColor: 'var(--brand-primary)' } : {}}>
            {periodLabel(p)}
          </a>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold">Rankings &#8212; {periodLabel(activePeriod)}</h2>
        </div>

        {sorted.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">🏆</p>
            <p className="text-white font-semibold">No activity yet this period</p>
            <p className="text-gray-500 text-sm mt-1">Employees appear here after collecting reviews</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[540px]">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Rank</th>
                  <th className="text-left px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Employee</th>
                  <th className="text-right px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Reviews</th>
                  <th className="text-right px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">5-Star</th>
                  <th className="text-right px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Avg Rating</th>
                  <th className="text-right px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Conversion</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800">
                {sorted.map((row, idx) => {
                  const rank = idx + 1
                  const periodCount = reviewCountForPeriod(row, activePeriod)
             