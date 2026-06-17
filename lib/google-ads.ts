/**
 * Google Ads API helper
 * All calls are server-side only — never expose tokens to client.
 */

const ADS_API_BASE = 'https://googleads.googleapis.com/v17'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'

export function stripDashes(customerId: string) {
  return customerId.replace(/-/g, '')
}

export function formatCustomerId(raw: string) {
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  return raw
}

/** Exchange refresh token for a fresh access token */
export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string
  expiry: Date
}> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Token refresh failed: ${err.error_description || err.error}`)
  }
  const data = await res.json()
  return {
    access_token: data.access_token,
    expiry: new Date(Date.now() + data.expires_in * 1000),
  }
}

/**
 * List all customer accounts accessible to the authenticated Google Ads user.
 * Returns resource names like "customers/1234567890"
 */
export async function listAccessibleCustomers(accessToken: string): Promise<string[]> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (!developerToken) throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN not set')

  const res = await fetch(`${ADS_API_BASE}/customers:listAccessibleCustomers`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': developerToken,
    },
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`listAccessibleCustomers failed: ${JSON.stringify(err)}`)
  }
  const data = await res.json()
  return data.resourceNames || []
}

export type AdsCustomer = {
  id: string           // raw digits, e.g. "1234567890"
  formatted_id: string // formatted, e.g. "123-456-7890"
  name: string
  currency_code: string
  time_zone: string
  status: string
  is_manager: boolean
}

/** Get details for a single customer account */
export async function getCustomerDetails(
  accessToken: string,
  customerId: string,
  mccId: string
): Promise<AdsCustomer | null> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (!developerToken) throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN not set')

  const cleanId = stripDashes(customerId)
  const cleanMcc = stripDashes(mccId)

  const res = await fetch(`${ADS_API_BASE}/customers/${cleanId}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'login-customer-id': cleanMcc,
    },
  })
  if (!res.ok) return null

  const data = await res.json()
  return {
    id: cleanId,
    formatted_id: formatCustomerId(cleanId),
    name: data.descriptiveName || data.id,
    currency_code: data.currencyCode || 'USD',
    time_zone: data.timeZone || 'America/New_York',
    status: data.status || 'ENABLED',
    is_manager: data.manager || false,
  }
}

export type CampaignStat = {
  campaign_id: string
  campaign_name: string
  campaign_status: string
  campaign_type: string
  budget_micros: number
  spend: number        // dollars
  clicks: number
  impressions: number
  conversions: number
  ctr: number          // percentage 0-100
  avg_cpc: number      // dollars
  cost_per_conversion: number
  conversion_rate: number
}

/** Run GAQL campaign performance report for a customer */
export async function getCampaignStats(
  accessToken: string,
  customerId: string,
  mccId: string,
  dateRange: 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'LAST_MONTH' = 'LAST_30_DAYS'
): Promise<CampaignStat[]> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (!developerToken) throw new Error('GOOGLE_ADS_DEVELOPER_TOKEN not set')

  const cleanId = stripDashes(customerId)
  const cleanMcc = stripDashes(mccId)

  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.advertising_channel_type,
      campaign_budget.amount_micros,
      metrics.cost_micros,
      metrics.clicks,
      metrics.impressions,
      metrics.ctr,
      metrics.average_cpc,
      metrics.conversions,
      metrics.cost_per_conversion,
      metrics.conversion_rate
    FROM campaign
    WHERE segments.date DURING ${dateRange}
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.cost_micros DESC
    LIMIT 50
  `

  const res = await fetch(`${ADS_API_BASE}/customers/${cleanId}/googleAds:search`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'developer-token': developerToken,
      'login-customer-id': cleanMcc,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query }),
  })

  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Campaign report failed: ${JSON.stringify(err)}`)
  }

  const data = await res.json()
  const results = data.results || []

  return results.map((row: any) => {
    const costMicros = row.metrics?.costMicros || 0
    const clicks = row.metrics?.clicks || 0
    const impressions = row.metrics?.impressions || 0
    const conversions = row.metrics?.conversions || 0
    const avgCpcMicros = row.metrics?.averageCpc || 0
    const costPerConvMicros = row.metrics?.costPerConversion || 0

    return {
      campaign_id: String(row.campaign?.id || ''),
      campaign_name: row.campaign?.name || 'Unknown',
      campaign_status: row.campaign?.status || 'UNKNOWN',
      campaign_type: row.campaign?.advertisingChannelType || 'UNKNOWN',
      budget_micros: row.campaignBudget?.amountMicros || 0,
      spend: costMicros / 1_000_000,
      clicks: Number(clicks),
      impressions: Number(impressions),
      conversions: Number(conversions),
      ctr: (row.metrics?.ctr || 0) * 100,
      avg_cpc: avgCpcMicros / 1_000_000,
      cost_per_conversion: costPerConvMicros / 1_000_000,
      conversion_rate: (row.metrics?.conversionRate || 0) * 100,
    }
  })
}

/** Build Google OAuth URL with adwords scope */
export function buildGoogleAdsAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/google-ads/callback`,
    response_type: 'code',
    scope: 'https://www.googleapis.com/auth/adwords',
    access_type: 'offline',
    prompt: 'consent',
    state,
  })
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`
}

/** Exchange auth code for tokens */
export async function exchangeCodeForTokens(code: string): Promise<{
  access_token: string
  refresh_token: string
  expires_in: number
}> {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL}/api/google-ads/callback`,
      grant_type: 'authorization_code',
    }),
  })
  if (!res.ok) {
    const err = await res.json()
    throw new Error(`Code exchange failed: ${err.error_description || err.error}`)
  }
  return res.json()
}
