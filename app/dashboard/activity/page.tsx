import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getActiveCompanyId } from '@/utils/active-company'

type TapRow = {
  id: string
  tapped_at: string
  device_type: string | null
  city: string | null
  region: string | null
  country: string | null
  profiles: { first_name: string | null } | null
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default async function ActivityPage() {
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

  const now = new Date()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString()

  const [
    { data: recentTaps },
    { count: todayTaps },
    { count: weekTaps },
  ] = await Promise.all([
    admin
      .from('taps')
      .select('id, tapped_at, device_type, city, region, country, profiles:employee_id(first_name)')
      .eq('company_id', companyId)
      .gte('tapped_at', sevenDaysAgo)
      .order('tapped_at', { ascending: false })
      .limit(50),
    admin.from('taps').select('*', { count: 'exact', head: true }).eq('company_id', companyId).gte('tapped_at', today),
    admin.from('taps').select('*', { count: 'exact', head: true }).eq('company_id', companyId).gte('tapped_at', sevenDaysAgo),
  ])

  const taps = (recentTaps || []) as TapRow[]

  // Group by day
  const grouped: Record<string, TapRow[]> = {}
  for (const tap of taps) {
    const dayKey = new Date(tap.tapped_at).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })
    if (!grouped[dayKey]) grouped[dayKey] = []
    grouped[dayKey].push(tap)
  }

  return (
    <div className="space-y-6 page-fade-in">
      <div>
        <h1 className="text-white font-bold text-xl">Field Activity</h1>
        <p className="text-gray-500 text-sm mt-0.5">Live NFC tap feed — last 7 days</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-white font-bold text-xl md:text-2xl">{todayTaps || 0}</p>
          <p className="text-gray-500 text-xs mt-1">Taps Today</p>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
          <p className="text-white font-bold text-xl md:text-2xl">{weekTaps || 0}</p>
          <p className="text-gray-500 text-xs mt-1">Taps This Week</p>
        </div>
      </div>

      {taps.length > 0 ? (
        <div className="space-y-4">
          {Object.entries(grouped).map(([day, dayTaps]) => (
            <div key={day} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-3 border-b border-gray-800 flex items-center justify-between">
                <span className="text-white font-semibold text-sm">{day}</span>
                <span className="text-gray-500 text-xs">{dayTaps.length} tap{dayTaps.length !== 1 ? 's' : ''}</span>
              </div>
              <div className="divide-y divide-gray-800">
                {dayTaps.map(tap => (
                  <div key={tap.id} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{tap.device_type === 'mobile' ? '📱' : '💻'}</span>
                      <div>
                        <p className="text-white text-sm font-medium">
                          {tap.profiles?.first_name || 'Unknown'}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {tap.city && tap.region ? `${tap.city}, ${tap.region}` : 'Location unknown'}
                          {tap.device_type && ` · ${tap.device_type}`}
                        </p>
                      </div>
                    </div>
                    <span className="text-gray-600 text-xs">{timeAgo(tap.tapped_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl">
          <div className="py-16 text-center">
            <p className="text-4xl mb-3">📲</p>
            <p className="text-white font-semibold">No taps in the last 7 days</p>
            <p className="text-gray-500 text-sm mt-1">Technicians tap their NFC card after c