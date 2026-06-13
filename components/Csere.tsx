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

export default function Csere({ data, onSubmit }: Props) {
  const [quantity, setQuantity] = useState(1)
  const [type, setType] = useState<'kek' | 'rozsaszin'>('kek')

  const fizetendo = quantity * data.patronPrice

  const submit = () => {
    onSubmit({
      muvelet:       'csere',
      kekUres:       type === 'kek'       ? quantity : 0,    // befelé: pozitív
      rozsaszinUres: type === 'rozsaszin' ? quantity : 0,
      kekTele:       type === 'kek'       ? -quantity : 0,   // kifelé: negatív
      rozsaszinTele: type === 'rozsaszin' ? -quantity : 0,
      osszegFt:      -fizetendo,
    })
  }

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Leírás */}
      <div className="warn-box" style={{ fontSize: 13 }}>
        Üres patront hozol be, és azonnal ugyanannyi teli patront viszel el.
        Az ár tartozásként kerül rögzítésre – befizetéssel rendezhető.
      </div>

      <div className="card">
        <div className="card-title">Patron típusa</div>
        <TypeSelector value={type} onChange={(t) => { setType(t); setQuantity(1) }} />
      </div>

      <div className="card">
        <div className="card-title">Mennyiség</div>
        <Counter
          value={quantity}
          onChange={setQuantity}
          min={1}
          quickValues={[1, 2, 3, 4]}
        />
      </div>

      {/* Összesítő */}
      <div className="card">
        <div className="summary-row">
          <span className="summary-label">Behoz (üres)</span>
          <span className="summary-value">{quantity} db {type === 'kek' ? 'kék' : 'rózsaszín'}</span>
        </div>
        <div className="summary-row">
          <span className="summary-label">Elvisz (teli)</span>
          <span className="summary-value">{quantity} db {type === 'kek' ? 'kék' : 'rózsaszín'}</span>
        </div>
        <div className="summary-row" style={{ borderTop: '1px solid var(--border)', paddingTop: 10, marginTop: 4 }}>
          <span className="summary-label">Tartozás</span>
          <span className="summary-value" style={{ fontWeight: 800, fontSize: 18 }}>{formatMoney(fizetendo)}</span>
        </div>
      </div>

      <button className="btn-primary btn-blue" onClick={submit}>
        🔄 Csere – {quantity} db {type === 'kek' ? 'kék' : 'rózsaszín'} / {formatMoney(fizetendo)}
      </button>
    </div>
  )
}
