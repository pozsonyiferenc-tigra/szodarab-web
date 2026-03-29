'use client'

import { useState } from 'react'
import { DashboardData } from './App'
import Counter from './Counter'
import TypeSelector from './TypeSelector'

function formatMoney(n: number) {
  return new Intl.NumberFormat('hu-HU').format(n) + ' Ft'
}

interface Props {
  data: DashboardData
  onSubmit: (data: Record<string, unknown>) => void
}

export default function Elvitel({ data, onSubmit }: Props) {
  const [quantity, setQuantity] = useState(1)
  const [type, setType] = useState<'kek' | 'rozsaszin'>('kek')

  const maxQty = type === 'kek' ? data.balance.kekPatron : data.balance.rozsaszinPatron
  const fizetendo = quantity * data.patronPrice

  const submit = () => {
    onSubmit({
      muvelet: 'elvitel',
      kekTele: type === 'kek' ? -quantity : 0,
      rozsaszinTele: type === 'rozsaszin' ? -quantity : 0,
      kekUres: 0,
      rozsaszinUres: 0,
      osszegFt: 0,
      megjegyzes: '',
    })
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      {/* Egyenleg info */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
        <h2 className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">Patron egyenleged</h2>
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-sm font-semibold text-gray-700">{data.balance.kekPatron} db kék</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-pink-500" />
            <span className="text-sm font-semibold text-gray-700">{data.balance.rozsaszinPatron} db rózsaszín</span>
          </div>
        </div>
        {maxQty === 0 && (
          <p className="text-amber-700 text-xs mt-2 font-medium">⚠️ Nincs elegendő {type === 'kek' ? 'kék' : 'rózsaszín'} patron egyenleged!</p>
        )}
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Patron típusa</h2>
        <TypeSelector value={type} onChange={(t) => { setType(t); setQuantity(1) }} />
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Mennyiség (max: {maxQty} db)
        </h2>
        <Counter
          value={quantity}
          onChange={setQuantity}
          min={1}
          max={maxQty}
          quickValues={[1, 2]}
          extraButton={{ label: 'Max', getValue: () => maxQty }}
        />
      </div>

      {/* Fizetendő */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
        <span className="text-sm text-gray-500 font-medium">Fizetendő</span>
        <span className="text-xl font-bold text-gray-800">{formatMoney(fizetendo)}</span>
      </div>

      <button
        onClick={submit}
        disabled={maxQty === 0}
        className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 shadow-sm disabled:opacity-40"
        style={{ background: maxQty === 0 ? '#ccc' : 'linear-gradient(135deg, #E91E63, #880E4F)' }}
      >
        ✅ Rögzít – {quantity} db {type === 'kek' ? 'kék' : 'rózsaszín'} elvitel
      </button>
    </div>
  )
}
