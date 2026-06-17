'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Overview', icon: '📊', exact: true },
  { href: '/dashboard/reviews', label: 'Reviews', icon: '⭐', exact: false },
  { href: '/dashboard/leaderboard', label: 'Leaders', icon: '🏆', exact: false },
  { href: '/dashboard/goals', label: 'Goals', icon: '🎯', exact: false },
  { href: '/dashboard/settings', label: 'Settings', icon: '⚙️', exact: false },
]

export default function MobileBottomNav() {
  const pathname = usePathname()

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href
    return pathname.startsWith(href)
  }

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-gray-900 border-t border-gray-800 flex items-stretch"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)', height: 'calc(4rem + env(safe-area-inset-bottom, 0px))' }}
    >
      {NAV_ITEMS.map(item => {
        const active = isActive(item.href, item.exact)
        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[56px] transition-colors"
            style={{ color: active ? 'var(--brand-primary)' : '#6b7280' }}
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
