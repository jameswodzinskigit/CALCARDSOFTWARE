import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ChatClient from './ChatClient'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, companies(feature_chat)')
    .eq('id', user.id)
    .single()

  const companyRaw = Array.isArray(profile?.companies) ? profile?.companies[0] : profile?.companies
  const company = companyRaw as { feature_chat: boolean } | null
  if (!profile?.company_id || !company?.feature_chat) redirect('/dashboard')

  const admin = await createAdminClient()

  const { data: messages } = await admin
    .from('chat_messages')
    .select('id, subject, body, status, admin_reply, admin_replied_at, created_at')
    .eq('company_id', profile.company_id)
    .order('created_at', { ascending: false })

  return <ChatClient messages={(messages || []) as any} />
}
