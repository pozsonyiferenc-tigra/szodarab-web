'use client'

import { DashboardData, Page } from './App'
import { useUser } from '@clerk/nextjs'

function formatMoney(n: number) {
  return new Intl.NumberFormat('hu-HU').format(n) + ' Ft'
}

function PatronBadge({ count, color }: { count: number; color: 'kek' | 'rozsaszin' }) {
  const accent = color === 'kek' ? '#2196F3' : '#E91E63'
  const label = color === 'kek' ? 'Kék' : 'Rózsaszín'
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ background: accent }} />
        <span className="text-gray-600 text-sm">{label}</span>
      </div>
      <span className="font-semibold text-gray-800">{count} db</span>
    </div>
  )
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
      <div className="flex flex-col gap-4 animate-pulse">
        <div className="h-28 bg-gray-200 rounded-2xl" />
        <div className="h-36 bg-gray-200 rounded-2xl" />
        <div className="h-28 bg-gray-200 rounded-2xl" />
      </div>
    )
  }

  const penzNegativ = data.balance.penz < 0
  const penzNagyon = data.balance.penz < -5000

  return (
    <div className="flex flex-col gap-4">
      {/* User card */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-3">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">
              {data.userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-semibold text-gray-900">{data.userName}</p>
            <p className="text-xs text-gray-400">{data.userEmail}</p>
          </div>
          <button onClick={onRefresh} className="ml-auto text-gray-400 hover:text-gray-600 transition-colors text-lg" title="Frissítés">
            ↻
          </button>
        </div>
      </div>

      {/* Patron egyenleg */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Patron egyenleged</h2>
        <PatronBadge count={data.balance.kekPatron} color="kek" />
        <div className="h-px bg-gray-100 my-1" />
        <PatronBadge count={data.balance.rozsaszinPatron} color="rozsaszin" />
      </div>

      {/* Pénzügyi egyenleg */}
      <div
        className={`rounded-2xl p-5 shadow-sm border ${
          penzNagyon
            ? 'bg-red-50 border-red-200'
            : penzNegativ
            ? 'bg-amber-50 border-amber-200'
            : 'bg-emerald-50 border-emerald-200'
        }`}
      >
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-2"
          style={{ color: penzNagyon ? '#ef4444' : penzNegativ ? '#f59e0b' : '#10b981' }}
        >
          Pénzügyi egyenleg
        </h2>
        <p className={`text-2xl font-bold ${penzNagyon ? 'text-red-600' : penzNegativ ? 'text-amber-600' : 'text-emerald-600'}`}>
          {formatMoney(data.balance.penz)}
        </p>
        {penzNegativ && (
          <p className="text-xs text-gray-500 mt-1">Tartozás – rendezd mielőbb!</p>
        )}
        <button
          onClick={() => onNavigate('befizetes')}
          className="mt-3 w-full py-2.5 rounded-xl font-semibold text-sm text-white transition-all active:scale-95"
          style={{ background: penzNagyon ? '#ef4444' : penzNegativ ? '#f59e0b' : '#10b981' }}
        >
          💰 Befizetés
        </button>
      </div>

      {/* Akció gombok */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate('behozas')}
          className="bg-white border border-gray-200 rounded-2xl p-5 text-left shadow-sm hover:border-blue-300 hover:bg-blue-50 transition-all active:scale-95 group"
        >
          <div className="text-3xl mb-2">📦</div>
          <div className="font-semibold text-gray-800 text-sm group-hover:text-blue-700">Behozás</div>
          <div className="text-xs text-gray-400 mt-0.5">Üres patron hozása</div>
        </button>
        <button
          onClick={() => onNavigate('elvitel')}
          className="bg-white border border-gray-200 rounded-2xl p-5 text-left shadow-sm hover:border-pink-300 hover:bg-pink-50 transition-all active:scale-95 group"
        >
          <div className="text-3xl mb-2">🥤</div>
          <div className="font-semibold text-gray-800 text-sm group-hover:text-pink-700">Elvitel</div>
          <div className="text-xs text-gray-400 mt-0.5">Tele patron elvitele</div>
        </button>
      </div>

      {/* Közös készlet */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Közös készlet</h2>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-600">Kék</span>
            </div>
            <div className="text-sm font-medium text-gray-800">
              <span className="text-green-600">{data.stock.kekTele} tele</span>
              <span className="text-gray-400 mx-1">/</span>
              <span className="text-gray-500">{data.stock.kekUres} üres</span>
            </div>
          </div>
          <div className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
              <span className="text-sm text-gray-600">Rózsaszín</span>
            </div>
            <div className="text-sm font-medium text-gray-800">
              <span className="text-green-600">{data.stock.rozsaszinTele} tele</span>
              <span className="text-gray-400 mx-1">/</span>
              <span className="text-gray-500">{data.stock.rozsaszinUres} üres</span>
            </div>
          </div>
        </div>
      </div>

      {/* Csere javaslatok */}
      {data.csereSuggestions.map((s, i) => (
        <div
          key={i}
          className={`rounded-2xl p-4 text-sm ${
            s.csereelheto
              ? 'bg-blue-50 border border-blue-200 text-blue-800'
              : 'bg-amber-50 border border-amber-200 text-amber-800'
          }`}
        >
          {s.csereelheto ? '✅ ' : '⏳ '}{s.uzenet}
        </div>
      ))}

      {/* Admin csere gomb */}
      {data.isAdmin && (
        <button
          onClick={() => onNavigate('csere')}
          className="w-full py-3 rounded-2xl font-semibold text-white text-sm transition-all active:scale-95"
          style={{ background: 'linear-gradient(135deg, #ff9800, #f57c00)' }}
        >
          ↔️ Csere (Admin)
        </button>
      )}
    </div>
  )
}
