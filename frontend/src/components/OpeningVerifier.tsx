import { useState } from 'react'
import { RuledPanel } from './Primitives'
import { commitBid } from '../services/proofs'

export default function OpeningVerifier() {
  const [amount, setAmount] = useState<number>(15_000_000)
  const [salt, setSalt] = useState('')
  const [commitment, setCommitment] = useState('')
  const [computed, setComputed] = useState<string | null>(null)
  const [result, setResult] = useState<null | boolean>(null)
  const [busy, setBusy] = useState(false)

  async function verify() {
    setBusy(true)
    setResult(null)
    try {
      const hash = await commitBid(amount, salt.trim())
      setComputed(hash)
      setResult(hash === commitment.trim().toLowerCase())
    } finally {
      setBusy(false)
    }
  }

  return (
    <RuledPanel title="Verificador de apertura de oferta">
      <p className="text-sm leading-relaxed text-zinc-400">
        Una oferta sellada en IDIO es{' '}
        <code className="rounded bg-white/[0.06] px-1 py-0.5 text-xs">
          SHA-256(be16(monto) || salt)
        </code>
        . Con la apertura <em>(monto, salt)</em> cualquier auditor puede verificar que el compromiso
        corresponde al monto declarado — sin que el público vea el valor antes del reveal.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-3">
        <label>
          <span className="label">Monto (unidades enteras)</span>
          <input
            type="number"
            className="input font-mono"
            value={amount}
            min={0}
            onChange={(event) => setAmount(Number(event.target.value))}
          />
        </label>
        <label className="md:col-span-2">
          <span className="label">Salt (hex, 64 chars = 32 bytes)</span>
          <input
            className="input font-mono text-xs"
            value={salt}
            maxLength={64}
            placeholder="a1b2c3d4...  (64 hex chars)"
            onChange={(event) => setSalt(event.target.value)}
          />
        </label>
      </div>

      <label className="mt-4 block">
        <span className="label">Compromiso publicado on-chain (hex)</span>
        <input
          className="input font-mono text-xs"
          placeholder="d772f954..."
          value={commitment}
          onChange={(event) => setCommitment(event.target.value)}
        />
      </label>

      <button
        className="btn-primary mt-5"
        onClick={verify}
        disabled={busy || !salt || !commitment || salt.length !== 64}
      >
        {busy ? 'Calculando…' : 'Verificar apertura'}
      </button>

      {salt.length > 0 && salt.length !== 64 && (
        <p className="mt-2 text-xs text-amber-400">El salt debe tener exactamente 64 caracteres hexadecimales (32 bytes).</p>
      )}

      {computed && (
        <div className="mt-4 border border-edge bg-white/[0.02] p-3">
          <div className="micro-label mb-1">Hash calculado</div>
          <div className="break-all font-mono text-xs text-zinc-400">{computed}</div>
        </div>
      )}

      {result !== null && (
        <div
          className={`mt-3 rounded-xl border p-3 text-sm font-medium ${
            result
              ? 'border-brand/30 bg-brand/10 text-brand'
              : 'border-red-400/30 bg-red-500/10 text-red-200'
          }`}
        >
          {result
            ? '✓ Apertura válida — el compromiso coincide con este (monto, salt).'
            : '✗ No coincide — ese monto o salt no abre este compromiso.'}
        </div>
      )}
    </RuledPanel>
  )
}
