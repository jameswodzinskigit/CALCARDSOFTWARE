import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, companies(name)')
    .eq('id', user.id)
    .single()

  if (!profile?.company_id) return NextResponse.json({ error: 'No company' }, { status: 403 })

  const companyRaw = Array.isArray(profile.companies) ? profile.companies[0] : profile.companies
  const companyName = (companyRaw as { name: string } | null)?.name || 'Company'

  const admin = await createAdminClient()
  const { data: reviews } = await admin
    .from('reviews')
    .select('reviewer_name, rating, body, reviewed_at, attribution_method, profiles:employee_id(first_name)')
    .eq('company_id', profile.company_id)
    .order('reviewed_at', { ascending: false })

  const rows = (reviews || []) as Array<{
    reviewer_name: string | null
    rating: number | null
    body: string | null
    reviewed_at: string
    attribution_method: string | null
    profiles: { first_name: string } | null
  }>

  function escapeCsv(val: string | number | null | undefined): string {
    if (val === null || val === undefined) return ''
    const str = String(val)
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return '"' + str.replace(/"/g, '""') + '"'
    }
    return str
  }

  const header = ['Date', 'Reviewer Name', 'Rating', 'Review Text', 'Attribution', 'Employee'].join(',')
  const lines = rows.map(r => [
    escapeCsv(r.reviewed_at ? new Date(r.reviewed_at).toLocaleDateString() : ''),
    escapeCsv(r.reviewer_name),
    escapeCsv(r.rating),
    escapeCsv(r.body),
    escapeCsv(r.attribution_method),
    escapeCsv(r.profiles?.first_name),
  ].join(','))

  const csv = [header, ...lines].join('\n')
  const filename = `${companyName.replace(/[^a-zA-Z0-9]/g, '_')}_reviews_${new Date().toISOString().slice(0, 10)}.csv`

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
