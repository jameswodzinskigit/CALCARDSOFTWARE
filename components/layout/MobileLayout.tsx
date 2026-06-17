'use client'

import { useState } from 'react'
import Sidebar from './Sidebar'
import NotificationBell from './NotificationBell'
import SignOutButton from './SignOutButton'
import MobileBottomNav from './MobileBottomNav'
import GlobalSearch from './GlobalSearch'
import CommandPalette from './CommandPalette'

interface NavItem {
  href: string
  label: string
  icon: string
  exact?: boolean
}

interface NavSection {
  label?: string
  items: NavItem[]
}

interface MobileLayoutProps {
  children: React.ReactNode
  sections: NavSection[]
  title: string
  subtitle?: string
  logoUrl?: string | null
  primaryColor?: string
}

export default function MobileLayout({
  children,
  sections,
  title,
  subtitle,
  logoUrl,
  primaryColor = '#22c55e',
}: MobileLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex h-screen bg-gray-950 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile unless open */}
      <div
        className={
          'fixed lg:static inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out lg:transform-none ' +
          (sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0')
        }
      >
        <Sidebar
          sections={sections}
          title={title}
          logoUrl={logoUrl}
          primaryColor={primaryColor}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Header — sticky so it stays visible while content scrolls */}
        <header className="sticky top-0 z-20 h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Hamburger — mobile only */}
            <button
              className="lg:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div>
              <h1 className="text-white font-semibold text-base md:text-lg leading-tight">{title}</h1>
              {subtitle && <p className="text-gray-400 text-xs hidden sm:block">{subtitle}</p>}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <GlobalSearch />
            <NotificationBell />
            <SignOutButton />
          </div>
        </header>
        <CommandPalette />

        {/* Main scrollable area — add pb-16 on mobile for bottom nav */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 pb-20 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <MobileBottomNav />
    </div>
  )
}
