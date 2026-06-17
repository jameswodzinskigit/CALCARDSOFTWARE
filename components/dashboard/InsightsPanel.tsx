'use client'

import { useState } from 'react'

interface InsightsPanelProps {
  initialInsights: string[]
  initialGeneratedAt: string | null
  isAdmin: boolean
  summary?: string
}

export default function InsightsPanel({ initialInsights, initialGeneratedAt, isAdmin, summary }: InsightsPanelProps) {
  const [insights, setInsights] = useState(initialInsights)
  const [generatedAt, setGeneratedAt] = useState(initialGeneratedAt)
  const [loading, setLoading] = useState(false)
  const [visible, setVisible] = useState(true)

  async function regenerate() {
    setLoading(true)
    try {
      const res = await fetch('/api/insights', { method: 'POST' })
      if (res.ok) {
        const data = await res.json()
        setInsights(data.insights || [])
        setGeneratedAt(data.generated_at || null)
      }
    } finally {
      setLoading(false)
    }
  }

  function formatDate(iso: string | null) {
    if (!iso) return null
    const d = new Date(iso)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (!visible) return null

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-900/80 border border-gray-700 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-lg">🧠</span>
          <h2 className="text-white font-semibold text-sm">AI Insights</h2>
          {generatedAt && (
            <span className="text-gray-500 text-xs">· Updated {formatDate(generatedAt)}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {isAdmin && (
            <button
              onClick={regenerate}
              disabled={loading}
              className="text-xs text-gray-400 hover:text-white transition-colors px-2 py-1 rounded hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? '⟳ Refreshing…' : '↻ Refresh'}
            </button>
          )}
          <button
            onClick={() => setVisible(false)}
            className="text-gray-600 hover:text-gray-400 text-sm transition-colors"
            aria-label="Dismiss"
          >
            ✕
          </button>
        </div>
      </div>
      <div className="p-5">
        {summary && (
          <div className="bg-gray-800/60 border border-gray-700 rounded-lg p-4 mb-4">
            <p className="text-gray-300 text-sm leading-relaxed">{summary}</p>
          </div>
        )}
        {loading && insights.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-4 bg-gray-800 rounded animate-pulse" style={{ width: `${70 + i * 10}%` }} />
            ))}
          </div>
        ) : insights.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-gray-500 text-sm">No insights yet.</p>
            {isAdmin && (
              <button onClick={regenerate} className="mt-2 text-xs text-green-400 hover:text-green-300 underline">
                Generate now
              </button>
            )}
          </div>
        ) : (
          <ul className="space-y-3">
            {insights.map((insight, i) => (
              <li key={i} className="flex gap-3 items-start">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0 mt-1.5" />
                <p className="text-gray-200 text-sm leading-relaxed">{insight}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
