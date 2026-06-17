import { notFound } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import ReviewWallClient from './ReviewWallClient'

const SUPABASE_URL = 'https://lujdnxyfwmaegszcwcqq.supabase.co'

export default async function ReviewWallPage({
  params,
}: {
  params: Promise<{ companyId: string }>
}) {
  const { companyId } = await params
  const supabase = createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!)

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, feature_review_wall')
    .eq('id', companyId)
    .single()

  if (!company || !company.feature_review_wall) notFound()

  // Recent 5-star reviews for the wall
  const { data: reviews } = await supabase
    .from('reviews')
    .select(`
      id, reviewer_name, rating, body, reviewed_at,
      profiles:employee_id ( first_name )
    `)
    .eq('company_id', companyId)
    .gte('rating', 4)
    .order('reviewed_at', { ascending: false })
    .limit(20)

  // Leaderboard snapshot (top 5 this month)
  const { data: leaderboard } = await supabase
    .from('leaderboard')
    .select('employee_id, first_name, reviews_this_month, five_star_reviews')
    .eq('company_id', companyId)
    .order('reviews_this_month', { ascending: false })
    .limit(5)

  return (
    <ReviewWallClient
      company={company}
      initialReviews={(reviews ?? []).map(r => ({
        ...r,
        employee_name: (r.profiles as { first_name: string } | null)?.first_name ?? null,
      }))}
      leaderboard={leaderboard ?? []}
    />
  )
}

export async function generateMetadata({ params }: { params: Promise<{ companyId: string }> }) {
  return { title: 'Review Wall — CalCard' }
}
