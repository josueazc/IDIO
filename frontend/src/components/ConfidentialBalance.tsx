import { useState } from 'react'
import { chain } from '../services/contracts'
import { getMode } from '../services/data'
import { config } from '../config'

/**
 * Panel de balance confidencial del token: muestra el compromiso Pedersen
 * (no revela el monto) y permite verificar una apertura `(monto, blinding)`
 * vía `token.verify_opening` — el mecanismo de auditabilidad del token.
 */
export default function ConfidentialBalance() {
  const [addr, setAddr] = useState(config.readSource)
  const [commitment, setCommitment] = useState<string | null>(null)
  const [amount, setAmount] = useState<number>(50_000_000)
  const [blinding, setBlinding] = useState('09'.repeat(32))
  const [opening, setOpening] = useState<null | boolean>(null)
  const [busy, setBusy] = useState(false)

  const chainMode = getMode() === 'chain'

  async function load() {
    setBusy(true)
    setOpening(null)
    try {
      setCommitment(await chain.tokenCommitment(addr))
    } catch (e) {
      setCommitment('error: ' + (e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function verify() {
    setBusy(true)
    try {
      setOpening(await chain.tokenVerifyOpening(addr, amount, blinding))
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (!chainMode) {
    return (
      <div className="card p-5 text-sm text-slate-400">
        El balance confidencial (compromiso Pedersen) se consulta en modo <span className="text-brand-soft">Testnet</span>.
      </div>
    )
  }

  return (
    <div className="card space-y-4 p-5">
      <div>
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Balance confidencial (token Pedersen)
        </div>
        <p className="mt-1 text-sm text-slate-400">
          El balance se guarda como compromiso `C = v·G + r·H`. No revela el monto; el auditor lo
          verifica con la apertura.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[260px]">
          <label className="label">Cuenta</label>
          <input className="input font-mono text-xs" value={addr} onChange={(e) => setAddr(e.target.value)} />
        </div>
        <button className="btn-ghost" onClick={load} disabled={busy}>
          Leer compromiso
        </button>
      </div>

      {commitment && (
        <div className="rounded-xl bg-ink/50 p-3">
          <div className="text-[10px] uppercase tracking-wide text-slate-500">Compromiso on-chain (64 bytes)</div>
          <div className="mt-1 break-all font-mono text-xs text-slate-300">{commitment}</div>
        </div>
      )}

      <div className="border-t border-edge/60 pt-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Verificar apertura</div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <label className="label">Monto declarado</label>
            <input
              type="number"
              className="input font-mono"
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
            />
          </div>
          <div>
            <label className="label">Blinding (hex 32 bytes)</label>
            <input className="input font-mono text-xs" value={blinding} onChange={(e) => setBlinding(e.target.value)} />
          </div>
        </div>
        <button className="btn-primary mt-3" onClick={verify} disabled={busy}>
          Verificar apertura on-chain
        </button>
        {opening !== null && (
          <div
            className={`mt-3 rounded-lg px-3 py-2 text-sm ${
              opening ? 'bg-emerald-500/10 text-emerald-300' : 'bg-rose-500/10 text-rose-300'
            }`}
          >
            {opening
              ? 'Apertura válida: el compromiso corresponde a (monto, blinding).'
              : 'Apertura inválida: no corresponde a ese monto/blinding.'}
          </div>
        )}
      </div>
    </div>
  )
}
