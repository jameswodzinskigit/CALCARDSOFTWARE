import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/company/theme?company_id=xxx
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')
  if (!companyId) return NextResponse.json({ primary_color: '#22c55e' })

  const admin = await createAdminClient()
  const { data } = await admin
    .from('company_themes')
    .select('primary_color')
    .eq('company_id', companyId)
    .single()

  return NextResponse.json({ primary_color: data?.primary_color || '#22c55e' })
}

// PUT /api/company/theme
export async function PUT(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  const body = await request.json()
  const { primary_color, company_id: reqCompanyId } = body

  // super_admin can set any company; company_admin can only set their own
  const targetCompanyId = profile?.role === 'super_admin' ? reqCompanyId : profile?.company_id
  if (!targetCompanyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

  const isAllowed = profile?.role === 'super_admin' || (
    profile?.role === 'company_admin' && profile.company_id === targetCompanyId
  )
  if (!isAllowed) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  if (!primary_color || !/^#[0-9a-fA-F]{6}$/.test(primary_color)) {
    return NextResponse.json({ error: 'Invalid color (must be 6-digit hex)' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { error } = await admin.from('company_themes').upsert(
    { company_id: targetCompanyId, primary_color, updated_at: new Date().toISOString() },
    { onConflict: 'company_id' }
  )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, primary_color })
}
