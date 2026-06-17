import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
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
  const { subject, message, messageId, status } = body

  const admin = await createAdminClient()

  if (status && messageId) {
    const { error } = await admin
      .from('chat_messages')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', messageId)
      .eq('company_id', profile.company_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  const { error } = await admin
    .from('chat_messages')
    .insert({
      company_id: profile.company_id,
      subject: subject || 'New Message',
      body: message || '',
      status: 'open',
      created_by: user.id,
    })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
