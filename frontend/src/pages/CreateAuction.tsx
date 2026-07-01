import { type ReactNode, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageHeader, RuledPanel } from '../components/Primitives'
import { createAuction, getMode } from '../services/data'
import { ASSET_TYPES, type AssetType } from '../types'
import { fmtUSD } from '../utils/format'
import {
  DURATION_PRESETS,
  durationToSeconds,
  formatDuration,
  type DurationUnit,
} from '../utils/duration'

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
  const [durationValue, setDurationValue] = useState(15)
  const [durationUnit, setDurationUnit] = useState<DurationUnit>('minutes')
  const [description, setDescription] = useState('')
  const [phase, setPhase] = useState<'form' | 'proving'>('form')
  const [error, setError] = useState<string | null>(null)

  function applyTemplate(t: (typeof TEMPLATES)[number]) {
    setAsset(t.asset)
    setAssetType(t.assetType)
    setAmount(t.amount)
    setMinBid(t.minBid)
    setDurationValue(t.durationValue)
    setDurationUnit(t.durationUnit)
    setDescription(t.description)
  }

  const mode = getMode()
  const durationSeconds = durationToSeconds(durationValue, durationUnit)
  const durationLabel = formatDuration(durationValue, durationUnit)

  const checks = useMemo(
    () => [
      ['Entorno', mode === 'chain' ? 'Stellar Testnet' : 'Demo local'],
      ['Requisito de reservas', amount > 0 ? 'Cobertura total' : 'Falta el monto'],
      ['Ventana de ofertas', durationLabel],
      ['Verificador', 'Groth16 / BN254'],
      ['Publicación', 'Tras validar la prueba'],
    ],
    [amount, durationLabel, mode]
  )

  async function submit() {
    setError(null)
    if (mode === 'chain' && !address) {
      setError('Conectá una billetera Stellar antes de publicar en Testnet.')
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
          description: description || 'Registro de emisión institucional.',
          durationSeconds,
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
        eyebrow="Mesa del emisor / nuevo registro"
        title="Emitir una subasta privada."
        description="Se genera una prueba de reservas antes de publicar este registro en el protocolo."
      />

      <div className="flex flex-wrap items-center gap-2">
        <span className="micro-label">Plantillas:</span>
        {TEMPLATES.map((t) => (
          <button key={t.label} className="btn-ghost min-h-9 px-3 py-1 text-xs" onClick={() => applyTemplate(t)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-8">
          <RuledPanel title="01 / Términos de emisión">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Activo">
                <input className="input" value={asset} onChange={(event) => setAsset(event.target.value)} />
              </Field>
              <Field label="Clase de activo">
                <select className="input" value={assetType} onChange={(event) => setAssetType(event.target.value as AssetType)}>
                  {ASSET_TYPES.map((type) => (
                    <option key={type.id} value={type.id}>{type.label}</option>
                  ))}
                </select>
              </Field>
              <Field label="Monto emitido">
                <input
                  type="number"
                  className="input font-mono"
                  value={amount}
                  step={10_000_000}
                  onChange={(event) => setAmount(Number(event.target.value))}
                />
              </Field>
              <Field label="Moneda de liquidación">
                <select className="input" value={currency} onChange={(event) => setCurrency(event.target.value)}>
                  <option>USDC</option>
                  <option>EURC</option>
                  <option>XLM</option>
                </select>
              </Field>
            </div>
          </RuledPanel>

          <RuledPanel title="02 / Condiciones de la subasta">
            <div className="grid gap-5 md:grid-cols-2">
              <Field label="Oferta mínima">
                <input
                  type="number"
                  className="input font-mono"
                  value={minBid}
                  step={1_000_000}
                  onChange={(event) => setMinBid(Number(event.target.value))}
                />
              </Field>
              <Field label="Duración de la subasta">
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min={1}
                      className="input font-mono flex-1"
                      value={durationValue}
                      onChange={(event) => setDurationValue(Number(event.target.value))}
                    />
                    <select
                      className="input w-[132px] shrink-0"
                      value={durationUnit}
                      onChange={(event) => setDurationUnit(event.target.value as DurationUnit)}
                    >
                      <option value="minutes">Minutos</option>
                      <option value="hours">Horas</option>
                      <option value="days">Días</option>
                    </select>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {DURATION_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        className="btn-ghost min-h-8 px-2.5 py-1 text-xs"
                        onClick={() => {
                          setDurationValue(preset.value)
                          setDurationUnit(preset.unit)
                        }}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </Field>
            </div>
            <div className="mt-5">
              <Field label="Memorando del emisor">
                <textarea
                  className="input min-h-[132px] resize-y"
                  value={description}
                  placeholder="Instrumento, cupón, plazo y notas de emisión."
                  onChange={(event) => setDescription(event.target.value)}
                />
              </Field>
            </div>
          </RuledPanel>
        </div>

        <aside className="space-y-5 xl:sticky xl:top-10 xl:self-start">
          <RuledPanel title="Verificación previa de la prueba">
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
              La subasta no se puede emitir hasta que el entorno actual verifique el predicado de reservas.
            </p>
            <div className="mt-5 border border-edge bg-[#0b0b0b] p-4">
              <div className="micro-label">Resumen del registro</div>
              <div className="mt-3 text-xl font-semibold text-white">{fmtUSD(amount)}</div>
              <div className="mt-1 text-sm text-slate-500">
                Oferta mínima {fmtUSD(minBid)} en {currency} · ventana {durationLabel}
              </div>
            </div>
            {error && <div className="mt-4 border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>}
          </RuledPanel>
          <button className="btn-primary w-full" onClick={submit} disabled={phase === 'proving'}>
            {phase === 'proving' ? 'Generando prueba' : 'Generar prueba y publicar'}
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

const TEMPLATES = [
  {
    label: 'Demo rápida',
    asset: 'Demo Notes 5Y',
    assetType: 'soberano' as AssetType,
    amount: 50_000_000,
    minBid: 1_000_000,
    durationValue: 5,
    durationUnit: 'minutes' as DurationUnit,
    description: 'Subasta corta para pruebas en Testnet o demo local.',
  },
  {
    label: 'Bono soberano',
    asset: 'Sovereign Notes 10Y',
    assetType: 'soberano' as AssetType,
    amount: 500_000_000,
    minBid: 10_000_000,
    durationValue: 48,
    durationUnit: 'hours' as DurationUnit,
    description: 'Sovereign bond, 10Y tenor, 5.25% coupon.',
  },
  {
    label: 'RWA tokenizado',
    asset: 'Tokenized Mortgage Pool',
    assetType: 'rwa' as AssetType,
    amount: 300_000_000,
    minBid: 8_000_000,
    durationValue: 72,
    durationUnit: 'hours' as DurationUnit,
    description: 'Tokenized real-world asset (mortgage pool).',
  },
  {
    label: 'Bono corporativo',
    asset: 'Corporate Bond 7Y',
    assetType: 'corporativo' as AssetType,
    amount: 250_000_000,
    minBid: 5_000_000,
    durationValue: 36,
    durationUnit: 'hours' as DurationUnit,
    description: 'Corporate bond, 7Y tenor.',
  },
  {
    label: 'Licitación',
    asset: 'Public Tender Lot',
    assetType: 'licitacion' as AssetType,
    amount: 120_000_000,
    minBid: 2_000_000,
    durationValue: 4,
    durationUnit: 'days' as DurationUnit,
    description: 'Public procurement tender.',
  },
]
