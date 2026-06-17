import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/social-stats?month=YYYY-MM-DD
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
    .from('social_stats')
    .select('*')
    .eq('company_id', profile.company_id)
    .order('month', { ascending: false })

  if (month) query = query.eq('month', month)
  else query = query.limit(48) // 4 platforms × 12 months

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/social-stats — upsert stats for a platform/month
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role, company_id').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { company_id, platform, month, ...stats } = body
  if (!company_id || !platform || !month) {
    return NextResponse.json({ error: 'company_id, platform, month required' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data, error } = await admin
    .from('social_stats')
    .upsert({
      company_id, platform, month,
      followers: stats.followers || 0,
      posts_count: stats.posts_count || 0,
      reach: stats.reach || 0,
      impressions: stats.impressions || 0,
      likes: stats.likes || 0,
      comments: stats.comments || 0,
      shares: stats.shares || 0,
      saves: stats.saves || 0,
      profile_visits: stats.profile_visits || 0,
      website_clicks: stats.website_clicks || 0,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'company_id,platform,month' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
