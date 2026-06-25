import { type ReactNode, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, RuledPanel } from '../components/Primitives'
import { createAuction, getMode } from '../services/data'
import { ASSET_TYPES, type AssetType } from '../types'
import { fmtUSD } from '../utils/format'

interface Props {
  address: string | null
}

export default function CreateAuction({ address }: Props) {
  const nav = useNavigate()
  const [asset, setAsset] = useState('Sovereign Notes')
  const [assetType, setAssetType] = useState<AssetType>('soberano')
  const [amount, setAmount] = useState(500_000_000)
  const [minBid, setMinBid] = useState(10_000_000)
  const [currency, setCurrency] = useState('USDC')
  const [duration, setDuration] = useState(48)
  const [description, setDescription] = useState('')
  const [phase, setPhase] = useState<'form' | 'proving'>('form')
  const [error, setError] = useState<string | null>(null)

  const mode = getMode()
  const checks = useMemo(
    () => [
      ['Environment', mode === 'chain' ? 'Stellar Testnet' : 'Demo local'],
      ['Reserve requirement', amount > 0 ? 'Total coverage' : 'Missing amount'],
      ['Verifier', 'Groth16 / BN254'],
      ['Publication', 'After proof validation'],
    ],
    [amount, mode]
  )

  async function submit() {
    setError(null)
    if (mode === 'chain' && !address) {
      setError('Connect a Stellar wallet before publishing to Testnet.')
      return
    }

    const wallet = address ?? 'GISSUER0000000000000000000000000000000000000000000000000'
    setPhase('proving')
    try {
      await createAuction(
        {
          asset,
          assetType,
          amount,
          minBid,
          currency,
          description: description || 'Institutional issuance record.',
          durationHours: duration,
        },
        wallet
      )
      nav('/auctions')
    } catch (e) {
      setError((e as Error).message)
      setPhase('form')
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Issuer desk / new record"
        title="Issue a private auction."
        description="A proof of reserves is generated before this record is published to the protocol."
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-8">
          <RuledPanel title="01 / Issuance terms">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Asset">
                <input className="input" value={asset} onChange={(event) => setAsset(event.target.value)} />
              </Field>
              <Field label="Asset class">
                <select className="input" value={assetType} onChange={(event) => setAssetType(event.target.value as AssetType)}>
                  {ASSET_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Issue amount">
                <input
                  type="number"
                  className="input font-mono"
                  value={amount}
                  step={10_000_000}
                  onChange={(event) => setAmount(Number(event.target.value))}
                />
              </Field>
              <Field label="Settlement currency">
                <select className="input" value={currency} onChange={(event) => setCurrency(event.target.value)}>
                  <option>USDC</option>
                  <option>EURC</option>
                  <option>XLM</option>
                </select>
              </Field>
            </div>
          </RuledPanel>

          <RuledPanel title="02 / Auction conditions">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Minimum bid">
                <input
                  type="number"
                  className="input font-mono"
                  value={minBid}
                  step={1_000_000}
                  onChange={(event) => setMinBid(Number(event.target.value))}
                />
              </Field>
              <Field label="Duration (hours)">
                <input
                  type="number"
                  className="input font-mono"
                  value={duration}
                  onChange={(event) => setDuration(Number(event.target.value))}
                />
              </Field>
            </div>
            <div className="mt-5">
              <Field label="Issuer memorandum">
                <textarea
                  className="input min-h-[132px] resize-y"
                  value={description}
                  placeholder="Instrument, coupon, tenor, and issuance notes."
                  onChange={(event) => setDescription(event.target.value)}
                />
              </Field>
            </div>
          </RuledPanel>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-10 xl:self-start">
          <RuledPanel title="Proof preflight">
            <div className="divide-y divide-edge border-y border-edge">
              {checks.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-4 text-sm">
                  <span className="text-slate-400">{label}</span>
                  <span className="text-right font-mono text-[11px] uppercase tracking-[0.18em] text-brand">
                    {value}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-400">
              The auction cannot be issued until the reserve predicate is checked by the current environment.
            </p>
            <div className="mt-5 border border-edge bg-[#0b0b0b] p-4">
              <div className="micro-label">Record summary</div>
              <div className="mt-3 text-xl font-semibold text-white">{fmtUSD(amount)}</div>
              <div className="mt-1 text-sm text-slate-500">
                Minimum bid {fmtUSD(minBid)} in {currency}
              </div>
            </div>
            {error && <div className="mt-4 border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
          </RuledPanel>
          <button className="btn-primary w-full" onClick={submit} disabled={phase === 'proving'}>
            {phase === 'proving' ? 'Generating proof' : 'Generate proof and publish'}
          </button>
        </aside>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
    </label>
  )
}
