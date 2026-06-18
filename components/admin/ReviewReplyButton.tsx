'use client'

import { useState } from 'react'

interface Props {
  reviewId: string
  existingReply?: string | null
  repliedAt?: string | null
}

export default function ReviewReplyButton({ reviewId, existingReply, repliedAt }: Props) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState(existingReply || '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [savedText, setSavedText] = useState(existingReply || '')
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    if (!text.trim()) return
    setSaving(true)
    setError(null)
    try {
      const res = await fetch(`/api/reviews/${reviewId}/reply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply_text: text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to save')
      setSavedText(text)
      setSaved(true)
      setOpen(false)
    } catch (e: any) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const displayReply = savedText || existingReply

  return (
    <div className="mt-2">
      {displayReply && !open && (
        <div className="text-xs bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 mb-2">
          <span className="text-gray-500">Reply: </span>
          <span className="text-gray-300">{displayReply}</span>
          {repliedAt && !saved && (
            <span className="text-gray-600 ml-2">· {new Date(repliedAt).toLocaleDateString()}</span>
          )}
          {saved && <span className="text-green-500 ml-2">· just saved</span>}
        </div>
      )}

      {!open ? (
        <button
          onClick={() => setOpen(true)}
          className="text-xs px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition-colors"
        >
          {displayReply ? '✏️ Edit reply' : '💬 Reply'}
        </button>
      ) : (
        <div className="space-y-2">
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Write your reply to this review..."
            rows={3}
            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-600 focus:outline-none focus:border-green-500 resize-none"
            autoFocus
          />
          {error && <p className="text-xs text-red-400">{error}</p>}
          <div className="flex items-center gap-2">
            <button
              onClick={handleSubmit}
              disabled={saving || !text.trim()}
              className="text-xs px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium transition-colors"
            >
              {saving ? 'Saving…' : 'Save Reply'}
            </button>
            <button
              onClick={() => { setOpen(false); setText(displayReply || '') }}
              className="text-xs px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
