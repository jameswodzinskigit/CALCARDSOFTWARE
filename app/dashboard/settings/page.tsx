import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ThemePicker from './ThemePicker'
import GoalSetter from '@/components/dashboard/GoalSetter'
import ImageUploader from '@/components/dashboard/ImageUploader'

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) redirect('/login')

  const admin = await createAdminClient()
  const [{ data: company }, { data: theme }, { data: goalData }] = await Promise.all([
    admin.from('companies')
      .select('name, google_place_id, owner_email, logo_url, feature_leaderboard, feature_gbp, feature_ads, feature_calls, feature_leads, feature_reports, feature_chat, feature_competitors, feature_social, feature_keywords')
      .eq('id', profile.company_id)
      .single(),
    admin.from('company_themes')
      .select('primary_color')
      .eq('company_id', profile.company_id)
      .single(),
    admin.from('review_goals')
      .select('monthly_target')
      .eq('company_id', profile.company_id)
      .maybeSingle(),
  ])

  const isAdmin = profile.role === 'company_admin' || profile.role === 'owner' || profile.role === 'super_admin'
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
          </div>
        </div>
      </div>

      {/* Company Logo — admin only */}
      {isAdmin && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-white font-semibold text-sm">Company Logo</h2>
            <p className="text-gray-500 text-xs mt-0.5">Appears in the sidebar. Click to upload or replace.</p>
          </div>
          <ImageUploader
            currentUrl={company?.logo_url}
            type="logo"
            id={profile.company_id}
            shape="square"
            size="lg"
            fallbackLabel={company?.name?.[0]?.toUpperCase() || '?'}
          />
        </div>
      )}

      {/* Dashboard Theme */}
      {isAdmin && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
          <div>
            <h2 className="text-white font-semibold text-sm">Dashboard Color</h2>
            <p className="text-gray-500 text-xs mt-0.5">Customize the accent color of your dashboard navigation</p>
          </div>
          <ThemePicker companyId={profile.company_id} initialColor={currentColor} />
        </div>
      )}

      {/* Review Goal — admin only */}
      {isAdmin && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <div>
            <h2 className="text-white font-semibold text-sm">Review Goal</h2>
            <p className="text-gray-500 text-xs mt-0.5">Set your monthly review target to track progress on the overview dashboard.</p>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-800">
            <span className="text-gray-400 text-sm">Monthly target</span>
            <span className="text-green-400 font-bold text-sm">{goalData?.monthly_target ?? 'Not set'}{goalData?.monthly_target ? ' reviews' : ''}</span>
          </div>
          <GoalSetter companyId={profile.company_id} currentTarget={goalData?.monthly_target || 20} />
        </div>
      )}

      {/* Active Features */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-white font-semibold text-sm mb-4">Active Features</h2>
        <div className="space-y-2">
          {flags.map(({ key, label }) => {
            const enabled = !!(company as any)?.[key]
            return (
              <div key={key} className="flex items-center justify-between py-2 border-b border-gray-800 last:border-0">
                <span className="text-gray-300 text-sm">{label}</span>
                <span className={'text-xs px-2 py-1 rounded-full ' + (enabled ? 'bg-green-500/10 text-green-400' : 'bg-gray-800 text-gray-500')}>
                  {enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            )
          })}
        </div>
        <p className="text-gray-600 text-xs mt-4">Contact the CAL team to enable or disable features.</p>
      </div>
    </div>
  )
}
