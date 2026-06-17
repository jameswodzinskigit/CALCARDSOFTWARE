import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'
import { getCampaignStats, refreshAccessToken } from '@/lib/google-ads'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return NextResponse.json({ error: 'No company' }, { status: 403 })

  const admin = await createAdminClient()
  const companyId = profile.company_id

  // Verify role — owner, company_admin, super_admin only
  if (!['super_admin', 'owner', 'company_admin'].includes(profile.role)) {
    return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
  }

  // For super_admin, allow querying any company via ?company_id=
  const { searchParams } = request.nextUrl
  const targetCompanyId = profile.role === 'super_admin'
    ? (searchParams.get('company_id') || companyId)
    : companyId

  const dateRange = (searchParams.get('range') || 'LAST_30_DAYS') as
    'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'LAST_MONTH'

  // Get the company's Google Ads assignment
  const { data: assignment } = await admin
    .from('company_google_ads_assignments')
    .select('customer_id, account_name, manager_customer_id')
    .eq('company_id', targetCompanyId)
    .maybeSingle()

  if (!assignment) {
    return NextResponse.json({
      error: 'No Google Ads account assigned to this company.',
      no_assignment: true,
    }, { status: 404 })
  }

  // Get active connection
  const { data: connection } = await admin
    .from('google_ads_connections')
    .select('*')
    .eq('status', 'active')
    .order('connected_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!connection) {
    return NextResponse.json({
      error: 'Google Ads connection needs to be reauthorized by CAL Marketing.',
      needs_reconnect: true,
    }, { status: 401 })
  }

  // Refresh token if needed
  let accessToken = connection.access_token
  const expiry = connection.token_expiry ? new Date(connection.token_expiry) : null
  if (!expiry || expiry < new Date(Date.now() + 60_000)) {
    try {
      const refreshed = await refreshAccessToken(connection.refresh_token)
      accessToken = refreshed.access_token
      await admin.from('google_ads_connections').update({
        access_token: refreshed.access_token,
        token_expiry: refreshed.expiry.toISOString(),
      }).eq('id', connection.id)
    } catch {
      await admin.from('google_ads_connections').update({ status: 'expired' }).eq('id', connection.id)
      return NextResponse.json({
        error: 'Google Ads connection needs to be reauthorized by CAL Marketing.',
        needs_reconnect: true,
      }, { status: 401 })
    }
  }

  const mccId = assignment.manager_customer_id || connection.manager_customer_id

  // Fetch live campaign data
  try {
    const campaigns = await getCampaignStats(
      accessToken,
      assignment.customer_id,
      mccId,
      dateRange
    )

    // Cache to DB for historical reference
    const now = new Date()
    const periodEnd = now.toISOString().split('T')[0]
    const periodStart = dateRange === 'LAST_7_DAYS'
      ? new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0]
      : dateRange === 'LAST_30_DAYS'
      ? new Date(now.getTime() - 30 * 86400000).toISOString().split('T')[0]
      : new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0]

    for (const c of campaigns) {
      await admin.from('google_ads_campaign_stats').upsert({
        company_id: targetCompanyId,
        customer_id: assignment.customer_id,
        campaign_id: c.campaign_id,
        campaign_name: c.campaign_name,
        campaign_status: c.campaign_status,
        campaign_type: c.campaign_type,
        period_start: periodStart,
        period_end: periodEnd,
        spend: c.spend,
        clicks: c.clicks,
        impressions: c.impressions,
        conversions: c.conversions,
        ctr: c.ctr,
        avg_cpc: c.avg_cpc,
        cost_per_conversion: c.cost_per_conversion,
        conversion_rate: c.conversion_rate,
        budget_micros: c.budget_micros,
        synced_at: new Date().toISOString(),
      }, { onConflict: 'company_id,campaign_id,period_start,period_end' })
    }

    return NextResponse.json({
      account_name: assignment.account_name,
      customer_id: assignment.customer_id,
      date_range: dateRange,
      campaigns,
    })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Unknown error'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
