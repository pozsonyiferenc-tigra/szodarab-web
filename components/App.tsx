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
  balance: {
    kekPatron: number
    rozsaszinPatron: number
    penz: number
  }
  stock: {
    kekUres: number
    kekTele: number
    rozsaszinUres: number
    rozsaszinTele: number
  }
  patronPrice: number
  csereMinimum: number
  csereSuggestions: Array<{
    tipus: string
    uzenet: string
    mennyiseg: number
    csereelheto: boolean
  }>
}

export interface ToastMsg {
  id: number
  text: string
  type: 'success' | 'error'
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
      const json: DashboardData = await res.json()
      setData(json)
    } catch {
      showToast('Hiba az adatok betöltésekor', 'error')
    } finally {
      if (!silent) setLoading(false)
    }
  }, [showToast])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  const navigate = (p: Page) => setPage(p)

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
        setTimeout(() => {
          setPage('dashboard')
          loadDashboard()
        }, 1200)
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
    <div className="min-h-dvh flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">
            <span style={{ color: '#2196F3' }}>Szóda</span>
            <span style={{ color: '#E91E63' }}>rab</span>
          </h1>
          {page !== 'dashboard' && (
            <button
              onClick={() => navigate('dashboard')}
              className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-100"
            >
              ← Vissza
            </button>
          )}
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-5 animate-fade-in">
        {page === 'dashboard' && (
          <Dashboard data={data} onNavigate={navigate} onRefresh={() => loadDashboard(true)} />
        )}
        {page === 'behozas' && data && (
          <Behozas data={data} onSubmit={submitTransaction} />
        )}
        {page === 'elvitel' && data && (
          <Elvitel data={data} onSubmit={submitTransaction} />
        )}
        {page === 'befizetes' && data && (
          <Befizetes data={data} onSubmit={submitTransaction} />
        )}
        {page === 'csere' && data && (
          <Csere data={data} onSubmit={submitTransaction} />
        )}
      </main>

      {/* Toast notifications */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => (
          <Toast key={t.id} text={t.text} type={t.type} />
        ))}
      </div>

      {/* Loading overlay */}
      {loading && <Loading />}
    </div>
  )
}
