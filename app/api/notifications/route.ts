import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'

// GET /api/notifications — returns last 20 for authenticated user's company
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()
    if (!profile?.company_id) return NextResponse.json({ error: 'No company' }, { status: 400 })

    const admin = await createAdminClient()
    const { data } = await admin
      .from('notifications')
      .select('*')
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })
      .limit(20)

    const unread = (data || []).filter((n: { read: boolean }) => !n.read).length
    return NextResponse.json({ notifications: data || [], unread })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// PATCH /api/notifications — mark one or all as read
export async function PATCH(request: NextRequest) {
  try {
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
    const admin = await createAdminClient()

    if (body.all) {
      await admin
        .from('notifications')
        .update({ read: true })
        .eq('company_id', profile.company_id)
        .eq('read', false)
    } else if (body.id) {
      await admin
        .from('notifications')
        .update({ read: true })
        .eq('id', body.id)
        .eq('company_id', profile.company_id)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST /api/notifications — create a notification (service/admin use)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()
    if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const { company_id, type, title, body, link } = await request.json()
    const admin = await createAdminClient()
    await admin.from('notifications').insert({ company_id, type, title, body, link })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
