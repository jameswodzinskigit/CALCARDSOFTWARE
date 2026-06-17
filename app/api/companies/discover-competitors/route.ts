import { createAdminClient } from '@/utils/supabase/server'
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

// POST /api/companies/discover-competitors
// Body: { company_id: string }
// Uses Google Places API to find competitors near the company's location
// Requires GOOGLE_PLACES_API_KEY env var
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'super_admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { company_id } = body
  if (!company_id) return NextResponse.json({ error: 'company_id required' }, { status: 400 })

  const KEY = process.env.GOOGLE_PLACES_API_KEY
  if (!KEY) return NextResponse.json({ error: 'GOOGLE_PLACES_API_KEY not configured' }, { status: 500 })

  const admin = await createAdminClient()

  // Fetch the company's Place ID + name
  const { data: company } = await admin
    .from('companies')
    .select('name, google_place_id')
    .eq('id', company_id)
    .single()

  if (!company?.google_place_id) {
    return NextResponse.json({ error: 'Company has no google_place_id set — set it first' }, { status: 400 })
  }

  // Step 1: Get the company's location + types from Places Details
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${company.google_place_id}&fields=geometry,types,name&key=${KEY}`
  const detailsRes = await fetch(detailsUrl)
  const details = await detailsRes.json()

  if (details.status !== 'OK') {
    return NextResponse.json({ error: `Places Details error: ${details.status}` }, { status: 500 })
  }

  const lat = details.result.geometry?.location?.lat
  const lng = details.result.geometry?.location?.lng
  const types = (details.result.types || []).filter((t: string) =>
    !['point_of_interest', 'establishment', 'local_government_office'].includes(t)
  )
  const primaryType = types[0] || 'business'

  // Step 2: Nearby Search for similar businesses
  const nearbyUrl = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=40000&type=${primaryType}&key=${KEY}`
  const nearbyRes = await fetch(nearbyUrl)
  const nearby = await nearbyRes.json()

  if (nearby.status !== 'OK' && nearby.status !== 'ZERO_RESULTS') {
    return NextResponse.json({ error: `Nearby Search error: ${nearby.status}` }, { status: 500 })
  }

  const results = (nearby.results || []) as Array<{
    place_id: string
    name: string
    rating?: number
    user_ratings_total?: number
  }>

  // Step 3: Filter out the company itself and upsert into competitors
  const toInsert = results
    .filter(r => r.place_id !== company.google_place_id)
    .slice(0, 10) // max 10 competitors

  const today = new Date().toISOString().split('T')[0]
  let added = 0

  for (const result of toInsert) {
    // Upsert to competitors master table
    const { error: compErr } = await admin
      .from('competitors')
      .upsert(
        { company_id, name: result.name, google_place_id: result.place_id },
        { onConflict: 'company_id,name' }
      )

    if (!compErr) {
      // Insert initial snapshot if we have rating data
      if (result.rating && result.user_ratings_total) {
        await admin.from('competitor_snapshots').insert({
          company_id,
          competitor_name: result.name,
          google_place_id: result.place_id,
          star_rating: result.rating,
          review_count: result.user_ratings_total,
          snapshot_date: today,
        }).then(() => {}) // best-effort, ignore duplicates
      }
      added++
    }
  }

  return NextResponse.json({
    discovered: toInsert.length,
    added,
    competitors: toInsert.map(r => ({ name: r.name, place_id: r.place_id, rating: r.rating, reviews: r.user_ratings_total })),
  })
}
