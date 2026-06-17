'use client'

import { useState } from 'react'
import AdminMemoPanel, { Memo } from '@/components/AdminMemoPanel'

const PLATFORMS = [
  { id: 'instagram', label: 'Instagram', emoji: '📸', color: '#E1306C' },
  { id: 'facebook', label: 'Facebook', emoji: '📘', color: '#1877F2' },
  { id: 'google', label: 'Google Business', emoji: '🔍', color: '#4285F4' },
  { id: 'tiktok', label: 'TikTok', emoji: '🎵', color: '#010101' },
]

interface SocialStat {
  id: string
  platform: string
  month: string
  followers: number
  posts_count: number
  reach: number
  impressions: number
  likes: number
  comments: number
  shares: number
  saves: number
  profile_visits: number
  website_clicks: number
}

interface Props {
  stats: SocialStat[]
  memos: Memo[]
  companyId: string
  companyName: string
  isSuperAdmin: boolean
  currentMonth: string
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="bg-gray-800/60 rounded-lg p-3 text-center">
      <p className="text-gray-400 text-xs mb-1">{label}</p>
      <p className="text-white font-bold text-lg">{value.toLocaleString()}</p>
    </div>
  )
}

const BLANK = {
  followers: '', posts_count: '', reach: '', impressions: '',
  likes: '', comments: '', shares: '', saves: '', profile_visits: '', website_clicks: ''
}

export default function SocialClient({ stats, memos, companyId, companyName, isSuperAdmin, currentMonth }: Props) {
  const [activePlatform, setActivePlatform] = useState(PLATFORMS[0].id)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')

  const platformStats = stats.filter(s => s.platform === activePlatform)
  const latestForPlatform = platformStats[0]
  const monthLabel = new Date(currentMonth + 'T12:00:00').toLocaleString('default', { month: 'long', year: 'numeric' })

  const existing = platformStats.find(s => s.month === currentMonth)
  const [form, setForm] = useState<Record<string, string>>({
    ...BLANK,
    ...Object.fromEntries(Object.keys(BLANK).map(k => [k, ((existing as any)?.[k] ?? '').toString().replace(/^0$/, '')])),
  })

  function handlePlatformChange(p: string) {
    setActivePlatform(p)
    setSaved(false)
    setErr('')
    const ex = stats.find(s => s.platform === p && s.month === currentMonth)
    setForm({ ...BLANK, ...Object.fromEntries(Object.keys(BLANK).map(k => [k, ((ex as any)?.[k] ?? '').toString().replace(/^0$/, '')])) })
  }

  async function handleSave() {
    setSaving(true); setSaved(false); setErr('')
    const res = await fetch('/api/social-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: companyId,
        platform: activePlatform,
        month: currentMonth,
        ...Object.fromEntries(Object.keys(BLANK).map(k => [k, Number(form[k]) || 0])),
      }),
    })
    if (res.ok) { setSaved(true); setTimeout(() => setSaved(false), 2000) }
    else setErr((await res.json()).error || 'Save failed')
    setSaving(false)
  }

  const platformMeta = PLATFORMS.find(p => p.id === activePlatform)!

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-white font-bold text-xl">Social Media</h1>
        <p className="text-gray-500 text-sm mt-0.5">{companyName} — engagement across all platforms</p>
      </div>

      {/* Platform tabs */}
      <div className="flex gap-2 flex-wrap">
        {PLATFORMS.map(p => (
          <button
            key={p.id}
            onClick={() => handlePlatformChange(p.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activePlatform === p.id
                ? 'bg-gray-700 text-white border border-gray-600'
                : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800'
            }`}
          >
            <span>{p.emoji}</span>
            <span>{p.label}</span>
            {stats.filter(s => s.platform === p.id).length > 0 && (
              <span className="text-xs bg-green-500/20 text-green-400 px-1.5 rounded-full">✓</span>
            )}
          </button>
        ))}
      </div>

      {/* Latest metrics grid */}
      {latestForPlatform && (
        <div className="bg-gray-900 rounded-xl border border-gray-800 p-5">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl">{platformMeta.emoji}</span>
            <h2 className="text-white font-semibold">{platformMeta.label} — Latest Snapshot</h2>
            <span className="text-gray-500 text-xs ml-auto">
              {new Date(latestForPlatform.month + 'T12:00:00').toLocaleString('default', { month: 'long', year: 'numeric' })}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <StatCard label="Followers" value={latestForPlatform.followers} />
            <StatCard label="Posts" value={latestForPlatform.posts_count} />
            <StatCard label="Reach" value={latestForPlatform.reach} />
            <StatCard label="Impressions" value={latestForPlatform.impressions} />
            <StatCard label="Likes" value={latestForPlatform.likes} />
            <StatCard label="Comments" value={latestForPlatform.comments} />
            <StatCard label="Shares" value={latestForPlatform.shares} />
            <StatCard label="Saves" value={latestForPlatform.saves} />
            <StatCard label="Profile Visits" value={latestForPlatform.profile_visits} />
            <StatCard label="Website Clicks" value={latestForPlatform.website_clicks} />
          </div>
        </div>
      )}

      {/* Manual entry — super admin only */}
      {isSuperAdmin && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h2 className="text-white font-semibold mb-4">
            Enter {platformMeta.label} Stats — {monthLabel}
          </h2>
          {err && <p className="text-red-400 text-sm mb-3">{err}</p>}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            {Object.keys(BLANK).map(k => (
              <div key={k}>
                <label className="text-xs text-gray-400 mb-1 block capitalize">{k.replace('_', ' ')}</label>
                <input
                  type="number"
                  min="0"
                  value={form[k]}
                  onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))}
                  placeholder="0"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                />
              </div>
            ))}
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="mt-4 px-5 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Stats'}
          </button>
        </div>
      )}

      {/* History table */}
      {platformStats.length > 1 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-800">
            <h2 className="text-white font-semibold">{platformMeta.label} History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-sm">
              <thead>
                <tr className="text-gray-400 text-xs uppercase tracking-wide border-b border-gray-800">
                  <th className="text-left px-5 py-3">Month</th>
                  <th className="text-right px-4 py-3">Followers</th>
                  <th className="text-right px-4 py-3">Reach</th>
                  <th className="text-right px-4 py-3">Impressions</th>
                  <th className="text-right px-4 py-3">Likes</th>
                  <th className="text-right px-4 py-3">Comments</th>
                  <th className="text-right px-4 py-3">Website Clicks</th>
                </tr>
              </thead>
              <tbody>
                {platformStats.map(s => (
                  <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-5 py-3 text-gray-300">
                      {new Date(s.month + 'T12:00:00').toLocaleString('default', { month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-4 py-3 text-right text-white tabular-nums">{s.followers.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-300 tabular-nums">{s.reach.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-300 tabular-nums">{s.impressions.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-300 tabular-nums">{s.likes.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-300 tabular-nums">{s.comments.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-gray-300 tabular-nums">{s.website_clicks.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Admin memo panel */}
      <AdminMemoPanel
        section="social"
        companyId={companyId}
        isSuperAdmin={isSuperAdmin}
        initialMemos={memos}
      />
    </div>
  )
}
