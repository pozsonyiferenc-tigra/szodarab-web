'use client'

interface Props {
  value: 'kek' | 'rozsaszin'
  onChange: (v: 'kek' | 'rozsaszin') => void
}

export default function TypeSelector({ value, onChange }: Props) {
  return (
    <div className="type-grid">
      {(['kek', 'rozsaszin'] as const).map(t => {
        const selected = value === t
        const activeClass = selected ? (t === 'kek' ? 'active-blue' : 'active-pink') : ''
        const label = t === 'kek' ? 'Kék' : 'Rózsaszín'
        return (
          <button
            key={t}
            className={`type-btn ${activeClass}`}
            onClick={() => onChange(t)}
          >
            <div className="radio-circle">
              <div className="radio-dot" />
            </div>
            <div className={`dot ${t === 'kek' ? 'dot-blue' : 'dot-pink'}`} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
