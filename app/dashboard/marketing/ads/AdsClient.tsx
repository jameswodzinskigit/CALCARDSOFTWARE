'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import AdminMemoPanel, { Memo } from '@/components/AdminMemoPanel'

interface AdStat {
  id?: string
  month: string
  spend: number
  clicks: number
  leads: number
  calls: number
}

interface AdKeyword {
  id: string
  keyword: string
  match_type: string | null
  impressions: number
  clicks: number
  conversions: number
  cost_cents: number
  avg_cpc_cents: number
  quality_score: number | null
  month: string
}

function calcCpl(spend: number, leads: number) {
  return leads > 0 ? '$' + (spend / leads).toFixed(2) : '--'
}

function centsToStr(cents: number) {
  return '$' + (cents / 100).toFixed(2)
}

interface Props {
  stats: AdStat[]
  keywords: AdKeyword[]
  memos: Memo[]
  companyId: string
  isSuperAdmin: boolean
  currentMonth: string
}

const TABS = ['Overview', 'Keywords', 'Notes'] as const
type Tab = typeof TABS[number]

export default function AdsClient({ stats, keywords, memos, companyId, isSuperAdmin, currentMonth }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('Overview')

  const existing = stats.find(s => s.month === currentMonth)
  const [form, setForm] = useState({
    spend: existing?.spend?.toString() || '',
    clicks: existing?.clicks?.toString() || '',
    leads: existing?.leads?.toString() || '',
    calls: existing?.calls?.toString() || '',
  })

  // Keyword entry form (super admin)
  const [kwForm, setKwForm] = useState({
    keyword: '', match_type: 'Broad', impressions: '', clicks: '', conversions: '', cost_cents: '', avg_cpc_cents: '', quality_score: '', month: currentMonth,
  })
  const [kwSaving, setKwSaving] = useState(false)
  const [kwSaved, setKwSaved] = useState(false)
  const [kwErr, setKwErr] = useState('')

  const now = new Date()
  const monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' })

  async function save() {
    setSaved(false); setErr('')
    const res = await fetch('/api/ad-stats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        month: currentMonth,
        spend: Number(form.spend) || 0,
        clicks: Number(form.clicks) || 0,
        leads: Number(form.leads) || 0,
        calls: Number(form.calls) || 0,
      }),
    })
    if (res.ok) { setSaved(true); startTransition(() => router.refresh()) }
    else setErr('Failed to save')
  }

  async function saveKeyword() {
    setKwSaving(true); setKwSaved(false); setKwErr('')
    const res = await fetch('/api/ad-keywords', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        company_id: companyId,
        keyword: kwForm.keyword.trim(),
        match_type: kwForm.match_type || null,
        impressions: Number(kwForm.impressions) || 0,
        clicks: Number(kwForm.clicks) || 0,
        conversions: Number(kwForm.conversions) || 0,
        cost_cents: Math.round((Number(kwForm.cost_cents) || 0) * 100),
        avg_cpc_cents: Math.round((Number(kwForm.avg_cpc_cents) || 0) * 100),
        quality_score: kwForm.quality_score ? Number(kwForm.quality_score) : null,
        month: kwForm.month,
      }),
    })
    if (res.ok) {
      setKwSaved(true)
      setKwForm(f => ({ ...f, keyword: '', impressions: '', clicks: '', conversions: '', cost_cents: '', avg_cpc_cents: '', quality_score: '' }))
      startTransition(() => router.refresh())
    } else {
      setKwErr((await res.json()).error || 'Failed to save')
    }
    setKwSaving(false)
  }

  const previewCpl = form.spend && form.leads && Number(form.leads) > 0
    ? calcCpl(Number(form.spend), Number(form.leads))
    : null

  return (
    <div className="space-y-6 page-fade-in">
      <div>
        <h1 className="text-white font-bold text-xl">Ads Dashboard</h1>
        <p className="text-gray-500 text-sm mt-0.5">Google Ads performance for {monthLabel}</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ' + (
              activeTab === tab
                ? 'border-green-500 text-white'
                : 'border-transparent text-gray-400 hover:text-white'
            )}
          >
            {tab}
            {tab === 'Notes' && memos.length > 0 && (
              <span className="ml-1.5 text-xs bg-amber-500/20 text-amber-400 px-1.5 rounded-full">{memos.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ── */}
      {activeTab === 'Overview' && (
        <>
          {isSuperAdmin && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="text-white font-semibold text-sm mb-4">Enter {monthLabel} Stats</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {([
                  { key: 'spend', label: 'Ad Spend ($)' },
                  { key: 'clicks', label: 'Clicks' },
                  { key: 'leads', label: 'Leads' },
                  { key: 'calls', label: 'Calls' },
                ] as { key: keyof typeof form; label: string }[]).map(({ key, label }) => (
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
              <div className="flex items-center gap-4 flex-wrap">
                <button
                  onClick={save}
                  disabled={pending}
                  className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
                >
                  {pending ? 'Saving...' : 'Save'}
                </button>
                {saved && <span className="text-green-400 text-sm">Saved!</span>}
                {err && <span className="text-red-400 text-sm">{err}</span>}
                {previewCpl && (
                  <p className="ml-auto text-sm text-gray-400">Est. CPL: <span className="text-green-400 font-bold">{previewCpl}</span></p>
                )}
              </div>
            </div>
          )}

          {/* Empty state */}
          {stats.length === 0 && !isSuperAdmin && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl py-16 text-center">
              <p className="text-4xl mb-3">&#127919;</p>
              <p className="text-white font-semibold">No ad data yet</p>
              <p className="text-gray-500 text-sm mt-1">Your CAL team will add your Google Ads performance data here each month</p>
            </div>
          )}

          {/* KPI cards for latest month */}
          {stats.length > 0 && (() => {
            const latest = stats[0]
            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Ad Spend', value: '$' + latest.spend.toLocaleString() },
                  { label: 'Clicks', value: latest.clicks.toLocaleString() },
                  { label: 'Leads', value: latest.leads.toLocaleString() },
                  { label: 'Cost / Lead', value: calcCpl(latest.spend, latest.leads) },
                ].map(card => (
                  <div key={card.label} className="bg-gray-900 border border-gray-800 rounded-xl p-4">
                    <p className="text-gray-400 text-xs uppercase tracking-wide">{card.label}</p>
                    <p className="text-white font-bold text-2xl mt-1">{card.value}</p>
                  </div>
                ))}
              </div>
            )
          })()}

          {stats.length > 0 && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <h2 className="text-white font-semibold text-sm">Monthly History</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px]">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Month</th>
                      <th className="text-right px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Spend</th>
                      <th className="text-right px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Clicks</th>
                      <th className="text-right px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Leads</th>
                      <th className="text-right px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Calls</th>
                      <th className="text-right px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">CPL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {stats.map((s) => (
                      <tr key={s.month} className="hover:bg-gray-800/50 transition-colors">
                        <td className="px-5 py-3 text-white text-sm">
                          {new Date(s.month + 'T12:00:00').toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                        </td>
                        <td className="px-5 py-3 text-gray-300 text-sm text-right">${s.spend.toFixed(0)}</td>
                        <td className="px-5 py-3 text-gray-300 text-sm text-right">{s.clicks}</td>
                        <td className="px-5 py-3 text-gray-300 text-sm text-right">{s.leads}</td>
                        <td className="px-5 py-3 text-gray-300 text-sm text-right">{s.calls}</td>
                        <td className="px-5 py-3 text-green-400 font-bold text-sm text-right">{calcCpl(s.spend, s.leads)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── KEYWORDS TAB ── */}
      {activeTab === 'Keywords' && (
        <div className="space-y-6">
          {isSuperAdmin && (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="text-white font-semibold text-sm mb-4">Add / Update Keyword</h2>
              {kwErr && <p className="text-red-400 text-sm mb-3">{kwErr}</p>}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {[
                  { key: 'keyword', label: 'Keyword', type: 'text', placeholder: 'e.g. septic service' },
                  { key: 'match_type', label: 'Match Type', type: 'text', placeholder: 'Broad / Exact / Phrase' },
                  { key: 'impressions', label: 'Impressions', type: 'number', placeholder: '0' },
                  { key: 'clicks', label: 'Clicks', type: 'number', placeholder: '0' },
                  { key: 'conversions', label: 'Conversions', type: 'number', placeholder: '0' },
                  { key: 'cost_cents', label: 'Cost ($)', type: 'number', placeholder: '0.00' },
                  { key: 'avg_cpc_cents', label: 'Avg CPC ($)', type: 'number', placeholder: '0.00' },
                  { key: 'quality_score', label: 'Quality Score (1-10)', type: 'number', placeholder: '—' },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs text-gray-400 mb-1 block">{label}</label>
                    <input
                      type={type}
                      value={(kwForm as any)[key]}
                      onChange={e => setKwForm(f => ({ ...f, [key]: e.target.value }))}
                      placeholder={placeholder}
                      className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                    />
                  </div>
                ))}
                <div>
                  <label className="text-xs text-gray-400 mb-1 block">Month</label>
                  <input
                    type="month"
                    value={kwForm.month.slice(0, 7)}
                    onChange={e => setKwForm(f => ({ ...f, month: e.target.value + '-01' }))}
                    className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
              <button
                onClick={saveKeyword}
                disabled={kwSaving || !kwForm.keyword.trim()}
                className="mt-4 px-5 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {kwSaving ? 'Saving…' : kwSaved ? '✓ Saved!' : 'Save Keyword'}
              </button>
            </div>
          )}

          {keywords.length > 0 ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between">
                <h2 className="text-white font-semibold text-sm">Keyword Performance</h2>
                <span className="text-gray-500 text-xs">{keywords.length} keywords tracked</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[700px] text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400 text-xs uppercase tracking-wide">
                      <th className="text-left px-5 py-3">Keyword</th>
                      <th className="text-left px-3 py-3">Match</th>
                      <th className="text-right px-3 py-3">Impressions</th>
                      <th className="text-right px-3 py-3">Clicks</th>
                      <th className="text-right px-3 py-3">CTR</th>
                      <th className="text-right px-3 py-3">Conversions</th>
                      <th className="text-right px-3 py-3">Cost</th>
                      <th className="text-right px-3 py-3">Avg CPC</th>
                      <th className="text-right px-3 py-3">QS</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {keywords.map(kw => {
                      const ctr = kw.impressions > 0 ? ((kw.clicks / kw.impressions) * 100).toFixed(1) + '%' : '--'
                      return (
                        <tr key={kw.id} className="hover:bg-gray-800/40 transition-colors">
                          <td className="px-5 py-3 text-white font-medium">{kw.keyword}</td>
                          <td className="px-3 py-3 text-gray-400">{kw.match_type || '--'}</td>
                          <td className="px-3 py-3 text-right text-gray-300 tabular-nums">{kw.impressions.toLocaleString()}</td>
                          <td className="px-3 py-3 text-right text-gray-300 tabular-nums">{kw.clicks.toLocaleString()}</td>
                          <td className="px-3 py-3 text-right text-blue-400 tabular-nums">{ctr}</td>
                          <td className="px-3 py-3 text-right text-green-400 tabular-nums">{kw.conversions}</td>
                          <td className="px-3 py-3 text-right text-gray-300 tabular-nums">{centsToStr(kw.cost_cents)}</td>
                          <td className="px-3 py-3 text-right text-gray-300 tabular-nums">{centsToStr(kw.avg_cpc_cents)}</td>
                          <td className="px-3 py-3 text-right tabular-nums">
                            {kw.quality_score != null ? (
                              <span className={kw.quality_score >= 7 ? 'text-green-400' : kw.quality_score >= 4 ? 'text-yellow-400' : 'text-red-400'}>
                                {kw.quality_score}/10
                              </span>
                            ) : (
                              <span className="text-gray-600">--</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-12 text-center">
              <p className="text-gray-400 text-sm">No keywords tracked yet.</p>
              {isSuperAdmin && <p className="text-gray-600 text-xs mt-1">Use the form above to add keyword performance data.</p>}
            </div>
          )}
        </div>
      )}

      {/* ── NOTES TAB ── */}
      {activeTab === 'Notes' && (
        <AdminMemoPanel
          section="ads"
          companyId={companyId}
          isSuperAdmin={isSuperAdmin}
          initialMemos={memos}
        />
      )}
    </div>
  )
}
