import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AdsClient from './AdsClient'
import SetupBanner from '@/components/ui/SetupBanner'
import { getActiveCompanyId } from '@/utils/active-company'

export default async function AdsPage() {
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
  const { data: coData } = await admin.from('companies').select('feature_ads').eq('id', companyId).single()
  const company = coData as { feature_ads: boolean } | null
  const isSuperAdmin = profile?.role === 'super_admin'

  // Show setup banner if Ads not yet activated
  if (!company?.feature_ads) {
    return (
      <div className="space-y-6 page-fade-in">
        <div>
          <h1 className="text-white font-bold text-xl">Google 