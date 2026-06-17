'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

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

interface SidebarProps {
  sections: NavSection[]
  title?: string
  logoUrl?: string | null
  primaryColor?: string
  onClose?: () => void
}

export default function Sidebar({ sections, title = 'CAL OS', logoUrl, primaryColor = '#22c55e', onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-60 bg-gray-900 border-r border-gray-800 flex flex-col h-full min-h-screen">
      <div className="p-4 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          {logoUrl ? (
            <img src={logoUrl} alt={title} className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-gray-700" />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <span className="text-white font-bold text-xs">C</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-white font-bold text-sm truncate">{title}</p>
            <p className="text-gray-500 text-xs">CAL OS</p>
          </div>
        </div>
        {/* Close button — mobile only */}
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors flex-shrink-0"
            aria-label="Close menu"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
      <nav className="flex-1 p-3 overflow-y-auto space-y-4">
        {sections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p className="text-gray-600 text-xs font-semibold uppercase tracking-wider px-2 mb-1">{section.label}</p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname === item.href || 