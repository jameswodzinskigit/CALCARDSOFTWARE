import MobileLayout from '@/components/layout/MobileLayout'
import { ToastProvider } from '@/context/ToastContext'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { getCompanyOverride } from '@/utils/active-company'
import React from 'react'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = user
    ? await supabase.from('profiles').select('company_id, role').eq('id', user.id).single()
    : { data: null }

  const isSuperAdmin = profile?.role === 'super_admin'
  const admin = await createAdminClient()

  // Determine which company to display in the nav
  const override = await getCompanyOverride(profile?.role)
  const activeCompanyId = override || profile?.company_id || null

  let company: {
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
  } | null = null

  let overrideName: string | null = null

  if (activeCompanyId) {
    const { data: co } = await admin
      .from('companies')
      .select('name, logo_url, feature_leaderboard, feature_gbp, feature_ads, feature_calls, feature_leads, feature_reports, feature_chat, feature_competitors, feature_social, feature_keywords')
      .eq('id', activeCompanyId)
      .single()
    if (co) {
      company = co
      if (override) overrideName = co.name
    }
  }

  const companyName = company?.name || 'Dashboard'
  const logoUrl = company?.logo_url || null

  // Fetch company theme color
  let primaryColor = '#3b82f6'
  if (activeCompanyId) {
    const { data: theme } = await admin
      .from('company_themes')
      .select('primary_color')
      .eq('company_id', activeCompanyId)
      .single()
    if (theme?.primary_color) primaryColor = theme.primary_color
  }

  const themeStyle = { '--brand-primary': primaryColor } as React.CSSProperties

  // Super admin always sees all nav items when viewing a company
  const showAll = isSuperAdmin && !!override

  const reputationItems = [
    { href: '/dashboard/reviews', label: 'Reviews', icon: '&#11088;' },
    { href: '/dashboard/employees', label: 'Employees', icon: '&#128101;' },
    { href: '/dashboard/activity', label: 'Field Activity', icon: '&#128242;' },
    ...(showAll || company?.feature_leaderboard !== false ? [{ href: '/dashboard/leaderboard', label: 'Leaderboard', icon: '&#127942;' }] : []),
  ]

  const marketingItems = [
    ...(showAll || company?.feature_gbp ? [{ href: '/dashboard/marketing/gbp', label: 'Google Business', icon: '&#128205;' }] : []),
    ...(showAll || company?.feature_ads ? [{ href: '/dashboard/marketing/ads', label: 'Ads', icon: '&#127919;' }] : []),
    ...(showAll || company?.feature_social ? [{ href: '/dashboard/marketing/social', label: 'Social Media', icon: '&#128247;' }] : []),
    .
