"use client"
import { useState } from 'react'
import Link from 'next/link'

export default function JoinPage() {
  const [form, setForm] = useState({
    company_name: '',
    contact_name: '',
    email: '',
    phone: '',
    employee_count: '',
    message: '',
  })
  const [status, setStatus] = useState<'idle'|'loading'|'success'|'error'>('idle')

  function set(field: string, value: string) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')
    try {
      const res = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, employee_count: parseInt(form.employee_count) || null }),
      })
      if (res.ok) setStatus('success')
      else setStatus('error')
    } catch {
      setStatus('error')
    }
  }

  if (status === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">&#10003;</span>
          </div>
          <h1 className="text-2xl font-bold text-white mb-3">Request Received!</h1>
          <p className="text-gray-400 mb-6">We&apos;ll review your application and reach out within 1-2 business days to get your CalCard program set up.</p>
          <Link href="/" className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2.5 rounded-lg transition-colors">
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 text-green-400 px-3 py-1 rounded-full text-sm font-medium mb-4">
            &#128279; Get CalCard for Your Team
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Start Getting More Reviews</h1>
          <p className="text-gray-400">NFC-powered review cards that turn every job into a Google review. Fill out the form and we&apos;ll set you up.</p>
        </div>

        <form onSubmit={submit} className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Company Name *</label>
              <input required value={form.company_name} onChange={e => set('company_name', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
                placeholder="ABC Plumbing" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Your Name *</label>
              <input required value={form.contact_name} onChange={e => set('contact_name', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
                placeholder="James Smith" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Email *</label>
              <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
                placeholder="you@company.com" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Phone</label>
              <input value={form.phone} onChange={e => set('phone', e.target.value)}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
                placeholder="(555) 000-0000" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Number of Employees</label>
            <input type="number" value={form.employee_count} onChange={e => set('employee_count', e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500"
              placeholder="e.g. 8" min={1} />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Anything else? (optional)</label>
            <textarea value={form.message} onChange={e => set('message', e.target.value)}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-green-500 resize-none"
              placeholder="Tell us a bit about your business..." />
          </div>

          {status === 'error' && (
            <p className="text-red-400 text-sm">Something went wrong. Please try again.</p>
          )}

          <button type="submit" disabled={status === 'loading'}
            className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">
            {status === 'loading' ? 'Submitting...' : 'Request CalCard Program →'}
          </button>
        </form>

        <p className="text-center text-gray-600 text-xs mt-4">
          Already have an account? <Link href="/login" className="text-gray-400 hover:text-white">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
