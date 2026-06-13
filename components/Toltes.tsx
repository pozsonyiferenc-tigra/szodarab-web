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

export default function Toltes({ data, onSubmit }: Props) {
  // Üres leadás
  const [kekUresQty,       setKekUresQty]       = useState(0)
  const [rozsaszinUresQty, setRozsaszinUresQty] = useState(0)
  // Teli átvétel
  const [kekTeleQty,       setKekTeleQty]       = useState(0)
  const [rozsaszinTeleQty, setRozsaszinTeleQty] = useState(0)

  const osszesenLeadott = kekUresQty + rozsaszinUresQty
  const osszesenAtvett  = kekTeleQty + rozsaszinTeleQty
  const koltseg         = osszesenAtvett * data.patronPrice
  const egyenlo         = osszesenLeadott > 0 && osszesenAtvett === osszesenLeadott

  const submit = () => {
    onSubmit({
      muvelet:       'toltes',
      kekUres:       -kekUresQty,
      kekTele:        kekTeleQty,
      rozsaszinUres: -rozsaszinUresQty,
      rozsaszinTele:  rozsaszinTeleQty,
      osszegFt:      -koltseg,
      megjegyzes:    `${osszesenLeadott} db leadva (${kekUresQty}K+${rozsaszinUresQty}P) → ${osszesenAtvett} db átvéve (${kekTeleQty}K+${rozsaszinTeleQty}P)`,
    })
  }

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Üres leadás */}
      <div className="card">
        <div className="card-title">🔵⬆️ Üres patronok leadása</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
          <div>
            <div className="stock-label" style={{ marginBottom: 4 }}>
              <span className="dot dot-blue" style={{ display: 'inline-block', marginRight: 6 }} />
              Kék
            </div>
            <input
              type="number"
              className="input-field input-big"
              value={kekUresQty}
              min={0}
              max={data.stock.kekUres}
              onChange={e => {
                const v = Math.max(0, Math.min(data.stock.kekUres, parseInt(e.target.value) || 0))
                setKekUresQty(v)
              }}
            />
            <div style={{ fontSize: 11, opacity: 0.55, marginTop: 3, textAlign: 'center' }}>
              max {data.stock.kekUres} db
            </div>
          </div>
          <div>
            <div className="stock-label" style={{ marginBottom: 4 }}>
              <span className="dot dot-pink" style={{ display: 'inline-block', marginRight: 6 }} />
              Rózsaszín
            </div>
            <input
              type="number"
              className="input-field input-big"
              value={rozsaszinUresQty}
              min={0}
              max={data.stock.rozsaszinUres}
              onChange={e => {
                const v = Math.max(0, Math.min(data.stock.rozsaszinUres, parseInt(e.target.value) || 0))
                setRozsaszinUresQty(v)
              }}
            />
            <div style={{ fontSize: 11, opacity: 0.55, marginTop: 3, textAlign: 'center' }}>
              max {data.stock.rozsaszinUres} db
            </div>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 8, fontWeight: 700, fontSize: 15 }}>
          Összesen leadva: <span style={{ color: 'var(--blue)' }}>{osszesenLeadott} db</span>
        </div>
      </div>

      {/* Teli átvétel */}
      <div className="card">
        <div className="card-title">🟠⬇️ Teli patronok átvétele</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 6 }}>
          <div>
            <div className="stock-label" style={{ marginBottom: 4 }}>
              <span className="dot dot-blue" style={{ display: 'inline-block', marginRight: 6 }} />
              Kék
            </div>
            <input
              type="number"
              className="input-field input-big"
              value={kekTeleQty}
              min={0}
              max={osszesenLeadott}
              onChange={e => {
                const v = Math.max(0, parseInt(e.target.value) || 0)
                setKekTeleQty(v)
              }}
            />
          </div>
          <div>
            <div className="stock-label" style={{ marginBottom: 4 }}>
              <span className="dot dot-pink" style={{ display: 'inline-block', marginRight: 6 }} />
              Rózsaszín
            </div>
            <input
              type="number"
              className="input-field input-big"
              value={rozsaszinTeleQty}
              min={0}
              max={osszesenLeadott}
              onChange={e => {
                const v = Math.max(0, parseInt(e.target.value) || 0)
                setRozsaszinTeleQty(v)
              }}
            />
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 8, fontWeight: 700, fontSize: 15 }}>
          Összesen átvéve:{' '}
          <span style={{ color: osszesenAtvett === osszesenLeadott && osszesenLeadott > 0 ? 'var(--green)' : osszesenAtvett > osszesenLeadott ? 'var(--red)' : 'var(--text)' }}>
            {osszesenAtvett} db
          </span>
        </div>
      </div>

      {/* Összesítő */}
      <div className="csere-summary">
        <div className="csere-sum-row">
          <span className="csere-sum-label">Leadott üresek</span>
          <span className="csere-sum-value">{kekUresQty}K + {rozsaszinUresQty}P = {osszesenLeadott} db</span>
        </div>
        <div className="csere-sum-row">
          <span className="csere-sum-label">Átvett teliek</span>
          <span className="csere-sum-value">{kekTeleQty}K + {rozsaszinTeleQty}P = {osszesenAtvett} db</span>
        </div>
        {!egyenlo && osszesenLeadott > 0 && (
          <div style={{ color: 'var(--red)', fontSize: 13, textAlign: 'center', marginTop: 4 }}>
            ⚠️ A leadott és átvett darabszámnak egyeznie kell!
          </div>
        )}
        <div className="csere-sum-row" style={{ marginTop: 6 }}>
          <span className="csere-sum-label">Töltetési költség</span>
          <span className="csere-sum-value" style={{ fontSize: 20 }}>{formatMoney(koltseg)}</span>
        </div>
        <div className="csere-sum-hint">Javasolt: min. {data.csereMinimum} db (optimális ár)</div>
      </div>

      <button
        className="btn-primary btn-orange"
        onClick={submit}
        disabled={!egyenlo}
      >
        🔄 Töltetés – {osszesenLeadott} db / {formatMoney(koltseg)}
      </button>
    </div>
  )
}
