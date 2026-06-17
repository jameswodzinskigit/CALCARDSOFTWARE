import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return NextResponse.json({ error: 'No company' }, { status: 400 })

  const body = await request.json()
  const { month, spend, clicks, leads, calls } = body

  const admin = await createAdminClient()
  const { error } = await admin
    .from('ad_stats')
    .upsert({
      company_id: profile.company_id,
      month,
      spend: spend || 0,
      clicks: clicks || 0,
      leads: leads || 0,
      calls: calls || 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id,month' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
