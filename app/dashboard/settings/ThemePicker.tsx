'use client'

import { useState } from 'react'

const PRESETS = [
  { label: 'Green', color: '#22c55e' },
  { label: 'Blue', color: '#3b82f6' },
  { label: 'Purple', color: '#8b5cf6' },
  { label: 'Orange', color: '#f97316' },
  { label: 'Red', color: '#ef4444' },
  { label: 'Pink', color: '#ec4899' },
  { label: 'Teal', color: '#14b8a6' },
  { label: 'Yellow', color: '#eab308' },
]

export default function ThemePicker({ companyId, initialColor }: { companyId: string; initialColor: string }) {
  const [color, setColor] = useState(initialColor || '#22c55e')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')

  async function save(hex: string) {
    setSaving(true); setSaved(false); setErr('')
    const res = await fetch('/api/company/theme', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: companyId, primary_color: hex }),
    })
    if (res.ok) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      // Apply live without full reload
      document.documentElement.style.setProperty('--brand-primary', hex)
    } else {
      setErr((await res.json()).error || 'Failed to save')
    }
    setSaving(false)
  }

  function handlePreset(hex: string) {
    setColor(hex)
    save(hex)
  }

  function handleColorInput(e: React.ChangeEvent<HTMLInputElement>) {
    setColor(e.target.value)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(p => (
          <button
            key={p.color}
            onClick={() => handlePreset(p.color)}
            title={p.label}
            className="w-9 h-9 rounded-full border-2 transition-transform hover:scale-110 focus:outline-none"
            style={{
              backgroundColor: p.color,
              borderColor: color === p.color ? 'white' : 'transparent',
              boxShadow: color === p.color ? '0 0 0 2px ' + p.color : 'none',
            }}
          />
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={color}
            onChange={handleColorInput}
            className="w-10 h-10 rounded-lg border border-gray-700 cursor-pointer bg-transparent"
          />
        </div>
        <input
          type="text"
          value={color}
          onChange={e => setColor(e.target.value)}
          placeholder="#22c55e"
          maxLength={7}
          className="w-28 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm font-mono focus:outline-none focus:border-green-500"
        />
        <button
          onClick={() => save(color)}
          disabled={saving}
          className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
        >
          {saving ? 'Saving…' : saved ? '✓ Applied!' : 'Apply'}
        </button>
        {err && <p className="text-red-400 text-sm">{err}</p>}
      </div>

      <div
        className="flex items-center gap-3 p-3 rounded-lg border border-gray-800 text-sm"
        style={{ borderLeftColor: color, borderLeftWidth: '4px' }}
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: color }}>C</div>
        <div>
          <p className="text-white font-medium">Preview</p>
          <p className="text-xs" style={{ color }}>Active nav items will use this color</p>
        </div>
      </div>
    </div>
  )
}
