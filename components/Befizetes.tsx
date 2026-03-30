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

function CopyRow({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  if (!value) return null
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    })
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.07em', color: 'var(--text-3)', marginBottom: 3 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', letterSpacing: '.02em' }}>{value}</div>
      </div>
      <button
        onClick={handleCopy}
        style={{
          padding: '7px 13px',
          borderRadius: 10,
          background: copied ? 'var(--green-light)' : 'var(--bg)',
          border: `1.5px solid ${copied ? 'var(--green)' : 'var(--border)'}`,
          color: copied ? 'var(--green)' : 'var(--text-2)',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all .15s',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {copied ? '✓ Másolva' : '📋 Másolás'}
      </button>
    </div>
  )
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

  const hasFizetesiInfo = data.szamlaszam || data.revolut

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Jelenlegi egyenleg */}
      <div className={`balance-card ${penzNegativ ? 'danger' : 'positive'}`}>
        <div className="balance-label">Jelenlegi egyenleg</div>
        <div className="balance-amount">{formatMoney(data.balance.penz)}</div>
      </div>

      {/* Fizetési adatok */}
      {hasFizetesiInfo && (
        <div className="card">
          <div className="card-title">Hová fizess?</div>
          <CopyRow label="Bankszámlaszám" value={data.szamlaszam} />
          <CopyRow label="Revolut" value={data.revolut} />
        </div>
      )}

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
