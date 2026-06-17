import { createAdminClient } from '@/utils/supabase/server'
import StatsCard from '@/components/dashboard/StatsCard'
import Link from 'next/link'

export default async function AdminPage() {
  const supabase = await createAdminClient()

  const [
    { count: companyCount },
    { count: employeeCount },
    { count: reviewCount },
    { count: tapCount },
    { data: recentCompanies },
    { data: spotlightReviews },
  ] = await Promise.all([
    supabase.from('companies').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'employee'),
    supabase.from('reviews').select('*', { count: 'exact', head: true }),
    supabase.from('taps').select('*', { count: 'exact', head: true }),
    supabase.from('companies').select('id, name, slug, created_at').order('created_at', { ascending: false }).limit(5),
    supabase.from('reviews').select('id, reviewer_name, rating, body, reviewed_at, profiles:employee_id(first_name), companies:company_id(name)')
      .eq('rating', 5).not('body', 'is', null).neq('body', '').order('reviewed_at', { ascending: false }).limit(20),
  ])

  const reviews = (spotlightReviews || []) as Array<{
    id: string; reviewer_name: string | null; rating: number; body: string | null; reviewed_at: string;
    profiles: { first_name: string } | null; companies: { name: string } | null
  }>
  const bestReview = reviews.reduce((best, r) =>
    (r.body?.length || 0) > (best?.body?.length || 0) ? r : best, reviews[0] || null)
  const funniestReview = reviews.find(r => r !== bestReview && (r.body?.length || 0) < 80 && (r.body?.length || 0) > 10) || null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard title="Total Companies" value={companyCount || 0} icon="&#127968;" />
        <StatsCard title="Total Employees" value={employeeCount || 0} icon="&#128101;" />
        <StatsCard title="Total Reviews" value={reviewCount || 0} icon="&#11088;" />
        <StatsCard title="Total Taps" value={tapCount || 0} icon="&#128242;" />
      </div>

      {(bestReview || funniestReview) && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-gray-800 flex items-center justify-between">
            <h3 className="text-white font-semibold">Review Spotlight &#10024;</h3>
            <Link href="/admin/reviews" className="text-green-400 hover:text-green-300 text-sm">View all &#8594;</Link>
          </div>
          <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-800">
            {bestReview && (
              <div className="p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">&#127942;</span>
                  <span className="text-xs font-semibold text-yellow-400 uppercase tracking-wide">Best Review</span>
                </div>
                <p className="text-gray-200 text-sm leading-relaxed italic">
                  &ldquo;{bestReview.body?.slice(0, 180)}{(bestReview.body?.length || 0) > 180 ? '\u2026' : ''}&rdquo;
                </p>
                <p className="text-gray-500 text-xs">
                  &#8212; {bestReview.reviewer_name || 'Anonymous'}
                  {bestReview.profiles?.first_name && <span className="text-green-400"> &#8594; {bestReview.profiles.first_name}</span>}
                  {bestReview.companies?.name && <span> &middot; {bestReview.companies.name}</span>}
                </p>
              </div>
            )}
            {funniestReview && (
              <div className="p-5 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">&#128514;</span>
                  <span className="text-xs font-semibold text-purple-400 uppercase tracking-wide">Quick &amp; Punchy</span>
                </div>
                <p className="text-gray-200 text-sm leading-relaxed italic">
                  &ldquo;{funniestReview.body}&rdquo;
                </p>
                <p className="text-gray-500 text-xs">
                  &#8212; {funniestReview.reviewer_name || 'Anonymous'}
                  {funniestReview.profiles?.first_name && <span className="text-green-400"> &#8594; {funniestReview.profiles.first_name}</span>}
                  {funniestReview.companies?.name && <span> &middot; {funniestReview.companies.name}</span>}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h3 className="text-white font-semibold">Recent Companies</h3>
          <Link href="/admin/companies" className="text-green-400 hover:text-green-300 text-sm">View all &#8594;</Link>
        </div>
        <div className="divide-y divide-gray-800">
          {recentCompanies?.map((company) => (
            <div key={company.id} className="flex items-center justify-between px-5 py-4">
              <div>
                <p className="text-white text-sm font-medium">{company.name}</p>
                <p className="text-gray-400 text-xs">/{company.slug}</p>
              </div>
              <div className="flex items-center gap-4">
                <p className="text-gray-500 text-xs">{new Date(company.created_at).toLocaleDateString()}</p>
                <Link href={"/admin/companies/" + company.id} className="text-green-400 hover:text-green-300 text-xs">Manage &#8594;</Link>
              </div>
            </div>
          ))}
          {!recentCompanies?.length && <div className="p-8 text-center text-gray-500 text-sm">No companies yet</div>}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <a href="/leaderboard" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-between bg-gradient-to-r from-green-500/10 to-green-600/5 border border-green-500/20 rounded-xl px-5 py-4 hover:border-green-500/40 transition-colors">
          <div>
            <p className="text-white font-semibold text-sm">&#127942; Platform Leaderboard</p>
            <p className="text-gray-400 text-xs mt-0.5">Top performers across all companies</p>
          </div>
          <span className="text-green-400 text-sm">View &#8599;</span>
        </a>
        <Link href="/admin/applications"
          className="flex items-center justify-between bg-gradient-to-r from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl px-5 py-4 hover:border-blue-500/40 transition-colors">
          <div>
            <p className="text-white font-semibold text-sm">&#128203; Company Applications</p>
            <p className="text-gray-400 text-xs mt-0.5">New signup requests from /join</p>
          </div>
          <span className="text-blue-400 text-sm">View &#8594;</span>
        </Link>
      </div>
    </div>
  )
}
