'use client'
import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

type Company = {
  id: string; name: string; slug: string; google_place_id: string | null
  owner_email: string | null
  feature_leaderboard: boolean; feature_team_rankings: boolean
  feature_review_wall: boolean; feature_rewards: boolean
  feature_reports: boolean; feature_owner_dashboard: boolean
  feature_gbp: boolean; feature_ads: boolean; feature_calls: boolean
  feature_leads: boolean; feature_chat: boolean; feature_competitors: boolean
  feature_social: boolean; feature_keywords: boolean
}
type Competitor = { id: string; name: string; google_place_id: string | null; is_active: boolean }
type Employee = {
  id: string; first_name: string; position: string | null
  role: string; team_id: string | null
  venmo_username: string | null; cashapp_username: string | null
}
type Team = { id: string; name: string; color: string | null }

const FEATURES: { key: keyof Company; label: string; description: string; group: string }[] = [
  { key: 'feature_owner_dashboard', label: 'Owner Dashboard',       description: 'Give business owner access to their dashboard', group: 'Core' },
  { key: 'feature_leaderboard',     label: 'Leaderboard',           description: 'Employee ranking board', group: 'Reputation' },
  { key: 'feature_review_wall',     label: 'Review Wall',           description: 'Live TV display of incoming reviews', group: 'Reputation' },
  { key: 'feature_team_rankings',   label: 'Team Rankings',         description: 'Group employees into competing teams', group: 'Reputation' },
  { key: 'feature_rewards',         label: 'Rewards',               description: 'Badge and reward system for employees', group: 'Reputation' },
  { key: 'feature_gbp',             label: 'Google Business',       description: 'GBP stats manual entry dashboard', group: 'Marketing' },
  { key: 'feature_ads',             label: 'Ads Dashboard',         description: 'Ad spend, clicks, leads, calls, CPL tracking', group: 'Marketing' },
  { key: 'feature_calls',           label: 'Calls Tracking',        description: 'Inbound call tracking section', group: 'Customers' },
  { key: 'feature_leads',           label: 'Leads Tracking',        description: 'Lead management section', group: 'Customers' },
  { key: 'feature_reports',         label: 'Monthly Reports',       description: 'Combined monthly performance reports', group: 'Reports' },
  { key: 'feature_chat',            label: 'CAL Chat',              description: 'Client-to-CAL messaging', group: 'Support' },
  { key: 'feature_competitors',    label: 'Competitor Tracker',    description: 'Side-by-side Google review count vs local competitors', group: 'Marketing' },
  { key: 'feature_social',         label: 'Social Media',          description: 'Views, likes, followers across Instagram, Facebook, Google, TikTok', group: 'Marketing' },
  { key: 'feature_keywords',       label: 'Keyword Performance',   description: 'Google Ads keyword ranking and performance table', group: 'Marketing' },
]

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)}
      className={'relative inline-flex h-6 w-11 items-center rounded-full transition-colors ' + (on ? 'bg-green-500' : 'bg-gray-700')}>
      <span className={'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ' + (on ? 'translate-x-6' : 'translate-x-1')} />
    </button>
  )
}

export default function CompanyDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const supabase = createClient()

  const [company, setCompany] = useState<Company | null>(null)
  const [employees, setEmployees] = useState<Employee[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [competitors, setCompetitors] = useState<Competitor[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)
  const [ownerEmail, setOwnerEmail] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailSaved, setEmailSaved] = useState(false)
  const [showAddComp, setShowAddComp] = useState(false)
  const [compForm, setCompForm] = useState({ name: '', google_place_id: '' })
  const [compSaving, setCompSaving] = useState(false)
  const [editingPlaceId, setEditingPlaceId] = useState<string | null>(null)
  const [editPlaceValue, setEditPlaceValue] = useState('')
  const [discovering, setDiscovering] = useState(false)
  const [discoverResult, setDiscoverResult] = useState<string | null>(null)

  // Theme state
  const [themeColor, setThemeColor] = useState('')
  const [themeSaving, setThemeSaving] = useState(false)
  const [themeSaved, setThemeSaved] = useState(false)

  const [showAddEmp, setShowAddEmp] = useState(false)
  const [empForm, setEmpForm] = useState({ first_name: '', position: '', role: 'employee', team_id: '', venmo_username: '', cashapp_username: '' })
  const [empSaving, setEmpSaving] = useState(false)
  const [empError, setEmpError] = useState('')

  const [editingEmpId, setEditingEmpId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ first_name: '', position: '', role: 'employee', venmo_username: '', cashapp_username: '' })
  const [editSaving, setEditSaving] = useState(false)

  const [showAddTeam, setShowAddTeam] = useState(false)
  const [teamForm, setTeamForm] = useState({ name: '', color: '' })
  const [teamSaving, setTeamSaving] = useState(false)

  const load = useCallback(async () => {
    const [{ data: co }, { data: emps }, { data: ts }, { data: comps }] = await Promise.all([
      supabase.from('companies').select('*').eq('id', id).single(),
      supabase.from('profiles').select('id, first_name, position, role, team_id, venmo_username, cashapp_username').eq('company_id', id).order('first_name'),
      supabase.from('teams').select('id, name, color').eq('company_id', id).order('name'),
      supabase.from('competitors').select('id, name, google_place_id, is_active').eq('company_id', id).order('name'),
    ])
    if (co) { setCompany(co); setOwnerEmail(co.owner_email || '') }
    if (emps) setEmployees(emps)
    if (ts) setTeams(ts)
    if (comps) setCompetitors(comps)
    setLoading(false)
  }, [id])

  useEffect(() => { load() }, [load])

  const toggleFeature = async (key: keyof Company, value: boolean) => {
    if (!company) return
    setSaving(key as string)
    setCompany(prev => prev ? { ...prev, [key]: value } : prev)
    await supabase.from('companies').update({ [key]: value }).eq('id', id)
    setSaving(null)
  }

  const saveOwnerEmail = async () => {
    setEmailSaving(true); setEmailSaved(false)
    await supabase.from('companies').update({ owner_email: ownerEmail.trim() || null }).eq('id', id)
    setEmailSaving(false); setEmailSaved(true)
    setTimeout(() => setEmailSaved(false), 2000)
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmpSaving(true); setEmpError('')
    const { error } = await supabase.from('profiles').insert({
      company_id: id,
      first_name: empForm.first_name.trim(),
      position: empForm.position.trim() || null,
      role: empForm.role,
      team_id: empForm.team_id || null,
      venmo_username: empForm.venmo_username.trim() || null,
      cashapp_username: empForm.cashapp_username.trim() || null,
      email: 'info@cal.marketing',
    })
    if (error) { setEmpError(error.message); setEmpSaving(false); return }
    setEmpForm({ first_name: '', position: '', role: 'employee', team_id: '', venmo_username: '', cashapp_username: '' })
    setShowAddEmp(false)
    await load(); setEmpSaving(false)
  }

  const startEdit = (emp: Employee) => {
    setEditingEmpId(emp.id)
    setEditForm({
      first_name: emp.first_name,
      position: emp.position || '',
      role: emp.role,
      venmo_username: emp.venmo_username || '',
      cashapp_username: emp.cashapp_username || '',
    })
  }

  const handleSaveEdit = async (empId: string) => {
    setEditSaving(true)
    await supabase.from('profiles').update({
      first_name: editForm.first_name.trim(),
      position: editForm.position.trim() || null,
      role: editForm.role,
      venmo_username: editForm.venmo_username.trim() || null,
      cashapp_username: editForm.cashapp_username.trim() || null,
    }).eq('id', empId)
    setEditingEmpId(null)
    await load(); setEditSaving(false)
  }

  const handleAddTeam = async (e: React.FormEvent) => {
    e.preventDefault(); setTeamSaving(true)
    await supabase.from('teams').insert({ company_id: id, name: teamForm.name.trim(), color: teamForm.color || null })
    setTeamForm({ name: '', color: '' }); setShowAddTeam(false)
    await load(); setTeamSaving(false)
  }

  const handleAddCompetitor = async (e: React.FormEvent) => {
    e.preventDefault(); setCompSaving(true)
    await supabase.from('competitors').insert({
      company_id: id,
      name: compForm.name.trim(),
      google_place_id: compForm.google_place_id.trim() || null,
    })
    setCompForm({ name: '', google_place_id: '' }); setShowAddComp(false)
    await load(); setCompSaving(false)
  }

  const savePlaceId = async (competitorId: string) => {
    await supabase.from('competitors').update({ google_place_id: editPlaceValue.trim() || null }).eq('id', competitorId)
    setEditingPlaceId(null); await load()
  }

  const toggleCompetitorActive = async (competitorId: string, isActive: boolean) => {
    await supabase.from('competitors').update({ is_active: !isActive }).eq('id', competitorId)
    await load()
  }

  const handleDiscover = async () => {
    setDiscovering(true); setDiscoverResult(null)
    try {
      const res = await fetch('/api/companies/discover-competitors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: id }),
      })
      const json = await res.json()
      if (res.ok) {
        setDiscoverResult(`Found ${json.discovered} competitors, added ${json.added} new. Refreshing…`)
        await load()
      } else {
        setDiscoverResult(json.error || 'Discovery failed')
      }
    } catch {
      setDiscoverResult('Network error — check connection')
    } finally {
      setDiscovering(false)
    }
  }

  const saveTheme = async () => {
    if (!themeColor.match(/^#[0-9a-fA-F]{6}$/)) return
    setThemeSaving(true); setThemeSaved(false)
    await fetch('/api/company/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: id, primary_color: themeColor }),
    })
    setThemeSaving(false); setThemeSaved(true)
    setTimeout(() => setThemeSaved(false), 2000)
  }

  if (loading) return <div className="flex items-center justify-center h-64"><div className="text-gray-400">Loading...</div></div>
  if (!company) return <div className="text-center py-16"><p className="text-gray-400 mb-4">Company not found.</p><Link href="/admin/companies" className="text-green-400 hover:text-green-300 text-sm">Back</Link></div>

  const featureGroups = Array.from(new Set(FEATURES.map(f => f.group)))

  return (
    <div className="space-y-8 max-w-4xl">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white transition-colors text-sm">Back</button>
        <div>
          <h1 className="text-white text-2xl font-bold">{company.name}</h1>
          <p className="text-gray-400 text-sm">/{company.slug}</p>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <h2 className="text-white font-semibold">Company Info</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div><p className="text-gray-400 mb-1">Company ID</p><p className="text-gray-300 font-mono text-xs">{company.id}</p></div>
          <div>
            <p className="text-gray-400 mb-1">Google Place ID</p>
            {company.google_place_id ? <p className="text-gray-300 font-mono text-xs">{company.google_place_id}</p> : <span className="text-yellow-500 text-xs">Not set</span>}
          </div>
          <div>
            <p className="text-gray-400 mb-1">Review URL</p>
            {company.google_place_id
              ? <a href={'https://search.google.com/local/writereview?placeid=' + company.google_place_id} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 text-xs">Open Google review link</a>
              : <span className="text-gray-500 text-xs">Set Google Place ID first</span>}
          </div>
          <div>
            <p className="text-gray-400 mb-1">Review Wall</p>
            <a href={'/wall/' + company.id} target="_blank" rel="noopener noreferrer" className="text-green-400 hover:text-green-300 text-xs">/wall/{company.id.slice(0, 8)}</a>
          </div>
        </div>
        <div>
          <p className="text-gray-400 text-sm mb-1">Owner Email (for weekly digest)</p>
          <div className="flex gap-2">
            <input
              type="email"
              value={ownerEmail}
              onChange={e => setOwnerEmail(e.target.value)}
              placeholder="owner@business.com"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
            />
            <button onClick={saveOwnerEmail} disabled={emailSaving}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              {emailSaving ? '...' : emailSaved ? 'Saved!' : 'Save'}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold">Features</h2>
          <p className="text-gray-400 text-sm mt-1">Control what this business can access in CAL OS</p>
        </div>
        {featureGroups.map(group => (
          <div key={group}>
            <div className="px-5 py-2 bg-gray-800/50 border-b border-gray-800">
              <p className="text-gray-500 text-xs font-semibold uppercase tracking-wider">{group}</p>
            </div>
            {FEATURES.filter(f => f.group === group).map(({ key, label, description }) => (
              <div key={key} className="flex items-center justify-between px-5 py-4 border-b border-gray-800 last:border-0">
                <div>
                  <p className="text-white text-sm font-medium">{label}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{description}</p>
                </div>
                <div className="flex items-center gap-2">
                  {saving === key && <span className="text-xs text-gray-500">Saving</span>}
                  <Toggle on={!!company[key]} onChange={(v) => toggleFeature(key, v)} />
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold">Teams</h2>
          <button onClick={() => setShowAddTeam(!showAddTeam)} className="text-sm text-green-400 hover:text-green-300 transition-colors">
            {showAddTeam ? 'Cancel' : '+ Add Team'}
          </button>
        </div>
        {showAddTeam && (
          <form onSubmit={handleAddTeam} className="p-5 border-b border-gray-800 flex gap-3">
            <input value={teamForm.name} onChange={e => setTeamForm(p => ({ ...p, name: e.target.value }))} required placeholder="Team name"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500" />
            <input value={teamForm.color} onChange={e => setTeamForm(p => ({ ...p, color: e.target.value }))} placeholder="#3b82f6"
              className="w-28 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500" />
            <button type="submit" disabled={teamSaving}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors">
              {teamSaving ? '...' : 'Add'}
            </button>
          </form>
        )}
        <div className="divide-y divide-gray-800">
          {teams.map(team => (
            <div key={team.id} className="flex items-center gap-3 px-5 py-3.5">
              {team.color && <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: team.color }} />}
              <p className="text-white text-sm flex-1">{team.name}</p>
              <p className="text-gray-500 text-xs">{employees.filter(e => e.team_id === team.id).length} members</p>
            </div>
          ))}
          {!teams.length && <p className="px-5 py-6 text-gray-500 text-sm text-center">No teams yet</p>}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-white font-semibold">Employees <span className="text-gray-500 font-normal text-sm ml-1">({employees.length})</span></h2>
          <button onClick={() => { setShowAddEmp(!showAddEmp); setEmpError('') }} className="text-sm text-green-400 hover:text-green-300 transition-colors">
            {showAddEmp ? 'Cancel' : '+ Add Employee'}
          </button>
        </div>

        {showAddEmp && (
          <form onSubmit={handleAddEmployee} className="p-5 border-b border-gray-800 space-y-3">
            {empError && <div className="bg-red-900/30 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{empError}</div>}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <input value={empForm.first_name} onChange={e => setEmpForm(p => ({ ...p, first_name: e.target.value }))} required placeholder="First name"
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500" />
              <input value={empForm.position} onChange={e => setEmpForm(p => ({ ...p, position: e.target.value }))} placeholder="Title (e.g. Lead Tech)"
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500" />
              <select value={empForm.role} onChange={e => setEmpForm(p => ({ ...p, role: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500">
                <option value="employee">Employee</option>
                <option value="company_admin">Owner / Admin</option>
              </select>
              <input value={empForm.venmo_username} onChange={e => setEmpForm(p => ({ ...p, venmo_username: e.target.value }))} placeholder="Venmo username"
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500" />
              <input value={empForm.cashapp_username} onChange={e => setEmpForm(p => ({ ...p, cashapp_username: e.target.value }))} placeholder="Cash App $tag"
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500" />
              <select value={empForm.team_id} onChange={e => setEmpForm(p => ({ ...p, team_id: e.target.value }))}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500">
                <option value="">No team</option>
                {teams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <button type="submit" disabled={empSaving}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
              {empSaving ? 'Adding...' : 'Add Employee'}
            </button>
          </form>
        )}

        <div className="divide-y divide-gray-800">
          {employees.map(emp => {
            const team = teams.find(t => t.id === emp.team_id)
            const isEditing = editingEmpId === emp.id
            return (
              <div key={emp.id}>
                <div className="flex items-center gap-4 px-5 py-3.5">
                  <div className="w-8 h-8 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {emp.first_name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{emp.first_name}</p>
                    <p className="text-gray-400 text-xs">{emp.position || ''}</p>
                    {(emp.venmo_username || emp.cashapp_username) && (
                      <p className="text-gray-600 text-xs mt-0.5">
                        {emp.venmo_username && '@' + emp.venmo_username + ' (Venmo)'}
                        {emp.venmo_username && emp.cashapp_username && ' | '}
                        {emp.cashapp_username && '$' + emp.cashapp_username + ' (Cash App)'}
                      </p>
                    )}
                  </div>
                  {team && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-800 text-gray-300">
                      {team.name}
                    </span>
                  )}
                  <span className={'text-xs px-2 py-0.5 rounded-full ' + (emp.role === 'company_admin' ? 'bg-blue-900/50 text-blue-300' : 'bg-gray-800 text-gray-400')}>
                    {emp.role === 'company_admin' ? 'Owner/Admin' : 'Employee'}
                  </span>
                  <button onClick={() => isEditing ? setEditingEmpId(null) : startEdit(emp)}
                    className="text-xs text-gray-500 hover:text-green-400 transition-colors flex-shrink-0">
                    {isEditing ? 'Cancel' : 'Edit'}
                  </button>
                </div>

                {isEditing && (
                  <div className="px-5 pb-4 pt-1 bg-gray-800/40 border-t border-gray-800 space-y-3">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">First Name</label>
                        <input value={editForm.first_name} onChange={e => setEditForm(p => ({ ...p, first_name: e.target.value }))}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Title / Position</label>
                        <input value={editForm.position} onChange={e => setEditForm(p => ({ ...p, position: e.target.value }))} placeholder="Lead Technician"
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Role</label>
                        <select value={editForm.role} onChange={e => setEditForm(p => ({ ...p, role: e.target.value }))}
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500">
                          <option value="employee">Employee</option>
                          <option value="company_admin">Owner / Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Venmo username</label>
                        <input value={editForm.venmo_username} onChange={e => setEditForm(p => ({ ...p, venmo_username: e.target.value }))} placeholder="username"
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 mb-1 block">Cash App $tag</label>
                        <input value={editForm.cashapp_username} onChange={e => setEditForm(p => ({ ...p, cashapp_username: e.target.value }))} placeholder="cashtag"
                          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500" />
                      </div>
                    </div>
                    <button onClick={() => handleSaveEdit(emp.id)} disabled={editSaving}
                      className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
                      {editSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            )
          })}
          {!employees.length && <p className="px-5 py-6 text-gray-500 text-sm text-center">No employees yet</p>}
        </div>
      </div>

      {/* Dashboard Theme */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div>
          <h2 className="text-white font-semibold">Dashboard Theme</h2>
          <p className="text-gray-400 text-xs mt-0.5">Set the brand accent color for this company&apos;s dashboard</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={themeColor || '#22c55e'}
            onChange={e => setThemeColor(e.target.value)}
            className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer bg-transparent"
          />
          <input
            type="text"
            value={themeColor}
            onChange={e => setThemeColor(e.target.value)}
            placeholder="#22c55e"
            maxLength={7}
            className="w-28 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500"
          />
          <button
            onClick={saveTheme}
            disabled={themeSaving || !themeColor.match(/^#[0-9a-fA-F]{6}$/)}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {themeSaving ? '…' : themeSaved ? '✓ Saved' : 'Set Color'}
          </button>
        </div>
      </div>

      {/* Competitors section */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <div>
            <h2 className="text-white font-semibold">Competitors</h2>
            <p className="text-gray-400 text-xs mt-0.5">Add Google Place IDs to enable live sync via the Competitors dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            {company.google_place_id && (
              <button
                onClick={handleDiscover}
                disabled={discovering}
                className="text-sm text-blue-400 hover:text-blue-300 disabled:opacity-50 transition-colors"
              >
                {discovering ? 'Discovering…' : '✦ Auto-Discover'}
              </button>
            )}
            <button onClick={() => setShowAddComp(!showAddComp)} className="text-sm text-green-400 hover:text-green-300 transition-colors">
              {showAddComp ? 'Cancel' : '+ Add Competitor'}
            </button>
          </div>
        </div>
        {discoverResult && (
          <div className="px-5 py-3 border-b border-gray-800 bg-blue-900/20 text-blue-300 text-sm">
            {discoverResult}
          </div>
        )}

        {showAddComp && (
          <form onSubmit={handleAddCompetitor} className="p-5 border-b border-gray-800 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Business Name</label>
                <input
                  value={compForm.name}
                  onChange={e => setCompForm(p => ({ ...p, name: e.target.value }))}
                  required placeholder="e.g. Busy Bee Septic"
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Google Place ID (optional)</label>
                <input
                  value={compForm.google_place_id}
                  onChange={e => setCompForm(p => ({ ...p, google_place_id: e.target.value }))}
                  placeholder="ChIJ..."
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 font-mono"
                />
              </div>
            </div>
            <button type="submit" disabled={compSaving}
              className="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors">
              {compSaving ? 'Adding...' : 'Add Competitor'}
            </button>
          </form>
        )}

        <div className="divide-y divide-gray-800">
          {competitors.map(comp => (
            <div key={comp.id} className={`px-5 py-4 ${!comp.is_active ? 'opacity-50' : ''}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium">{comp.name}</p>
                  {editingPlaceId === comp.id ? (
                    <div className="flex gap-2 mt-2">
                      <input
                        value={editPlaceValue}
                        onChange={e => setEditPlaceValue(e.target.value)}
                        placeholder="ChIJ..."
                        className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-white text-xs focus:outline-none focus:border-green-500 font-mono"
                      />
                      <button onClick={() => savePlaceId(comp.id)} className="text-xs bg-green-600 hover:bg-green-500 text-white px-3 py-1.5 rounded-lg">Save</button>
                      <button onClick={() => setEditingPlaceId(null)} className="text-xs text-gray-400 hover:text-white px-2">Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setEditingPlaceId(comp.id); setEditPlaceValue(comp.google_place_id || '') }}
                      className="text-xs text-gray-500 hover:text-gray-300 mt-1 transition-colors font-mono"
                    >
                      {comp.google_place_id ? comp.google_place_id : '+ Add Place ID'}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {comp.google_place_id && (
                    <span className="text-xs bg-green-900/40 text-green-400 px-2 py-0.5 rounded-full">Live sync ready</span>
                  )}
                  <button
                    onClick={() => toggleCompetitorActive(comp.id, comp.is_active)}
                    className={`text-xs px-2 py-1 rounded-lg transition-colors ${comp.is_active ? 'bg-gray-800 text-gray-400 hover:text-red-400' : 'bg-gray-800 text-gray-600 hover:text-green-400'}`}
                  >
                    {comp.is_active ? 'Disable' : 'Enable'}
                  </button>
                </div>
              </div>
            </div>
          ))}
          {!competitors.length && <p className="px-5 py-6 text-gray-500 text-sm text-center">No competitors tracked yet</p>}
        </div>
      </div>
    </div>
  )
}
