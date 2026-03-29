'use client'

import { useState, useEffect, useCallback } from 'react'
import Dashboard from './Dashboard'
import Behozas from './Behozas'
import Elvitel from './Elvitel'
import Befizetes from './Befizetes'
import Csere from './Csere'
import Loading from './Loading'
import Toast from './Toast'

export type Page = 'dashboard' | 'behozas' | 'elvitel' | 'befizetes' | 'csere'

export interface DashboardData {
  userName: string
  userEmail: string
  isAdmin: boolean
  balance: { kekPatron: number; rozsaszinPatron: number; penz: number }
  stock: { kekUres: number; kekTele: number; rozsaszinUres: number; rozsaszinTele: number }
  patronPrice: number
  csereMinimum: number
  csereSuggestions: Array<{ tipus: string; uzenet: string; mennyiseg: number; csereelheto: boolean }>
}

export interface ToastMsg { id: number; text: string; type: 'success' | 'error' }

const PAGE_TITLES: Record<Page, string> = {
  dashboard: '',
  behozas: 'Behozás',
  elvitel: 'Elvitel',
  befizetes: 'Befizetés',
  csere: 'Csere',
}

export default function App() {
  const [page, setPage] = useState<Page>('dashboard')
  const [data, setData] = useState<DashboardData | null>(null)
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
      if (!res.ok) throw new Error('Betöltési hiba')
      setData(await res.json())
    } catch {
      showToast('Hiba az adatok betöltésekor', 'error')
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

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-inner">
          {page === 'dashboard' ? (
            <span className="app-logo">
              <span className="blue">Szóda</span><span className="pink">rab</span>
            </span>
          ) : (
            <>
              <button className="btn-back" onClick={() => setPage('dashboard')}>
                ← Vissza
              </button>
              <span className="page-title" style={{ fontSize: 17, fontWeight: 700 }}>
                {PAGE_TITLES[page]}
              </span>
              <div style={{ width: 80 }} />
            </>
          )}
        </div>
      </header>

      <main className="app-main">
        {page === 'dashboard' && <Dashboard data={data} onNavigate={setPage} onRefresh={() => loadDashboard(true)} />}
        {page === 'behozas'   && data && <Behozas   data={data} onSubmit={submitTransaction} />}
        {page === 'elvitel'   && data && <Elvitel   data={data} onSubmit={submitTransaction} />}
        {page === 'befizetes' && data && <Befizetes data={data} onSubmit={submitTransaction} />}
        {page === 'csere'     && data && <Csere     data={data} onSubmit={submitTransaction} />}
      </main>

      <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 60, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
        {toasts.map(t => <Toast key={t.id} text={t.text} type={t.type} />)}
      </div>

      {loading && <Loading />}
    </div>
  )
}
