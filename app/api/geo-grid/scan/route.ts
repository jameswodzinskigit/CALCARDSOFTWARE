import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { createAdminClient } from '@/utils/supabase/server'
import { getActiveCompanyId } from '@/utils/active-company'

const MAPS_KEY = process.env.GOOGLE_MAPS_API_KEY || ''
const MILES_PER_DEG_LAT = 69.0

// Build NxN grid points around center
function buildGrid(
  centerLat: number,
  centerLng: number,
  gridSize: number,
  spacingMiles: number
): Array<{ row: number; col: number; lat: number; lng: number }> {
  const half = Math.floor(gridSize / 2)
  const degLng = spacingMiles / (MILES_PER_DEG_LAT * Math.cos((centerLat * Math.PI) / 180))
  const degLat = spacingMiles / MILES_PER_DEG_LAT
  const points = []
  for (let row = -half; row <= half; row++) {
    for (let col = -half; col <= half; col++) {
      points.push({
        row,
        col,
        lat: centerLat + row * degLat,
        lng: centerLng + col * degLng,
      })
    }
  }
  return points
}

// Search keyword at a lat/lng and find target place_id rank (1-based, 0 = not in top 20)
async function getRankAtPoint(
  lat: number,
  lng: number,
  keyword: string,
  targetPlaceId: string
): Promise<number> {
  const radiusMeters = 8000 // ~5 miles
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(keyword)}&location=${lat},${lng}&radius=${radiusMeters}&key=${MAPS_KEY}`
  try {
    const res = await fetch(url, { next: { revalidate: 0 } })
    if (!res.ok) return 0
    const data = await res.json()
    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Places API error:', data.status, data.error_message)
      return 0
    }
    const results: Array<{ place_id: string }> = data.results || []
    const idx = results.findIndex((r) => r.place_id === targetPlaceId)
    return idx >= 0 ? idx + 1 : 0
  } catch {
    return 0
  }
}

// GET: return recent scans for this company
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  const companyId = await getActiveCompanyId(profile?.company_id, profile?.role)
  if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

  const admin = await createAdminClient()
  const { data: scans } = await admin
    .from('geo_grid_scans')
    .select('id, keyword, grid_size, grid_spacing_miles, center_lat, center_lng, place_name, results, status, error_message, scanned_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false })
    .limit(10)

  return NextResponse.json({ scans: scans || [] })
}

// POST: run a new scan
export async function POST(req: NextRequest) {
  if (!MAPS_KEY) {
    return NextResponse.json({ error: 'GOOGLE_MAPS_API_KEY not configured' }, { status: 503 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  const companyId = await getActiveCompanyId(profile?.company_id, profile?.role)
  if (!companyId) return NextResponse.json({ error: 'No company' }, { status: 400 })

  const body = await req.json()
  const keyword: string = (body.keyword || '').trim()
  const gridSize: number = [3, 5, 7].includes(body.grid_size) ? body.grid_size : 5
  const spacingMiles: number = parseFloat(body.spacing_miles) || 1

  if (!keyword) return NextResponse.json({ error: 'Keyword required' }, { status: 400 })

  // Get company's google_place_id
  const admin = await createAdminClient()
  const { data: company } = await admin
    .from('companies')
    .select('google_place_id, name')
    .eq('id', companyId)
    .single()

  if (!company?.google_place_id) {
    return NextResponse.json({ error: 'No Google Place ID set for this company' }, { status: 400 })
  }

  // Geocode the place_id to get lat/lng
  const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${company.google_place_id}&fields=geometry,name&key=${MAPS_KEY}`
  const detailsRes = await fetch(detailsUrl, { next: { revalidate: 0 } })
  const detailsData = await detailsRes.json()

  if (detailsData.status !== 'OK' || !detailsData.result?.geometry) {
    return NextResponse.json({ error: 'Could not geocode place ID — check your Google Maps API key' }, { status: 400 })
  }

  const { lat, lng } = detailsData.result.geometry.location
  const placeName: string = detailsData.result.name || company.name || ''

  // Build grid
  const gridPoints = buildGrid(lat, lng, gridSize, spacingMiles)

  // Run scans — batch 5 concurrent to respect rate limits
  const results: Array<{ row: number; col: number; lat: number; lng: number; rank: number }> = []
  const batchSize = 5
  for (let i = 0; i < gridPoints.length; i += batchSize) {
    const batch = gridPoints.slice(i, i + batchSize)
    const ranks = await Promise.all(
      batch.map((pt) => getRankAtPoint(pt.lat, pt.lng, keyword, company.google_place_id!))
    )
    ranks.forEach((rank, j) => {
      results.push({ ...batch[j], rank })
    })
    // Small delay between batches
    if (i + batchSize < gridPoints.length) {
      await new Promise((r) => setTimeout(r, 200))
    }
  }

  // Save to DB
  const { data: scan, error } = await admin
    .from('geo_grid_scans')
    .insert({
      company_id: companyId,
      keyword,
      grid_size: gridSize,
      grid_spacing_miles: spacingMiles,
      center_lat: lat,
      center_lng: lng,
      place_name: placeName,
      results,
      status: 'complete',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: 'Failed to save scan' }, { status: 500 })
  }

  return NextResponse.json({ scan })
}
