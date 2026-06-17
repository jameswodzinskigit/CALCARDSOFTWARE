import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lujdnxyfwmaegszcwcqq.supabase.co'

function getSupabase() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

async function findEmployeeByTap(
  supabase: ReturnType<typeof getSupabase>,
  companyId: string,
  windowHours: number
): Promise<{ employeeId: string; method: string } | null> {
  const since = new Date(Date.now() - windowHours * 60 * 60 * 1000).toISOString()
  const { data: taps } = await supabase
    .from('taps')
    .select('employee_id, tapped_at')
    .eq('company_id', companyId)
    .gte('tapped_at', since)
    .order('tapped_at', { ascending: false })
    .limit(1)

  if (taps && taps.length > 0 && taps[0].employee_id) {
    return {
      employeeId: taps[0].employee_id,
      method: `tap_${windowHours}hr`,
    }
  }
  return null
}

async function findEmployeeByName(
  supabase: ReturnType<typeof getSupabase>,
  companyId: string,
  reviewText: string
): Promise<{ employeeId: string; method: string } | null> {
  const { data: employees } = await supabase
    .from('profiles')
    .select('id, first_name')
    .eq('company_id', companyId)
    .in('role', ['employee', 'company_admin'])

  if (!employees) return null

  const lower = reviewText.toLowerCase()
  for (const emp of employees) {
    if (emp.first_name && lower.includes(emp.first_name.toLowerCase())) {
      return { employeeId: emp.id, method: 'name_match' }
    }
  }
  return null
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      reviewer_name,
      rating,
      review_text,
      google_review_id,
      company_slug,
    } = body

    const supabase = getSupabase()

    const { data: company } = await supabase
      .from('companies')
      .select('id')
      .eq('slug', company_slug || 'unitedsewerseptic')
      .single()

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    if (google_review_id) {
      const { data: existing } = await supabase
        .from('reviews')
        .select('id')
        .eq('google_review_id', google_review_id)
        .single()
      if (existing) {
        return NextResponse.json({ success: true, duplicate: true, review_id: existing.id })
      }
    }

    let attribution: { employeeId: string; method: string } | null = null

    attribution = await findEmployeeByTap(supabase, company.id, 1)
    if (!attribution) {
      attribution = await findEmployeeByTap(supabase, company.id, 2)
    }
    if (!attribution && review_text) {
      attribution = await findEmployeeByName(supabase, company.id, review_text)
    }

    const { data: review } = await supabase
      .from('reviews')
      .insert({
        company_id: company.id,
        employee_id: attribution?.employeeId ?? null,
        attribution_method: attribution?.method ?? null,
        reviewer_name,
        rating: parseInt(rating) || 5,
        body: review_text,
        google_review_id: google_review_id ?? null,
        source: 'google',
        verified: true,
      })
      .select()
      .single()

    if (attribution?.employeeId && review) {
      const { count } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true })
        .eq('employee_id', attribution.employeeId)

      const milestones = [1, 5, 10, 25, 50, 100]
      for (const milestone of milestones) {
        if (count === milestone) {
          await supabase.from('badges').insert({
            employee_id: attribution.employeeId,
            badge_type: `reviews_${milestone}`,
          })
        }
      }
    }

    return NextResponse.json({
      success: true,
      review_id: review?.id,
      attributed_to: attribution?.employeeId ?? null,
      attribution_method: attribution?.method ?? 'unattributed',
    })
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
