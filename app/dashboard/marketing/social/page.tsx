import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import SocialClient from './SocialClient'
import { getActiveCompanyId } from '@/utils/active-company'

export default async function SocialPage() {
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
  const { data: coData } = await admin.from('companies').select('feature_social, name').eq('id', companyId).single()
  const company = coData as { feature_social: boolean; name: string } | null
  if (!company?.feature_social) redirect('/dashboard')

  const isSuperAdmin = profile?.role === 'super_admin'

  const [{ data: stats }, { data: memos }] = await Promise.all([
    admin.from('social_stats').select('*').eq('company_id', companyId).order('month', { ascending: false }).limit(48),
    admin.from('admin_memos').select('*').eq('company_id', companyId).eq('section', 'social').order('is_pinned', { ascending: false }).order('created_at', { ascending: false }),
  ])

  const now = new Date()
  const currentMonth = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01'

  return (
    <SocialClient
      stats={stats || []}
      memos={memos || []}
      companyId={companyId}
 