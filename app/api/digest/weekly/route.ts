import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://lujdnxyfwmaegszcwcqq.supabase.co'
function getSupabase() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function buildEmailHtml(companyName: string, stats: {
  weekReviews: number
  weekTaps: number
  topEmployee: string | null
  recentReviews: Array<{ reviewer_name: string; rating: number; body: string | null; employee_name: string | null }>
  monthProgress: number
  monthTarget: number
}) {
  const reviews = stats.recentReviews.slice(0, 3)
  const reviewsHtml = reviews.map(r => {
    const stars = Array(Math.min(r.rating, 5)).fill('&#11088;').join('')
    const body = r.body ? r.body.slice(0, 120) + (r.body.length > 120 ? '...' : '') : ''
    const emp = r.employee_name ? '<span style="color:#6ee7b7;font-size:12px;">attributed to ' + r.employee_name + '</span>' : ''
    return '<div style="background:#1f2937;border-radius:8px;padding:12px 16px;margin-bottom:8px;">' +
      '<div style="margin-bottom:4px;">' + stars + '</div>' +
      '<div style="color:#e5e7eb;font-size:14px;">' + (r.reviewer_name || 'Anonymous') + '</div>' +
      (body ? '<div style="color:#9ca3af;font-size:13px;margin-top:4px;">' + body + '</div>' : '') +
      (emp ? '<div style="margin-top:6px;">' + emp + '</div>' : '') +
      '</div>'
  }).join('')

  const pct = Math.min(Math.round((stats.monthProgress / stats.monthTarget) * 100), 100)
  const barColor = pct >= 100 ? '#10b981' : pct >= 60 ? '#f59e0b' : '#3b82f6'

  const header = '<!DOCTYPE html><html><body style="background:#111827;font-family:system-ui,sans-serif;color:#f9fafb;margin:0;padding:24px;">'
  const footer = '</div></body></html>'

  const statsGrid = '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px;">' +
    '<div style="background:#1f2937;border-radius:8px;padding:12px;text-align:center;"><div style="font-size:22px;font-weight:700;color:#10b981;">' + stats.weekReviews + '</div><div style="color:#9ca3af;font-size:12px;margin-top:2px;">Reviews</div></div>' +
    '<div style="background:#1f2937;border-radius:8px;padding:12px;text-align:center;"><div style="font-size:22px;font-weight:700;color:#60a5fa;">' + stats.weekTaps + '</div><div style="color:#9ca3af;font-size:12px;margin-top:2px;">Card Taps</div></div>' +
    '<div style="background:#1f2937;border-radius:8px;padding:12px;text-align:center;"><div style="font-size:22px;font-weight:700;color:#fbbf24;">' + (stats.topEmployee || 'None') + '</div><div style="color:#9ca3af;font-size:12px;margin-top:2px;">Top Employee</div></div>' +
    '</div>'

  const goalBar = '<div style="background:#1f2937;border-radius:8px;padding:16px;margin-bottom:24px;">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
    '<span style="font-size:14px;color:#d1d5db;">Monthly Goal Progress</span>' +
    '<span style="font-size:14px;font-weight:700;color:' + barColor + ';">' + stats.monthProgress + ' / ' + stats.monthTarget + '</span>' +
    '</div>' +
    '<div style="background:#374151;border-radius:999px;height:8px;overflow:hidden;">' +
    '<div style="background:' + barColor + ';height:100%;width:' + pct + '%;border-radius:999px;"></div>' +
    '</div>' +
    (pct >= 100 ? '<p style="color:#10b981;font-size:12px;margin:6px 0 0;">Goal reached this month!</p>' : '') +
    '</div>'

  const cta = '<div style="text-align:center;margin-top:24px;">' +
    '<a href="https://calcardai.netlify.app/dashboard" style="background:#10b981;color:white;padding:10px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">View Full Dashboard</a>' +
    '</div>'

  const poweredBy = '<p style="color:#4b5563;font-size:11px;text-align:center;margin-top:24px;">Powered by CalCard &middot; Review Gamification Platform</p>'

  return header +
    '<div style="max-width:540px;margin:0 auto;">' +
    '<div style="background:#10b981;color:white;border-radius:8px;padding:6px 12px;display:inline-block;font-size:12px;font-weight:600;margin-bottom:16px;">CalCard Weekly Digest</div>' +
    '<h1 style="font-size:22px;font-weight:700;margin:0 0 4px;">' + companyName + '</h1>' +
    '<p style="color:#9ca3af;font-size:14px;margin:0 0 24px;">How your team did this week</p>' +
    statsGrid +
    goalBar +
    (reviews.length > 0 ? '<p style="font-size:14px;font-weight:600;color:#d1d5db;margin-bottom:8px;">Recent Reviews</p>' + reviewsHtml : '') +
    cta +
    poweredBy +
    footer
}

export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization')
  if (auth !== 'Bearer ' + process.env.DIGEST_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabase()
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

  const { data: companies } = await supabase
    .from('companies')
    .select('id, name, owner_email')
    .not('owner_email', 'is', null)

  if (!companies) return NextResponse.json({ sent: 0 })

  let sent = 0
  for (const company of companies) {
    const [
      { count: weekReviews },
      { count: weekTaps },
      { data: topEmp },
      { data: recentReviews },
      { count: monthProgress },
      { data: goalRow },
    ] = await Promise.all([
      supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('company_id', company.id).gte('created_at', sevenDaysAgo),
      supabase.from('taps').select('*', { count: 'exact', head: true }).eq('company_id', company.id).gte('tapped_at', sevenDaysAgo),
      supabase.from('leaderboard').select('first_name, total_reviews').eq('company_id', company.id).order('total_reviews', { ascending: false }).limit(1),
      supabase.from('reviews').select('reviewer_name, rating, body, profiles(first_name)').eq('company_id', company.id).gte('created_at', sevenDaysAgo).order('created_at', { ascending: false }).limit(3),
      supabase.from('reviews').select('*', { count: 'exact', head: true }).eq('company_id', company.id).gte('created_at', monthStart),
      supabase.from('review_goals').select('monthly_target').eq('company_id', company.id).maybeSingle(),
    ])

    const formattedReviews = (recentReviews || []).map((r: any) => ({
      reviewer_name: r.reviewer_name,
      rating: r.rating,
      body: r.body,
      employee_name: r.profiles?.first_name || null,
    }))

    const html = buildEmailHtml(company.name, {
      weekReviews: weekReviews || 0,
      weekTaps: weekTaps || 0,
      topEmployee: topEmp?.[0]?.first_name || null,
      recentReviews: formattedReviews,
      monthProgress: monthProgress || 0,
      monthTarget: goalRow?.monthly_target || 20,
    })

    if (process.env.RESEND_API_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer ' + process.env.RESEND_API_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'CalCard <digest@cal.marketing>',
          to: [company.owner_email],
          subject: company.name + ' Weekly Review Digest',
          html,
        }),
      })
      sent++
    }
  }

  return NextResponse.json({ sent, companies: companies.length })
}
