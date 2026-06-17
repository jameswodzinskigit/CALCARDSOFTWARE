import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export default async function LeadsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white font-bold text-xl">Leads</h1>
        <p className="text-gray-500 text-sm mt-0.5">Incoming lead tracking</p>
      </div>
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <p className="text-3xl mb-3">&#128100;</p>
        <p className="text-white font-semibold mb-2">Lead Tracking Coming Soon</p>
        <p className="text-gray-500 text-sm">This section will show leads generated from your ads and marketing campaigns. Your CAL team will set this up for you.</p>
      </div>
    </div>
  )
}
