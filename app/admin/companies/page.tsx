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
                          <p className="text-yell