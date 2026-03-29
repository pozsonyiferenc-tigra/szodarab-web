'use client'

interface Props {
  value: 'kek' | 'rozsaszin'
  onChange: (v: 'kek' | 'rozsaszin') => void
}

export default function TypeSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {(['kek', 'rozsaszin'] as const).map(t => {
        const selected = value === t
        const color = t === 'kek' ? '#2196F3' : '#E91E63'
        const label = t === 'kek' ? 'Kék' : 'Rózsaszín'
        return (
          <button
            key={t}
            onClick={() => onChange(t)}
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 font-semibold text-sm transition-all active:scale-95 ${
              selected ? 'border-current shadow-sm' : 'border-gray-200 bg-white text-gray-500'
            }`}
            style={selected ? { borderColor: color, color, background: `${color}15` } : {}}
          >
            <div className="w-4 h-4 rounded-full border-2 flex items-center justify-center" style={{ borderColor: selected ? color : '#ccc' }}>
              {selected && <div className="w-2 h-2 rounded-full" style={{ background: color }} />}
            </div>
            <div className="w-3 h-3 rounded-full" style={{ background: color }} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
