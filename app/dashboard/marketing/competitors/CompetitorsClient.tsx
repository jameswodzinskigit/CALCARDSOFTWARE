'use client'

import { useState } from 'react'
import AdminMemoPanel, { Memo } from '@/components/AdminMemoPanel'

interface Competitor {
  name: string
  review_count: number
  star_rating: number
  snapshot_date: string
  google_place_id: string | null
}

interface HistoryRow {
  competitor_name: string
  review_count: number | null
  snapshot_date: string
}

interface Props {
  company: { name: string; review_count: number; star_rating: number }
  competitors: Competitor[]
  history: HistoryRow[]
  memos: Memo[]
  companyId: string
  isSuperAdmin: boolean
}

function StarRating({ value }: { value: number }) {
  const full = Math.floor(value)
  const half = value - full >= 0.5
  const empty = 5 - full - (half ? 1 : 0)
  return (
    <span className="text-yellow-400 text-sm">
      {'★'.repeat(full)}{half ? '½' : ''}{'☆'.repeat(empty)}
      <span className="ml-1 text-gray-300">{value.toFixed(1)}</span>
    </span>
  )
}

export default function CompetitorsClient({ company, competitors, history, memos, companyId, isSuperAdmin }: Props) {
  const [syncing, setSyncing] = useState(false)
  const [syncResult, setSyncResult] = useState<string | null>(null)

  const allEntries = [
    { name: company.name, review_count: company.review_count, star_rating: company.star_rating, isUs: true },
    ...competitors.map(c => ({ ...c, isUs: false })),
  ].sort((a, b) => b.review_count - a.review_count)

  const maxReviews = Math.max(...allEntries.map(e => e.review_count), 1)
  const ourRank = allEntries.findIndex(e => e.isUs) + 1

  async function handleSync() {
    setSyncing(true)
    setSyncResult(null)
    try {
      const res = await fetch('/api/competitors/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) })
      const json = await res.json()
      if (json.synced !== undefined) {
        setSyncResult(json.synced > 0 ? `Synced ${json.synced} competitor(s) via Google Places.` : 'No Place IDs configured yet — add them in admin to enable live sync.')
      } else {
        setSyncResult(json.error || 'Unknown error')
      }
    } catch {
      setSyncResult('Sync failed — check network.')
    } finally {
      setSyncing(false)
    }
  }

  const reviewsToFirst = allEntries[0]?.isUs ? 0 : (allEntries[0]?.review_count ?? 0) - company.review_count
  const reviewsToNext = ourRank > 1 ? allEntries[ourRank - 2]?.review_count - company.review_count : 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">Competitor Tracker</h1>
          <p className="text-gray-500 text-sm mt-0.5">See how {company.name} stacks up against local competitors</p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          {syncing ? 'Syncing…' : '↻ Sync Now'}
        </button>
      </div>

      {syncResult && (
        <div className="bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm text-gray-300">
          {syncResult}
        </div>
      )}

      {/* Rank summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-xs uppercase tracking-wide">Our Reviews</p>
          <p className="text-3xl font-bold text-white mt-1">{company.review_count.toLocaleString()}</p>
          <StarRating value={company.star_rating} />
        </div>
        <div className="bg-gray-900 rounded-xl p-4 border border-gray-800">
          <p className="text-gray-400 text-xs uppercase tracking-wide">Rank</p>
          <p className="text-3xl font-bold text-white mt-1">#{ourRank}</p>
          <p className="text-gray-400 text-xs mt-1">of {allEntries.length} in market</p>
        </div>
        <div className={`rounded-xl p-4 border ${reviewsToFirst <= 0 ? 'bg-green-900/30 border-green-800' : 'bg-gray-900 border-gray-800'}`}>
          <p className="text-gray-400 text-xs uppercase tracking-wide">To #1 Spot</p>
          {reviewsToFirst <= 0 ? (
            <p className="text-2xl font-bold text-green-400 mt-1">You&apos;re #1!</p>
          ) : (
            <>
              <p className="text-3xl font-bold text-white mt-1">+{reviewsToFirst.toLocaleString()}</p>
              <p className="text-gray-400 text-xs mt-1">reviews needed</p>
            </>
          )}
        </div>
        <div className={`rounded-xl p-4 border ${reviewsToNext <= 0 ? 'bg-green-900/30 border-green-800' : 'bg-amber-900/30 border-amber-800'}`}>
          <p className="text-gray-400 text-xs uppercase tracking-wide">Next Rank Up</p>
          {reviewsToNext <= 0 ? (
            <p className="text-2xl font-bold text-green-400 mt-1">Top position</p>
          ) : (
            <>
              <p className="text-3xl font-bold text-amber-300 mt-1">+{reviewsToNext.toLocaleString()}</p>
              <p className="text-gray-400 text-xs mt-1">to pass {allEntries[ourRank - 2]?.name?.split(' ')[0]}</p>
            </>
          )}
        </div>
      </div>

      {/* No competitors yet */}
      {competitors.length === 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl py-14 text-center">
          <p className="text-4xl mb-3">&#128202;</p>
          <p className="text-white font-semibold">No competitors added yet</p>
          <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">Your CAL team will add local competitors so you can track how you stack up in your market</p>
        </div>
      )}

      {/* Bar chart + detail table — only when competitors exist */}
      {competitors.length > 0 && (
      <>
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-6">
        <h2 className="text-white font-semibold mb-6">Review Count Comparison</h2>
        <div className="space-y-4">
          {allEntries.map((entry) => {
            const pct = (entry.review_count / maxReviews) * 100
            const isUs = entry.isUs
            return (
              <div key={entry.name}>
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`text-sm font-medium ${isUs ? 'text-blue-400' : 'text-gray-300'}`}>
                      {isUs ? '● ' : ''}{entry.name}
                    </span>
                    {isUs && <span className="text-xs bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full">You</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <StarRating value={entry.star_rating} />
                    <span className={`text-sm font-bold tabular-nums ${isUs ? 'text-white' : 'text-gray-300'}`}>
                      {entry.review_count.toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="h-5 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${isUs ? 'bg-blue-500' : 'bg-gray-600'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {!isUs && !entry.isUs && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {entry.review_count > company.review_count
                      ? `▲ ${(entry.review_count - company.review_count).toLocaleString()} ahead of you`
                      : `▼ ${(company.review_count - entry.review_count).toLocaleString()} behind you`}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Star rating comparison table */}
      <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-800">
          <h2 className="text-white font-semibold">Side-by-Side Detail</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] text-sm">
            <thead>
              <tr className="text-gray-400 text-xs uppercase tracking-wide border-b border-gray-800">
                <th className="text-left px-6 py-3">Business</th>
                <th className="text-right px-4 py-3">Reviews</th>
                <th className="text-right px-4 py-3">Stars</th>
                <th className="text-right px-4 py-3">vs. You</th>
                <th className="text-right px-4 py-3">Last Updated</th>
              </tr>
            </thead>
            <tbody>
              {allEntries.map((entry, i) => {
                const delta = entry.review_count - company.review_count
                const isUs = entry.isUs
                return (
                  <tr
                    key={entry.name}
                    className={`border-b border-gray-800/50 ${isUs ? 'bg-blue-900/20' : i % 2 === 0 ? 'bg-gray-900' : 'bg-gray-900/50'}`}
                  >
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${isUs ? 'text-blue-400' : 'text-gray-200'}`}>{entry.name}</span>
                        {isUs && <span className="text-xs bg-blue-900/60 text-blue-300 px-2 py-0.5 rounded-full">You</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-white tabular-nums">
                      {entry.review_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <StarRating value={entry.star_rating} />
                    </td>
                    <td className="px-4 py-3 text-right tabular-nums">
                      {isUs ? (
                        <span className="text-gray-500">&mdash;</span>
                      ) : delta > 0 ? (
                        <span className="text-red-400">+{delta.toLocaleString()} ahead</span>
                      ) : delta < 0 ? (
                        <span className="text-green-400">{Math.abs(delta).toLocaleString()} behind</span>
                      ) : (
                       