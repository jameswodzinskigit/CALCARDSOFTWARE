'use client'
import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    if (data.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', data.user.id)
        .single()
      if (profile?.role === 'super_admin') {
        window.location.href = '/admin'
      } else if (profile?.role === 'company_admin') {
        window.location.href = '/dashboard'
      } else {
        window.location.href = '/profile'
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center font-bold text-white text-lg">C</div>
            <span className="text-2xl font-bold text-white">CalCard</span>
          </div>
          <p className="text-gray-400">Sign in to your account</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          {error && <div className="bg-red-900/30 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors" placeholder="you@example.com" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1.5">Password</label>
            <div className="relative">
              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 pr-11 text-white placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors" placeholder="&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;&#9679;" />
              <button type="button" onClick={() => setShowPassword(function(p) { return !p })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors text-base leading-none">
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-2.5 rounded-lg transition-colors">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Don&apos;t have an account? <Link href="/signup" className="text-green-400 hover:text-green-300">Sign up</Link>
        </p>
      </div>
    </div>
  )
}
