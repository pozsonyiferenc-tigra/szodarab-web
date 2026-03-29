'use client'

import { useState } from 'react'
import { DashboardData } from './App'

function formatMoney(n: number) {
  return new Intl.NumberFormat('hu-HU').format(n) + ' Ft'
}

const QUICK_AMOUNTS = [1900, 3800, 5700, 7600]

interface Props {
  data: DashboardData
  onSubmit: (data: Record<string, unknown>) => void
}

export default function Befizetes({ data, onSubmit }: Props) {
  const defaultAmount = data.balance.penz < 0 ? Math.abs(data.balance.penz) : data.patronPrice
  const [amount, setAmount] = useState(defaultAmount)
  const [megjegyzes, setMegjegyzes] = useState('Revolut')

  const newBalance = data.balance.penz + amount
  const penzNegativ = data.balance.penz < 0

  const submit = () => {
    onSubmit({
      muvelet: 'befizetes',
      kekUres: 0, kekTele: 0,
      rozsaszinUres: 0, rozsaszinTele: 0,
      osszegFt: amount,
      megjegyzes,
    })
  }

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Jelenlegi egyenleg */}
      <div className={`balance-card ${penzNegativ ? 'danger' : 'positive'}`}>
        <div className="balance-label">Jelenlegi egyenleg</div>
        <div className="balance-amount">{formatMoney(data.balance.penz)}</div>
      </div>

      {/* Összeg */}
      <div className="card">
        <div className="card-title">Összeg (Ft)</div>
        <input
          type="number"
          className="input-field input-big"
          value={amount}
          min={0}
          step={100}
          onChange={e => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
        />
        <div className="quick-btns" style={{ marginTop: 12 }}>
          {QUICK_AMOUNTS.map(v => (
            <button
              key={v}
              className={`quick-btn${amount === v ? ' active' : ''}`}
              style={amount === v ? { background: 'var(--green)', borderColor: 'var(--green)', color: 'white' } : {}}
              onClick={() => setAmount(v)}
            >
              {v.toLocaleString('hu-HU')}
            </button>
          ))}
        </div>
      </div>

      {/* Új egyenleg előnézet */}
      <div className="card">
        <div className="summary-row">
          <span className="summary-label">Új egyenleg</span>
          <span className="summary-value" style={{ color: newBalance < 0 ? 'var(--red)' : 'var(--green)' }}>
            {formatMoney(newBalance)}
          </span>
        </div>
      </div>

      <div className="card">
        <div className="card-title">Megjegyzés</div>
        <textarea
          className="input-field"
          value={megjegyzes}
          onChange={e => setMegjegyzes(e.target.value)}
          rows={2}
          maxLength={100}
        />
      </div>

      <button
        className="btn-primary btn-green"
        onClick={submit}
        disabled={amount <= 0}
      >
        ✅ Rögzít – {formatMoney(amount)} befizetés
      </button>
    </div>
  )
}
