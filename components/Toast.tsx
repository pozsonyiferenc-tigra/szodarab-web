interface Props {
  text: string
  type: 'success' | 'error'
}

export default function Toast({ text, type }: Props) {
  return (
    <div className={`toast ${type}`}>
      <div className="toast-icon">
        {type === 'success' ? '✓' : '✕'}
      </div>
      {text}
    </div>
  )
}
