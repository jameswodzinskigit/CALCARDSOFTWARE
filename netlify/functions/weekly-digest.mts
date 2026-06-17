import type { Config, Context } from '@netlify/functions'

/**
 * Netlify Scheduled Function — Weekly Digest
 * Runs every Monday at 9:00 AM UTC.
 * Required env vars: NEXT_PUBLIC_APP_URL, DIGEST_SECRET
 */

export default async (req: Request, context: Context) => {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const digestSecret = process.env.DIGEST_SECRET

  if (!appUrl || !digestSecret) {
    console.error('[weekly-digest] Missing required env vars: NEXT_PUBLIC_APP_URL or DIGEST_SECRET')
    return new Response('Configuration error', { status: 500 })
  }

  const url = `${appUrl}/api/digest/weekly`
  console.log(`[weekly-digest] Calling ${url}`)

  let res: Response
  try {
    res = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${digestSecret}` },
    })
  } catch (err) {
    console.error('[weekly-digest] Fetch failed:', err)
    return new Response('Fetch error', { status: 500 })
  }

  const body = await res.text()
  if (!res.ok) {
    console.error(`[weekly-digest] Digest endpoint returned ${res.status}:`, body)
    return new Response(`Digest failed: ${res.status}`, { status: res.status })
  }

  console.log(`[weekly-digest] Success (${res.status}):`, body)
  return new Response('OK', { status: 200 })
}

export const config: Config = {
  schedule: '0 9 * * 1',
}
