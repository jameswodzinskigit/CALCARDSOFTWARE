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

export default function Sidebar({ sections, title = 'CAL OS', logoUrl, primaryColor = '#3b82f6', onClose }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="w-60 bg-gray-950 border-r border-gray-800/60 flex flex-col h-full min-h-screen relative">
      {/* CAL rainbow accent line */}
      <div className="absolute top-0 left-0 right-0 h-0.5 bg-cal-gradient" />

      {/* Header */}
      <div className="p-4 border-b border-gray-800/60 flex items-center justify-between mt-0.5">
        <div className="flex items-center gap-3 min-w-0">
          {logoUrl ? (
            <img src={logoUrl} alt={title} className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-gray-700/60" />
          ) : (
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: primaryColor }}
            >
              <span className="text-white font-bold text-xs">C</span>
            </div>
          )}
          <div className="min-w-0">
            <p className="text-gray-100 font-bold text-sm truncate">{title}</p>
            <p className="text-gray-500 text-xs">CAL OS</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800/60 transition-colors flex-shrink-0"
            aria-label="Close menu"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto space-y-4">
        {sections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p className="text-gray-600 text-xs font-semibold uppercase tracking-widest px-2 mb-2">{section.label}</p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const active = item.exact
                  ? pathname === item.href
                  : pathname === item.href ||
                    pathname.startsWith(item.href + '/')

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onClose}
                    className={`flex items-center gap-2.5 py-2 rounded-lg text-sm transition-all duration-150 relative overflow-hidden ${
                      active
                        ? 'text-white font-medium bg-gray-800/70'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/40'
                    }`}
                    style={{
                      paddingLeft: '10px',
                      paddingRight: '10px',
                      borderLeft: active ? `2px solid ${primaryColor}` : '2px solid transparent',
                    }}
                  >
                    <span className="text-base leading-none flex-shrink-0">{item.icon}</span>
                    <span className="truncate">{item.label}</span>
                    {active && (
                      <span
                        className="absolute right-2.5 w-1.5 h-1.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: primaryColor }}
                      />
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-gray-800/60">
        <p className="text-gray-600 text-xs text-center tracking-wide">
          Powered by <span className="text-cal-gradient font-semibold">CAL Marketing</span>
        </p>
      </div>
    </aside>
  )
}
