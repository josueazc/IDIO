import { useState } from 'react'
import { RuledPanel } from './Primitives'
import { commitBid } from '../services/proofs'

/**
 * Real view key for bids: the opening `(amount, salt)`.
 *
 * A bid commitment on-chain is `SHA-256(be16(amount) || salt)`. Whoever holds
 * the opening can prove which amount a commitment corresponds to; the public —
 * who only sees the hash — cannot. That is exactly a view key.
 */
export default function OpeningVerifier() {
  const [amount, setAmount] = useState<number>(15_000_000)
  const [salt, setSalt] = useState('')
  const [commitment, setCommitment] = useState('')
  const [result, setResult] = useState<null | boolean>(null)

  async function verify() {
    const computed = await commitBid(amount, salt.trim())
    setResult(computed === commitment.trim().toLowerCase())
  }

  return (
    <RuledPanel title="Bid opening (view key)">
      <p className="text-sm leading-6 text-slate-400">
        With the opening (amount, salt) you can prove which amount a bid commitment maps to. Without
        it, only the hash is visible. Recomputes SHA-256(be16(amount) || salt) and compares.
      </p>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <label>
          <span className="label">Amount</span>
          <input
            type="number"
            className="input font-mono"
            value={amount}
            onChange={(event) => setAmount(Number(event.target.value))}
          />
        </label>
        <label className="md:col-span-2">
          <span className="label">Salt (hex, 32 bytes)</span>
          <input className="input font-mono text-xs" value={salt} onChange={(event) => setSalt(event.target.value)} />
        </label>
      </div>
      <label className="mt-4 block">
        <span className="label">Published commitment (hex)</span>
        <input
          className="input font-mono text-xs"
          placeholder="d772f954..."
          value={commitment}
          onChange={(event) => setCommitment(event.target.value)}
        />
      </label>
      <button className="btn-primary mt-4" onClick={verify} disabled={!salt || !commitment}>
        Verify opening
      </button>
      {result !== null && (
        <div
          className={`mt-4 border p-3 text-sm ${
            result ? 'border-brand/30 bg-brand/10 text-brand' : 'border-red-400/30 bg-red-500/10 text-red-200'
          }`}
        >
          {result
            ? 'Valid opening: the commitment matches this (amount, salt).'
            : 'No match: that amount/salt does not open this commitment.'}
        </div>
      )}
    </RuledPanel>
  )
}
