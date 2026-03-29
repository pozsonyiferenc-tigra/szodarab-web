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
    <div className="counter-wrap">
      <div className="counter-row">
        <button
          className="counter-btn"
          onClick={() => set(value - 1)}
          disabled={value <= min}
        >
          −
        </button>
        <span className="counter-value">{value}</span>
        <button
          className="counter-btn"
          onClick={() => set(value + 1)}
          disabled={value >= max}
        >
          +
        </button>
      </div>

      {(quickValues || extraButton) && (
        <div className="quick-btns">
          {quickValues?.map(v => (
            <button
              key={v}
              className={`quick-btn${value === v ? ' active' : ''}`}
              onClick={() => set(v)}
            >
              {v}
            </button>
          ))}
          {extraButton && (
            <button
              className="quick-btn"
              onClick={() => set(extraButton.getValue())}
            >
              {extraButton.label}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
