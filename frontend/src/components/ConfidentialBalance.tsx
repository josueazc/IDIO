import { useState } from 'react'
import { chain } from '../services/contracts'
import { getMode } from '../services/data'
import { config } from '../config'
import { RuledPanel } from './Primitives'

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
      setCommitment(`error: ${(e as Error).message}`)
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
      <RuledPanel title="Balance confidencial">
        <p className="text-sm leading-6 text-slate-400">
          Los compromisos Pedersen del token están disponibles en modo Testnet.
        </p>
      </RuledPanel>
    )
  }

  return (
    <RuledPanel title="Balance confidencial">
      <div className="space-y-5">
        <p className="text-sm leading-6 text-slate-400">
          El balance del token se guarda como un compromiso Pedersen. El auditor verifica una apertura sin
          exponer el valor públicamente.
        </p>

        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label>
            <span className="label">Cuenta</span>
            <input className="input font-mono text-xs" value={addr} onChange={(event) => setAddr(event.target.value)} />
          </label>
          <button className="btn-ghost" onClick={load} disabled={busy}>
            Leer compromiso
          </button>
        </div>

        {commitment && (
          <div className="border border-edge bg-white/[0.02] p-4">
            <div className="micro-label">Compromiso on-chain</div>
            <div className="mt-2 break-all font-mono text-xs text-slate-300">{commitment}</div>
          </div>
        )}

        <div className="border-t border-edge pt-5">
          <div className="micro-label mb-4">Verificar apertura</div>
          <div className="grid gap-3 md:grid-cols-2">
            <label>
              <span className="label">Monto declarado</span>
              <input
                type="number"
                className="input font-mono"
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
              />
            </label>
            <label>
              <span className="label">Blinding (hex)</span>
              <input
                className="input font-mono text-xs"
                value={blinding}
                onChange={(event) => setBlinding(event.target.value)}
              />
            </label>
          </div>
          <button className="btn-primary mt-4" onClick={verify} disabled={busy}>
            Verificar apertura on-chain
          </button>
          {opening !== null && (
            <div className={`mt-4 border p-3 text-sm ${opening ? 'border-brand/40 bg-brand/10 text-brand' : 'border-red-400/30 bg-red-500/10 text-red-200'}`}>
              {opening
                ? 'Apertura válida: el compromiso coincide con el monto y el blinding.'
                : 'Apertura inválida: el monto y el blinding no coinciden.'}
            </div>
          )}
        </div>
      </div>
    </RuledPanel>
  )
}
