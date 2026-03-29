'use client'

interface Props {
  value: number
  onChange: (n: number) => void
  min?: number
  max?: number
  quickValues?: number[]
  extraButton?: { label: string; getValue: () => number }
}

export default function Counter({ value, onChange, min = 1, max = 99, quickValues, extraButton }: Props) {
  const set = (n: number) => onChange(Math.max(min, Math.min(max, n)))

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="flex items-center gap-6">
        <button
          onClick={() => set(value - 1)}
          disabled={value <= min}
          className="w-12 h-12 rounded-full text-white text-2xl font-bold flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
          style={{ background: '#2196F3' }}
        >
          −
        </button>
        <span className="text-4xl font-bold text-gray-800 min-w-[3rem] text-center tabular-nums">
          {value}
        </span>
        <button
          onClick={() => set(value + 1)}
          disabled={value >= max}
          className="w-12 h-12 rounded-full text-white text-2xl font-bold flex items-center justify-center transition-all active:scale-95 disabled:opacity-30"
          style={{ background: '#2196F3' }}
        >
          +
        </button>
      </div>

      {(quickValues || extraButton) && (
        <div className="flex gap-2">
          {quickValues?.map(v => (
            <button
              key={v}
              onClick={() => set(v)}
              className={`flex-1 py-2 px-3 rounded-xl text-sm font-semibold transition-all active:scale-95 min-w-[48px] ${
                value === v
                  ? 'text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={value === v ? { background: '#2196F3' } : {}}
            >
              {v}
            </button>
          ))}
          {extraButton && (
            <button
              onClick={() => set(extraButton.getValue())}
              className="flex-1 py-2 px-3 rounded-xl text-sm font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all active:scale-95"
            >
              {extraButton.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
