import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import GoalSetter from '@/components/dashboard/GoalSetter'

function ProgressRing({ pct, color = '#22c55e', size = 120 }: { pct: number; color?: string; size?: number }) {
  const clamped = Math.min(100, Math.max(0, pct))
  const deg = Math.round((clamped / 100) * 360)
  const inner = size - 24
  return (
    <div className="relative flex items-center justify-center flex-shrink-0" style={{ width: size, height: size }}>
      <div
        className="rounded-full"
        style={{
          width: size,
          height: size,
          background: `conic-gradient(${color} ${deg}deg, #1f2937 ${deg}deg)`,
        }}
      />
      <div
        className="absolute rounded-full bg-gray-900 flex flex-col items-center justify-center"
        style={{ width: inner, height: inner }}
      >
        <span className="text-white font-bold text-xl">{clamped}%</span>
      </div>
    </div>
  )
}

function GrowthBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-gray-600 text-xs">No prior data</span>
  const up = pct >= 0
  return (
    <span className={up ? 'text-green-400 text-xs font-semibold' : 'text-red-400 text-xs font-semibold'}>
      {up ? '▲' : '▼'} {up ? '+' : ''}{pct}% vs last month
    </span>
  )
}

export default async function GoalsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role, companies(name, feature_ads, feature_gbp)')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) redirect('/login')

  const companyRaw = Array.isArray(profile.companies) ? profile.companies[0] : profile.companies
  const company = companyRaw as { name: string; feature_ads: boolean; feature_gbp: boolean } | null
  const isAdmin = ['super_admin', 'company_admin', 'owner'].includes(profile.role)

  const admin = await createAdminClient()
  const companyId = profile.company_id

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString()
  const prevMonthEnd = monthStart
  const monthStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01'
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const prevMonthStr = prevDate.getFullYear() + '-' + String(prevDate.getMonth() + 1).padStart(2, '0') + '-01'

  const [
    { count: monthReviews },
    { count: prevMonthReviews },
    { data: goalRow },
    { data: adRow },
    { data: prevAdRow },
    { data: gbpRow },
    { data: prevGbpRow },
  ] = await Promise.all([
    admin.from('reviews').select('*', { count: 'exact', head: true }).eq('company_id', companyId).gte('created_at', monthStart),
    admin.from('reviews').select('*', { count: 'exact', head: true }).eq('company_id', companyId).gte('created_at', prevMonthStart).lt('created_at', prevMonthEnd),
    admin.from('review_goals').select('monthly_target').eq('company_id', companyId).maybeSingle(),
    company?.feature_ads
      ? admin.from('ad_stats').select('leads').eq('company_id', companyId).eq('month', monthStr).maybeSingle()
      : Promise.resolve({ data: null }),
    company?.feature_ads
      ? admin.from('ad_stats').select('leads').eq('company_id', companyId).eq('month', prevMonthStr).maybeSingle()
      : Promise.resolve({ data: null }),
    company?.feature_gbp
      ? admin.from('gbp_stats').select('website_clicks').eq('company_id', companyId).eq('month', monthStr).maybeSingle()
      : Promise.resolve({ data: null }),
    company?.feature_gbp
      ? admin.from('gbp_stats').select('website_clicks').eq('company_id', companyId).eq('month', prevMonthStr).maybeSingle()
      : Promise.resolve({ data: null }),
  ])

  const reviewTarget = goalRow?.monthly_target || 20
  const curReviews = monthReviews || 0
  const prevReviews = prevMonthReviews || 0
  const reviewPct = Math.min(100, Math.round((curReviews / reviewTarget) * 100))
  const reviewGrowth = prevReviews > 0 ? Math.round(((curReviews - prevReviews) / prevReviews) * 100) : null

  const adData = adRow as { leads: number } | null
  const prevAdData = prevAdRow as { leads: number } | null
  const leadTarget = 100
  const curLeads = adData?.leads || 0
  const prevLeads = prevAdData?.leads || 0
  const leadPct = Math.min(100, Math.round((curLeads / leadTarget) * 100))
  const leadGrowth = prevLeads > 0 ? Math.round(((curLeads - prevLeads) / prevLeads) * 100) : null

  const gbpData = gbpRow as { website_clicks: number } | null
  const prevGbpData = prevGbpRow as { website_clicks: number } | null
  const trafficTarget = 500
  const curTraffic = gbpData?.website_clicks || 0
  const prevTraffic = prevGbpData?.website_clicks || 0
  const trafficPct = Math.min(100, Math.round((curTraffic / trafficTarget) * 100))
  const trafficGrowth = prevTraffic > 0 ? Math.round(((curTraffic - prevTraffic) / prevTraffic) * 100) : null

  const monthName = now.toLocaleString('default', { month: 'long' })

  return (
    <div className="space-y-6 page-fade-in">
      <div>
        <h1 className="text-white font-bold text-xl">Goals</h1>
        <p className="text-gray-500 text-sm mt-0.5">{monthName} {now.getFullYear()} targets</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Review Goal */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
          <div>
            <h2 className="text-white font-semibold">⭐ Review Goal</h2>
            <p className="text-gray-500 text-xs mt-0.5">Monthly Google reviews target</p>
          </div>
          <div className="flex justify-center">
            <ProgressRing pct={reviewPct} color="var(--brand-primary)" />
          </div>
          <div className="text-center space-y-1">
            <p>
              <span className="text-3xl font-bold text-green-400">{curReviews}</span>
              <span className="text-gray-500 text-lg"> / {reviewTarget}</span>
            </p>
            <GrowthBadge pct={reviewGrowth} />
          </div>
          {isAdmin && (
            <div className="border-t border-gray-800 pt-4">
              <p className="text-gray-500 text-xs mb-2">Adjust monthly target</p>
              <GoalSetter companyId={companyId} currentTarget={reviewTarget} />
            </div>
          )}
        </div>

        {/* Lead Goal */}
        {company?.feature_ads && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-white font-semibold">📊 Lead Goal</h2>
              <p className="text-gray-500 text-xs mt-0.5">Monthly leads from ads</p>
            </div>
            <div className="flex justify-center">
              <ProgressRing pct={leadPct} color="#3b82f6" />
            </div>
            <div className="text-center space-y-1">
              <p>
                <span className="text-3xl font-bold text-blue-400">{curLeads}</span>
                <span className="text-gray-500 text-lg"> / {leadTarget}</span>
              </p>
              <GrowthBadge pct={leadGrowth} />
            </div>
          </div>
        )}

        {/* Traffic Goal */}
        {company?.feature_gbp && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 space-y-5">
            <div>
              <h2 className="text-white font-semibold">🌐 Traffic Goal</h2>
              <p className="text-gray-500 text-xs mt-0.5">Monthly website clicks via GBP</p>
            </div>
            <div className="flex justify-center">
              <ProgressRing pct={trafficPct} color="#8b5cf6" />
            </div>
            <div className="text-center space-y-1">
              <p>
                <span className="text-3xl font-bold text-purple-400">{curTraffic.toLocaleString()}</span>
                <span className="text-gray-500 text-lg"> / {trafficTarget.toLocaleString()}</span>
              </p>
              <GrowthBadge pct={trafficGrowth} />
            </div>
          </div>
        )}
      </div>

      {/* Tips */}
      {curReviews < reviewTarget && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold text-sm mb-3">💡 Getting to Your Goal</h2>
          <div className="space-y-2 text-sm text-gray-400">
            {reviewTarget - curReviews > 0 && (
              <p>• You need <span className="text-white font-semibold">{reviewTarget - curReviews} more reviews</span> this month to hit your target.</p>
            )}
            <p>• Make sure every technician taps their NFC card after every job.</p>
            <p>• Focus on jobs where customers seem satisfied — those are your best review opportunities.</p>
          </div>
        </div>
      )}
    </div>
  )
}
