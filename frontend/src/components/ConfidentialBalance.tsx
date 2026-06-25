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
      <RuledPanel title="Confidential balance">
        <p className="text-sm leading-6 text-slate-400">
          Pedersen token commitments are available in Testnet mode.
        </p>
      </RuledPanel>
    )
  }

  return (
    <RuledPanel title="Confidential balance">
      <div className="space-y-5">
        <p className="text-sm leading-6 text-slate-400">
          The token balance is stored as a Pedersen commitment. The auditor verifies an opening without
          exposing the value publicly.
        </p>

        <div className="grid gap-3 md:grid-cols-[1fr_auto] md:items-end">
          <label>
            <span className="label">Account</span>
            <input className="input font-mono text-xs" value={addr} onChange={(event) => setAddr(event.target.value)} />
          </label>
          <button className="btn-ghost" onClick={load} disabled={busy}>
            Read commitment
          </button>
        </div>

        {commitment && (
          <div className="border border-edge bg-white/[0.02] p-4">
            <div className="micro-label">On-chain commitment</div>
            <div className="mt-2 break-all font-mono text-xs text-slate-300">{commitment}</div>
          </div>
        )}

        <div className="border-t border-edge pt-5">
          <div className="micro-label mb-4">Verify opening</div>
          <div className="grid gap-3 md:grid-cols-2">
            <label>
              <span className="label">Declared amount</span>
              <input
                type="number"
                className="input font-mono"
                value={amount}
                onChange={(event) => setAmount(Number(event.target.value))}
              />
            </label>
            <label>
              <span className="label">Blinding hex</span>
              <input
                className="input font-mono text-xs"
                value={blinding}
                onChange={(event) => setBlinding(event.target.value)}
              />
            </label>
          </div>
          <button className="btn-primary mt-4" onClick={verify} disabled={busy}>
            Verify on-chain opening
          </button>
          {opening !== null && (
            <div className={`mt-4 border p-3 text-sm ${opening ? 'border-brand/40 bg-brand/10 text-brand' : 'border-red-400/30 bg-red-500/10 text-red-200'}`}>
              {opening
                ? 'Valid opening: commitment matches amount and blinding.'
                : 'Invalid opening: amount and blinding do not match.'}
            </div>
          )}
        </div>
      </div>
    </RuledPanel>
  )
}
