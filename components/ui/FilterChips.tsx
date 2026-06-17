'use client'

interface Option {
  label: string
  value: string
}

interface Props {
  options: Option[]
  value: string
  onChange: (v: string) => void
}

export default function FilterChips({ options, value, onChange }: Props) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {options.map(opt => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={'flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ' +
              (active
                ? 'text-white border-transparent'
                : 'bg-gray-800 text-gray-400 hover:text-white border-gray-700')}
            style={active ? { backgroundColor: 'var(--brand-primary)', borderColor: 'var(--brand-primary)' } : {}}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
