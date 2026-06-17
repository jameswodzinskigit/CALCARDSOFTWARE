import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createNotification } from '@/lib/notify'

const SUPABASE_URL = 'https://lujdnxyfwmaegszcwcqq.supabase.co'
function getSupabase() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(request: NextRequest) {
  try {
    const { company_id, monthly_target } = await request.json()
    if (!company_id || !monthly_target) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }
    const supabase = getSupabase()
    await supabase.from('review_goals').upsert(
      { company_id, monthly_target, updated_at: new Date().toISOString() },
      { onConflict: 'company_id' }
    )
    await createNotification(
      company_id,
      'goal',
      'Revi