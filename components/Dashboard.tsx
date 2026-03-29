'use client'

import { DashboardData, Page } from './App'
import { useUser } from '@clerk/nextjs'

function formatMoney(n: number) {
  return new Intl.NumberFormat('hu-HU').format(n) + ' Ft'
}

interface Props {
  data: DashboardData | null
  onNavigate: (p: Page) => void
  onRefresh: () => void
}

export default function Dashboard({ data, onNavigate, onRefresh }: Props) {
  const { user } = useUser()

  if (!data) {
    return (
      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="skeleton" style={{ height: 88 }} />
        <div className="skeleton" style={{ height: 108 }} />
        <div className="skeleton" style={{ height: 108 }} />
        <div className="skeleton" style={{ height: 88 }} />
      </div>
    )
  }

  const penzNegativ = data.balance.penz < 0
  const penzNagyon  = data.balance.penz < -5000
  const balanceClass = penzNagyon ? 'danger' : penzNegativ ? 'warning' : 'positive'

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* User card */}
      <div className="user-card">
        <div className="user-avatar">
          {user?.imageUrl
            ? <img src={user.imageUrl} alt="" />
            : data.userName.charAt(0).toUpperCase()
          }
        </div>
        <div className="user-info">
          <div className="user-name">{data.userName}</div>
          <div className="user-email">{data.userEmail}</div>
        </div>
        <button className="btn-refresh" onClick={onRefresh} title="Frissítés">↻</button>
      </div>

      {/* Patron egyenleg */}
      <div className="card">
        <div className="card-title">Patron egyenleged</div>
        <div className="patron-row">
          <div className="patron-label">
            <div className="dot dot-blue" />
            Kék
          </div>
          <div className="patron-value">{data.balance.kekPatron} db</div>
        </div>
        <div className="patron-row">
          <div className="patron-label">
            <div className="dot dot-pink" />
            Rózsaszín
          </div>
          <div className="patron-value">{data.balance.rozsaszinPatron} db</div>
        </div>
      </div>

      {/* Pénzügyi egyenleg */}
      <div className={`balance-card ${balanceClass}`}>
        <div className="balance-label">Pénzügyi egyenleg</div>
        <div className="balance-amount">{formatMoney(data.balance.penz)}</div>
        {penzNegativ && <div className="balance-sub">Tartozás – rendezd mielőbb!</div>}
        <button
          className={`btn-primary ${penzNagyon ? 'btn-red' : penzNegativ ? 'btn-amber' : 'btn-green'}`}
          style={{ marginTop: 14 }}
          onClick={() => onNavigate('befizetes')}
        >
          💰 Befizetés
        </button>
      </div>

      {/* Akció gombok */}
      <div className="action-grid">
        <button className="action-btn behozas" onClick={() => onNavigate('behozas')}>
          <div className="icon">📦</div>
          <div className="action-name">Behozás</div>
          <div className="action-desc">Üres patron hozása</div>
        </button>
        <button className="action-btn elvitel" onClick={() => onNavigate('elvitel')}>
          <div className="icon">🥤</div>
          <div className="action-name">Elvitel</div>
          <div className="action-desc">Tele patron elvitele</div>
        </button>
      </div>

      {/* Közös készlet */}
      <div className="card">
        <div className="card-title">Közös készlet</div>
        <div className="stock-row">
          <div className="stock-label">
            <div className="dot dot-blue" />
            Kék
          </div>
          <div className="stock-values">
            <span className="stock-tele">{data.stock.kekTele} tele</span>
            <span className="stock-sep">/</span>
            <span className="stock-ures">{data.stock.kekUres} üres</span>
          </div>
        </div>
        <div className="stock-row">
          <div className="stock-label">
            <div className="dot dot-pink" />
            Rózsaszín
          </div>
          <div className="stock-values">
            <span className="stock-tele">{data.stock.rozsaszinTele} tele</span>
            <span className="stock-sep">/</span>
            <span className="stock-ures">{data.stock.rozsaszinUres} üres</span>
          </div>
        </div>
      </div>

      {/* Csere javaslatok */}
      {data.csereSuggestions.map((s, i) => (
        <div key={i} className={`suggestion ${s.csereelheto ? 'ready' : 'waiting'}`}>
          {s.csereelheto ? '✅ ' : '⏳ '}{s.uzenet}
        </div>
      ))}

      {/* Admin csere gomb */}
      {data.isAdmin && (
        <button
          className="btn-primary btn-orange"
          onClick={() => onNavigate('csere')}
        >
          ↔️ Csere (Admin)
        </button>
      )}
    </div>
  )
}
