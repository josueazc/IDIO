import { useState } from 'react'
import { chain } from '../services/contracts'
import { getMode } from '../services/data'
import { decodeSorobanError } from '../services/sorobanErrors'
import { config } from '../config'
import { CopyButton, InlineAlert, RuledPanel } from './Primitives'

export default function ConfidentialBalance() {
  const [addr, setAddr] = useState(config.readSource)
  const [commitment, setCommitment] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [amount, setAmount] = useState<number>(50_000_000)
  const [blinding, setBlinding] = useState('09'.repeat(32))
  const [opening, setOpening] = useState<null | boolean>(null)
  const [busy, setBusy] = useState(false)

  const chainMode = getMode() === 'chain'

  async function load() {
    setBusy(true)
    setOpening(null)
    setError(null)
    try {
      setCommitment(await chain.tokenCommitment(addr))
    } catch (e) {
      setError(decodeSorobanError((e as Error).message))
    } finally {
      setBusy(false)
    }
  }

  async function verify() {
    setBusy(true)
    setError(null)
    try {
      setOpening(await chain.tokenVerifyOpening(addr, amount, blinding))
    } catch (e) {
      setError(decodeSorobanError((e as Error).message))
    } finally {
      setBusy(false)
    }
  }

  if (!chainMode) {
    return (
      <RuledPanel title="Balance confidencial (Pedersen)">
        <InlineAlert variant="info">
          Los compromisos Pedersen del token están disponibles en modo Testnet. Cambiá el modo
          a Testnet y conectá tu wallet para verificar balances on-chain.
        </InlineAlert>
        <div className="mt-4 text-sm leading-6 text-zinc-500">
          <strong className="text-zinc-300">¿Qué es esto?</strong> El balance del token se guarda como un compromiso Pedersen{' '}
          <code className="rounded bg-white/[0.06] px-1 py-0.5 text-xs">v·G + r·H</code>.
          El auditor puede verificar una apertura <em>(v, r)</em> sin exponer el valor al público.
        </div>
      </RuledPanel>
    )
  }

  return (
    <RuledPanel title="Balance confidencial (Pedersen)">
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-zinc-400">
          El balance del token se guarda como un compromiso Pedersen{' '}
          <code className="rounded bg-white/[0.06] px-1 py-0.5 text-xs">v·G + r·H</code>.
          El auditor verifica una apertura <em>(v, r)</em> sin exponer el valor públicamente.
        </p>

        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label>
            <span className="label">Cuenta Stellar</span>
            <input
              className="input font-mono text-xs"
              value={addr}
              onChange={(event) => setAddr(event.target.value)}
              placeholder="G..."
            />
          </label>
          <button className="btn-ghost" onClick={load} disabled={busy || !addr}>
            {busy ? 'Cargando…' : 'Leer compromiso'}
          </button>
        </div>

        {commitment && (
          <div className="border border-edge bg-white/[0.02] p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="micro-label">Compromiso on-chain (hex)</div>
              <CopyButton text={commitment} />
            </div>
            <div className="mt-2 break-all font-mono text-xs text-zinc-300">{commitment}</div>
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </div>
        )}

        <div className="border-t border-edge pt-5">
          <div className="micro-label mb-4">Verificar apertura</div>
          <div className="grid gap-3 md:grid-cols-2">
            <label>
              <span className="label">Monto declarado (unidades enteras)</span>
              <input
                type="number"
                className="input font-mono"
                value={amount}
                min={0}
                onChange={(event) => setAmount(Number(event.target.value))}
              />
            </label>
            <label>
              <span className="label">Factor cegador / blinding (hex, 64 chars)</span>
              <input
                className="input font-mono text-xs"
                value={blinding}
                onChange={(event) => setBlinding(event.target.value)}
                maxLength={64}
                placeholder="64 hex chars"
              />
            </label>
          </div>
          <button
            className="btn-primary mt-4"
            onClick={verify}
            disabled={busy || !commitment || blinding.length !== 64}
          >
            {busy ? 'Verificando…' : 'Verificar apertura on-chain'}
          </button>
          {!commitment && !busy && (
            <p className="mt-2 text-xs text-zinc-600">
              Cargá el compromiso de la cuenta primero.
            </p>
          )}
          {opening !== null && (
            <div
              className={`mt-4 rounded-xl border p-3 text-sm font-medium ${
                opening
                  ? 'border-brand/40 bg-brand/10 text-brand'
                  : 'border-red-400/30 bg-red-500/10 text-red-200'
              }`}
            >
              {opening ? (
                <>✓ Apertura válida — el compromiso coincide con <em>v</em> y <em>r</em>.</>
              ) : (
                <>✗ Apertura inválida — el monto o el blinding no coinciden.</>
              )}
            </div>
          )}
        </div>
      </div>
    </RuledPanel>
  )
}
