import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Verify admin role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { reply_text } = await request.json()
  if (!reply_text?.trim()) {
    return NextResponse.json({ error: 'reply_text is required' }, { status: 400 })
  }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('reviews')
    .update({
      reply_text: reply_text.trim(),
      replied_at: new Date().toISOString(),
      reply_status: 'pending_sync',
    })
    .eq('id', params.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
