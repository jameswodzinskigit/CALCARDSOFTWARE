'use client'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'

export default function SignOutButton() {
  const router = useRouter()

  const handleSignOut = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
    )
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <button
      onClick={handleSignOut}
      className="text-gray-400 hover:text-white text-sm transition-colors"
    >
      Sign Out
    </button>
  )
}
