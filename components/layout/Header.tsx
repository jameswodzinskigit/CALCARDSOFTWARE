import SignOutButton from './SignOutButton'

interface HeaderProps {
  title: string
  subtitle?: string
}

export default function Header({ title, subtitle }: HeaderProps) {
  return (
    <header className="h-16 bg-gray-900 border-b border-gray-800 flex items-center justify-between px-6">
      <div>
        <h1 className="text-white font-semibold text-lg">{title}</h1>
        {subtitle && <p className="text-gray-400 text-xs">{subtitle}</p>}
      </div>
      <SignOutButton />
    </header>
  )
}
