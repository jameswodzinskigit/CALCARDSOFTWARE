import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { buildGoogleAdsAuthUrl } from '@/lib/google-ads'
import { redirect } from 'next/navigation'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'super_admin') {
    return NextResponse.json({ error: 'Super admin only' }, { status: 403 })
  }

  // State contains the user ID to verify on callback
  const state = Buffer.from(JSON.stringify({ uid: user.id, ts: Date.now() })).toString('base64')
  const url = buildGoogleAdsAuthUrl(state)

  return NextResponse.redirect(url)
}
