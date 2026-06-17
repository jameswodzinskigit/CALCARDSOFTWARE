'use client'

import { useState, useEffect } from 'react'

interface GridCell {
  row: number
  col: number
  lat: number
  lng: number
  rank: number
}

interface GeoScan {
  id: string
  keyword: string
  grid_size: number
  grid_spacing_miles: number
  center_lat: number
  center_lng: number
  place_name: string
  results: GridCell[]
  status: string
  error_message: string | null
  scanned_at: string
}

interface GeoGridTabProps {
  companyId: string
  hasPlaceId: boolean
}

function rankColor(rank: number): string {
  if (rank === 0) return 'bg-gray-700 text-gray-500'
  if (rank <= 3) return 'bg-green-500/20 text-green-400 border-green-500/40'
  if (rank <= 7) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40'
  if (rank <= 13) return 'bg-orange-500/20 text-orange-400 border-orange-500/40'
  return 'bg-red-500/20 text-red-400 border-red-500/40'
}

function rankLabel(rank: number): string {
  if (rank === 0) return '20+'
  return String(rank)
}

function GridDisplay({ scan }: { scan: GeoScan }) {
  const cells = scan.results as GridCell[]
  const size = scan.grid_size
  const half = Math.floor(size / 2)

  // Build a 2D map
  const grid: Record<string, GridCell> = {}
  cells.forEach((c) => { grid[`${c.row},${c.col}`] = c })

  // Stats
  const ranks = cells.map(c => c.rank).filter(r => r > 0)
  const avgRank = ranks.length > 0 ? (ranks.reduce((a, b) => a + b, 0) / ranks.length).toFixed(1) : '—'
  const top3 = cells.filter(c => c.rank > 0 && c.rank <= 3).length
  const top10 = cells.filter(c => c.rank > 0 && c.rank <= 10).length
  const notFound = cells.filter(c => c.rank === 0).length

  return (
    <div className="space-y-4">
      {/* Scan meta */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <p className="text-white font-semibold">"{scan.keyword}"</p>
          <p className="text-gray-500 text-xs mt-0.5">
            {scan.grid_size}×{scan.grid_size} grid · {scan.grid_spacing_miles} mi spacing · {scan.place_name}
            · {new Date(scan.scanned_at).toLocaleDateString()}
          </p>
        </div>
        <div className="flex gap-3 text-xs">
          <span className="text-green-400">🟢 Top 3: {top3}</span>
          <span className="text-yellow-400">🟡 Top 10: {top10}</span>
          <span className="text-gray-400">❌ 20+: {notFound}</span>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-white font-bold text-xl">{avgRank}</p>
          <p className="text-gray-500 text-xs mt-0.5">Avg Rank</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-green-400 font-bold text-xl">{top3}</p>
          <p className="text-gray-500 text-xs mt-0.5">Top 3 Points</p>
        </div>
        <div className="bg-gray-800/50 rounded-lg p-3 text-center">
          <p className="text-yellow-400 font-bold text-xl">{top10}</p>
          <p className="text-gray-500 text-xs mt-0.5">Top 10 Points</p>
        </div>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto">
        <div
          className="inline-grid gap-1.5 mx-auto"
          style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: size }, (_, ri) => ri - half).map((row) =>
            Array.from({ length: size }, (_, ci) => ci - half).map((col) => {
              const cell = grid[`${row},${col}`]
              const rank = cell?.rank ?? 0
              const isCenter = row === 0 && col === 0
              return (
                <div
                  key={`${row},${col}`}
                  className={`w-12 h-12 rounded-lg border flex items-center justify-center font-bold text-sm transition-transform hover:scale-105 relative
                    ${isCenter ? 'ring-2 ring-white/40 ' : ''}
                    ${rankColor(rank)}`}
                  title={rank === 0 ? 'Not in top 20' : `Rank #${rank} at this location`}
                >
                  {rankLabel(rank)}
                  {isCenter && (
                    <span className="absolute -top-1 -right-1 text-xs">📍</span>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 flex-wrap text-xs text-gray-400">
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-green-500/40 inline-block"></span> #1–3
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-yellow-500/40 inline-block"></span> #4–7
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-orange-500/40 inline-block"></span> #8–13
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-red-500/40 inline-block"></span> #14–20
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded bg-gray-700 inline-block"></span> Not found
        </div>
        <div className="flex items-center gap-1.5">
          <span>📍</span> Business location
        </div>
      </div>
    </div>
  )
}

export default function GeoGridTab({ hasPlaceId }: GeoGridTabProps) {
  const [keyword, setKeyword] = useState('')
  const [gridSize, setGridSize] = useState(5)
  const [spacingMiles, setSpacingMiles] = useState(1)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const [scans, setScans] = useState<GeoScan[]>([])
  const [activeScanId, setActiveScanId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  // Load recent scans on mount
  useEffect(() => {
    fetch('/api/geo-grid/scan')
      .then(r => r.json())
      .then(d => {
        setScans(d.scans || [])
        if (d.scans?.length > 0) setActiveScanId(d.scans[0].id)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function runScan() {
    if (!keyword.trim()) return
    setScanning(true)
    setError('')
    try {
      const res = await fetch('/api/geo-grid/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim(), grid_size: gridSize, spacing_miles: spacingMiles }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Scan failed')
        return
      }
      setScans(prev => [data.scan, ...prev])
      setActiveScanId(data.scan.id)
      setKeyword('')
    } catch {
      setError('Network error — try again')
    } finally {
      setScanning(false)
    }
  }

  const activeScan = scans.find(s => s.id === activeScanId) || null

  if (!hasPlaceId) {
    return (
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
        <p className="text-3xl mb-3">📍</p>
        <p className="text-white font-semibold">Google Place ID not set</p>
        <p className="text-gray-500 text-sm mt-1 max-w-xs mx-auto">
          Your account manager needs to add your Google Place ID before rank tracking can run.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-5">
      {/* Scan form */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <h2 className="text-white font-semibold text-sm mb-4">Run a Rank Scan</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            value={keyword}
            onChange={e => setKeyword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !scanning && runScan()}
            placeholder='e.g. "sewer repair near me"'
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 placeholder-gray-600"
          />
          <select
            value={gridSize}
            onChange={e => setGridSize(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 w-full sm:w-auto"
          >
            <option value={3}>3×3 grid</option>
            <option value={5}>5×5 grid</option>
            <option value={7}>7×7 grid</option>
          </select>
          <select
            value={spacingMiles}
            onChange={e => setSpacingMiles(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-green-500 w-full sm:w-auto"
          >
            <option value={0.5}>0.5 mi spacing</option>
            <option value={1}>1 mi spacing</option>
            <option value={2}>2 mi spacing</option>
            <option value={3}>3 mi spacing</option>
          </select>
          <button
            onClick={runScan}
            disabled={scanning || !keyword.trim()}
            className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors whitespace-nowrap"
          >
            {scanning ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                </svg>
                Scanning…
              </span>
            ) : 'Run Scan'}
          </button>
        </div>
        {scanning && (
          <p className="text-gray-400 text-xs mt-3">
            Checking {gridSize}×{gridSize} = {gridSize * gridSize} locations… this takes about {Math.ceil(gridSize * gridSize * 0.4)}s
          </p>
        )}
        {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      </div>

      {/* Scan history tabs */}
      {scans.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {scans.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveScanId(s.id)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeScanId === s.id
                  ? 'bg-green-500/20 text-green-400 border-green-500/40'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-white'
              }`}
            >
              {s.keyword} · {new Date(s.scanned_at).toLocaleDateString()}
            </button>
          ))}
        </div>
      )}

      {/* Active scan grid */}
      {loading ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-gray-500 text-sm">Loading scans…</p>
        </div>
      ) : activeScan ? (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <GridDisplay scan={activeScan} />
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
          <p className="text-3xl mb-3">🗺️</p>
          <p className="text-white font-semibold">No scans yet</p>
          <p className="text-gray-500 text-sm mt-1">Enter a keyword above to see how you rank across your service area</p>
        </div>
      )}
    </div>
  )
}
