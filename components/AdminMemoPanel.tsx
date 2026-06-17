'use client'

import { useState } from 'react'

export interface Memo {
  id: string
  body: string
  author_name: string | null
  is_pinned: boolean
  created_at: string
  section: string
}

interface Props {
  section: string
  companyId: string
  isSuperAdmin: boolean
  initialMemos: Memo[]
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return mins <= 1 ? 'just now' : `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export default function AdminMemoPanel({ section, companyId, isSuperAdmin, initialMemos }: Props) {
  const [memos, setMemos] = useState<Memo[]>(initialMemos)
  const [body, setBody] = useState('')
  const [isPinned, setIsPinned] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [editBody, setEditBody] = useState('')
  const [open, setOpen] = useState(true)

  const pinnedMemos = memos.filter(m => m.is_pinned)
  const normalMemos = memos.filter(m => !m.is_pinned)
  const displayed = [...pinnedMemos, ...normalMemos]

  async function refresh() {
    const res = await fetch(`/api/admin/memos?company_id=${companyId}&section=${section}`)
    if (res.ok) setMemos(await res.json())
  }

  async function addMemo() {
    if (!body.trim()) return
    setSaving(true)
    await fetch('/api/admin/memos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: companyId, section, memo_body: body, is_pinned: isPinned }),
    })
    setBody('')
    setIsPinned(false)
    await refresh()
    setSaving(false)
  }

  async function deleteMemo(id: string) {
    await fetch(`/api/admin/memos?id=${id}`, { method: 'DELETE' })
    await refresh()
  }

  async function saveEdit(id: string) {
    await fetch(`/api/admin/memos?id=${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memo_body: editBody }),
    })
    setEditing(null)
    await refresh()
  }

  async function togglePin(memo: Memo) {
    await fetch(`/api/admin/memos?id=${memo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_pinned: !memo.is_pinned }),
    })
    await refresh()
  }

  if (!isSuperAdmin && displayed.length === 0) return null

  return (
    <div
      className="bg-gray-900 border rounded-xl overflow-hidden"
      style={{ borderColor: 'var(--brand-primary)' }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <span className="text-lg">📋</span>
          <div className="text-left">
            <p className="font-semibold text-sm" style={{ color: 'var(--brand-primary)' }}>
              {isSuperAdmin ? 'Manager Notes' : 'Notes from Your CAL Team'}
            </p>
            <p className="text-gray-500 text-xs">{displayed.length} note{displayed.length !== 1 ? 's' : ''}</p>
          </div>
          {pinnedMemos.length > 0 && (
            <span
              className="text-xs px-2 py-0.5 rounded-full"
              style={{ color: 'var(--brand-primary)', backgroundColor: 'var(--brand-primary)' + '1a' }}
            >
              {pinnedMemos.length} pinned
            </span>
          )}
        </div>
        <span className="text-gray-500 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="p-4 space-y-3">
          {/* Write area — super admin only */}
          {isSuperAdmin && (
            <div className="space-y-2">
              <textarea
                value={body}
                onChange={e => setBody(e.target.value)}
                placeholder={`Add a note about this company's ${section} performance...`}
                rows={3}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none placeholder-gray-600"
                style={{ '--tw-ring-color': 'var(--brand-primary)' } as React.CSSProperties}
              />
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPinned}
                    onChange={e => setIsPinned(e.target.checked)}
                    className="rounded"
                  />
                  Pin to top
                </label>
                <button
                  onClick={addMemo}
                  disabled={saving || !body.trim()}
                  className="px-3 py-1.5 disabled:bg-gray-700 disabled:text-gray-500 text-white text-xs font-semibold rounded-lg transition-colors"
                  style={{ backgroundColor: 'var(--brand-primary)' }}
                >
                  {saving ? 'Saving…' : 'Post Note'}
                </button>
              </div>
            </div>
          )}

          {/* Memos list */}
          {displayed.length > 0 ? (
            <div className="space-y-2">
              {displayed.map(memo => (
                <div
                  key={memo.id}
                  className={`rounded-lg p-3 ${memo.is_pinned ? 'border' : 'bg-gray-800/60'}`}
                  style={memo.is_pinned ? { borderColor: 'var(--brand-primary)', backgroundColor: 'var(--brand-primary)' + '0d' } : {}}
                >
                  {editing === memo.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editBody}
                        onChange={e => setEditBody(e.target.value)}
                        rows={3}
                        className="w-full bg-gray-800 border border-gray-700 rounded px-2 py-1.5 text-white text-sm resize-none focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(memo.id)} className="text-xs text-white px-3 py-1 rounded font-semibold" style={{ backgroundColor: 'var(--brand-primary)' }}>Save</button>
                        <button onClick={() => setEditing(null)} className="text-xs text-gray-400 hover:text-white px-2">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {memo.is_pinned && (
                        <p className="text-xs font-semibold mb-1.5" style={{ color: 'var(--brand-primary)' }}>📌 Pinned</p>
                      )}
                      <p className="text-gray-200 text-sm whitespace-pre-wrap leading-relaxed">{memo.body}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span>{memo.author_name || 'CAL Team'}</span>
                          <span>·</span>
                          <span>{timeAgo(memo.created_at)}</span>
                        </div>
                        {isSuperAdmin && (
                          <div className="flex items-center gap-2">
                            <button onClick={() => togglePin(memo)} className="text-xs text-gray-500 hover:text-white transition-colors">
                              {memo.is_pinned ? 'Unpin' : 'Pin'}
                            </button>
                            <button onClick={() => { setEditing(memo.id); setEditBody(memo.body) }} className="text-xs text-gray-500 hover:text-white transition-colors">
                              Edit
                            </button>
                            <button onClick={() => deleteMemo(memo.id)} className="text-xs text-gray-500 hover:text-red-400 transition-colors">
                              Delete
                            </button>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          ) : (
            isSuperAdmin && (
              <p className="text-gray-600 text-xs text-center py-2">No notes yet for this section</p>
            )
          )}
        </div>
      )}
    </div>
  )
}
