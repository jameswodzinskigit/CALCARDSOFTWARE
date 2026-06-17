import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SocialClient from './SocialClient'

export default async function SocialPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role, companies(feature_social, name)')
    .eq('id', user.id)
    .single()

  const companyRaw = Array.isArray(profile?.companies) ? profile?.companies[0] : profile?.companies
  const company = companyRaw as { feature_social: boolean; name: string } | null
  if (!profile?.company_id || !company?.feature_social) redirect('/dashboard')

  const admin = await createAdminClient()
  const isSuperAdmin = profile.role === 'super_admin'

  const [{ data: stats }, { data: memos }] = await Promise.all([
    admin.from('social_stats').select('*').eq('company_id', profile.company_id).order('month', { ascending: false }).limit(48),
    admin.from('admin_memos').select('*').eq('company_id', profile.company_id).eq('section', 'social').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
  ])

  const now = new Date()
  const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01'

  return (
    <SocialClient
      stats={stats || []}
      memos={memos || []}
      companyId={profile.company_id}
      companyName={company.name}
      isSuperAdmin={isSuperAdmin}
      currentMonth={currentMonth}
    />
  )
}
