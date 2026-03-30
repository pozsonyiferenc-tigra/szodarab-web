'use client'

import { useState } from 'react'
import { DashboardData } from './App'
import Counter from './Counter'
import TypeSelector from './TypeSelector'

function formatMoney(n: number) {
  return new Intl.NumberFormat('hu-HU').format(n) + ' Ft'
}

interface Props {
  data: DashboardData
  onSubmit: (data: Record<string, unknown>) => void
}

export default function Elvitel({ data, onSubmit }: Props) {
  const [quantity, setQuantity] = useState(1)
  const [type, setType] = useState<'kek' | 'rozsaszin'>('kek')

  const maxQty = type === 'kek' ? data.balance.kekPatron : data.balance.rozsaszinPatron
  const fizetendo = quantity * data.patronPrice

  const submit = () => {
    onSubmit({
      muvelet: 'elvitel',
      kekTele: type === 'kek' ? -quantity : 0,
      rozsaszinTele: type === 'rozsaszin' ? -quantity : 0,
      kekUres: 0,
      rozsaszinUres: 0,
      osszegFt: 0,
      megjegyzes: '',
    })
  }

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Egyenleg info */}
      <div className="warn-box">
        <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 11, textTransform: 'uppercase', letterSpacing: '.08em' }}>
          Patron egyenleged
        </div>
        <div style={{ display: 'flex', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="dot dot-blue" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>{data.balance.kekPatron} db kék</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div className="dot dot-pink" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>{data.balance.rozsaszinPatron} db rózsaszín</span>
          </div>
        </div>
        {maxQty === 0 && (
          <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600 }}>
            ⚠️ Nincs elegendő {type === 'kek' ? 'kék' : 'rózsaszín'} patron egyenleged!
          </div>
        )}
      </div>

      <div className="card">
        <div className="card-title">Patron típusa</div>
        <TypeSelector value={type} onChange={(t) => { setType(t); setQuantity(1) }} />
      </div>

      <div className="card">
        <div className="card-title">Mennyiség (max: {maxQty} db)</div>
        <Counter
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={Math.max(1, maxQty)}
          quickValues={[1, 2]}
          extraButton={{ label: 'Max', getValue: () => maxQty }}
        />
      </div>

      {/* Fizetendő */}
      <div className="card">
        <div className="summary-row">
          <span className="summary-label">Fizetendő</span>
          <span className="summary-value">{formatMoney(fizetendo)}</span>
        </div>
      </div>

      <button
        className="btn-primary btn-pink"
        onClick={submit}
        disabled={maxQty === 0}
      >
        ✅ Rögzít – {quantity} db {type === 'kek' ? 'kék' : 'rózsaszín'} teli elvitel
      </button>
    </div>
  )
}
