import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/utils/supabase/server'
import { formatCustomerId, stripDashes } from '@/lib/google-ads'

export async function POST(request: NextRequest) {
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

  const body = await request.json()
  const { company_id, customer_id, account_name } = body

  if (!company_id || !customer_id) {
    return NextResponse.json({ error: 'company_id and customer_id are required' }, { status: 400 })
  }

  const admin = await createAdminClient()

  // Get current assignment for audit log
  const { data: existing } = await admin
    .from('company_google_ads_assignments')
    .select('customer_id, account_name')
    .eq('company_id', company_id)
    .maybeSingle()

  const cleanId = stripDashes(customer_id)

  // Get the manager customer ID
  const { data: connection } = await admin
    .from('google_ads_connections')
    .select('manager_customer_id')
    .eq('status', 'active')
    .order('connected_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Upsert the assignment
  const { error } = await admin.from('company_google_ads_assignments').upsert({
    company_id,
    customer_id: cleanId,
    account_name: account_name || formatCustomerId(cleanId),
    manager_customer_id: connection?.manager_customer_id || null,
    assigned_by: user.id,
    assigned_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }, { onConflict: 'company_id' })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Also enable the ads feature flag on the company
  await admin.from('companies').update({ feature_ads: true }).eq('id', company_id)

  // Audit log
  await admin.from('integration_audit_log').insert({
    action: 'google_ads_assigned',
    actor_id: user.id,
    company_id,
    old_value: existing ? { customer_id: existing.customer_id, account_name: existing.account_name } : null,
    new_value: { customer_id: cleanId, account_name: account_name || formatCustomerId(cleanId) },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(request: NextRequest) {
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

  const { searchParams } = request.nextUrl
  const company_id = searchParams.get('company_id')
  if (!company_id) return NextResponse.json({ error: 'company_id required' }, { status: 400 })

  const admin = await createAdminClient()

  const { data: existing } = await admin
    .from('company_google_ads_assignments')
    .select('customer_id, account_name')
    .eq('company_id', company_id)
    .maybeSingle()

  await admin.from('company_google_ads_assignments').delete().eq('company_id', company_id)
  await admin.from('companies').update({ feature_ads: false }).eq('id', company_id)

  await admin.from('integration_audit_log').insert({
    action: 'google_ads_unassigned',
    actor_id: user.id,
    company_id,
    old_value: existing ? { customer_id: existing.customer_id, account_name: existing.account_name } : null,
  })

  return NextResponse.json({ success: true })
}
