'use client'
import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

type AdsAccount = {
  id: string
  formatted_id: string
  name: string
  currency_code: string
  time_zone: string
  status: string
}

type Connection = {
  manager_customer_id: string
  connected_at: string
  status: string
}

export default function GoogleAdsIntegrationsPage() {
  const searchParams = useSearchParams()
  const connected = searchParams.get('connected') === '1'
  const urlError = searchParams.get('error')

  const [connection, setConnection] = useState<Connection | null>(null)
  const [accounts, setAccounts] = useState<AdsAccount[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(urlError || '')
  const [disconnecting, setDisconnecting] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/google-ads/accounts')
      const data = await res.json()
      if (res.ok) {
        setConnection(data.connection)
        setAccounts(data.accounts || [])
      } else {
        if (res.status === 404) {
          setConnection(null)
        } else {
          setError(data.error || 'Failed to load')
        }
      }
    } catch {
      setError('Network error')
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Google Ads? All company assignments will need to be reassigned.')) return
    setDisconnecting(true)
    await fetch('/api/google-ads/accounts', { method: 'DELETE' })
    setConnection(null)
    setAccounts([])
    setDisconnecting(false)
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="text-gray-400 hover:text-white transition-colors text-sm">← Admin</Link>
        <div>
          <h1 className="text-white text-xl font-bold">Google Ads Integration</h1>
          <p className="text-gray-400 text-sm mt-0.5">Connect CAL Marketing's Google Ads Manager Account</p>
        </div>
      </div>

      {connected && (
        <div className="bg-green-900/20 border border-green-700/40 text-green-300 rounded-xl px-5 py-4 text-sm font-medium">
          ✓ Google Ads connected successfully
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-700/40 text-red-300 rounded-xl px-5 py-4 text-sm">
          ⚠ {error}
        </div>
      )}

      {/* Connection Status */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-white font-semibold">Manager Account Connection</h2>
          {connection && (
            <span className="text-xs bg-green-900/40 text-green-400 px-3 py-1 rounded-full font-medium">Connected</span>
          )}
        </div>

        {loading ? (
          <p className="text-gray-500 text-sm">Checking connection…</p>
        ) : connection ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-400 text-xs mb-1">Manager Account ID</p>
                <p className="text-white font-mono">{connection.manager_customer_id}</p>
              </div>
              <div>
                <p className="text-gray-400 text-xs mb-1">Connected</p>
                <p className="text-white">{new Date(connection.connected_at).toLocaleDateString()}</p>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {refreshing ? '⟳ Refreshing…' : '⟳ Refresh Accounts'}
              </button>
              <button
                onClick={handleDisconnect}
                disabled={disconnecting}
                className="bg-red-900/30 hover:bg-red-900/50 disabled:opacity-50 text-red-400 text-sm font-medium px-4 py-2 rounded-lg transition-colors border border-red-800/40"
              >
                {disconnecting ? 'Disconnecting…' : 'Disconnect'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              Connect CAL Marketing's Google Ads Manager Account to pull client ad accounts and performance data.
            </p>
            <div className="bg-gray-800/60 rounded-xl p-4 space-y-2 text-sm text-gray-400">
              <p className="text-white font-medium text-xs uppercase tracking-wider mb-3">Before connecting:</p>
              <p>1. Make sure <code className="text-green-400 bg-gray-900 px-1 rounded">GOOGLE_ADS_DEVELOPER_TOKEN</code> is set in Netlify env vars</p>
              <p>2. Make sure <code className="text-green-400 bg-gray-900 px-1 rounded">NEXT_PUBLIC_APP_URL</code> is set to <code className="text-blue-400">https://calcardai.netlify.app</code></p>
              <p>3. Add <code className="text-blue-400 bg-gray-900 px-1 rounded">/api/google-ads/callback</code> as an authorized redirect URI in Google Cloud Console</p>
            </div>
            <a
              href="/api/google-ads/auth"
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Connect Google Ads Manager Account
            </a>
          </div>
        )}
      </div>

      {/* Client Accounts */}
      {accounts.length > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="p-5 border-b border-gray-800">
            <h2 className="text-white font-semibold">Accessible Client Accounts</h2>
            <p className="text-gray-400 text-sm mt-0.5">{accounts.length} account{accounts.length !== 1 ? 's' : ''} found under your manager account</p>
          </div>
          <div className="divide-y divide-gray-800">
            {accounts.map(acc => (
              <div key={acc.id} className="px-5 py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-white text-sm font-medium">{acc.name}</p>
                  <p className="text-gray-400 text-xs font-mono mt-0.5">{acc.formatted_id}</p>
                  <p className="text-gray-500 text-xs mt-0.5">{acc.currency_code} · {acc.time_zone}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  acc.status === 'ENABLED' ? 'bg-green-900/40 text-green-400' : 'bg-yellow-900/40 text-yellow-400'
                }`}>
                  {acc.status}
                </span>
              </div>
            ))}
          </div>
          <div className="p-5 border-t border-gray-800 bg-gray-800/30">
            <p className="text-gray-400 text-sm">
              To assign an account to a company, go to{' '}
              <Link href="/admin/companies" className="text-green-400 hover:text-green-300">Admin → Companies</Link>{' '}
              and open the company.
            </p>
          </div>
        </div>
      )}

      {/* Audit log hint */}
      <div className="bg-gray-900/50 border border-gray-800 rounded-xl p-4 text-sm text-gray-500">
        All connection and assignment changes are recorded in the integration audit log.
      </div>
    </div>
  )
}
