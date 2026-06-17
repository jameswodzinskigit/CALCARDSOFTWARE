'use client'
import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

type Company = {
  id: string
  name: string
  slug: string
  google_place_id: string | null
  created_at: string
  feature_leaderboard: boolean
  feature_owner_dashboard: boolean
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '').trim()
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', google_place_id: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('companies')
      .select('id, name, slug, google_place_id, created_at, feature_leaderboard, feature_owner_dashboard')
      .order('created_at', { ascending: false })
    if (data) setCompanies(data)
  }, [])

  useEffect(() => { load() }, [load])

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    const slug = slugify(form.name)
    if (!slug) { setError('Company name is required'); setSaving(false); return }
    const supabase = createClient()
    const { error: insertError } = await supabase.from('companies').insert({
      name: form.name.trim(),
      slug,
      google_place_id: form.google_place_id.trim() || null,
    })
    if (insertError) {
      setError(insertError.message)
      setSaving(false)
      return
    }
    setForm({ name: '', google_place_id: '' })
    setShowForm(false)
    await load()
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-xl">Companies</h2>
        <button
          onClick={() => { setShowForm(!showForm); setError('') }}
          className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Company'}
        </button>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-700 rounded-xl p-5">
          <h3 className="text-white font-medium mb-4">New Company</h3>
          <form onSubmit={handleAdd} className="space-y-4">
            {error && <div className="bg-red-900/30 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Company Name <span className="text-red-400">*</span></label>
                <input
                  value={form.name}
                  onChange={e => setForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                  placeholder="United Sewer & Septic"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500"
                />
                {form.name && (
                  <p className="text-xs text-gray-500 mt-1">Slug: /{slugify(form.name)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Google Place ID <span className="text-gray-500">(optional)</span></label>
                <input
                  value={form.google_place_id}
                  onChange={e => setForm(prev => ({ ...prev, google_place_id: e.target.value }))}
                  placeholder="ChIJ..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
                {saving ? 'Saving...' : 'Add Company'}
              </button>
              <button type="button" onClick={() => { setShowForm(false); setError('') }}
                className="bg-gray-700 hover:bg-gray-600 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Name</th>
              <th className="text-left px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Slug</th>
              <th className="text-left px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Features</th>
              <th className="text-left px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Created</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {companies.map((company) => (
              <tr key={company.id} className="hover:bg-gray-800/50 transition-colors">
                <td className="px-5 py-4 text-white text-sm font-medium">{company.name}</td>
                <td className="px-5 py-4 text-gray-400 text-sm font-mono">/{company.slug}</td>
                <td className="px-5 py-4">
                  <div className="flex gap-1.5">
                    {company.feature_leaderboard && <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">Leaderboard</span>}
                    {company.feature_owner_dashboard && <span className="text-xs bg-blue-900/40 text-blue-400 px-2 py-0.5 rounded-full">Owner</span>}
                    {!company.feature_leaderboard && !company.feature_owner_dashboard && <span className="text-xs text-gray-600">—</span>}
                  </div>
                </td>
                <td className="px-5 py-4 text-gray-500 text-xs">
                  {new Date(company.created_at).toLocaleDateString()}
                </td>
                <td className="px-5 py-4 text-right">
                  <Link href={`/admin/companies/${company.id}`} className="text-green-400 hover:text-green-300 text-xs font-medium transition-colors">
                    Manage &rarr;
                  </Link>
                </td>
              </tr>
            ))}
            {!companies.length && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-gray-500 text-sm">No companies yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
