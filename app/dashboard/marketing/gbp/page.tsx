import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import GbpClient from './GbpClient'

export default async function GbpPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role, companies(feature_gbp)')
    .eq('id', user.id)
    .single()

  const companyRaw = Array.isArray(profile?.companies) ? profile?.companies[0] : profile?.companies
  const company = companyRaw as { feature_gbp: boolean } | null
  if (!profile?.company_id || !company?.feature_gbp) redirect('/dashboard')

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
