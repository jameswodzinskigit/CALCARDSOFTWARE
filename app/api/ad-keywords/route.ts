import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/ad-keywords?month=YYYY-MM-DD
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('company_id').eq('id', user.id).single()
  if (!profile?.company_id) return NextResponse.json({ error: 'No company' }, { status: 400 })

  const { searchParams } = new URL(request.url)
  const month = searchParams.get('month')

  const admin = await createAdminClient()
  let query = admin
    .from('ad_keywords')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('impressions', { ascending: false })

  if (month) query = query.eq('month', month)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/ad-keywords — upsert one or many keywords
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role, company_id').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  // body can be a single keyword object or array
  const rows = Array.isArray(body) ? body : [body]
  const companyId = rows[0]?.company_id || profile.company_id

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('ad_keywords')
    .upsert(
      rows.map((r: any) => ({
        company_id: r.company_id || companyId,
        keyword: r.keyword,
        match_type: r.match_type || 'broad',
        impressions: r.impressions || 0,
        clicks: r.clicks || 0,
        conversions: r.conversions || 0,
        cost_cents: r.cost_cents || 0,
        avg_cpc_cents: r.avg_cpc_cents || 0,
        quality_score: r.quality_score || null,
        month: r.month,
        updated_at: new Date().toISOString(),
      })),
      { onConflict: 'company_id,keyword,month' }
    )
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// DELETE /api/ad-keywords?id=xxx
export async function DELETE(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const admin = await createAdminClient()
  await admin.from('ad_keywords').delete().eq('id', id)
  return NextResponse.json({ success: true })
}
