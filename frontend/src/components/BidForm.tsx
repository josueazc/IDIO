import { useState } from 'react'
import type { Auction } from '../types'
import { fmtUSD } from '../utils/format'
import { submitBid } from '../services/store'

interface Props {
  auction: Auction
  bidderAddress: string
  onClose: () => void
  onDone: () => void
}

const BALANCE = 50_000_000 // saldo simulado del bidder

export default function BidForm({ auction, bidderAddress, onClose, onDone }: Props) {
  const [amount, setAmount] = useState<number>(auction.minBid)
  const [name, setName] = useState('Mi Banco')
  const [phase, setPhase] = useState<'form' | 'proving' | 'done'>('form')
  const [error, setError] = useState<string | null>(null)

  const checks = {
    balance: BALANCE >= amount,
    min: amount >= auction.minBid,
    credential: true,
    whitelist: true,
  }
  const ready = Object.values(checks).every(Boolean)

  async function submit() {
    setError(null)
    setPhase('proving')
    try {
      await submitBid(auction.id, name, bidderAddress, amount, BALANCE)
      setPhase('done')
      setTimeout(() => {
        onDone()
        onClose()
      }, 1100)
    } catch (e) {
      setError((e as Error).message)
      setPhase('form')
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="card w-full max-w-md p-6 shadow-glow" onClick={(e) => e.stopPropagation()}>
        <div className="mb-1 text-xs font-mono text-slate-500">#{String(auction.id).padStart(3, '0')}</div>
        <h2 className="text-xl font-bold text-white">{auction.asset}</h2>
        <p className="mt-1 text-sm text-slate-400">Oferta sellada — el monto permanece privado on-chain.</p>

        <div className="mt-5 flex items-center justify-between rounded-xl bg-ink/50 px-4 py-3 text-sm">
          <span className="text-slate-400">Mi balance</span>
          <span className="font-semibold text-slate-100">{fmtUSD(BALANCE)} USDC</span>
        </div>

        <div className="mt-4">
          <label className="label">Nombre (visible solo con view key)</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </div>

        <div className="mt-3">
          <label className="label">Mi oferta · mínimo {fmtUSD(auction.minBid)}</label>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500">$</span>
            <input
              type="number"
              className="input pl-7 font-mono"
              value={amount}
              min={auction.minBid}
              step={1_000_000}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="mt-4 space-y-2">
          <Check ok={checks.balance} label={`Balance ≥ ${fmtUSD(amount)}`} />
          <Check ok={checks.min} label="Supera el mínimo" />
          <Check ok={checks.credential} label="Credencial institucional válida" />
          <Check ok={checks.whitelist} label="Banco en allow-list (ASP)" />
        </div>

        {error && <div className="mt-3 rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">{error}</div>}

        {phase === 'proving' && (
          <div className="mt-4">
            <div className="mb-1.5 text-xs text-slate-400">Generando prueba ZK…</div>
            <div className="h-2 overflow-hidden rounded-full bg-ink">
              <div className="h-full w-2/3 animate-pulse rounded-full bg-gradient-to-r from-brand to-accent" />
            </div>
          </div>
        )}

        {phase === 'done' && (
          <div className="mt-4 rounded-lg bg-emerald-500/10 px-3 py-2.5 text-sm text-emerald-300">
            ✅ Oferta sellada registrada. Nadie puede ver tu monto.
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button className="btn-ghost flex-1" onClick={onClose} disabled={phase === 'proving'}>
            Cancelar
          </button>
          <button className="btn-primary flex-1" onClick={submit} disabled={!ready || phase !== 'form'}>
            Confirmar oferta
          </button>
        </div>
      </div>
    </div>
  )
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <span
        className={`grid h-4 w-4 place-items-center rounded ${
          ok ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-500'
        }`}
      >
        {ok ? '✓' : '·'}
      </span>
      <span className={ok ? 'text-slate-300' : 'text-slate-500'}>{label}</span>
    </div>
  )
}
