import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import InsightsPanel from '@/components/dashboard/InsightsPanel'
import ReviewRequestButton from '@/components/dashboard/ReviewRequestButton'
import OnboardingChecklist from '@/components/dashboard/OnboardingChecklist'
import QuickWinsPanel from '@/components/dashboard/QuickWinsPanel'
import HealthScoreCard from '@/components/dashboard/HealthScoreCard'
import ActivityFeed from '@/components/dashboard/ActivityFeed'
import { computeHealthScore } from '@/lib/healthScore'
import { timeAgo } from '@/lib/timeAgo'

export const revalidate = 300

function GrowthBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-gray-600 text-xs">—</span>
  const up = pct >= 0
  return (
    <span className={up ? 'text-green-400 font-semibold text-xs' : 'text-red-400 font-semibold text-xs'}>
      {up ? '▲' : '▼'} {up ? '+' : ''}{pct.toFixed(0)}%
    </span>
  )
}

function GoalProgressBar({ current, target }: { current: number; target: number }) {
  if (!target) return null
  const pct = Math.min(100, Math.round((current / target) * 100))
  return (
    <div className="mt-2">
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{current} / {target} goal</span>
        <span className={pct >= 100 ? 'text-green-400 font-semibold' : 'text-gray-400'}>{pct}%</span>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={'h-full rounded-full ' + (pct >= 100 ? 'bg-green-400' : '')}
          style={{ width: `${pct}%`, backgroundColor: pct < 100 ? 'var(--brand-primary)' : undefined }}
        />
      </div>
    </div>
  )
}

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role, companies(name, logo_url, google_place_id, owner_email, feature_leaderboard, feature_gbp, feature_ads, feature_calls, feature_leads, feature_reports, feature_chat)')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) redirect('/login')

  const companyRaw = Array.isArray(profile.companies) ? profile.companies[0] : profile.companies
  const company = companyRaw as {
    name: string; logo_url: string | null; google_place_id: string | null
    owner_email: string | null; feature_leaderboard: boolean; feature_gbp: boolean
    feature_ads: boolean; feature_calls: boolean; feature_leads: boolean
    feature_reports: boolean; feature_chat: boolean
  } | null

  const admin = await createAdminClient()
  const companyId = profile.company_id
  const isAdmin = ['super_admin', 'company_admin', 'owner'].includes(profile.role)

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const prevMonthEnd = monthStart
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
  const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString()
  const monthStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01'
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthStr = prevDate.getFullYear() + '-' + String(prevDate.getMonth() + 1).padStart(2, '0') + '-01'

  const [
    { count: monthReviews },
    { count: prevMonthReviews },
    { data: ratingRows },
    { count: recentTaps },
    { count: prevTaps },
    { data: recentReviews },
    { data: adRow },
    { data: prevAdRow },
    { data: gbpRow },
    { data: prevGbpRow },
    { data: goalRow },
    { data: insightsRow },
    { data: employees },
    { data: onboarding },
  ] = await Promise.all([
    admin.from('reviews').select('*', { count: 'exact', head: true }).eq('company_id', companyId).gte('created_at', monthStart),
    admin.from('reviews').select('*', { count: 'exact', head: true }).eq('company_id', companyId).gte('created_at', prevMonthStart).lt('created_at', prevMonthEnd),
    admin.from('reviews').select('rating').eq('company_id', companyId),
    admin.from('taps').select('*', { count: 'exact', head: true }).eq('company_id', companyId).gte('tapped_at', thirtyDaysAgo),
    admin.from('taps').select('*', { count: 'exact', head: true }).eq('company_id', companyId).gte('tapped_at', sixtyDaysAgo).lt('tapped_at', thirtyDaysAgo),
    admin.from('reviews').select('id, reviewer_name, rating, body, created_at').eq('company_id', companyId).order('created_at', { ascending: false }).limit(5),
    company?.feature_ads
      ? admin.from('ad_stats').select('*').eq('company_id', companyId).eq('month', monthStr).maybeSingle()
      : Promise.resolve({ data: null }),
    company?.feature_ads
      ? admin.from('ad_stats').select('*').eq('company_id', companyId).eq('month', prevMonthStr).maybeSingle()
      : Promise.resolve({ data: null }),
    company?.feature_gbp
      ? admin.from('gbp_stats').select('*').eq('company_id', companyId).eq('month', monthStr).maybeSingle()
      : Promise.resolve({ data: null }),
    company?.feature_gbp
      ? admin.from('gbp_stats').select('*').eq('company_id', companyId).eq('month', prevMonthStr).maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from('review_goals').select('monthly_target').eq('company_id', companyId).maybeSingle(),
    admin.from('company_insights').select('insights, generated_at').eq('company_id', companyId).maybeSingle(),
    admin.from('profiles').select('id, first_name, cards(slug, status)').eq('company_id', companyId).eq('role', 'employee').order('first_name').limit(20),
    admin.from('company_onboarding').select('*').eq('company_id', companyId).maybeSingle(),
  ])

  const totalReviews = ratingRows?.length || 0
  const avgRating = totalReviews > 0
    ? (ratingRows!.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '--'
  const positiveReviews = ratingRows?.filter((r: any) => r.rating >= 4).length || 0
  const negativeReviews = ratingRows?.filter((r: any) => r.rating <= 2).length || 0
  const positivePct = totalReviews > 0 ? Math.round((positiveReviews / totalReviews) * 100) : 0
  const negativePct = totalReviews > 0 ? Math.round((negativeReviews / totalReviews) * 100) : 0

  const adData = adRow as { spend: number; clicks: number; leads: number; calls: number } | null
  const prevAdData = prevAdRow as { spend: number; clicks: number; leads: number; calls: number } | null
  const gbpData = gbpRow as { views: number; searches: number; calls: number; directions: number; website_clicks: number } | null
  const prevGbpData = prevGbpRow as { views: number; searches: number; calls: number; directions: number; website_clicks: number } | null

  const goalTarget = goalRow?.monthly_target || 0
  const curReviews = monthReviews || 0
  const prevReviews = prevMonthReviews || 0

  const reviewGrowthPct = prevReviews > 0 ? Math.round(((curReviews - prevReviews) / prevReviews) * 100) : null
  const leadGrowthPct = adData && prevAdData && prevAdData.leads > 0
    ? Math.round(((adData.leads - prevAdData.leads) / prevAdData.leads) * 100) : null
  const trafficGrowthPct = gbpData && prevGbpData && prevGbpData.website_clicks > 0
    ? Math.round(((gbpData.website_clicks - prevGbpData.website_clicks) / prevGbpData.website_clicks) * 100) : null

  const cpl = adData && adData.leads > 0 ? adData.spend / adData.leads : null
  const prevCpl = prevAdData && prevAdData.leads > 0 ? prevAdData.spend / prevAdData.leads : null
  const cplChange = cpl && prevCpl ? Math.round(((cpl - prevCpl) / prevCpl) * 100) : null

  const tapsThisMonth = recentTaps || 0
  const funnelDropoff = tapsThisMonth > 0 ? Math.round(((tapsThisMonth - curReviews) / tapsThisMonth) * 100) : 0
  const funnelConversion = tapsThisMonth > 0 ? Math.round((curReviews / tapsThisMonth) * 100) : 0
  const reviewBarHeight = tapsThisMonth > 0 ? Math.max(8, Math.round((curReviews / tapsThisMonth) * 80)) : 8

  // AI Summary paragraph — generated from live data
  const monthName = now.toLocaleString('default', { month: 'long' })
  let aiSummary = `${company?.name || 'Your business'} gained ${curReviews} new review${curReviews !== 1 ? 's' : ''} in ${monthName}`
  if (reviewGrowthPct !== null) {
    aiSummary += ` (${reviewGrowthPct >= 0 ? '▲' : '▼'} ${Math.abs(reviewGrowthPct)}% vs last month)`
  }
  if (avgRating !== '--') {
    aiSummary += `, with a ${avgRating}★ average rating across ${totalReviews.toLocaleString()} total reviews`
  }
  if (adData?.leads) {
    aiSummary += `, generated ${adData.leads} leads`
    if (cpl !== null) {
      if (cplChange !== null && cplChange < 0) {
        aiSummary += ` and reduced cost per lead by ${Math.abs(cplChange)}% to $${cpl.toFixed(2)}`
      } else {
        aiSummary += ` at $${cpl.toFixed(2)} per lead`
      }
    }
  }
  aiSummary += '.'

  const activeEmployees = (employees || [])
    .map((e: any) => {
      const card = Array.isArray(e.cards) ? e.cards[0] : e.cards
      return { first_name: e.first_name, slug: card?.status === 'active' ? card.slug : null }
    })
    .filter((e: any) => e.slug)

  const ob = onboarding as Record<string, boolean> | null
  const checklistItems = [
    { key: 'logo_uploaded', label: 'Upload your company logo', description: 'Add a logo to brand your dashboard.', done: !!ob?.logo_uploaded || !!company?.logo_url, link: '/dashboard/settings', linkLabel: 'Go to Settings →' },
    { key: 'place_id_set', label: 'Connect Google Business Profile', description: 'Set your Place ID to enable GBP tracking.', done: !!ob?.place_id_set || !!company?.google_place_id, link: '/dashboard/settings', linkLabel: 'Go to Settings →' },
    { key: 'first_review_received', label: 'Receive your first review', description: 'Tap an NFC card after your next job.', done: !!ob?.first_review_received || totalReviews > 0, link: '/dashboard/reviews', linkLabel: 'View Reviews →' },
    { key: 'nfc_tapped', label: 'Tap your first NFC card', description: 'Have a technician tap their CAL card after a job.', done: !!ob?.nfc_tapped || tapsThisMonth > 0 },
    { key: 'five_reviews_received', label: 'Reach 5 reviews', description: 'Five reviews unlocks the full reputation dashboard.', done: !!ob?.five_reviews_received || totalReviews >= 5, link: '/dashboard/employees', linkLabel: 'View Employees →' },
  ]
  const showChecklist = checklistItems.filter(i => i.done).length < checklistItems.length
  const insights = (insightsRow?.insights as string[]) || []
  const generatedAt = insightsRow?.generated_at || null

  const hasMarketing = company?.feature_ads || company?.feature_gbp || company?.feature_leads || company?.feature_calls

  const refreshedAt = new Date().toISOString()
  const healthScore = computeHealthScore({
    reviewsThisMonth: curReviews,
    reviewsLastMonth: prevReviews,
    avgRating: avgRating !== '--' ? parseFloat(avgRating) : 0,
    goalTarget,
    leadsThisMonth: adData?.leads || 0,
    leadsLastMonth: prevAdData?.leads || 0,
    tapsThisMonth,
  })

  // Build quick wins — rule-based tips from live data
  const quickWins: { icon: string; title: string; body: string; urgent?: boolean }[] = []
  if (negativePct > 15) {
    quickWins.push({ icon: '⚠️', title: 'Review quality needs attention', body: `${negativePct}% of your reviews are 1-2 star. Respond to recent negative reviews to show you care.`, urgent: true })
  }
  if (goalTarget > 0 && curReviews < goalTarget * 0.5 && now.getDate() > 15) {
    quickWins.push({ icon: '🎯', title: 'Falling behind on your goal', body: `You've collected ${curReviews} of ${goalTarget} reviews with half the month gone. Tap every job this week.`, urgent: true })
  }
  if (tapsThisMonth === 0) {
    quickWins.push({ icon: '📲', title: 'No taps this month', body: 'No NFC taps recorded yet. Remind technicians to tap their card at the end of every job.' })
  } else if (funnelConversion < 20 && tapsThisMonth >= 5) {
    quickWins.push({ icon: '📲', title: 'Low tap conversion', body: `Only ${funnelConversion}% of taps are resulting in reviews. Make sure cards are being tapped at the right moment — after a successful job, before leaving.` })
  }
  if (goalTarget > 0 && curReviews >= goalTarget) {
    quickWins.push({ icon: '🎉', title: 'Goal achieved!', body: `You hit your ${goalTarget}-review target for ${monthName}. Consider raising your goal for next month.` })
  }
  if (quickWins.length < 3 && totalReviews < 10) {
    quickWins.push({ icon: '🚀', title: 'Build early momentum', body: 'The first 10 reviews are the hardest. Focus your team on tapping after every single job until you reach double digits.' })
  }
  if (quickWins.length < 3) {
    quickWins.push({ icon: '⭐', title: 'Ask happy customers to mention specifics', body: 'Reviews mentioning your technician\'s name or the job type rank higher on Google. Coach customers with a simple: "A review mentioning [Name] would mean the world."' })
  }

  return (
    <div className="space-y-6 page-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">Overview</h1>
          <p className="text-gray-500 text-sm mt-0.5">{monthName} {now.getFullYear()} performance</p>
        </div>
        <p className="text-gray-700 text-xs hidden sm:block">Updated {timeAgo(refreshedAt)}</p>
      </div>

      {showChecklist && (
        <OnboardingChecklist items={checklistItems} companyId={companyId} />
      )}

      {/* AI Summary */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0">🤖</span>
          <div>
            <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1.5">Monthly Summary</p>
            <p className="text-white text-sm leading-relaxed">{aiSummary}</p>
          </div>
        </div>
      </div>

      {/* Three Snapshot Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Reputation Snapshot */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 card-hover">
          <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">⭐ Reputation</h2>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">Google Rating</span>
              <span className="text-yellow-400 font-bold">{avgRating} ★</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">Total Reviews</span>
              <span className="text-white font-bold">{totalReviews.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">This Month</span>
              <div className="flex items-center gap-1.5">
                <span className="text-green-400 font-bold">{curReviews}</span>
                <GrowthBadge pct={reviewGrowthPct} />
              </div>
            </div>
            {goalTarget > 0 && <GoalProgressBar current={curReviews} target={goalTarget} />}
            <div className="flex justify-between items-center pt-1">
              <span className="text-gray-400 text-xs">Positive (4-5★)</span>
              <span className="text-green-400 font-semibold text-xs">{positivePct}%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">Negative (1-2★)</span>
              <span className={negativePct > 10 ? 'text-red-400 font-semibold text-xs' : 'text-gray-500 text-xs'}>{negativePct}%</span>
            </div>
          </div>
        </div>

        {/* Marketing Snapshot */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 card-hover">
          <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">📈 Marketing</h2>
          {hasMarketing ? (
            <div className="space-y-2.5">
              {company?.feature_leads && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Leads This Month</span>
                  <span className="text-white font-bold">{adData?.leads ?? '--'}</span>
                </div>
              )}
              {(company?.feature_calls || company?.feature_gbp) && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Calls This Month</span>
                  <span className="text-white font-bold">{gbpData?.calls ?? '--'}</span>
                </div>
              )}
              {company?.feature_gbp && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-xs">Website Visitors</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-white font-bold">{gbpData?.website_clicks?.toLocaleString() ?? '--'}</span>
                    <GrowthBadge pct={trafficGrowthPct} />
                  </div>
                </div>
              )}
              {company?.feature_ads && (
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">Ad Spend</span>
                    <span className="text-white font-bold">{adData?.spend != null ? '$' + adData.spend.toFixed(0) : '--'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400 text-xs">Cost Per Lead</span>
                    <span className="text-green-400 font-bold">{cpl != null ? '$' + cpl.toFixed(2) : '--'}</span>
                  </div>
                  {adData?.clicks && adData?.leads && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400 text-xs">Conversion Rate</span>
                      <span className="text-blue-400 font-bold">
                        {((adData.leads / adData.clicks) * 100).toFixed(1)}%
                      </span>
                    </div>
                  )}
                </>
              )}
            </div>
          ) : (
            <p className="text-gray-600 text-xs mt-2">Marketing tracking not enabled.<br />Contact CAL to activate ads, GBP, or leads tracking.</p>
          )}
        </div>

        {/* Growth Snapshot */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 card-hover">
          <h2 className="text-white font-semibold text-sm mb-3 flex items-center gap-2">🚀 Growth</h2>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 text-xs">Review Growth</span>
              <GrowthBadge pct={reviewGrowthPct} />
            </div>
            {company?.feature_leads && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Lead Growth</span>
                <GrowthBadge pct={leadGrowthPct} />
              </div>
            )}
            {company?.feature_gbp && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">Traffic Growth</span>
                <GrowthBadge pct={trafficGrowthPct} />
              </div>
            )}
            {company?.feature_ads && cplChange !== null && (
              <div className="flex justify-between items-center">
                <span className="text-gray-400 text-xs">CPL Change</span>
                {/* Invert: negative CPL change is good */}
                <GrowthBadge pct={cplChange !== null ? -cplChange : null} />
              </div>
            )}
            <div className="border-t border-gray-800 pt-2.5 flex justify-between items-center">
              <span className="text-gray-400 text-xs">NFC Taps (30d)</span>
              <span className="text-white font-bold">{tapsThisMonth}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Review Funnel */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-white font-semibold text-sm mb-4">Review Funnel</h2>
        <div className="overflow-x-auto">
          <div className="flex items-end gap-0 min-w-[280px]" style={{ height: '140px' }}>
            <div className="flex flex-col items-center flex-1 h-full justify-end">
              <p className="text-white font-bold text-xl mb-1">{tapsThisMonth}</p>
              <div className="w-full rounded-t-lg" style={{ height: '80px', backgroundColor: 'var(--brand-primary)', opacity: 0.7 }} />
              <p className="text-gray-400 text-xs mt-2 text-center">NFC Taps<br /><span className="text-gray-600">(30 days)</span></p>
            </div>
            <div className="flex flex-col items-center justify-center px-4 pb-10">
              <p className="text-red-400 text-xs font-medium text-center whitespace-nowrap">
                {tapsThisMonth > 0 ? `${funnelDropoff}%` : '—'}
              </p>
              <p className="text-gray-600 text-xs">drop-off</p>
              <span className="text-gray-700 text-xl mt-1">→</span>
            </div>
            <div className="flex flex-col items-center flex-1 h-full justify-end">
              <p className="text-white font-bold text-xl mb-1">{curReviews}</p>
              <div className="w-full bg-green-500 rounded-t-lg" style={{ height: `${reviewBarHeight}px` }} />
              <p className="text-gray-400 text-xs mt-2 text-center">Reviews<br /><span className="text-gray-600">(this month)</span></p>
            </div>
          </div>
          {tapsThisMonth > 0 ? (
            <p className="text-center text-green-400 text-xs mt-3 font-semibold">
              {funnelConversion}% conversion rate
            </p>
          ) : (
            <p className="text-center text-gray-600 text-xs mt-3">Tap NFC cards after jobs to see funnel data</p>
          )}
        </div>
      </div>

      {/* Quick Wins */}
      <QuickWinsPanel tips={quickWins.slice(0, 3)} />

      {/* Health Score + Activity Feed — two column on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <HealthScoreCard score={healthScore} />
        <ActivityFeed />
      </div>

      {/* AI Insights */}
      <InsightsPanel initialInsights={insights} initialGeneratedAt={generatedAt} isAdmin={isAdmin} />

      {/* Recent Reviews section with ReviewRequestButton above */}
      <div className="space-y-3">
        {activeEmployees.length > 0 && (
          <div className="flex justify-end">
            <ReviewRequestButton employees={activeEmployees} />
          </div>
        )}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-white font-semibold text-sm">Recent Reviews</h2>
            <a href="/dashboard/reviews" className="text-xs text-gray-500 hover:text-gray-300 transition-colors">View all →</a>
          </div>
          <div className="divide-y divide-gray-800">
            {recentReviews && recentReviews.length > 0 ? recentReviews.map((r: any) => (
              <div key={r.id} className="px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-white text-sm font-medium truncate">{r.reviewer_name || 'Anonymous'}</p>
                    {r.body && <p className="text-gray-400 text-xs mt-1 line-clamp-2">{r.body}</p>}
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <p className="text-yellow-400 text-sm">{'⭐'.repeat(Math.min(r.rating || 5, 5))}</p>
                    <p className="text-gray-600 text-xs mt-0.5">{new Date(r.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            )) : (
              <div className="py-16 text-center">
                <p className="text-4xl mb-3">⭐</p>
                <p className="text-white font-semibold">No reviews yet</p>
                <p className="text-gray-500 text-sm mt-1">Tap your NFC cards after jobs to start collecting reviews</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
