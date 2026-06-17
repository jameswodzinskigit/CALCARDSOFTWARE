import { NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'

// GET /api/insights — returns cached insights for user's company
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id')
      .eq('id', user.id)
      .single()
    if (!profile?.company_id) return NextResponse.json({ error: 'No company' }, { status: 400 })

    const admin = await createAdminClient()
    const { data } = await admin
      .from('company_insights')
      .select('insights, generated_at')
      .eq('company_id', profile.company_id)
      .single()

    return NextResponse.json({ insights: data?.insights || [], generated_at: data?.generated_at || null })
  } catch {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

// POST /api/insights — generate fresh insights (super_admin or company_admin)
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, role')
      .eq('id', user.id)
      .single()
    if (!profile?.company_id) return NextResponse.json({ error: 'No company' }, { status: 400 })
    const allowed = ['super_admin', 'company_admin', 'owner']
    if (!allowed.includes(profile.role)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

    const admin = await createAdminClient()
    const companyId = profile.company_id

    const now = new Date()
    const monthStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01'
    const prevMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const prevMonthStr = prevMonthDate.getFullYear() + '-' + String(prevMonthDate.getMonth() + 1).padStart(2, '0') + '-01'
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

    // Gather data in parallel
    const [
      { count: reviewsThisMonth },
      { count: reviewsLastMonth },
      { data: ratingRows },
      { count: taps },
      { data: adRow },
      { data: gbpRow },
      { data: goal },
      { data: competitors },
    ] = await Promise.all([
      admin.from('reviews').select('*', { count: 'exact', head: true }).eq('company_id', companyId).gte('created_at', monthStr),
      admin.from('reviews').select('*', { count: 'exact', head: true }).eq('company_id', companyId).gte('created_at', prevMonthStr).lt('created_at', monthStr),
      admin.from('reviews').select('rating').eq('company_id', companyId),
      admin.from('taps').select('*', { count: 'exact', head: true }).eq('company_id', companyId).gte('tapped_at', thirtyDaysAgo),
      admin.from('ad_stats').select('*').eq('company_id', companyId).eq('month', monthStr).maybeSingle(),
      admin.from('gbp_stats').select('*').eq('company_id', companyId).eq('month', monthStr).maybeSingle(),
      admin.from('review_goals').select('monthly_target').eq('company_id', companyId).maybeSingle(),
      admin.from('competitors').select('name, review_count, star_rating').eq('company_id', companyId).eq('is_active', true).limit(5),
    ])

    const avgRating = ratingRows && ratingRows.length > 0
      ? ratingRows.reduce((s: number, r: { rating: number }) => s + r.rating, 0) / ratingRows.length
      : null

    // Build rule-based insights
    const insights: string[] = []
    const thisMonth = reviewsThisMonth || 0
    const lastMonth = reviewsLastMonth || 0
    const monthName = now.toLocaleString('default', { month: 'long' })

    // Review velocity
    if (thisMonth > lastMonth && lastMonth > 0) {
      const pct = Math.round(((thisMonth - lastMonth) / lastMonth) * 100)
      insights.push(`📈 Reviews are up ${pct}% vs last month — ${thisMonth} reviews in ${monthName} vs ${lastMonth} in ${prevMonthDate.toLocaleString('default', { month: 'long' })}.`)
    } else if (thisMonth < lastMonth && lastMonth > 0) {
      const drop = lastMonth - thisMonth
      insights.push(`⚠️ Review pace is down this month — ${drop} fewer than last month so far. Consider sending more review requests.`)
    } else if (thisMonth === 0 && lastMonth === 0) {
      insights.push(`🚀 No reviews yet this month — tap your NFC cards after every job to start building momentum.`)
    }

    // Goal progress
    if (goal?.monthly_target && goal.monthly_target > 0) {
      const pct = Math.round((thisMonth / goal.monthly_target) * 100)
      const remaining = goal.monthly_target - thisMonth
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const daysLeft = daysInMonth - now.getDate()
      if (pct >= 100) {
        insights.push(`🏆 Goal hit! You've reached your monthly target of ${goal.monthly_target} reviews with ${daysLeft} days to spare.`)
      } else if (remaining > 0 && daysLeft > 0) {
        const pace = Math.ceil(remaining / daysLeft)
        insights.push(`🎯 You're ${pct}% toward your ${goal.monthly_target}-review goal — need ${remaining} more. At current pace, that's about ${pace}/day.`)
      }
    }

    // Rating insight
    if (avgRating !== null) {
      if (avgRating >= 4.8) {
        insights.push(`⭐ Outstanding reputation — your ${avgRating.toFixed(1)} average rating puts you in the top tier of local service businesses.`)
      } else if (avgRating >= 4.5) {
        insights.push(`⭐ Strong ${avgRating.toFixed(1)}-star average. A few more 5-star reviews could push you to 4.8+ and improve your Google ranking.`)
      } else if (avgRating < 4.0) {
        insights.push(`⚠️ Your ${avgRating.toFixed(1)} average is below the 4.0 threshold that impacts Google visibility. Focus on requesting reviews from satisfied customers.`)
      }
    }

    // NFC tap insight
    if ((taps || 0) > 0) {
      insights.push(`📱 ${taps} NFC card taps in the last 30 days — each tap is a direct review request delivered at the moment of maximum satisfaction.`)
    }

    // GBP insight
    const gbpData = gbpRow as { views?: number; calls?: number; website_clicks?: number } | null
    if (gbpData?.views && gbpData.views > 0) {
      insights.push(`📍 Your Google Business Profile got ${gbpData.views.toLocaleString()} views this month${gbpData.calls ? ` and generated ${gbpData.calls} calls` : ''}.`)
    }

    // Ad insight
    const adData = adRow as { spend?: number; clicks?: number; leads?: number } | null
    if (adData?.spend && adData.spend > 0 && adData.leads && adData.leads > 0) {
      const cpl = (adData.spend / adData.leads).toFixed(2)
      insights.push(`💰 Ads are running at $${cpl} cost per lead with ${adData.leads} leads this month.`)
    }

    // Competitor insight
    if (competitors && competitors.length > 0) {
      const sorted = [...competitors].sort((a: any, b: any) => (b.review_count || 0) - (a.review_count || 0))
      const top = sorted[0] as { name: string; review_count: number } | undefined
      if (top && top.review_count > 0) {
        insights.push(`🔍 Top local competitor "${top.name}" has ${top.review_count.toLocaleString()} reviews. Stay consistent to protect your market position.`)
      }
    }

    // Fallback
    if (insights.length === 0) {
      insights.push(`📊 Start collecting data by tapping NFC cards after every job — insights will appear here once you have review and tap history.`)
    }

    // Keep top 4
    const finalInsights = insights.slice(0, 4)

    await admin.from('company_insights').upsert({
      company_id: companyId,
      insights: finalInsights,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'company_id' })

    return NextResponse.json({ insights: finalInsights, generated_at: new Date().toISOString() })
  } catch (e) {
    console.error('Insights error:', e)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
