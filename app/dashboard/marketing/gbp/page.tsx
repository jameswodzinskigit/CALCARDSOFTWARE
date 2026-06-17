import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import GbpClient from './GbpClient'
import SetupBanner from '@/components/ui/SetupBanner'

export default async function GbpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role, companies(feature_gbp, google_place_id)')
    .eq('id', user.id)
    .single()

  const companyRaw = Array.isArray(profile?.companies) ? profile?.companies[0] : profile?.companies
  const company = companyRaw as { feature_gbp: boolean; google_place_id: string | null } | null
  if (!profile?.company_id) redirect('/dashboard')

  // Show setup banner if GBP not yet configured
  if (!company?.feature_gbp || !company?.google_place_id) {
    return (
      <div className="space-y-6 page-fade-in">
        <div>
          <h1 className="text-white font-bold text-xl">Google Business Profile</h1>
          <p className="text-gray-500 text-sm mt-0.5">GBP performance insights</p>
        </div>
        <SetupBanner
          icon="🗺️"
          title={!company?.google_place_id ? 'Google connection not set up yet' : 'GBP insights coming soon'}
          description={
            !company?.google_place_id
              ? 'Your account manager is finishing your Google Business Profile connection. Once linked, your GBP performance data will appear here.'
              : 'Your Google Business Profile is connected — your account manager will activate this dashboard soon.'
          }
          variant="info"
        />
      </div>
    )
  }

  const admin = await createAdminClient()
  const companyId = profile.company_id
  const isSuperAdmin = profile.role === 'super_admin'

  const now = new Date()
  const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01'

  const [{ data: stats }, { data: memos }] = await Promise.all([
    admin.from('gbp_stats').select('*').eq('company_id', companyId).order('month', { ascending: false }).limit(12),
    admin.from('admin_memos').select('*').eq('company_id', companyId).eq('section', 'gbp').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
  ])

  return (
    <GbpClient
      stats={(stats || []) as any}
      memos={(memos || []) as any}
      companyId={companyId}
      isSuperAdmin={isSuperAdmin}
      currentMonth={currentMonth}
    />
  )
}
