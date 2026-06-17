import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const companyId = searchParams.get('company_id')
  const period = searchParams.get('period') || 'monthly'

  if (!companyId) return NextResponse.json({ error: 'company_id required' }, { status: 400 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const now = new Date()
  let since: string
  if (period === 'daily') since = new Date(now.setHours(0,0,0,0)).toISOString()
  else if (period === 'weekly') since = new Date(now.setDate(now.getDate() - 7)).toISOString()
  else if (period === 'monthly') since = new Date(now.setDate(1)).toISOString()
  else since = new Date(0).toISOString()

  const { data } = await supabase
    .from('reviews')
    .select('employee_id, profiles(first_name, last_name)')
    .eq('company_id', companyId)
    .gte('created_at', since)

  const counts: Record<string, { name: string; count: number }> = {}
  if (data) {
    for (const r of data) {
      if (!r.employee_id) continue
      const p = (Array.isArray(r.profiles) ? r.profiles[0] : r.profiles) as { first_name: string; last_name: string } | null
      if (!counts[r.employee_id]) counts[r.employee_id] = { name: `${p?.first_name} ${p?.last_name}`.trim(), count: 0 }
      counts[r.employee_id].count++
    }
  }

  const leaderboard = Object.entries(counts)
    .map(([id, v]) => ({ employee_id: id, name: v.name, review_count: v.count }))
    .sort((a, b) => b.review_count - a.review_count)
    .map((e, i) => ({ ...e, rank: i + 1 }))

  return NextResponse.json({ leaderboard, period })
}
