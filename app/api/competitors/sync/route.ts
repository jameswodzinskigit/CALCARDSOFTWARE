import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/competitors/sync
// Body: { company_id?: string }  — omit to sync all companies with feature_competitors
// Calls Google Places Details API for each competitor that has a google_place_id,
// then inserts a new competitor_snapshot row. Falls back to existing snapshot data
// for competitors without a Place ID.
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, company_id')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'No profile' }, { status: 403 })

  const isSuperAdmin = profile.role === 'super_admin'
  const body = await request.json().catch(() => ({}))
  const targetCompanyId: string | null = body.company_id || (isSuperAdmin ? null : profile.company_id)

  // Non-admins can only sync their own company
  if (!isSuperAdmin && targetCompanyId !== profile.company_id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const admin = await createAdminClient()
  const PLACES_KEY = process.env.GOOGLE_PLACES_API_KEY

  // Fetch competitors to sync
  let query = admin.from('competitors').select('id, company_id, name, google_place_id').eq('is_active', true)
  if (targetCompanyId) query = query.eq('company_id', targetCompanyId)
  const { data: competitors, error: compErr } = await query

  if (compErr) return NextResponse.json({ error: compErr.message }, { status: 500 })
  if (!competitors || competitors.length === 0) {
    return NextResponse.json({ synced: 0, message: 'No competitors to sync' })
  }

  const today = new Date().toISOString().split('T')[0]
  const results: { name: string; status: string; review_count?: number; star_rating?: number }[] = []

  for (const comp of competitors) {
    if (comp.google_place_id && PLACES_KEY) {
      try {
        const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(comp.google_place_id)}&fields=name,rating,user_ratings_total&key=${PLACES_KEY}`
        const res = await fetch(url)
        const json = await res.json()

        if (json.status === 'OK' && json.result) {
          const rating: number = json.result.rating ?? null
          const count: number = json.result.user_ratings_total ?? null

          await admin.from('competitor_snapshots').insert({
            company_id: comp.company_id,
            competitor_name: comp.name,
            google_place_id: comp.google_place_id,
            star_rating: rating,
            review_count: count,
            snapshot_date: today,
          })

          results.push({ name: comp.name, status: 'synced', review_count: count, star_rating: rating })
        } else {
          results.push({ name: comp.name, status: `places_error:${json.status}` })
        }
      } catch (e) {
        results.push({ name: comp.name, status: 'fetch_error' })
      }
    } else {
      // No Place ID — record as skipped (manual entry required)
      results.push({ name: comp.name, status: 'no_place_id' })
    }
  }

  return NextResponse.json({ synced: results.filter(r => r.status === 'synced').length, results })
}
