import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AdsClient from './AdsClient'

export default async function AdsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role, companies(feature_ads)')
    .eq('id', user.id)
    .single()

  const companyRaw = Array.isArray(profile?.companies) ? profile?.companies[0] : profile?.companies
  const company = companyRaw as { feature_ads: boolean } | null
  if (!profile?.company_id || !company?.feature_ads) redirect('/dashboard')

  const admin = await createAdminClient()
  const companyId = profile.company_id
  const isSuperAdmin = profile.role === 'super_admin'

  const now = new Date()
  const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01'

  const [{ data: stats }, { data: keywords }, { data: memos }] = await Promise.all([
    admin.from('ad_stats').select('*').eq('company_id', companyId).order('month', { ascending: false }).limit(12),
    admin.from('ad_keywords').select('*').eq('company_id', companyId).order('impressions', { ascending: false }).limit(100),
    admin.from('admin_memos').select('*').eq('company_id', companyId).eq('section', 'ads').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
  ])

  return (
    <AdsClient
      stats={(stats || []) as any}
      keywords={(keywords || []) as any}
      memos={(memos || []) as any}
      companyId={companyId}
      isSuperAdmin={isSuperAdmin}
      currentMonth={currentMonth}
    />
  )
}
