'use client'

import { useState } from 'react'

interface Props {
  companyName: string
  avgRating: string
  totalReviews: number
  positivePct: number
}

export default function ShareRatingCard({ companyName, avgRating, totalReviews, positivePct }: Props) {
  const [copied, setCopied] = useState(false)
  const [open, setOpen] = useState(false)

  const shareText = `⭐ ${avgRating} stars · ${totalReviews.toLocaleString()} Google reviews · ${positivePct}% positive\n\n${companyName} — trusted by hundreds of local customers.\n\n#LocalBusiness #GoogleReviews`

  async function copy() {
    try {
      await navigator.clipboard.writeText(shareText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select text
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 transition-colors flex items-center gap-2 h-10"
      >
        📤 Share Rating
      </button>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">Share Your Rating</h3>
        <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-white text-xs">✕ Close</button>
      </div>

      {/* Preview card */}
      <div className="rounded-xl border p-5 text-center space-y-2" style={{ borderColor: 'var(--brand-primary)', backgroundColor: 'var(--brand-primary)' + '0d' }}>
        <p className="text-yellow-400 text-2xl">⭐ {avgRating}</p>
        <p className="text-white font-bold text-lg">{companyName}</p>
        <p className="text-gray-300 text-sm">{totalReviews.toLocaleString()} Google reviews · {positivePct}% positive</p>
      </div>

      {/* Copy text */}
      <div className="bg-gray-800 rounded-lg p-3">
        <p className="text-gray-300 text-xs font-mono whitespace-pre-wrap leading-relaxed">{shareText}</p>
      </div>

      <button
        onClick={copy}
        className="w-full py-2.5 text-sm font-semibold rounded-lg transition-colors text-white"
        style={{ backgroundColor: 'var(--brand-primary)' }}
      >
        {copied ? '✓ Copied!' : '📋 Copy to Clipboard'}
      </button>
    </div>
  )
}
