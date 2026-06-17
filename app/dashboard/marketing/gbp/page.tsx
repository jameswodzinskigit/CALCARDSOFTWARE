import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import GbpClient from './GbpClient'
import SetupBanner from '@/components/ui/SetupBanner'
import { getActiveCompanyId } from '@/utils/active-company'

export default async function GbpPage() {
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
  const { data: coData } = await admin.from('companies').select('feature_gbp, google_place_id').eq('id', companyId).single()
  const company = coData as { feature_gbp: boolean; google_place_id: string | null } | null
  const isSuperAdmin = profile?.role === 'super_admin'
  const hasPlaceId = !!company?.google_place_id

  // Show setup banner if GBP not enabled (super admin bypasses the place_id check)
  if (!company?.feature_gbp) {
    