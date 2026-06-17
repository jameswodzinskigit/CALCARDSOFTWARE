import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { headers } from "next/headers"
import * as crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const { cardId, employeeId, companyId } = await request.json()
    if (!cardId) return NextResponse.json({ error: "Missing cardId" }, { status: 400 })

    const supabase = createClient(
      "https://lujdnxyfwmaegszcwcqq.supabase.co",
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const headersList = await headers()
    const userAgent = headersList.get("user-agent") || ""
    const forwarded = headersList.get("x-forwarded-for") || ""
    const rawIp = forwarded.split(",")[0].trim()
    const ipHash = crypto.createHash("sha256").update(rawIp).digest("hex").slice(0, 16)
    const deviceType = /mobile|android|iphone|ipad/i.test(userAgent) ? "mobile" : "desktop"

    // Geo lookup (ip-api.com free tier — HTTP only, server-side OK)
    let city: string | null = null
    let region: string | null = null
    let country: string | null = null
    let lat: number | null = null
    let lng: number | null = null

    const isPrivateIp = !rawIp ||
      rawIp === "127.0.0.1" ||
      rawIp === "::1" ||
      rawIp.startsWith("10.") ||
      rawIp.startsWith("192.168.") ||
      rawIp.startsWith("172.16.") ||
      rawIp.startsWith("172.17.") ||
      rawIp.startsWith("172.18.") ||
      rawIp.startsWith("172.19.") ||
      rawIp.startsWith("172.2") ||
      rawIp.startsWith("172.30.") ||
      rawIp.startsWith("172.31.")

    if (!isPrivateIp) {
      try {
        const geoRes = await fetch(
          "http://ip-api.com/json/" + rawIp + "?fields=status,city,regionName,country,lat,lon",
          { signal: AbortSignal.timeout(2000) }
        )
        if (geoRes.ok) {
          const geo = await geoRes.json()
          if (geo.status === "success") {
            city = geo.city || null
            region = geo.regionName || null
            country = geo.country || null
            lat = geo.lat || null
            lng = geo.lon || null
          }
        }
      } catch {
        // geo lookup failed silently, tap still records
      }
    }

    await supabase.from("taps").insert({
      card_id: cardId,
      employee_id: employeeId,
      company_id: companyId,
      device_type: deviceType,
      user_agent: userAgent.slice(0, 255),
      ip_hash: ipHash,
      city,
      region,
      country,
      lat,
      lng,
    })

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
