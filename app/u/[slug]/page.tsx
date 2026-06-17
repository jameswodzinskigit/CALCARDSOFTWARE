import { createAdminClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import TapTracker from './TapTracker'
import Link from 'next/link'
import { BadgePill } from '@/components/badges/BadgePill'

interface Props { params: Promise<{ slug: string }> }

export default async function TapPage({ params }: Props) {
  const { slug } = await params
  const supabase = await createAdminClient()

  const { data: card } = await supabase
    .from('cards')
    .select('*, employee:profiles(id, first_name, last_name, company_id, venmo_username, cashapp_username, avatar_url), company:companies(name, google_place_id, logo_url)')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!card) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">&#128269;</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Card Not Found</h1>
          <p className="text-gray-400">This card hasn&apos;t been activated yet.</p>
          <a href={"/activate/" + slug} className="mt-4 inline-block bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors">
            Activate This Card
          </a>
        </div>
      </div>
    )
  }

  const employee = card.employee as { id: string; first_name: string; last_name: string; company_id: string; venmo_username: string | null; cashapp_username: string | null; avatar_url: string | null }
  const company = card.company as { name: string; google_place_id: string; logo_url: string | null }
  const firstName = employee?.first_name || 'Your technician'

  const { data: badges } = employee?.id
    ? await supabase.from('badges').select('badge_type').eq('employee_id', employee.id)
    : { data: [] }

  const { count: reviewCount } = await supabase
    .from('reviews')
    .select('*', { count: 'exact', head: true })
    .eq('employee_id', employee.id)

  const reviewUrl = company?.google_place_id
    ? "https://search.google.com/local/writereview?placeid=" + company.google_place_id
    : "https://www.google.com/search?q=" + encodeURIComponent((company?.name || '') + ' reviews')
  const hasTips = !!(employee?.venmo_username || employee?.cashapp_username)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4">
      <TapTracker cardId={card.id} employeeId={card.employee_id} companyId={card.company_id} />
      <div className="w-full max-w-sm text-center">

        {company?.logo_url && (
          <div className="mb-6">
            <img src={company.logo_url} alt={company.name} className="h-10 w-auto mx-auto object-contain opacity-80" />
          </div>
        )}

        <div className="relative inline-flex mb-4">
          {employee?.avatar_url ? (
            <img
              src={employee.avatar_url}
              alt={firstName}
              className="w-24 h-24 rounded-full object-cover shadow-lg shadow-green-500/20 border-2 border-green-500/30"
            />
          ) : (
            <div className="w-24 h-24 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-lg shadow-green-500/20">
              <span className="text-3xl font-bold text-white">{firstName.charAt(0).toUpperCase()}</span>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-green-500 rounded-full flex items-center justify-center border-2 border-gray-950">
            <span className="text-xs">&#11088;</span>
          </div>
        </div>

        {badges && badges.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1.5 mb-4">
            {badges.map((b: { badge_type: string }) => (
              <BadgePill key={b.badge_type} type={b.badge_type} />
            ))}
          </div>
        )}

        {reviewCount !== null && reviewCount > 0 && (
          <p className="text-green-400 text-sm font-medium mb-1">
            &#11088; {reviewCount} Google {reviewCount === 1 ? 'review' : 'reviews'} collected
          </p>
        )}

        <h1 className="text-2xl font-bold text-white mb-2">You worked with {firstName} today!</h1>
        <p className="text-gray-400 mb-2">{company?.name}</p>
        <p className="text-gray-300 mb-8 leading-relaxed">
          Was {firstName} great? A quick Google review helps{' '}
          <span className="text-green-400 font-medium">{firstName}</span>{' '}
          and the whole team &mdash; it only takes 30 seconds.
        </p>

        <a href={reviewUrl} target="_blank" rel="noopener noreferrer"
          className="block w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-green-500/25 transition-all transform hover:scale-[1.02] active:scale-[0.98] mb-3">
          &#11088; Leave {firstName} a Review
        </a>

        {hasTips && (
          <Link href={"/tip/" + slug}
            className="block w-full bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white font-semibold py-3.5 rounded-2xl transition-all text-sm">
            &#128176; Leave a Tip
          </Link>
        )}

        <Link href={'/tech/' + slug}
          className="block text-xs text-gray-600 hover:text-gray-400 mt-6 transition-colors">
          {firstName}&apos;s personal stats &#8250;
        </Link>
        <p className="text-xs text-gray-700 mt-1">Powered by CalCard &middot; Review Gamification Platform</p>
      </div>
    </div>
  )
}
