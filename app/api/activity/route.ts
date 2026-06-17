import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'

const PAGE_SIZE = 20

export async function GET(request: NextRequest) {
  try {
    const page = parseInt(request.nextUrl.searchParams.get('page') || '1', 10)
    const offset = (page - 1) * PAGE_SIZE

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()
    if (!profile?.company_id) return NextResponse.json({ items: [], hasMore: false })

    const admin = await createAdminClient()

    const { data, count } = await admin
      .from('notifications')
      .select('id, type, title, body, created_at', { count: 'exact' })
      .eq('company_id', profile.company_id)
      .order('created_at', { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1)

    const items = (data || []).map((n: any) => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      created_at: n.created_at,
    }))

    return NextResponse.json({ items, hasMore: (count || 0) > offset + PAGE_SIZE })
  } catch {
    return NextResponse.json({ items: [], hasMore: false })
  }
}
