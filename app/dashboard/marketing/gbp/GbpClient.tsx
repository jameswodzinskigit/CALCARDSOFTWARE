'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import AdminMemoPanel, { Memo } from '@/components/AdminMemoPanel'
import GeoGridTab from './GeoGridTab'

interface GbpStat {
  id?: string
  month: string
  views: number
  searches: number
  calls: number
  directions: number
  website_clicks: number
}

interface GbpClientProps {
  stats: GbpStat[]
  memos: Memo[]
  companyId: string
  isSuperAdmin: boolean
  currentMonth: string
  hasPlaceId: boolean
}

const TABS = ['Overview', 'Rank Map'] as const
type Tab = typeof TABS[number]

export default function GbpClient({ stats, memos, companyId, isSuperAdmin, currentMonth, hasPlaceId }: GbpClientProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('Overview')

  const existing = stats.find(s => s.month === currentMonth)
  const [form, setForm] = useState({
    views: existing?.views?.toString() || '',
    searches: existing?.searches?.toString() || '',
    calls: existing?.calls?.toString() || '',
    directions: existing?.directions?.toString() || '',
    website_clicks: existing?.website_clicks?.toString() || '',
  })

  const now = new Date()
  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' })

  async function save() {
    setSaved(false)
    setErr('')
    const res = await fetch('/api/gbp-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month: currentMonth,
        views: Number(form.views) || 0,
        searches: Number(form.searches) || 0,
        calls: Number(form.calls) || 0,
        directions: Number(form.directions) || 0,
        website_clicks: Number(form.website_clicks) || 0,
      }),
    })
    if (res.ok) {
      setSaved(true)
      startTransition(() => router.refresh())
    } else {
      setErr('Failed to save')
    }
  }

  const fields: { key: keyof typeof form; label: string }[] = [
    { key: 'views', label: 'Profile Views' },
    { key: 'searches', label: 'Searches' },
    { key: 'calls', label: 'Calls' },
    { key: 'directions', label: 'Directions' },
    { key: 'website_clicks', label: 'Website Clicks' },
  ]

  return (
    <div className="space-y-6 page-fade-in">
      <div>
        <h1 className="text-white font-bold text-xl">Google Business Profile</h1>
        <p className="text-gray-500 text-sm mt-0.5">GBP performance &amp; local rank tracking</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
            style={activeTab === tab ? { backgroundColor: 'var(--brand-primary)' } : {}}
          >
            {tab === 'Rank Map' ? '🗺️ Rank Map' : '📍 ' + tab}
          </button>
        ))}
      </div>

      {activeTab === 'Overview' && (
        <>
          {/* Enter stats */}
          {isSuperAdmin && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="text-white font-semibold text-sm mb-4">Enter {monthLabel} Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                {fields.map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-400 mb-1">{label}</label>
                    <input
                      type="number"
                      min="0"
                      value={form[key]}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                    />
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={save}
                  disabled={pending}
                  className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
                >
                  {pending ? 'Saving...' : 'Save'}
                </button>
                {saved && <span className="text-green-400 text-sm">Saved!</span>}
                {err && <span className="text-red-400 text-sm">{err}</span>}
              </div>
            </div>
          )}

          {stats.length > 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <h2 className="text-white font-semibold text-sm">Monthly History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Month</th>
                      <th className="text-right px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Views</th>
                      <th className="text-right px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Searches</th>
                      <th className="text-right px-5 py-3 text-gray-400 text-xs font-medium uppercas