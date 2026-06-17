import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getActiveCompanyId } from '@/utils/active-company'
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

  const companyId = await getActiveCompanyId(profile?.company_id, profile?.role)
  if (!companyId) redirect('/login')

  const admin = await createAdminClient()

  // When viewing as another company, fetch that company's data directly
  let company: {
    name: string; logo_url: string | null; google_place_id: string | null
    owner_email: string | null; feature_leaderboard: boolean; feature_gbp: boolean
    feature_ads: boolean; feature_calls: boolean; feature_leads: boolean
    feature_reports: boolean; feature_chat: boolean
  } | null = null

  if (companyId !== profile?.company_id) {
    const { data: co } = await admin.from('companies').select('name, logo_url, google_place_id, owner_email, feature_leaderboard, feature_gbp, feature_ads, feature_calls, feature_leads, feature_reports, feature_chat').eq('id', companyId).single()
    company = co
  } else {
    const companyRaw = Array.isArray(profile?.companies) ? profile?.companies[0] : profile?.companies
    company = companyRaw as typeof company
  }
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
    admin.from('profiles').select('id, first_name, cards(slug, status)').eq('company_id', companyId).eq('role', 'employee').order('first_name').limit(20