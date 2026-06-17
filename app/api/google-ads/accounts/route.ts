import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'
import {
  listAccessibleCustomers,
  getCustomerDetails,
  refreshAccessToken,
  stripDashes,
  formatCustomerId,
} from '@/lib/google-ads'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super admin only' }, { status: 403 })
  }

  const admin = await createAdminClient()

  // Load the stored connection
  const { data: connection } = await admin
    .from('google_ads_connections')
    .select('*')
    .eq('status', 'active')
    .order('connected_at', { ascending: false })
    .limit(1)
    .single()

  if (!connection) {
    return NextResponse.json({ error: 'No Google Ads connection found. Please connect first.' }, { status: 404 })
  }

  // Refresh token if expired
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
    } catch (e) {
      await admin.from('google_ads_connections').update({ status: 'expired' }).eq('id', connection.id)
      return NextResponse.json({ error: 'Token expired. Please reconnect Google Ads.' }, { status: 401 })
    }
  }

  const mccId = connection.manager_customer_id

  // Get list of accessible customer resource names
  let resourceNames: string[] = []
  try {
    resourceNames = await listAccessibleCustomers(accessToken)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to list accounts: ' + (e instanceof Error ? e.message : 'unknown') }, { status: 500 })
  }

  // Fetch details for each customer (skip the MCC itself)
  const customers = []
  for (const name of resourceNames) {
    const rawId = name.replace('customers/', '')
    try {
      const details = await getCustomerDetails(accessToken, rawId, mccId)
      if (details && !details.is_manager) {
        customers.push(details)
      }
    } catch {
      // Skip accounts we can't access
      customers.push({
        id: rawId,
        formatted_id: formatCustomerId(rawId),
        name: `Account ${rawId}`,
        currency_code: 'USD',
        time_zone: 'Unknown',
        status: 'UNKNOWN',
        is_manager: false,
      })
    }
  }

  // Also cache to google_ads_accounts table
  for (const c of customers) {
    await admin.from('google_ads_accounts').upsert({
      customer_id: c.id,
      account_name: c.name,
      currency_code: c.currency_code,
      time_zone: c.time_zone,
      account_status: c.status,
      manager_customer_id: mccId,
      last_synced_at: new Date().toISOString(),
    }, { onConflict: 'customer_id' })
  }

  return NextResponse.json({
    connection: {
      manager_customer_id: mccId,
      connected_at: connection.connected_at,
      status: connection.status,
    },
    accounts: customers,
  })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super admin only' }, { status: 403 })
  }

  const admin = await createAdminClient()
  await admin.from('google_ads_connections').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('integration_audit_log').insert({
    action: 'google_ads_disconnected',
    actor_id: user.id,
  })

  return NextResponse.json({ success: true })
}
