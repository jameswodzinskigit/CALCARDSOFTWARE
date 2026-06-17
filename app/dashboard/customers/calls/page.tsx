import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function CallsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white font-bold text-xl">Calls</h1>
        <p className="text-gray-500 text-sm mt-0.5">Call tracking and analytics</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <p className="text-3xl mb-3">&#128222;</p>
        <p className="text-white font-semibold mb-2">Call Tracking Coming Soon</p>
        <p className="text-gray-500 text-sm">This section will show inbound calls from your marketing channels. Your CAL team will connect your call tracking system here.</p>
      </div>
    </div>
  )
}
