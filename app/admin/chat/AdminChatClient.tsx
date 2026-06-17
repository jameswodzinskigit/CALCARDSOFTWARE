'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface ChatMessage {
  id: string
  subject: string
  body: string
  status: 'open' | 'in_progress' | 'resolved'
  admin_reply: string | null
  admin_replied_at: string | null
  created_at: string
  company: { name: string } | null
}

const statusColors: Record<string, string> = {
  open: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  resolved: 'bg-green-500/10 text-green-400 border-green-500/20',
}

const statusOptions = ['open', 'in_progress', 'resolved']

function MessageCard({ msg }: { msg: ChatMessage }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [reply, setReply] = useState(msg.admin_reply || '')
  const [status, setStatus] = useState(msg.status)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [expanded, setExpanded] = useState(msg.status !== 'resolved')

  async function save() {
    setSaving(true); setSaved(false)
    await fetch('/api/admin/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId: msg.id, status, adminReply: reply }),
    })
    setSaving(false); setSaved(true)
    startTransition(() => router.refresh())
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div
        className="px-5 py-4 flex items-start justify-between gap-3 cursor-pointer hover:bg-gray-800/30 transition-colors"
        onClick={() => setExpanded(e => !e)}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-gray-500">{msg.company?.name || 'Unknown'}</span>
            <span className="text-gray-700 text-xs">&#183;</span>
            <span className="text-gray-600 text-xs">{new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
          <p className="text-white font-semibold text-sm">{msg.subject}</p>
          {!expanded && <p className="text-gray-500 text-xs mt-1 truncate">{msg.body}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {msg.admin_reply && <span className="text-xs text-blue-400">Replied</span>}
          <span className={'text-xs px-2 py-1 rounded-full border ' + (statusColors[status] || statusColors.open)}>
            {status.replace('_', ' ')}
          </span>
          <span className="text-gray-600 text-xs">{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div className="px-5 pb-5 border-t border-gray-800 pt-4 space-y-4">
          <div className="bg-gray-800/50 rounded-lg p-4">
            <p className="text-gray-400 text-xs font-medium mb-2">Client message</p>
            <p className="text-gray-200 text-sm leading-relaxed">{msg.body}</p>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Status</label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value as ChatMessage['status'])}
              className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
            >
              {statusOptions.map(s => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">Reply to client</label>
            <textarea
              value={reply}
              onChange={e => setReply(e.target.value)}
              rows={3}
              placeholder="Type your reply..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 resize-none"
            />
          </div>

          {msg.admin_replied_at && (
            <p className="text-gray-600 text-xs">Last replied: {new Date(msg.admin_replied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
          )}

          <div className="flex items-center gap-3">
            <button
              onClick={save}
              disabled={saving || pending}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            {saved && <span className="text-green-400 text-sm">Saved!</span>}
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminChatClient({ messages }: { messages: ChatMessage[] }) {
  const [filter, setFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all')

  const filtered = filter === 'all' ? messages : messages.filter(m => m.status === filter)
  const counts = {
    all: messages.length,
    open: messages.filter(m => m.status === 'open').length,
    in_progress: messages.filter(m => m.status === 'in_progress').length,
    resolved: messages.filter(m => m.status === 'resolved').length,
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-white font-bold text-xl">CAL Chat</h1>
        <p className="text-gray-500 text-sm mt-0.5">Client support messages</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['all', 'open', 'in_progress', 'resolved'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ' +
              (filter === f ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-gray-800 text-gray-400 hover:text-white')}
          >
            {f.replace('_', ' ')} <span className="text-xs opacity-60">({counts[f]})</span>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-gray-500 text-sm">No messages</div>
        )}
        {filtered.map(msg => <MessageCard key={msg.id} msg={msg} />)}
      </div>
    </div>
  )
}
