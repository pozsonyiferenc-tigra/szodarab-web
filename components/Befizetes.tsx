'use client'

import { useState } from 'react'
import { DashboardData } from './App'

function formatMoney(n: number) {
  return new Intl.NumberFormat('hu-HU').format(n) + ' Ft'
}

const QUICK_AMOUNTS = [1900, 3800, 5700, 7600]

interface Props {
  data: DashboardData
  onSubmit: (data: Record<string, unknown>) => void
}

export default function Befizetes({ data, onSubmit }: Props) {
  const defaultAmount = data.balance.penz < 0 ? Math.abs(data.balance.penz) : data.patronPrice
  const [amount, setAmount] = useState(defaultAmount)
  const [megjegyzes, setMegjegyzes] = useState('Revolut')

  const newBalance = data.balance.penz + amount
  const penzNegativ = data.balance.penz < 0

  const submit = () => {
    onSubmit({
      muvelet: 'befizetes',
      kekUres: 0, kekTele: 0,
      rozsaszinUres: 0, rozsaszinTele: 0,
      osszegFt: amount,
      megjegyzes,
    })
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Jelenlegi egyenleg */}
      <div className={`rounded-2xl p-4 border ${penzNegativ ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
        <h2 className={`text-xs font-semibold uppercase tracking-wider mb-1 ${penzNegativ ? 'text-red-600' : 'text-emerald-600'}`}>
          Jelenlegi egyenleg
        </h2>
        <p className={`text-2xl font-bold ${penzNegativ ? 'text-red-600' : 'text-emerald-600'}`}>
          {formatMoney(data.balance.penz)}
        </p>
      </div>

      {/* Összeg */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Összeg (Ft)</h2>
        <input
          type="number"
          value={amount}
          min={0}
          step={100}
          onChange={e => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-2xl font-bold text-gray-800 text-center focus:outline-none focus:border-emerald-400 transition-colors"
        />
        <div className="flex gap-2 mt-3">
          {QUICK_AMOUNTS.map(v => (
            <button
              key={v}
              onClick={() => setAmount(v)}
              className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all active:scale-95 ${
                amount === v ? 'text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
              style={amount === v ? { background: '#10b981' } : {}}
            >
              {v.toLocaleString('hu-HU')}
            </button>
          ))}
        </div>
      </div>

      {/* Új egyenleg előnézet */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
        <span className="text-sm text-gray-500">Új egyenleg</span>
        <span className={`text-xl font-bold ${newBalance < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
          {formatMoney(newBalance)}
        </span>
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Megjegyzés</h2>
        <textarea
          value={megjegyzes}
          onChange={e => setMegjegyzes(e.target.value)}
          rows={2}
          maxLength={100}
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 resize-none focus:outline-none focus:border-emerald-400 transition-colors"
        />
      </div>

      <button
        onClick={submit}
        disabled={amount <= 0}
        className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 shadow-sm disabled:opacity-40"
        style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}
      >
        ✅ Rögzít – {formatMoney(amount)} befizetés
      </button>
    </div>
  )
}
