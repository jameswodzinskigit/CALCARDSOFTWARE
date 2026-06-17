import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/admin/memos?company_id=xxx&section=ads
export async function GET(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'No profile' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const section = searchParams.get('section') || null
  const reqCompanyId = searchParams.get('company_id')
  const companyId = profile.role === 'super_admin' ? (reqCompanyId || null) : profile.company_id

  if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

  const admin = await createAdminClient()
  let query = admin
    .from('admin_memos')
    .select('*')
    .eq('company_id', companyId)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false })

  if (section) query = query.eq('section', section)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/admin/memos
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id, first_name, last_name')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { company_id, section, memo_body, is_pinned } = body

  if (!company_id || !memo_body?.trim()) {
    return NextResponse.json({ error: 'company_id and memo_body required' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { data, error } = await admin.from('admin_memos').insert({
    company_id,
    section: section || 'general',
    body: memo_body.trim(),
    author_name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'CAL Team',
    is_pinned: !!is_pinned,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// PATCH /api/admin/memos?id=xxx
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const body = await request.json()
  const admin = await createAdminClient()
  const { error } = await admin.from('admin_memos').update({
    body: body.memo_body ?? undefined,
    is_pinned: body.is_pinned ?? undefined,
    updated_at: new Date().toISOString(),
  }).eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

// DELETE /api/admin/memos?id=xxx
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
  const { error } = await admin.from('admin_memos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
