import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import CompetitorsClient from './CompetitorsClient'
import { getActiveCompanyId } from '@/utils/active-company'

export default async function CompetitorsPage() {
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
  const isSuperAdmin = profile?.role === 'super_admin'

  const { data: company } = await admin
    .from('companies')
    .select('id, name, google_review_count, google_star_rating, feature_competitors')
    .eq('id', companyId)
    .single()

  if (!company?.feature_competitors) redirect('/dashboard')

  const { data: snapshots } = await admin
    .from('competitor_snapshots')
    .select('competitor_name, star_rating, review_count, snapshot_date, google_place_id')
    .eq('company_id', companyId)
    .order('snapshot_date', { ascending: false })

  const seen = new Set<string>()
  const latestSnapshots: {
    competitor_name: string
    star_rating: number | null
    review_count: number | null
    snapshot_date: string
    google_place_id: string | null
  }[] = []

  for (const s of snapshots ?? []) {
    if (!seen.has(s.competitor_name)) {
      seen.add(s.competitor_name)
      latestSnapshots.push(s)
    }
  }

  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [{ data: history }, { data: memos }] = await Promise.all([
    admin
      .from('competitor_snapshots')
      .select('competitor_name, review_count, snapshot_date')
      .eq('company_id', companyId)
      .gte('snapshot_date', thirtyDaysAgo.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true }),
    admin
      .from('admin_memos')
      .select('*')
      .eq('company_id', companyId)
      .eq('section', 'competitors')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false }),
  ])

  return (
    <CompetitorsClient
      company={{
        name: company.name,
        review_count: company.google_review_count ?? 0,
        star_rating: Number(company.google_star_rating ?? 0),
      }}
      competitors={latestSnapshots.map(s => ({
        name: s.competitor_name