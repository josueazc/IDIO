import { useEffect, useState } from 'react'
import type { Auction } from '../types'
import { fmtUSD } from '../utils/format'
import { submitBid, getMode, getCapacity, lastProof, lastBidSecret } from '../services/data'
import { getProfile } from '../services/auth'

interface Props {
  auction: Auction
  bidderAddress: string
  onClose: () => void
  onDone: () => void
}

const BALANCE = 50_000_000

export default function BidForm({ auction, bidderAddress, onClose, onDone }: Props) {
  const chain = getMode() === 'chain'
  const profile = getProfile(bidderAddress)
  const [amount, setAmount] = useState<number>(auction.minBid)
  const [name, setName] = useState(profile?.name ?? 'Institutional bidder')
  const [phase, setPhase] = useState<'form' | 'proving' | 'done'>('form')
  const [error, setError] = useState<string | null>(null)
  const [proofInfo, setProofInfo] = useState<string | null>(null)
  const [capacity, setCapacity] = useState<number | null>(null)

  useEffect(() => {
    if (!chain) return
    let alive = true
    getCapacity(bidderAddress)
      .then((c) => alive && setCapacity(c))
      .catch(() => alive && setCapacity(0))
    return () => {
      alive = false
    }
  }, [chain, bidderAddress])

  // En chain, el techo es el cupo registrado on-chain; en demo, el balance simulado.
  const ceiling = chain ? (capacity ?? 0) : BALANCE
  const registered = !chain || !!profile
  const checks = {
    balance: ceiling >= amount,
    min: amount >= auction.minBid,
    credential: registered,
    whitelist: registered,
  }
  const ready = Object.values(checks).every(Boolean)

  async function submit() {
    setError(null)
    setPhase('proving')
    try {
      await submitBid(auction.id, name, bidderAddress, amount, BALANCE, auction.minBid)
      if (lastProof) {
        setProofInfo(
          lastProof.proofOk
            ? `ZK proof generated in ${Math.round(lastProof.ms)} ms`
            : `Circuit constraints checked in ${Math.round(lastProof.ms)} ms`
        )
      }
      setPhase('done')
      setTimeout(() => {
        onDone()
        onClose()
      }, 1800)
    } catch (e) {
      setError((e as Error).message)
      setPhase('form')
    }
  }

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/70 p-4" onClick={onClose}>
      <div className="w-full max-w-lg border border-edge bg-[#080a08]" onClick={(event) => event.stopPropagation()}>
        <div className="border-b border-edge p-5">
          <div className="font-mono text-xs text-brand">#{String(auction.id).padStart(3, '0')}</div>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white">{auction.asset}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Submit a sealed commitment. The amount remains private until reveal.
          </p>
        </div>

        <div className="space-y-5 p-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="border border-edge bg-white/[0.02] p-3">
              <div className="micro-label">{chain ? 'Cupo on-chain' : 'Simulated balance'}</div>
              <div className="mt-2 font-mono text-sm text-white">
                {chain ? (capacity === null ? 'consultando…' : fmtUSD(capacity)) : `${fmtUSD(BALANCE)} USDC`}
              </div>
            </div>
            <div className="border border-edge bg-white/[0.02] p-3">
              <div className="micro-label">Minimum bid</div>
              <div className="mt-2 font-mono text-sm text-white">{fmtUSD(auction.minBid)}</div>
            </div>
          </div>

          {chain && !profile && (
            <div className="border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              Tu wallet no está registrada como banco. Si el Covenant ZK está activo, necesitás
              registrarte (Sign up) para probar tu membresía y poder ofertar.
            </div>
          )}
          {chain && capacity === 0 && (
            <div className="border border-amber-400/30 bg-amber-500/10 p-3 text-sm text-amber-200">
              No tenés cupo (capacity) asignado on-chain. Pedile al emisor/admin que registre tu cupo.
            </div>
          )}

          <label className="block">
            <span className="label">Bidder label</span>
            <input className="input" value={name} onChange={(event) => setName(event.target.value)} />
          </label>

          <label className="block">
            <span className="label">Bid amount</span>
            <input
              type="number"
              className="input font-mono"
              value={amount}
              min={auction.minBid}
              step={1_000_000}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </label>

          <div className="grid gap-2 border-y border-edge py-4">
            <Check ok={checks.balance} label={`${chain ? 'Cupo' : 'Balance'} >= ${fmtUSD(amount)}`} />
            <Check ok={checks.min} label="Amount clears minimum bid" />
            <Check ok={checks.credential} label={chain ? 'Banco registrado (perfil)' : 'Institutional credential accepted'} />
            <Check ok={checks.whitelist} label={chain ? 'Membresía Covenant / allow-list' : 'Participant is allow-listed'} />
          </div>

          {error && <div className="border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}

          {phase === 'proving' && (
            <div className="border border-edge bg-white/[0.02] p-4">
              <div className="text-sm text-slate-300">
                {getMode() === 'chain'
                  ? 'Generating proof and requesting wallet signature through Stellar Wallets Kit.'
                  : 'Generating local demo proof.'}
              </div>
              <div className="mt-3 h-1 overflow-hidden bg-white/10">
                <div className="h-full w-2/3 animate-pulse bg-brand" />
              </div>
            </div>
          )}

          {phase === 'done' && (
            <div className="border border-brand/40 bg-brand/10 p-4 text-sm text-brand">
              Sealed bid registered.
              {proofInfo && <div className="mt-1 text-xs text-brand-soft">{proofInfo}</div>}
              {getMode() === 'chain' && lastBidSecret && (
                <div className="mt-3 border border-edge bg-black/30 p-3 text-xs text-slate-300">
                  Save this to reveal from another device:
                  <div className="mt-1 break-all font-mono">amount={lastBidSecret.amount}</div>
                  <div className="break-all font-mono">salt={lastBidSecret.salt}</div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex gap-3 border-t border-edge p-5">
          <button className="btn-ghost flex-1" onClick={onClose} disabled={phase === 'proving'}>
            Cancel
          </button>
          <button className="btn-primary flex-1" onClick={submit} disabled={!ready || phase !== 'form'}>
            Confirm sealed bid
          </button>
        </div>
      </div>
    </div>
  )
}

function Check({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className="flex items-center gap-3 text-sm">
      <span className={`h-2 w-2 rounded-full ${ok ? 'bg-brand' : 'bg-slate-600'}`} />
      <span className={ok ? 'text-slate-300' : 'text-slate-600'}>{label}</span>
    </div>
  )
}
