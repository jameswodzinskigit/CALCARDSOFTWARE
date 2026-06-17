import MobileLayout from '@/components/layout/MobileLayout'
import { ToastProvider } from '@/context/ToastContext'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import React from 'react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select(
        'company_id, role, companies(name, logo_url, feature_leaderboard, feature_gbp, feature_ads, feature_calls, feature_leads, feature_reports, feature_chat, feature_competitors, feature_social, feature_keywords)'
      ).eq('id', user.id).single()
    : { data: null }

  const companyRaw = Array.isArray(profile?.companies) ? profile?.companies[0] : profile?.companies
  const company = companyRaw as {
    name: string
    logo_url: string | null
    feature_leaderboard: boolean
    feature_gbp: boolean
    feature_ads: boolean
    feature_calls: boolean
    feature_leads: boolean
    feature_reports: boolean
    feature_chat: boolean
    feature_competitors: boolean
    feature_social: boolean
    feature_keywords: boolean
  } | null

  const companyName = company?.name || 'Dashboard'
  const logoUrl = company?.logo_url || null

  // Fetch company theme color
  let primaryColor = '#22c55e'
  if (profile?.company_id) {
    const admin = await createAdminClient()
    const { data: theme } = await admin
      .from('company_themes')
      .select('primary_color')
      .eq('company_id', profile.company_id)
      .single()
    if (theme?.primary_color) primaryColor = theme.primary_color
  }

  const themeStyle = { '--brand-primary': primaryColor } as React.CSSProperties

  const reputationItems = [
    { href: '/dashboard/reviews', label: 'Reviews', icon: '&#11088;' },
    { href: '/dashboard/employees', label: 'Employees', icon: '&#128101;' },
    { href: '/dashboard/activity', label: 'Field Activity', icon: '&#128242;' },
    ...(company?.feature_leaderboard !== false ? [{ href: '/dashboard/leaderboard', label: 'Leaderboard', icon: '&#127942;' }] : []),
  ]

  const marketingItems = [
    ...(company?.feature_gbp ? [{ href: '/dashboard/marketing/gbp', label: 'Google Business', icon: '&#128205;' }] : []),
    ...(company?.feature_ads ? [{ href: '/dashboard/marketing/ads', label: 'Ads', icon: '&#127919;' }] : []),
    ...(company?.feature_social ? [{ href: '/dashboard/marketing/social', label: 'Social Media', icon: '&#128247;' }] : []),
    ...(company?.feature_competitors ? [{ href: '/dashboard/marketing/competitors', label: 'Competitors', icon: '&#128202;' }] : []),
  ]

  const customerItems = [
    ...(company?.feature_leads ? [{ href: '/dashboard/customers/leads', label: 'Leads', icon: '&#128100;' }] : []),
    ...(company?.feature_calls ? [{ href: '/dashboard/customers/calls', label: 'Calls', icon: '&#128222;' }] : []),
  ]

  const sections = [
    {
      items: [
        { href: '/dashboard', label: 'Overview', icon: '&#128202;', exact: true },
        { href: '/dashboard/goals', label: 'Goals', icon: '&#127919;' },
      ],
    },
    {
      label: 'Reputation',
      items: reputationItems,
    },
    ...(marketingItems.length > 0 ? [{ label: 'Marketing', items: marketingItems }] : []),
    ...(customerItems.length > 0 ? [{ label: 'Customers', items: customerItems }] : []),
    ...(company?.feature_reports ? [{ label: 'Reports', items: [{ href: '/dashboard/reports', label: 'Monthly Reports', icon: '&#128196;' }] }] : []),
    ...(company?.feature_chat ? [{ label: 'Support', items: [{ href: '/dashboard/chat', label: 'CAL Chat', icon: '&#128172;' }] }] : []),
    {
      label: 'Settings',
      items: [
        { href: '/dashboard/settings', label: 'Settings', icon: '&#9881;' },
      ],
    },
  ]

  return (
    <div style={themeStyle}>
      <ToastProvider>
        <MobileLayout
          sections={sections}
          title={companyName}
          subtitle="CAL OS"
          logoUrl={logoUrl}
          primaryColor={primaryColor}
        >
          {children}
        </MobileLayout>
      </ToastProvider>
    </div>
  )
}
