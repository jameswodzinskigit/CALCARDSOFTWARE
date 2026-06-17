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
}

const statusColors: Record<string, string> = {
  open: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  in_progress: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  resolved: 'bg-green-500/10 text-green-400 border-green-500/20',
}

const statusLabels: Record<string, string> = {
  open: 'Open',
  in_progress: 'In Progress',
  resolved: 'Resolved',
}

export default function ChatClient({ messages }: { messages: ChatMessage[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [showForm, setShowForm] = useState(false)
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const [err, setErr] = useState('')

  async function send() {
    if (!subject.trim() || !body.trim()) return
    setSending(true)
    setErr('')
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject: subject.trim(), message: body.trim() }),
    })
    if (res.ok) {
      setSubject('')
      setBody('')
      setShowForm(false)
      startTransition(() => router.refresh())
    } else {
      setErr('Failed to send')
    }
    setSending(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-white font-bold text-xl">CAL Chat</h1>
          <p className="text-gray-500 text-sm mt-0.5">Message the CAL team</p>
        </div>
        <button
          onClick={() => setShowForm(f => !f)}
          className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          + New Message
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
          <h2 className="text-white font-semibold text-sm">New Message</h2>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Subject</label>
            <input
              type="text"
              value={subject}
              onChange={e => setSubject(e.target.value)}
              placeholder="What do you need help with?"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Message</label>
            <textarea
              value={body}
              onChange={e => setBody(e.target.value)}
              rows={4}
              placeholder="Describe your request or question..."
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 resize-none"
            />
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={send}
              disabled={sending || !subject.trim() || !body.trim()}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              {sending ? 'Sending...' : 'Send Message'}
            </button>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white text-sm transition-colors">
              Cancel
            </button>
            {err && <span className="text-red-400 text-sm">{err}</span>}
          </div>
        </div>
      )}

      <div className="space-y-3">
        {messages.length === 0 && !showForm && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <p className="text-2xl mb-3">&#128172;</p>
            <p className="text-white font-medium mb-1">No messages yet</p>
            <p className="text-gray-500 text-sm">Send a message to the CAL team for support or questions.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div key={msg.id} className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-4">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-white font-semibold text-sm">{msg.subject}</h3>
                <span className={'text-xs px-2 py-1 rounded-full border flex-shrink-0 ' + (statusColors[msg.status] || statusColors.open)}>
                  {statusLabels[msg.status] || msg.status}
                </span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">{msg.body}</p>
              <p className="text-gray-600 text-xs mt-3">{new Date(msg.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            {msg.admin_reply && (
              <div className="border-t border-gray-800 px-5 py-4 bg-green-500/5">
                <p className="text-green-400 text-xs font-semibold mb-2">Reply from CAL Team</p>
                <p className="text-gray-300 text-sm leading-relaxed">{msg.admin_reply}</p>
                {msg.admin_replied_at && (
                  <p className="text-gray-600 text-xs mt-2">{new Date(msg.admin_replied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
