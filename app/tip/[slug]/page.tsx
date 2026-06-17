import { createAdminClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

export default async function TipPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const supabase = await createAdminClient()

  const { data: card } = await supabase
    .from('cards')
    .select('*, employee:profiles(first_name, venmo_username, cashapp_username), company:companies(name)')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!card) notFound()

  const employee = card.employee as { first_name: string; venmo_username: string | null; cashapp_username: string | null } | null
  const company = card.company as { name: string } | null
  const firstName = employee?.first_name || 'Your technician'
  const hasTips = !!(employee?.venmo_username || employee?.cashapp_username)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm text-center">
        {/* Avatar */}
        <div className="inline-flex mb-6">
          <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <span className="text-2xl font-bold text-white">{firstName.charAt(0).toUpperCase()}</span>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-white mb-1">Tip {firstName} 💰</h1>
        <p className="text-gray-400 text-sm mb-2">{company?.name}</p>
        <p className="text-gray-300 text-sm leading-relaxed mb-8">
          Did {firstName} do a great job? Send them a tip — 100% goes directly to them.
        </p>

        {hasTips ? (
          <div className="space-y-3">
            {employee?.venmo_username && (
              <a href={`https://venmo.com/${employee.venmo_username}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-blue-500/20">
                <span className="text-xl">💙</span>
                Tip on Venmo — @{employee.venmo_username}
              </a>
            )}
            {employee?.cashapp_username && (
              <a href={`https://cash.app/$${employee.cashapp_username}`} target="_blank" rel="noopener noreferrer"
                className="flex items-center justify-center gap-3 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-4 rounded-2xl transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-emerald-500/20">
                <span className="text-xl">💚</span>
                Tip on Cash App — ${employee.cashapp_username}
              </a>
            )}
          </div>
        ) : (
          <div className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 mb-4">
            <p className="text-4xl mb-3">😊</p>
            <p className="text-white font-medium mb-1">Tips coming soon!</p>
            <p className="text-gray-400 text-sm">
              {firstName} hasn&apos;t set up their tip links yet — but a 5-star review means just as much!
            </p>
          </div>
        )}

        <div className="mt-6">
          <Link href={`/u/${slug}`}
            className="block w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-4 rounded-2xl transition-all transform hover:scale-[1.02] shadow-lg shadow-green-500/20">
            ⭐ Leave {firstName} a Review
          </Link>
          <p className="text-xs text-gray-600 mt-4">Powered by CalCard · Review Gamification Platform</p>
        </div>
      </div>
    </div>
  )
}
