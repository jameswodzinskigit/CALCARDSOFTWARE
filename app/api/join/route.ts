import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lujdnxyfwmaegszcwcqq.supabase.co'
function getSupabase() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { company_name, contact_name, email, phone, employee_count, message } = body
    if (!company_name || !contact_name || !email) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const supabase = getSupabase()
    await supabase.from('company_applications').insert({
      company_name,
      contact_name,
      email,
      phone: phone || null,
      employee_count: employee_count || null,
      message: message || null,
    })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
