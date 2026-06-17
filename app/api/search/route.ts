import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q') || ''
  if (!q.trim()) return NextResponse.json({ reviews: [], employees: [] })

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()
    if (!profile?.company_id) return NextResponse.json({ reviews: [], employees: [] })

    const admin = await createAdminClient()
    const companyId = profile.company_id

    const [{ data: reviewRows }, { data: employeeRows }] = await Promise.all([
      admin
        .from('reviews')
        .select('id, reviewer_name, body, rating, reviewed_at')
        .eq('company_id', companyId)
        .or(`reviewer_name.ilike.%${q}%,body.ilike.%${q}%`)
        .order('reviewed_at', { ascending: false })
        .limit(5),
      admin
        .from('profiles')
        .select('id, first_name, last_name, position')
        .eq('company_id', companyId)
        .eq('role', 'employee')
        .or(`first_name.ilike.%${q}%,last_name.ilike.%${q}%`)
        .limit(5),
    ])

    const reviews = (reviewRows || []).map((r: any) => ({
      id: 'r-' + r.id,
      type: 'review',
      title: r.reviewer_name || 'Anonymous',
      subtitle: r.body ? r.body.slice(0, 60) + (r.body.length > 60 ? '…' : '') : ('⭐'.repeat(r.rating || 5)),
      href: '/dashboard/reviews',
    }))

    const employees = (employeeRows || []).map((e: any) => ({
      id: 'e-' + e.id,
      type: 'employee',
      title: [e.first_name, e.last_name].filter(Boolean).join(' '),
      subtitle: e.position || 'Employee',
      href: '/dashboard/employees/' + e.id,
    }))

    return NextResponse.json({ reviews, employees })
  } catch {
    return NextResponse.json({ reviews: [], employees: [] })
  }
}
