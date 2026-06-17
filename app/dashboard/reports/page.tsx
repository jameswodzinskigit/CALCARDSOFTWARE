import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PrintButton from './PrintButton'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, companies(name, feature_reports, feature_ads, feature_gbp)')
    .eq('id', user.id)
    .single()

  const companyRaw = Array.isArray(profile?.companies) ? profile?.companies[0] : profile?.companies
  const company = companyRaw as { name: string; feature_reports: boolean; feature_ads: boolean; feature_gbp: boolean } | null
  if (!profile?.company_id || !company?.feature_reports) redirect('/dashboard')

  const admin = await createAdminClient()
  const companyId = profile.company_id
  const now = new Date()

  const months: string[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push(d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-01')
  }

  const currentMonthStr = months[0]
  const prevMonthStr = months[1]

  const [
    { data: reviewsByMonth },
    { count: totalReviews },
    { data: ratingRows },
    { data: adStats },
    { data: prevAdStats },
    { data: gbpStats },
    { data: prevGbpStats },
    { data: tapsByMonth },
    { data: goalRow },
  ] = await Promise.all([
    admin.from('reviews').select('created_at').eq('company_id', companyId),
    admin.from('reviews').select('*', { count: 'exact', head: true }).eq('company_id', companyId),
    admin.from('reviews').select('rating').eq('company_id', companyId),
    company.feature_ads
      ? admin.from('ad_stats').select('*').eq('company_id', companyId).in('month', months)
      : Promise.resolve({ data: [] }),
    company.feature_ads
      ? admin.from('ad_stats').select('*').eq('company_id', companyId).eq('month', prevMonthStr).maybeSingle()
      : Promise.resolve({ data: null }),
    company.feature_gbp
      ? admin.from('gbp_stats').select('*').eq('company_id', companyId).in('month', months)
      : Promise.resolve({ data: [] }),
    company.feature_gbp
      ? admin.from('gbp_stats').select('*').eq('company_id', companyId).eq('month', prevMonthStr).maybeSingle()
      : Promise.resolve({ data: null }),
    admin.from('taps').select('tapped_at').eq('company_id', companyId),
    admin.from('review_goals').select('monthly_target').eq('company_id', companyId).maybeSingle(),
  ])

  function reviewsInMonth(month: string) {
    const d = new Date(month + 'T12:00:00')
    return (reviewsByMonth || []).filter((r: any) => {
      const rd = new Date(r.created_at)
      return rd.getFullYear() === d.getFullYear() && rd.getMonth() === d.getMonth()
    }).length
  }

  function tapsInMonth(month: string) {
    const d = new Date(month + 'T12:00:00')
    return (tapsByMonth || []).filter((t: any) => {
      const td = new Date(t.tapped_at)
      return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth()
    }).length
  }

  function adForMonth(month: string) {
    return (adStats || []).find((s: any) => s.month === month) as { spend: number; clicks: number; leads: number; calls: number } | undefined
  }

  function gbpForMonth(month: string) {
    return (gbpStats || []).find((s: any) => s.month === month) as { views: number; searches: number; calls: number; directions: number; website_clicks: number } | undefined
  }

  // Current month data
  const curMonthReviews = reviewsInMonth(currentMonthStr)
  const prevMonthReviews = reviewsInMonth(prevMonthStr)
  const curAd = adForMonth(currentMonthStr)
  const prevAd = prevAdStats as { spend: number; clicks: number; leads: number; calls: number } | null
  const curGbp = gbpForMonth(currentMonthStr)
  const prevGbp = prevGbpStats as { views: number; searches: number; calls: number; directions: number; website_clicks: number } | null

  const avgRating = ratingRows && ratingRows.length > 0
    ? (ratingRows.reduce((s: number, r: any) => s + r.rating, 0) / ratingRows.length).toFixed(1)
    : '--'

  const goalTarget = goalRow?.monthly_target || 0
  const goalAchievement = goalTarget > 0 ? Math.round((curMonthReviews / goalTarget) * 100) : null

  const reviewGrowth = prevMonthReviews > 0
    ? Math.round(((curMonthReviews - prevMonthReviews) / prevMonthReviews) * 100)
    : null

  const cpl = curAd && curAd.leads > 0 ? curAd.spend / curAd.leads : null
  const prevCpl = prevAd && prevAd.leads > 0 ? prevAd.spend / prevAd.leads : null
  const cplChange = cpl && prevCpl ? Math.round(((cpl - prevCpl) / prevCpl) * 100) : null

  // AI Summary
  const currentMonthLabel = new Date(currentMonthStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  let aiSummary = `${company.name} gained ${curMonthReviews} new reviews in ${currentMonthLabel}`
  if (reviewGrowth !== null) {
    aiSummary += ` (${reviewGrowth >= 0 ? '▲' : '▼'} ${Math.abs(reviewGrowth)}% vs prior month)`
  }
  if (avgRating !== '--') {
    aiSummary += `, maintaining a ${avgRating}★ average across ${(totalReviews || 0).toLocaleString()} total reviews`
  }
  if (curAd?.leads) {
    aiSummary += `, generated ${curAd.leads} leads`
    if (cpl) aiSummary += ` at $${cpl.toFixed(2)} CPL`
  }
  aiSummary += '.'

  // Rule-based recommendations
  const recs: string[] = []
  if (goalTarget > 0 && curMonthReviews < goalTarget) {
    recs.push(`You are ${goalTarget - curMonthReviews} reviews short of your ${goalTarget}-review goal — increase NFC tap frequency to close the gap.`)
  }
  if (cplChange !== null && cplChange > 15) {
    recs.push(`Cost per lead rose ${cplChange}% — review your ad targeting or pause underperforming keywords.`)
  }
  if (curGbp && prevGbp && curGbp.website_clicks < prevGbp.website_clicks) {
    recs.push(`Website clicks from GBP dropped vs. last month — ensure your business profile photos and posts are up to date.`)
  }
  if (recs.length === 0 && curMonthReviews >= (goalTarget || 1)) {
    recs.push(`You hit your review target! Consider raising your monthly goal to keep the momentum going.`)
  }
  if (recs.length < 3) {
    recs.push(`Schedule a weekly team reminder to tap NFC cards after every completed job.`)
  }
  if (recs.length < 3) {
    recs.push(`Review your top 5-star reviews and use customer language in your ads and GBP description.`)
  }

  return (
    <div className="space-y-6 page-fade-in">
      <div className="flex items-start justify-between flex-wrap gap-3 no-print">
        <div>
          <h1 className="text-white font-bold text-xl">Monthly Reports</h1>
          <p className="text-gray-500 text-sm mt-0.5">{company.name} — last 6 months</p>
        </div>
        <PrintButton />
      </div>

      {/* Current Month Full Report */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden print-page" id="report-content">
        {/* Report Header */}
        <div className="px-6 py-5 border-b border-gray-800">
          <div className="flex items-start justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-white font-bold text-lg">{company.name}</h2>
              <p className="text-gray-400 text-sm">{currentMonthLabel} — Monthly Performance Report</p>
            </div>
            <p className="text-gray-600 text-xs">Generated {now.toLocaleDateString()}</p>
          </div>
        </div>

        {/* AI Summary */}
        <div className="px-6 py-4 bg-gray-800/30 border-b border-gray-800">
          <p className="text-white text-sm leading-relaxed">🤖 {aiSummary}</p>
        </div>

        <div className="p-6 space-y-6">
          {/* Reputation Section */}
          <div>
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">⭐ Reputation</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-gray-400 text-xs mb-1">Reviews Gained</p>
                <p className="text-white font-bold text-xl">{curMonthReviews}</p>
                {reviewGrowth !== null && (
                  <p className={reviewGrowth >= 0 ? 'text-green-400 text-xs mt-0.5' : 'text-red-400 text-xs mt-0.5'}>
                    {reviewGrowth >= 0 ? '▲' : '▼'} {Math.abs(reviewGrowth)}% vs prior
                  </p>
                )}
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-gray-400 text-xs mb-1">Avg Rating</p>
                <p className="text-yellow-400 font-bold text-xl">{avgRating} ★</p>
              </div>
              <div className="bg-gray-800/50 rounded-lg p-3">
                <p className="text-gray-400 text-xs mb-1">Total Reviews</p>
                <p className="text-white font-bold text-xl">{(totalReviews || 0).toLocaleString()}</p>
              </div>
              {goalTarget > 0 && (
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Goal Achievement</p>
                  <p className={`font-bold text-xl ${(goalAchievement || 0) >= 100 ? 'text-green-400' : 'text-white'}`}>
                    {goalAchievement ?? '--'}%
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">of {goalTarget} target</p>
                </div>
              )}
            </div>
          </div>

          {/* Marketing Section */}
          {company.feature_ads && (
            <div>
              <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">📈 Marketing (Ads)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Ad Spend</p>
                  <p className="text-white font-bold text-xl">{curAd ? '$' + curAd.spend.toFixed(0) : '--'}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Leads</p>
                  <p className="text-white font-bold text-xl">{curAd?.leads ?? '--'}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Cost Per Lead</p>
                  <p className="text-green-400 font-bold text-xl">{cpl ? '$' + cpl.toFixed(2) : '--'}</p>
                  {cplChange !== null && (
                    <p className={cplChange <= 0 ? 'text-green-400 text-xs mt-0.5' : 'text-red-400 text-xs mt-0.5'}>
                      {cplChange <= 0 ? '▼' : '▲'} {Math.abs(cplChange)}% vs prior
                    </p>
                  )}
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Calls (Ads)</p>
                  <p className="text-white font-bold text-xl">{curAd?.calls ?? '--'}</p>
                </div>
              </div>
            </div>
          )}

          {/* GBP Section */}
          {company.feature_gbp && (
            <div>
              <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">📍 Google Business Profile</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Profile Views</p>
                  <p className="text-white font-bold text-xl">{curGbp?.views?.toLocaleString() ?? '--'}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Calls</p>
                  <p className="text-white font-bold text-xl">{curGbp?.calls ?? '--'}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Directions</p>
                  <p className="text-white font-bold text-xl">{curGbp?.directions ?? '--'}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Website Clicks</p>
                  <p className="text-white font-bold text-xl">{curGbp?.website_clicks ?? '--'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div>
            <h3 className="text-gray-400 text-xs font-semibold uppercase tracking-wider mb-3">💡 Next Month Recommendations</h3>
            <div className="space-y-2">
              {recs.slice(0, 3).map((rec, i) => (
                <div key={i} className="flex items-start gap-3 bg-gray-800/40 rounded-lg px-4 py-3">
                  <span className="text-green-400 font-bold text-sm flex-shrink-0">{i + 1}.</span>
                  <p className="text-gray-300 text-sm">{rec}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Historical table */}
      <div className="space-y-4 no-print">
        <h2 className="text-white font-semibold">History — Last 6 Months</h2>
        {months.slice(1).map((month) => {
          const label = new Date(month + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
          const reviews = reviewsInMonth(month)
          const taps = tapsInMonth(month)
          const ad = adForMonth(month)
          const gbp = gbpForMonth(month)

          return (
            <div key={month} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <h3 className="text-white font-semibold text-sm">{label}</h3>
              </div>
              <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">Reviews</p>
                  <p className="text-white font-bold text-lg">{reviews}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-gray-400 text-xs mb-1">NFC Taps</p>
                  <p className="text-white font-bold text-lg">{taps}</p>
                </div>
                {company.feature_ads && (
                  <>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Ad Spend</p>
                      <p className="text-white font-bold text-lg">{ad ? '$' + ad.spend.toFixed(0) : '--'}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Leads / CPL</p>
                      <p className="text-white font-bold text-lg">{ad?.leads ?? '--'}</p>
                      {ad && ad.leads > 0 && <p className="text-green-400 text-xs">${(ad.spend / ad.leads).toFixed(2)} CPL</p>}
                    </div>
                  </>
                )}
                {company.feature_gbp && (
                  <>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">GBP Views</p>
                      <p className="text-white font-bold text-lg">{gbp ? gbp.views.toLocaleString() : '--'}</p>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">GBP Calls</p>
                      <p className="text-white font-bold text-lg">{gbp?.calls ?? '--'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
