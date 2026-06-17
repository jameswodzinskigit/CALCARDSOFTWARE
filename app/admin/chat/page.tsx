import { createAdminClient } from '@/utils/supabase/server'
import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import AdminChatClient from './AdminChatClient'

export default async function AdminChatPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') redirect('/admin')

  const admin = await createAdminClient()

  const { data: messages } = await admin
    .from('chat_messages')
    .select('*, company:companies(name)')
    .order('created_at', { ascending: false })

  return <AdminChatClient messages={(messages || []) as any} />
}
