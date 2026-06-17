import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/server'
import { exchangeCodeForTokens, listAccessibleCustomers } from '@/lib/google-ads'

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || ''
  const adminUrl = `${appUrl}/admin/integrations/google-ads`

  if (error) {
    return NextResponse.redirect(`${adminUrl}?error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    return NextResponse.redirect(`${adminUrl}?error=missing_params`)
  }

  // Decode state
  let uid: string
  try {
    const decoded = JSON.parse(Buffer.from(state, 'base64').toString())
    uid = decoded.uid
  } catch {
    return NextResponse.redirect(`${adminUrl}?error=invalid_state`)
  }

  const admin = await createAdminClient()

  // Verify user is super_admin
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', uid)
    .single()

  if (profile?.role !== 'super_admin') {
    return NextResponse.redirect(`${adminUrl}?error=forbidden`)
  }

  // Exchange code for tokens
  let tokens: { access_token: string; refresh_token: string; expires_in: number }
  try {
    tokens = await exchangeCodeForTokens(code)
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'token_exchange_failed'
    return NextResponse.redirect(`${adminUrl}?error=${encodeURIComponent(msg)}`)
  }

  if (!tokens.refresh_token) {
    return NextResponse.redirect(`${adminUrl}?error=no_refresh_token`)
  }

  // Get accessible customer list to find the manager account
  let resourceNames: string[] = []
  try {
    resourceNames = await listAccessibleCustomers(tokens.access_token)
  } catch {
    // Not fatal — we can still save the connection
  }

  // Extract manager customer ID (first one, typically the MCC)
  const managerCustomerId = resourceNames.length > 0
    ? resourceNames[0].replace('customers/', '')
    : 'unknown'

  // Delete old connection and save new one
  await admin.from('google_ads_connections').delete().neq('id', '00000000-0000-0000-0000-000000000000')
  await admin.from('google_ads_connections').insert({
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    token_expiry: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
    manager_customer_id: managerCustomerId,
    connected_by: uid,
    status: 'active',
  })

  // Audit log
  await admin.from('integration_audit_log').insert({
    action: 'google_ads_connected',
    actor_id: uid,
    new_value: { manager_customer_id: managerCustomerId, resource_count: resourceNames.length },
  })

  return NextResponse.redirect(`${adminUrl}?connected=1`)
}
