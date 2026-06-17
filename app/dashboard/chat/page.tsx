import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import ChatClient from './ChatClient'
import { getActiveCompanyId } from '@/utils/active-company'

export default async function ChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  const companyId = await getActiveCompanyId(profile?.company_id, profile?.role)
  if (!companyId) redirect('/dashboard')

  const admin = await createAdminClient()
  const { data: coData } = await admin.from('companies').select('feature_chat').eq('id', companyId).single()
  if (!(coData as any)?.feature_chat) redirect('/dashboard')

  const { data: messages } = await admin
    .from('chat_messages')
    .select('id, subject, body, status, admin_reply, admin_replied_at, created_at')
    .eq('company_id', companyId)
    .order('created_at', { 