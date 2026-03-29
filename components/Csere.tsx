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
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Elérhető üres készlet */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Elérhető üres patronok</h2>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between bg-blue-50 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-gray-700">Kék</span>
            </div>
            <span className="font-bold text-blue-700">{data.stock.kekUres} db</span>
          </div>
          <div className="flex items-center justify-between bg-pink-50 rounded-xl px-4 py-2.5">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-pink-500" />
              <span className="text-sm text-gray-700">Rózsaszín</span>
            </div>
            <span className="font-bold text-pink-700">{data.stock.rozsaszinUres} db</span>
          </div>
          <div className="flex items-center justify-between bg-gray-100 rounded-xl px-4 py-2.5">
            <span className="text-sm font-semibold text-gray-600">Összesen</span>
            <span className="font-bold text-gray-800">{maxOsszesen} db</span>
          </div>
        </div>
      </div>

      {/* Kék csere input */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <h2 className="text-sm font-semibold text-gray-700">Kék (db)</h2>
        </div>
        <input
          type="number"
          value={kekQty}
          min={0}
          max={data.stock.kekUres}
          onChange={e => setKekQty(Math.max(0, Math.min(data.stock.kekUres, parseInt(e.target.value) || 0)))}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-2xl font-bold text-center focus:outline-none focus:border-blue-400 transition-colors"
        />
      </div>

      {/* Rózsaszín csere input */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full bg-pink-500" />
          <h2 className="text-sm font-semibold text-gray-700">Rózsaszín (db)</h2>
        </div>
        <input
          type="number"
          value={rozsaszinQty}
          min={0}
          max={data.stock.rozsaszinUres}
          onChange={e => setRozsaszinQty(Math.max(0, Math.min(data.stock.rozsaszinUres, parseInt(e.target.value) || 0)))}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-2xl font-bold text-center focus:outline-none focus:border-pink-400 transition-colors"
        />
      </div>

      {/* Összesítő */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-amber-700">Összesen cserélve</span>
          <span className="font-bold text-amber-800">{osszesen} db</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-amber-700">Költség</span>
          <span className="text-xl font-bold text-amber-800">{formatMoney(koltseg)}</span>
        </div>
        <p className="text-xs text-amber-600 mt-2">Javasolt: min. {data.csereMinimum} db (optimális ár)</p>
      </div>

      <button
        onClick={submit}
        disabled={osszesen === 0}
        className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 shadow-sm disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg, #ff9800, #e65100)' }}
      >
        ↔️ Csere – {osszesen} db / {formatMoney(koltseg)}
      </button>
    </div>
  )
}
