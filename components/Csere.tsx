'use client'

import { useState } from 'react'
import { DashboardData } from './App'

function formatMoney(n: number) {
  return new Intl.NumberFormat('hu-HU').format(n) + ' Ft'
}

interface Props {
  data: DashboardData
  onSubmit: (data: Record<string, unknown>) => void
}

export default function Csere({ data, onSubmit }: Props) {
  const [kekQty, setKekQty] = useState(0)
  const [rozsaszinQty, setRozsaszinQty] = useState(Math.min(4, data.stock.rozsaszinUres))

  const osszesen = kekQty + rozsaszinQty
  const maxOsszesen = data.stock.kekUres + data.stock.rozsaszinUres
  const koltseg = osszesen * data.patronPrice

  const submit = () => {
    onSubmit({
      muvelet: 'csere',
      kekUres: -kekQty,
      kekTele: kekQty,
      rozsaszinUres: -rozsaszinQty,
      rozsaszinTele: rozsaszinQty,
      osszegFt: -koltseg,
      megjegyzes: `${osszesen} db csere (${kekQty} kék + ${rozsaszinQty} rózsaszín)`,
    })
  }

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Elérhető üres készlet */}
      <div className="card">
        <div className="card-title">Elérhető üres patronok</div>
        <div className="stock-row">
          <div className="stock-label">
            <div className="dot dot-blue" /> Kék
          </div>
          <span style={{ fontWeight: 700, color: 'var(--blue)' }}>{data.stock.kekUres} db</span>
        </div>
        <div className="stock-row">
          <div className="stock-label">
            <div className="dot dot-pink" /> Rózsaszín
          </div>
          <span style={{ fontWeight: 700, color: 'var(--pink)' }}>{data.stock.rozsaszinUres} db</span>
        </div>
        <div className="stock-row">
          <div className="stock-label" style={{ fontWeight: 700, color: 'var(--text)' }}>Összesen</div>
          <span style={{ fontWeight: 700, color: 'var(--text)' }}>{maxOsszesen} db</span>
        </div>
      </div>

      {/* Kék */}
      <div className="card">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="dot dot-blue" />
          Kék (db)
        </div>
        <input
          type="number"
          className="input-field input-big"
          value={kekQty}
          min={0}
          max={data.stock.kekUres}
          onChange={e => setKekQty(Math.max(0, Math.min(data.stock.kekUres, parseInt(e.target.value) || 0)))}
        />
      </div>

      {/* Rózsaszín */}
      <div className="card">
        <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div className="dot dot-pink" />
          Rózsaszín (db)
        </div>
        <input
          type="number"
          className="input-field input-big"
          value={rozsaszinQty}
          min={0}
          max={data.stock.rozsaszinUres}
          onChange={e => setRozsaszinQty(Math.max(0, Math.min(data.stock.rozsaszinUres, parseInt(e.target.value) || 0)))}
        />
      </div>

      {/* Összesítő */}
      <div className="csere-summary">
        <div className="csere-sum-row">
          <span className="csere-sum-label">Összesen cserélve</span>
          <span className="csere-sum-value">{osszesen} db</span>
        </div>
        <div className="csere-sum-row">
          <span className="csere-sum-label">Költség</span>
          <span className="csere-sum-value" style={{ fontSize: 20 }}>{formatMoney(koltseg)}</span>
        </div>
        <div className="csere-sum-hint">Javasolt: min. {data.csereMinimum} db (optimális ár)</div>
      </div>

      <button
        className="btn-primary btn-orange"
        onClick={submit}
        disabled={osszesen === 0}
      >
        ↔️ Csere – {osszesen} db / {formatMoney(koltseg)}
      </button>
    </div>
  )
}
