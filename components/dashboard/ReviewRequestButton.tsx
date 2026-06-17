'use client'

import { useState } from 'react'

interface ReviewRequestButtonProps {
  employees: { first_name: string; slug: string | null }[]
}

export default function ReviewRequestButton({ employees }: ReviewRequestButtonProps) {
  const [open, setOpen] = useState(false)
  const [selectedEmployee, setSelectedEmployee] = useState(employees[0] || null)
  const [copied, setCopied] = useState(false)

  const activeEmployees = employees.filter(e => e.slug)
  const emp = selectedEmployee?.slug ? selectedEmployee : activeEmployees[0] || null

  const reviewUrl = emp?.slug ? `https://calcardai.netlify.app/u/${emp.slug}` : null
  const smsText = reviewUrl
    ? `Hi! Thanks for choosing us — we'd love your feedback. Could you leave us a quick Google review? It only takes a minute: ${reviewUrl}`
    : ''

  async function copy() {
    if (!smsText) return
    try {
      await navigator.clipboard.writeText(smsText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        <span>📲</span> Request a Review
      </button>
    )
  }

  return (
    <div className="bg-gray-900 border border-gray-700 rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-white font-semibold text-sm">📲 Send Review Request</h3>
        <button onClick={() => setOpen(false)} className="text-gray-500 hover:text-gray-300 text-sm">✕</button>
      </div>

      {activeEmployees.length > 1 && (
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Select employee</label>
          <div className="flex flex-wrap gap-2">
            {activeEmployees.map(e => (
              <button
                key={e.slug}
                onClick={() => setSelectedEmployee(e)}
                className={'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors border ' + (emp?.slug === e.slug ? 'bg-green-600 border-green-500 text-white' : 'bg-gray-800 border-gray-700 text-gray-300 hover:border-gray-600')}
              >
                {e.first_name}
              </button>
            ))}
          </div>
        </div>
      )}

      {smsText ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Pre-filled SMS message</label>
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 leading-relaxed">
              {smsText}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={copy}
              className={'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ' + (copied ? 'bg-green-600 text-white' : 'bg-gray-700 hover:bg-gray-600 text-white')}
            >
              {copied ? '✓ Copied!' : '📋 Copy to clipboard'}
            </button>
            {emp?.slug && (
              <a
                href={`sms:?body=${encodeURIComponent(smsText)}`}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              >
                💬 Open in Messages
              </a>
            )}
          </div>
          <p className="text-gray-600 text-xs">Copy and paste into any messaging app, or tap "Open in Messages" on mobile.</p>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No active NFC card found for this employee. Activate a card first.</p>
      )}
    </div>
  )
}
