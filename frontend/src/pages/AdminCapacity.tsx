import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { PageHeader, RuledPanel, Toast, EmptyState } from '../components/Primitives'
import { getCapacity, getMode, setCapacity } from '../services/data'
import { listBanks } from '../services/auth'
import { fmtUSD } from '../utils/format'
import { shortAddress } from '../services/wallet'

interface Props {
  address: string | null
}

interface Row {
  address: string
  name: string
  capacity: number
}

const TRACKED_KEY = 'idio.capacityTracked'

function loadTracked(): string[] {
  try {
    return JSON.parse(localStorage.getItem(TRACKED_KEY) || '[]')
  } catch {
    return []
  }
}
function saveTracked(list: string[]) {
  localStorage.setItem(TRACKED_KEY, JSON.stringify([...new Set(list)]))
}

function isStellarAddress(a: string): boolean {
  return /^G[A-Z2-7]{55}$/.test(a.trim())
}

export default function AdminCapacity({ address }: Props) {
  const mode = getMode()
  const [who, setWho] = useState('')
  const [amount, setAmount] = useState(50_000_000)
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(
    null
  )

  const refresh = useCallback(async () => {
    if (mode !== 'chain') {
      setRows([])
      return
    }
    setLoading(true)
    try {
      const banks = listBanks()
      const nameByAddr = new Map(banks.map((b) => [b.address, b.name]))
      const addresses = [...new Set([...banks.map((b) => b.address), ...loadTracked()])]
      const out: Row[] = []
      for (const addr of addresses) {
        let capacity = 0
        try {
          capacity = await getCapacity(addr)
        } catch {
          capacity = 0
        }
        out.push({ address: addr, name: nameByAddr.get(addr) ?? '', capacity })
      }
      out.sort((a, b) => b.capacity - a.capacity)
      setRows(out)
    } finally {
      setLoading(false)
    }
  }, [mode])

  useEffect(() => {
    refresh()
  }, [refresh])

  async function register() {
    setNotice(null)
    if (mode !== 'chain') {
      setNotice({ type: 'error', message: 'Cambiá al entorno Testnet (chain) para registrar cupos on-chain.' })
      return
    }
    if (!address) {
      setNotice({ type: 'error', message: 'Conectá la wallet del admin/emisor para firmar el registro.' })
      return
    }
    if (!isStellarAddress(who)) {
      setNotice({ type: 'error', message: 'Dirección Stellar inválida (debe empezar con G y tener 56 caracteres).' })
      return
    }
    if (amount <= 0) {
      setNotice({ type: 'error', message: 'El cupo debe ser mayor a cero.' })
      return
    }
    setBusy(true)
    try {
      await setCapacity(address, who.trim(), amount)
      saveTracked([...loadTracked(), who.trim()])
      setNotice({
        type: 'success',
        message: `Cupo de ${fmtUSD(amount)} registrado on-chain para ${shortAddress(who.trim())}.`,
      })
      setWho('')
      await refresh()
    } catch (e) {
      setNotice({ type: 'error', message: (e as Error).message })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Mesa de emisor / admin"
        title="Cupos de participación (capacity)."
        description="Registrá on-chain el cupo máximo de oferta de cada banco. La prueba ZK de elegibilidad ata la oferta a este cupo: nadie puede ofertar por encima de lo asignado."
      />

      {mode !== 'chain' && (
        <Toast
          notice={{
            type: 'info',
            message: 'Estás en modo Demo. Los cupos on-chain requieren el entorno Testnet (chain).',
          }}
          onClose={() => {}}
        />
      )}
      <Toast notice={notice} onClose={() => setNotice(null)} />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_360px]">
        <RuledPanel title="Cupos asignados">
          {loading ? (
            <p className="text-sm text-slate-400">Consultando cupos on-chain…</p>
          ) : rows.length === 0 ? (
            <EmptyState
              title="Sin cupos registrados"
              description="Registrá el primer cupo desde el panel de la derecha. Los bancos registrados (sign up) aparecerán acá automáticamente."
            />
          ) : (
            <div className="divide-y divide-edge border-y border-edge">
              {rows.map((r) => (
                <div key={r.address} className="flex items-center justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-white">
                      {r.name || 'Banco sin nombre'}
                    </div>
                    <div className="font-mono text-[11px] text-slate-500">{shortAddress(r.address)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-sm text-brand">
                      {r.capacity > 0 ? fmtUSD(r.capacity) : 'sin cupo'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </RuledPanel>

        <aside className="space-y-5 xl:sticky xl:top-10 xl:self-start">
          <RuledPanel title="Registrar cupo">
            <div className="space-y-5">
              <Field label="Dirección del banco (Stellar)">
                <input
                  className="input font-mono text-xs"
                  placeholder="G…"
                  value={who}
                  onChange={(e) => setWho(e.target.value)}
                />
              </Field>
              <Field label="Cupo (capacity)">
                <input
                  type="number"
                  className="input font-mono"
                  value={amount}
                  step={1_000_000}
                  onChange={(e) => setAmount(Number(e.target.value))}
                />
              </Field>
              <div className="border border-edge bg-[#0b0b0b] p-4 text-sm text-slate-400">
                Firmado por el admin/emisor: <span className="font-mono text-[11px] text-slate-300">{address ? shortAddress(address) : '— sin wallet —'}</span>
              </div>
              <button className="btn-primary w-full" onClick={register} disabled={busy}>
                {busy ? 'Registrando on-chain…' : 'Registrar cupo'}
              </button>
            </div>
          </RuledPanel>
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
