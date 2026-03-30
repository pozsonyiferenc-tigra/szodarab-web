'use client'

import { useState, useEffect, useCallback } from 'react'
import Dashboard from './Dashboard'
import Behozas from './Behozas'
import Elvitel from './Elvitel'
import Befizetes from './Befizetes'
import Csere from './Csere'
import Loading from './Loading'
import Toast from './Toast'
import { NotRegistered, PendingApproval } from './Unauthorized'

export type Page = 'dashboard' | 'behozas' | 'elvitel' | 'befizetes' | 'csere'
export type AuthState = 'loading' | 'ok' | 'not_registered' | 'pending'

export interface DashboardData {
  userName: string
  userEmail: string
  isAdmin: boolean
  tema: 'dark' | 'light'
  balance: { kekPatron: number; rozsaszinPatron: number; penz: number }
  stock: { kekUres: number; kekTele: number; rozsaszinUres: number; rozsaszinTele: number }
  patronPrice: number
  csereMinimum: number
  csereSuggestions: Array<{ tipus: string; uzenet: string; mennyiseg: number; csereelheto: boolean }>
}

export interface ToastMsg { id: number; text: string; type: 'success' | 'error' }

const PAGE_TITLES: Record<Page, string> = {
  dashboard: '',
  behozas: 'Üres behozás',
  elvitel: 'Teli elvitel',
  befizetes: 'Befizetés',
  csere: 'Csere',
}

/* ── Theme – Google Sheets-ből töltve, API-n mentve ── */
function applyTheme(t: 'dark' | 'light') {
  document.documentElement.setAttribute('data-theme', t)
}

/* ── Cylinder SVG background decorations ── */
function BgCylinders() {
  return (
    <div className="bg-decor" aria-hidden="true">
      <svg className="bg-cyl bg-cyl-blue" viewBox="0 0 100 240" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgb" x1="0" x2="1">
            <stop offset="0%" stopColor="#005A90" stopOpacity=".75"/>
            <stop offset="40%" stopColor="#1AC9FF"/>
            <stop offset="100%" stopColor="#005A90" stopOpacity=".75"/>
          </linearGradient>
        </defs>
        <rect x="40" y="8" width="20" height="36" rx="7" fill="#4A6070"/>
        <ellipse cx="50" cy="8" rx="10" ry="5" fill="#607888"/>
        <ellipse cx="50" cy="46" rx="38" ry="13" fill="#1AC9FF" opacity=".9"/>
        <rect x="12" y="46" width="76" height="168" rx="8" fill="url(#bgb)"/>
        <ellipse cx="50" cy="214" rx="38" ry="13" fill="#005A90" opacity=".7"/>
        <rect x="16" y="50" width="19" height="160" rx="6" fill="rgba(255,255,255,.22)"/>
        <rect x="18" y="88" width="64" height="90" rx="5" fill="rgba(255,255,255,.07)"/>
        <text x="50" y="143" textAnchor="middle" fill="rgba(255,255,255,.28)" fontSize="15" fontWeight="700" fontFamily="system-ui,sans-serif">CO₂</text>
      </svg>
      <svg className="bg-cyl bg-cyl-pink" viewBox="0 0 100 240" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bgp" x1="0" x2="1">
            <stop offset="0%" stopColor="#880040" stopOpacity=".75"/>
            <stop offset="40%" stopColor="#FF2090"/>
            <stop offset="100%" stopColor="#880040" stopOpacity=".75"/>
          </linearGradient>
        </defs>
        <rect x="40" y="8" width="20" height="36" rx="7" fill="#604060"/>
        <ellipse cx="50" cy="8" rx="10" ry="5" fill="#807080"/>
        <ellipse cx="50" cy="46" rx="38" ry="13" fill="#FF2090" opacity=".9"/>
        <rect x="12" y="46" width="76" height="168" rx="8" fill="url(#bgp)"/>
        <ellipse cx="50" cy="214" rx="38" ry="13" fill="#880040" opacity=".7"/>
        <rect x="16" y="50" width="19" height="160" rx="6" fill="rgba(255,255,255,.22)"/>
        <rect x="18" y="88" width="64" height="90" rx="5" fill="rgba(255,255,255,.07)"/>
        <text x="50" y="143" textAnchor="middle" fill="rgba(255,255,255,.28)" fontSize="15" fontWeight="700" fontFamily="system-ui,sans-serif">CO₂</text>
      </svg>
      <svg className="bg-cyl bg-cyl-blue2" viewBox="0 0 100 240" xmlns="http://www.w3.org/2000/svg">
        <rect x="40" y="8" width="20" height="36" rx="7" fill="#4A6070"/>
        <ellipse cx="50" cy="8" rx="10" ry="5" fill="#607888"/>
        <ellipse cx="50" cy="46" rx="38" ry="13" fill="#1AC9FF" opacity=".9"/>
        <rect x="12" y="46" width="76" height="168" rx="8" fill="#0090CC"/>
        <rect x="16" y="50" width="19" height="160" rx="6" fill="rgba(255,255,255,.18)"/>
      </svg>
      <svg className="bg-cyl bg-cyl-pink2" viewBox="0 0 100 240" xmlns="http://www.w3.org/2000/svg">
        <rect x="40" y="8" width="20" height="36" rx="7" fill="#604060"/>
        <ellipse cx="50" cy="8" rx="10" ry="5" fill="#807080"/>
        <ellipse cx="50" cy="46" rx="38" ry="13" fill="#FF2090" opacity=".9"/>
        <rect x="12" y="46" width="76" height="168" rx="8" fill="#CC0068"/>
        <rect x="16" y="50" width="19" height="160" rx="6" fill="rgba(255,255,255,.18)"/>
      </svg>
    </div>
  )
}

export default function App() {
  const [theme, setThemeState] = useState<'dark' | 'light'>('dark')
  const [page, setPage] = useState<Page>('dashboard')
  const [data, setData] = useState<DashboardData | null>(null)
  const [authState, setAuthState] = useState<AuthState>('loading')
  const [authMeta, setAuthMeta] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [toasts, setToasts] = useState<ToastMsg[]>([])

  const showToast = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, text, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500)
  }, [])

  const loadDashboard = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const json: DashboardData = await res.json()
        setData(json)
        setAuthState('ok')
        // Téma alkalmazása a Sheetsből jövő érték alapján
        const t = json.tema ?? 'dark'
        setThemeState(t)
        applyTheme(t)
      } else {
        const body = await res.json()
        if (res.status === 403) {
          if (body.error === 'not_registered') {
            setAuthState('not_registered')
            setAuthMeta({ clerkName: body.clerkName ?? '' })
          } else if (body.error === 'pending') {
            setAuthState('pending')
            setAuthMeta({ nev: body.nev ?? '' })
          } else {
            setAuthState('not_registered')
          }
        } else {
          showToast('Hiba az adatok betöltésekor', 'error')
        }
      }
    } catch {
      showToast('Hálózati hiba', 'error')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [showToast])

  useEffect(() => { loadDashboard() }, [loadDashboard])

  const submitTransaction = async (txData: Record<string, unknown>) => {
    setLoading(true)
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(txData),
      })
      const result = await res.json()
      if (result.success) {
        showToast(result.message, 'success')
        setData(null)
        setTimeout(() => { setPage('dashboard'); loadDashboard() }, 1200)
      } else {
        showToast(result.message || result.error, 'error')
      }
    } catch {
      showToast('Hálózati hiba', 'error')
    } finally {
      setLoading(false)
    }
  }

  const toggleTheme = useCallback(async () => {
    const next = theme === 'dark' ? 'light' : 'dark'
    // Azonnali UI frissítés (optimistic)
    setThemeState(next)
    applyTheme(next)
    // Mentés Google Sheetsbe
    try {
      await fetch('/api/theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tema: next }),
      })
      // Cache invalidálás hogy a következő betöltés friss értéket kapjon
      if (data) setData({ ...data, tema: next })
    } catch {
      // Hiba esetén visszaállítjuk
      setThemeState(theme)
      applyTheme(theme)
      showToast('Témaváltás mentése sikertelen', 'error')
    }
  }, [theme, data, showToast])

  const themeIcon = theme === 'dark' ? '☀️' : '🌙'

  return (
    <>
      <BgCylinders />
      <div className="app-shell">
        <header className="app-header">
          <div className={`app-header-inner${page !== 'dashboard' ? ' subpage' : ''}`}>
            {page === 'dashboard' ? (
              <>
                <div className="logo-pill">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/logo.png" alt="Szódarab" className="app-logo-img" />
                </div>
                <button className="btn-theme" onClick={toggleTheme} title={theme === 'dark' ? 'Világos mód' : 'Sötét mód'}>
                  {themeIcon}
                </button>
              </>
            ) : (
              <>
                <button className="btn-back" onClick={() => setPage('dashboard')}>← Vissza</button>
                <span className="page-title">{PAGE_TITLES[page]}</span>
                <button className="btn-theme" onClick={toggleTheme} title={theme === 'dark' ? 'Világos mód' : 'Sötét mód'}>
                  {themeIcon}
                </button>
              </>
            )}
          </div>
        </header>

        <main className="app-main">
          {authState === 'loading' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="skeleton" style={{ height: 90 }} />
              <div className="skeleton" style={{ height: 110 }} />
              <div className="skeleton" style={{ height: 90 }} />
            </div>
          )}
          {authState === 'not_registered' && <NotRegistered clerkName={authMeta.clerkName ?? ''} />}
          {authState === 'pending'        && <PendingApproval nev={authMeta.nev ?? ''} />}
          {authState === 'ok' && (
            <>
              {page === 'dashboard' && <Dashboard data={data} onNavigate={setPage} onRefresh={() => loadDashboard(true)} />}
              {page === 'behozas'   && data && <Behozas   data={data} onSubmit={submitTransaction} />}
              {page === 'elvitel'   && data && <Elvitel   data={data} onSubmit={submitTransaction} />}
              {page === 'befizetes' && data && <Befizetes data={data} onSubmit={submitTransaction} />}
              {page === 'csere'     && data && <Csere     data={data} onSubmit={submitTransaction} />}
            </>
          )}
        </main>

        <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 60, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
          {toasts.map(t => <Toast key={t.id} text={t.text} type={t.type} />)}
        </div>

        {loading && <Loading />}
      </div>
    </>
  )
}
