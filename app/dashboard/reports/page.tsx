import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import PrintButton from './PrintButton'
import { getActiveCompanyId } from '@/utils/active-company'

export default async function ReportsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  const companyId = await getActiveCompanyId(profile?.company_id, profile?.role)
  if (!companyId) redirect('/dashboard')

  const admin = await createAdminClient()
  const { data: coData } = await admin.from('companies').select('name, feature_reports, feature_ads, feature_gbp').eq('id', companyId).single()
  const company = coData as { name: string; feature_reports: boolean; feature_ads: boolean; feature_gbp: boolean } | null
  if (!company?.feature_reports) redirect('/dashboard')
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
    recs.push(`Website clicks from GBP dr