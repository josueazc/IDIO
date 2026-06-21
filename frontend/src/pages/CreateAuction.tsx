import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { createAuction } from '../services/store'

interface Props {
  address: string | null
}

export default function CreateAuction({ address }: Props) {
  const nav = useNavigate()
  const [asset, setAsset] = useState('Bonos Soberanos')
  const [amount, setAmount] = useState(500_000_000)
  const [minBid, setMinBid] = useState(10_000_000)
  const [currency, setCurrency] = useState('USDC')
  const [duration, setDuration] = useState(48)
  const [description, setDescription] = useState('')
  const [phase, setPhase] = useState<'form' | 'proving'>('form')

  async function submit() {
    setPhase('proving')
    await createAuction({
      issuer: address ?? 'GISSUER0000000000000000000000000000000000000000000000000',
      asset,
      amount,
      minBid,
      currency,
      description: description || 'Emisión institucional.',
      durationHours: duration,
    })
    nav('/auctions')
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Nueva subasta</h1>
        <p className="text-sm text-slate-400">
          Se generará una prueba de reservas (ZK) antes de publicar on-chain.
        </p>
      </div>

      <div className="card space-y-4 p-6">
        <div>
          <label className="label">Activo</label>
          <input className="input" value={asset} onChange={(e) => setAsset(e.target.value)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Monto total</label>
            <input
              type="number"
              className="input font-mono"
              value={amount}
              step={10_000_000}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Moneda</label>
            <select className="input" value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option>USDC</option>
              <option>EURC</option>
              <option>XLM</option>
            </select>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Mínimo por oferta</label>
            <input
              type="number"
              className="input font-mono"
              value={minBid}
              step={1_000_000}
              onChange={(e) => setMinBid(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Duración (horas)</label>
            <input
              type="number"
              className="input font-mono"
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
            />
          </div>
        </div>

        <div>
          <label className="label">Descripción</label>
          <textarea
            className="input min-h-[90px] resize-none"
            value={description}
            placeholder="Detalles de la emisión, cupón, plazo…"
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>

        <button className="btn-primary w-full" onClick={submit} disabled={phase === 'proving'}>
          {phase === 'proving' ? 'Generando proof-of-reserves…' : 'Generar proof & crear subasta'}
        </button>
      </div>
    </div>
  )
}
