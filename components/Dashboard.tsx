'use client'

import { useState, useEffect } from 'react'
import { DashboardData, Page } from './App'
import { useUser } from '@clerk/nextjs'

function formatMoney(n: number) {
  return new Intl.NumberFormat('hu-HU').format(n) + ' Ft'
}

/* Small soda cylinder icon for action buttons */
function CylIcon({ color, size = 48 }: { color: string; size?: number }) {
  const h = Math.round(size * 2.5)
  const cx = size / 2
  const dark = color === '#1AC9FF' ? '#005A90' : '#880040'
  const id = `cyl_${color.replace('#', '')}`
  return (
    <svg width={size} height={h} viewBox="0 0 50 125" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id={id} x1="0" x2="1">
          <stop offset="0%"   stopColor={dark}  stopOpacity=".7"/>
          <stop offset="45%"  stopColor={color}/>
          <stop offset="100%" stopColor={dark}  stopOpacity=".7"/>
        </linearGradient>
      </defs>
      {/* nozzle */}
      <rect x="20" y="4" width="10" height="19" rx="4" fill="#4A6070"/>
      <ellipse cx="25" cy="4" rx="5" ry="2.5" fill="#607888"/>
      {/* shoulder */}
      <ellipse cx="25" cy="24" rx="19" ry="6.5" fill={color} opacity=".9"/>
      {/* body */}
      <rect x="6"  y="24" width="38" height="82" rx="5" fill={`url(#${id})`}/>
      {/* base */}
      <ellipse cx="25" cy="106" rx="19" ry="6.5" fill={dark} opacity=".7"/>
      {/* highlight */}
      <rect x="9"  y="27" width="9"  height="76" rx="3.5" fill="rgba(255,255,255,.25)"/>
      {/* label */}
      <text x="25" y="74" textAnchor="middle" fill="rgba(255,255,255,.35)"
        fontSize="9" fontWeight="700" fontFamily="system-ui,sans-serif">CO₂</text>
    </svg>
  )
}

interface Props {
  data: DashboardData | null
  onNavigate: (p: Page) => void
  onRefresh: () => void
}

function usePendingUsers(isAdmin: boolean) {
  const [pending, setPending] = useState<{ row: number; nev: string; email: string }[]>([])
  const [approving, setApproving] = useState<string | null>(null)

  useEffect(() => {
    if (!isAdmin) return
    fetch('/api/admin/pending').then(r => r.json()).then(setPending).catch(() => {})
  }, [isAdmin])

  const approve = async (email: string) => {
    setApproving(email)
    try {
      const res = await fetch('/api/admin/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) setPending(prev => prev.filter(p => p.email !== email))
    } finally {
      setApproving(null)
    }
  }

  return { pending, approve, approving }
}

export default function Dashboard({ data, onNavigate, onRefresh }: Props) {
  const { user } = useUser()

  if (!data) {
    return (
      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="skeleton" style={{ height: 90 }} />
        <div className="skeleton" style={{ height: 110 }} />
        <div className="skeleton" style={{ height: 110 }} />
        <div className="skeleton" style={{ height: 90 }} />
      </div>
    )
  }

  const { pending, approve, approving } = usePendingUsers(data.isAdmin)

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
            Kék patron
          </div>
          <div className="patron-value">{data.balance.kekPatron} db</div>
        </div>
        <div className="patron-row">
          <div className="patron-label">
            <div className="dot dot-pink" />
            Rózsaszín patron
          </div>
          <div className="patron-value">{data.balance.rozsaszinPatron} db</div>
        </div>
      </div>

      {/* Akció gombok – szódapatron ikonokkal */}
      <div className="action-grid">
        <button className="action-btn behozas" onClick={() => onNavigate('behozas')}>
          <div className="action-cyl">
            <CylIcon color="#1AC9FF" size={46} />
          </div>
          <div className="action-name">Behozás</div>
          <div className="action-desc">Üres patron hozása</div>
        </button>
        <button className="action-btn elvitel" onClick={() => onNavigate('elvitel')}>
          <div className="action-cyl">
            <CylIcon color="#FF2090" size={46} />
          </div>
          <div className="action-name">Elvitel</div>
          <div className="action-desc">Tele patron elvitele</div>
        </button>
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

      {/* Admin szekció */}
      {data.isAdmin && (
        <>
          <button className="btn-primary btn-orange" onClick={() => onNavigate('csere')}>
            ↔️ Csere (Admin)
          </button>

          {pending.length > 0 && (
            <div className="card">
              <div className="card-title" style={{ color: 'var(--amber)' }}>
                🔔 Jóváhagyásra vár ({pending.length})
              </div>
              {pending.map(p => (
                <div key={p.email} className="pending-row">
                  <div className="pending-info">
                    <div className="pending-name">{p.nev}</div>
                    <div className="pending-email">{p.email}</div>
                  </div>
                  <button
                    className="btn-approve"
                    onClick={() => approve(p.email)}
                    disabled={approving === p.email}
                  >
                    {approving === p.email ? '...' : '✓ Jóváhagy'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
