'use client'

import { useState } from 'react'
import { DashboardData } from './App'
import Counter from './Counter'
import TypeSelector from './TypeSelector'

interface Props {
  data: DashboardData
  onSubmit: (data: Record<string, unknown>) => void
}

export default function Behozas({ data: _data, onSubmit }: Props) {
  const [quantity, setQuantity] = useState(1)
  const [type, setType] = useState<'kek' | 'rozsaszin'>('kek')
  const [megjegyzes, setMegjegyzes] = useState('')

  const submit = () => {
    onSubmit({
      muvelet: 'behozas',
      kekUres: type === 'kek' ? quantity : 0,
      rozsaszinUres: type === 'rozsaszin' ? quantity : 0,
      kekTele: 0,
      rozsaszinTele: 0,
      osszegFt: 0,
      megjegyzes,
    })
  }

  return (
    <div className="flex flex-col gap-4 animate-fade-in">
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Patron típusa</h2>
        <TypeSelector value={type} onChange={setType} />
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Mennyiség</h2>
        <Counter
          value={quantity}
          onChange={setQuantity}
          quickValues={[1, 2, 3, 4]}
        />
      </div>

      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Megjegyzés (opcionális)</h2>
        <textarea
          value={megjegyzes}
          onChange={e => setMegjegyzes(e.target.value)}
          rows={3}
          maxLength={100}
          placeholder="Pl. hétfőn hoztam..."
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm text-gray-800 resize-none focus:outline-none focus:border-blue-400 transition-colors"
        />
      </div>

      <button
        onClick={submit}
        className="w-full py-4 rounded-2xl font-bold text-white text-base transition-all active:scale-95 shadow-sm"
        style={{ background: 'linear-gradient(135deg, #2196F3, #1565C0)' }}
      >
        ✅ Rögzít – {quantity} db {type === 'kek' ? 'kék' : 'rózsaszín'} behozás
      </button>
    </div>
  )
}
