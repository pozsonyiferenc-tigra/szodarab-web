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
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card">
        <div className="card-title">Patron típusa</div>
        <TypeSelector value={type} onChange={setType} />
      </div>

      <div className="card">
        <div className="card-title">Mennyiség</div>
        <Counter value={quantity} onChange={setQuantity} quickValues={[1, 2, 3, 4]} />
      </div>

      <div className="card">
        <div className="card-title">Megjegyzés (opcionális)</div>
        <textarea
          className="input-field"
          value={megjegyzes}
          onChange={e => setMegjegyzes(e.target.value)}
          rows={3}
          maxLength={100}
          placeholder="Pl. hétfőn hoztam..."
        />
      </div>

      <button className="btn-primary btn-blue" onClick={submit}>
        ✅ Rögzít – {quantity} db {type === 'kek' ? 'kék' : 'rózsaszín'} behozás
      </button>
    </div>
  )
}
