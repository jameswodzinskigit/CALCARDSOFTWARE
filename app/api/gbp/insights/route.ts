import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lujdnxyfwmaegszcwcqq.supabase.co'
function getSupabase() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

// POST: receive GBP metrics (called from scheduled task / Zapier)
// Body: { company_id: string, date: string (YYYY-MM-DD), metrics: { views, search_impressions, calls, website_clicks, direction_requests } }
export async function POST(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== 'Bearer ' + process.env.DIGEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { company_id, date, metrics } = body

  if (!company_id || !date || !metrics) {
    return NextResponse.json({ error: 'Missing required fields: company_id, date, metrics' }, { status: 400 })
  }

  const supabase = getSupabase()
  const rows = Object.entries(metrics).map(([metric_name, metric_value]) => ({
    company_id,
    date,
    metric_name,
    metric_value: metric_value as number,
  }))

  const { error } = await supabase
    .from('gbp_insights')
    .upsert(rows, { onConflict: 'company_id,date,metric_name' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, inserted: rows.length })
}

// GET: retrieve last 30 days of GBP insights for a company
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== 'Bearer ' + process.env.DIGEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const company_id = searchParams.get('company_id')
  if (!company_id) return NextResponse.json({ error: 'Missing company_id' }, { status: 400 })

  const supabase = getSupabase()
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('gbp_insights')
    .select('date, metric_name, metric_value')
    .eq('company_id', company_id)
    .gte('date', thirtyDaysAgo)
    .order('date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
    }
