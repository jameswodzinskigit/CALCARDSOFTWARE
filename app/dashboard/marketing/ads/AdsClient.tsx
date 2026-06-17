'use client'
import { useState, useTransition, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AdminMemoPanel, { Memo } from '@/components/AdminMemoPanel'

// ── Live Google Ads types ──
type DateRange = 'LAST_7_DAYS' | 'LAST_30_DAYS' | 'THIS_MONTH' | 'LAST_MONTH'
interface CampaignStat {
  campaign_id: string
  campaign_name: string
  campaign_status: string
  campaign_type: string
  budget_micros: number
  spend: number
  clicks: number
  impressions: number
  conversions: number
  ctr: number
  avg_cpc: number
  cost_per_conversion: number
  conversion_rate: number
}
interface LiveData {
  account_name: string
  customer_id: string
  date_range: string
  campaigns: CampaignStat[]
}

function fmt$(n: number) { return '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) }
function fmtPct(n: number) { return (n * 100).toFixed(2) + '%' }

function LiveCampaignsTab({ companyId, isSuperAdmin }: { companyId: string; isSuperAdmin: boolean }) {
  const [range, setRange] = useState<DateRange>('LAST_30_DAYS')
  const [data, setData] = useState<LiveData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [noAssignment, setNoAssignment] = useState(false)
  const [needsReconnect, setNeedsReconnect] = useState(false)

  const fetchData = useCallback(async (r: DateRange) => {
    setLoading(true); setError(''); setNoAssignment(false); setNeedsReconnect(false)
    const url = `/api/google-ads/campaigns?range=${r}${isSuperAdmin ? `&company_id=${companyId}` : ''}`
    try {
      const res = await fetch(url)
      const json = await res.json()
      if (res.ok) {
        setData(json)
      } else if (json.no_assignment) {
        setNoAssignment(true)
      } else if (json.needs_reconnect) {
        setNeedsReconnect(true)
      } else {
        setError(json.error || 'Failed to load campaign data')
      }
    } catch {
      setError('Network error')
    }
    setLoading(false)
  }, [companyId, isSuperAdmin])

  useEffect(() => { fetchData(range) }, [range, fetchData])

  const totals = data?.campaigns.reduce((acc, c) => ({
    spend: acc.spend + c.spend,
    clicks: acc.clicks + c.clicks,
    impressions: acc.impressions + c.impressions,
    conversions: acc.conversions + c.conversions,
  }), { spend: 0, clicks: 0, impressions: 0, conversions: 0 })

  const totalCtr = totals && totals.impressions > 0 ? totals.clicks / totals.impressions : 0
  const totalCpl = totals && totals.conversions > 0 ? totals.spend / totals.conversions : 0

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <div className="text-gray-500 text-sm">Loading campaign data…</div>
    </div>
  )

  if (noAssignment) return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl py-12 text-center px-6">
      <p className="text-2xl mb-3">📊</p>
      <p className="text-white font-semibold text-sm">No Google Ads account assigned</p>
      <p className="text-gray-500 text-xs mt-1">Ask your account manager to link a Google Ads account to this dashboard.</p>
    </div>
  )

  if (needsReconnect) return (
    <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl py-12 text-center px-6">
      <p className="text-2xl mb-3">🔑</p>
      <p className="text-amber-300 font-semibold text-sm">Google Ads connection expired</p>
      <p className="text-amber-400/70 text-xs mt-1">CAL Marketing needs to reauthorize the Google Ads connection.</p>
    </div>
  )

  if (error) return (
    <div className="bg-red-900/20 border border-red-700/40 rounded-xl py-8 px-5 text-center">
      <p className="text-red-300 text-sm">{error}</p>
      <button onClick={() => fetchData(range)} className="mt-3 text-xs text-red-400 hover:text-red-300">Retry</button>
    </div>
  )

  return (
    <div className="space-y-5">
      {/* Header row */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          {data && <p className="text-white font-medium text-sm">{data.account_name}</p>}
          <p className="text-gray-500 text-xs">{data?.customer_id}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={range}
            onChange={e => setRange(e.target.value as DateRange)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none"
          >
            <option value="LAST_7_DAYS">Last 7 Days</option>
            <option value="LAST_30_DAYS">Last 30 Days</option>
            <option value="THIS_MONTH">This Month</option>
            <option value="LAST_MONTH">Last Month</option>
          </select>
          <button onClick={() => fetchData(range)} className="bg-gray-800 hover:bg-gray-700 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs transition-colors">
            ⟳ Refresh
          </button>
        </div>
      </div>

      {/* KPI cards */}
      {totals && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Total Spend', value: fmt$(totals.spend), color: 'text-white' },
            { label: 'Clicks', value: totals.clicks.toLocaleString(), color: 'text-white' },
            { label: 'Impressions', value: totals.impressions.toLocaleString(), color: 'text-white' },
            { label: 'Conversions', value: totals.conversions.toFixed(1), color: 'text-green-400' },
            { label: 'CTR', value: fmtPct(totalCtr), color: 'text-blue-400' },
            { label: 'Cost / Conv.', value: totalCpl > 0 ? fmt$(totalCpl) : '--', color: 'text-amber-400' },
          ].map(c => (
            <div key={c.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wide">{c.label}</p>
              <p className={`font-bold text-x