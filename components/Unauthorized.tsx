'use client'

import { useState } from 'react'
import { useUser } from '@clerk/nextjs'

/* ── Nem regisztrált felhasználó ── */
export function NotRegistered({ clerkName }: { clerkName: string }) {
  const { user } = useUser()
  const [nev, setNev] = useState(clerkName || user?.fullName || '')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    if (!nev.trim()) { setError('Add meg a neved!'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nev: nev.trim() }),
      })
      const data = await res.json()
      if (res.ok) setSent(true)
      else setError(data.error || 'Hiba történt.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="unauth-wrap fade-up">
      <div className="unauth-icon">🥤</div>
      {sent ? (
        <>
          <h1 className="unauth-title">Kérés elküldve!</h1>
          <p className="unauth-sub">A menedzser jóváhagyja a hozzáférésedet. Értesítünk, ha kész!</p>
        </>
      ) : (
        <>
          <h1 className="unauth-title">Hozzáférés kérése</h1>
          <p className="unauth-sub">Még nem vagy a Szódarab rendszerben. Add meg a neved, és a menedzser jóváhagyja a regisztrációdat.</p>
          <div className="unauth-form">
            <label className="unauth-label">Neved</label>
            <input
              className="input-field"
              value={nev}
              onChange={e => setNev(e.target.value)}
              placeholder="Teljes név"
              onKeyDown={e => e.key === 'Enter' && submit()}
            />
            {error && <div className="unauth-error">{error}</div>}
            <button
              className="btn-primary btn-blue"
              style={{ marginTop: 8 }}
              onClick={submit}
              disabled={loading}
            >
              {loading ? 'Küldés...' : '📨 Hozzáférés kérése'}
            </button>
          </div>
          <p className="unauth-footer">
            Bejelentkezve mint <strong>{user?.emailAddresses[0]?.emailAddress}</strong>
          </p>
        </>
      )}
    </div>
  )
}

/* ── Függőben lévő felhasználó ── */
export function PendingApproval({ nev }: { nev: string }) {
  const { user } = useUser()
  return (
    <div className="unauth-wrap fade-up">
      <div className="unauth-icon" style={{ animationDelay: '.1s' }}>⏳</div>
      <h1 className="unauth-title">Jóváhagyásra vár</h1>
      <p className="unauth-sub">
        Szia <strong>{nev}</strong>! A regisztrációd beérkezett, a menedzser hamarosan jóváhagyja a hozzáférésedet.
      </p>
      <div className="pending-pulse">
        <div className="pulse-dot" />
        <span>Várakozás...</span>
      </div>
      <p className="unauth-footer">
        Bejelentkezve mint <strong>{user?.emailAddresses[0]?.emailAddress}</strong>
      </p>
    </div>
  )
}
