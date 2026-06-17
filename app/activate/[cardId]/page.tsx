'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

export default function ActivatePage() {
  const params = useParams()
  const router = useRouter()
  const cardId = params.cardId as string

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    companyId: '',
    message: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/activate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cardId, ...form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Activation failed')
      router.push(`/u/${data.slug}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-white font-bold text-2xl">C</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">Activate Your Card</h1>
          <p className="text-gray-400 text-sm">Set up your CalCard to start collecting reviews</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">First Name *</label>
              <input
                type="text"
                required
                value={form.firstName}
                onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500"
                placeholder="John"
              />
            </div>
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5">Last Name</label>
              <input
                type="text"
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500"
                placeholder="Smith"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5">Company ID *</label>
            <input
              type="text"
              required
              value={form.companyId}
              onChange={(e) => setForm({ ...form, companyId: e.target.value })}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500"
              placeholder="Your company ID (ask your manager)"
            />
          </div>

          <div>
            <label className="block text-gray-400 text-xs font-medium mb-1.5">Personal Message (optional)</label>
            <textarea
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              rows={2}
              className="w-full bg-gray-900 border border-gray-700 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:border-green-500 resize-none"
              placeholder="e.g. It was great working with you today!"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? 'Activating...' : 'Activate Card'}
          </button>
        </form>
      </div>
    </div>
  )
}
