"use client"
import { useState } from 'react'

export default function GoalSetter({ companyId, currentTarget }: { companyId: string; currentTarget: number }) {
  const [editing, setEditing] = useState(false)
  const [target, setTarget] = useState(String(currentTarget))
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  async function save() {
    setSaving(true)
    await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: companyId, monthly_target: parseInt(target) || 20 }),
    })
    setSaving(false)
    setSaved(true)
    setEditing(false)
    setTimeout(() => { setSaved(false); window.location.reload() }, 800)
  }

  if (!editing) {
    return (
      <button onClick={() => setEditing(true)}
        className="mt-3 text-xs text-gray-500 hover:text-gray-300 underline underline-offset-2 transition-colors">
        {saved ? "&#10003; Saved" : "Change goal"}
      </button>
    )
  }

  return (
    <div className="mt-3 flex items-center gap-2">
      <input
        type="number"
        value={target}
        onChange={e => setTarget(e.target.value)}
        className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-green-500"
        min={1}
      />
      <button onClick={save} disabled={saving}
        className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded transition-colors disabled:opacity-50">
        {saving ? "Saving..." : "Save"}
      </button>
      <button onClick={() => setEditing(false)} className="text-xs text-gray-500 hover:text-gray-300">Cancel</button>
    </div>
  )
}
