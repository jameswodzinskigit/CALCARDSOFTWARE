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

type PlaceCandidate = {
  place_id: string
  name: string
  formatted_address: string
  rating?: number
  user_ratings_total?: number
}

function slugify(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '').trim()
}

export default function AdminCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', city: '', google_place_id: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [searching, setSearching] = useState(false)
  const [candidates, setCandidates] = useState<PlaceCandidate[]>([])
  const [selectedPlace, setSelectedPlace] = useState<PlaceCandidate | null>(null)

  const load = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('companies')
      .select('id, name, slug, google_place_id, created_at, feature_leaderboard, feature_owner_dashboard')
      .order('created_at', { ascending: false })
    if (data) setCompanies(data)
  }, [])

  useEffect(() => { load() }, [load])

  const searchPlaces = async () => {
    const q = [form.name, form.city].filter(Boolean).join(' ')
    if (!q.trim()) return
    setSearching(true)
    setCandidates([])
    setSelectedPlace(null)
    setError('')
    try {
      const res = await fetch(`/api/places-search?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data.candidates?.length) {
        setCandidates(data.candidates)
        setSelectedPlace(data.candidates[0])
        setForm(prev => ({ ...prev, google_place_id: data.candidates[0].place_id }))
      } else {
        setError('No matching businesses found. Try adding the city/state.')
      }
    } catch {
      setError('Search failed')
    }
    setSearching(false)
  }

  const selectCandidate = (c: PlaceCandidate) => {
    setSelectedPlace(c)
    setForm(prev => ({ ...prev, google_place_id: c.place_id }))
  }

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
    setForm({ name: '', city: '', google_place_id: '' })
    setCandidates([])
    setSelectedPlace(null)
    setShowForm(false)
    await load()
    setSaving(false)
  }

  const resetForm = () => {
    setShowForm(false)
    setError('')
    setCandidates([])
    setSelectedPlace(null)
    setForm({ name: '', city: '', google_place_id: '' })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-white font-semibold text-xl">Companies</h2>
        <button
          onClick={() => showForm ? resetForm() : setShowForm(true)}
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1.5">Company Name <span className="text-red-400">*</span></label>
                <input
                  value={form.name}
                  onChange={e => { setForm(prev => ({ ...prev, name: e.target.value })); setCandidates([]); setSelectedPlace(null) }}
                  required
                  placeholder="United Sewer & Septic"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500"
                />
                {form.name && (
                  <p className="text-xs text-gray-500 mt-1">Slug: /{slugify(form.name)}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">City / State</label>
                <input
                  value={form.city}
                  onChange={e => { setForm(prev => ({ ...prev, city: e.target.value })); setCandidates([]); setSelectedPlace(null) }}
                  placeholder="Middletown, NY"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={searchPlaces}
              disabled={searching || !form.name.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors flex items-center gap-2"
            >
              {searching ? '⟳ Searching Google...' : '🔍 Find on Google'}
            </button>

            {candidates.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs text-gray-400 font-medium">Select the correct listing:</p>
                {candidates.map(c => (
                  <button
                    key={c.place_id}
                    type="button"
                    onClick={() => selectCandidate(c)}
                    className={`w-full text-left p-3 rounded-lg border transition-colors ${
                      selectedPlace?.place_id === c.place_id
                        ? 'border-green-500 bg-green-900/20'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-white text-sm font-medium">{c.name}</p>
                        <p className="text-gray-400 text-xs mt-0.5">{c.formatted_address}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        {c.rating && (
                          <p className="text-yellow-400 text-xs font-medium">★ {c.rating} ({c.user_ratings_total?.toLocaleString()})</p>
                        )}
                        {selectedPlace?.place_id === c.place_id && (
                          <span className="text-green-400 text-xs">✓ Selected</span>
                        )}
                      </div>
                    </div>
                    <p className="text-gray-600 text-xs mt-1 font-mono">{c.place_id}</p>
                  </button>
                ))}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1.5">
                Google Place ID
                <span className="text-gray-500 ml-1 font-normal">(auto-filled by search, or enter manually)</span>
              </label>
              <input
                value={form.google_place_id}
                onChange={e => setForm(prev => ({ ...prev, google_place_id: e.target.value }))}
                placeholder="ChIJ..."
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-green-500 font-mono text-sm"
              />
            </div>

            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors">
                {saving ? 'Saving...' : 'Add Company'}
              </button>
              <button type="button" onClick={resetForm}
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
              <th className="text-left px-5 py-3 text-gray-400 text-xs font-medium uppercase tracking-wider">Google</th>
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
                  {company.google_place_id
                    ? <span className="text-green-400 text-xs font-medium">✓ Connected</span>
                    : <span className="text-yellow-500 text-xs">⚠ Not set</span>
                  }
                </td>
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
                <td colSpan={6} className="px-5 py-8 text-center text-gray-500 text-sm">No companies yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
