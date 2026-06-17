import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ThemePicker from './ThemePicker'
import GoalSetter from '@/components/dashboard/GoalSetter'
import ImageUploader from '@/components/dashboard/ImageUploader'
import { getActiveCompanyId } from '@/utils/active-company'

export default async function SettingsPage() {
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
  const [{ data: company }, { data: theme }, { data: goalData }] = await Promise.all([
    admin.from('companies')
      .select('name, google_place_id, owner_email, logo_url, feature_leaderboard, feature_gbp, feature_ads, feature_calls, feature_leads, feature_reports, feature_chat, feature_competitors, feature_social, feature_keywords')
      .eq('id', companyId)
      .single(),
    admin.from('company_themes')
      .select('primary_color')
      .eq('company_id', companyId)
      .single(),
    admin.from('review_goals')
      .select('monthly_target')
      .eq('company_id', companyId)
      .maybeSingle(),
  ])

  const isAdmin = profile?.role === 'company_admin' || profile?.role === 'owner' || profile?.role === 'super_admin'
  const currentColor = theme?.primary_color || '#22c55e'

  const flags = [
    { key: 'feature_leaderboard', label: 'Leaderboard' },
    { key: 'feature_gbp', label: 'Google Business Profile' },
    { key: 'feature_ads', label: 'Ads Dashboard' },
    { key: 'feature_keywords', label: 'Keyword Performance' },
    { key: 'feature_social', label: 'Social Media' },
    { key: 'feature_competitors', label: 'Competitor Tracker' },
    { key: 'feature_calls', label: 'Calls Tracking' },
    { key: 'feature_leads', label: 'Leads Tracking' },
    { key: 'feature_reports', label: 'Monthly Reports' },
    { key: 'feature_chat', label: 'CAL Chat' },
  ]

  return (
    <div className="space-y-6 max-w-2xl page-fade-in">
      <div>
        <h1 className="text-white font-bold text-xl">Settings</h1>
        <p className="text-gray-500 text-sm mt-0.5">Company configuration</p>
      </div>

      {/* Company Info */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold text-sm">Company Info</h2>
        <div className="grid gap-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-800">
            <span className="text-gray-400 text-sm">Company Name</span>
            <span className="text-white text-sm font-medium">{company?.name || '--'}</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-800">
            <span className="text-gray-400 text-sm">Google Place ID</span>
            <span className="text-white text-sm font-mono text-xs">{company?.google_place_id || 'Not set'}</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-gray-400 text-sm">Owner Email</span>
            <span className="text-white text-sm">{company?.owner_email || 'Not set'}</span>
          </di