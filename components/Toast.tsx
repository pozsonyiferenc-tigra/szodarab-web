interface Props {
  text: string
  type: 'success' | 'error'
}

export default function Toast({ text, type }: Props) {
  const bg = type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
  const icon = type === 'success' ? '✓' : '✕'

  return (
    <div
      className={`${bg} text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2 animate-slide-down pointer-events-auto`}
    >
      <span className="font-bold">{icon}</span>
      {text}
    </div>
  )
}
