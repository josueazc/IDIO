import { type ReactNode, useCallback, useEffect, useState } from 'react'
import { CopyButton, PageHeader, RuledPanel, Toast, EmptyState } from '../components/Primitives'
import { getAuctionAdmin, getCapacity, getMode, setCapacity } from '../services/data'
import { listBanks } from '../services/auth'
import { decodeSorobanError } from '../services/sorobanErrors'
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

function adminMismatchMessage(connected: string, admin: string): string {
  return `Solo el admin on-chain (${shortAddress(admin)}) puede registrar cupos. Tu wallet conectada (${shortAddress(connected)}) no coincide. Conectá la wallet del deployer o pedí que te transfieran el admin (requiere redespliegue).`
}

export default function AdminCapacity({ address }: Props) {
  const mode = getMode()
  const [who, setWho] = useState('')
  const [amount, setAmount] = useState(50_000_000)
  const [rows, setRows] = useState<Row[]>([])
  const [onChainAdmin, setOnChainAdmin] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(
    null
  )

  const walletIsAdmin =
    mode !== 'chain' || !address || !onChainAdmin
      ? true
      : address === onChainAdmin

  const refresh = useCallback(async () => {
    if (mode !== 'chain') {
      setRows([])
      setOnChainAdmin(null)
      return
    }
    setLoading(true)
    try {
      const admin = await getAuctionAdmin()
      setOnChainAdmin(admin)
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
      setNotice({ type: 'error', message: 'Conectá la wallet del admin on-chain para firmar el registro.' })
      return
    }
    if (onChainAdmin && address !== onChainAdmin) {
      setNotice({ type: 'error', message: adminMismatchMessage(address, onChainAdmin) })
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
      setNotice({ type: 'error', message: decodeSorobanError((e as Error).message) })
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

      {mode === 'chain' && onChainAdmin && (
        <Toast
          notice={{
            type: walletIsAdmin ? 'info' : 'error',
            message: walletIsAdmin
              ? `Admin on-chain: ${onChainAdmin}. Solo esta wallet puede firmar set_capacity.`
              : adminMismatchMessage(address ?? '', onChainAdmin),
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
              <div className="space-y-3 border border-edge bg-raised/60 p-4 text-sm text-slate-400">
                <div>
                  <div className="micro-label mb-1">Admin on-chain</div>
                  {onChainAdmin ? (
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="break-all font-mono text-[11px] text-slate-300">{onChainAdmin}</span>
                      <CopyButton text={onChainAdmin} />
                      <a
                        href={`https://stellar.expert/explorer/testnet/account/${onChainAdmin}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] text-brand hover:underline"
                      >
                        stellar.expert →
                      </a>
                    </div>
                  ) : (
                    <span className="text-slate-600">— consultando —</span>
                  )}
                </div>
                <div>
                  <div className="micro-label mb-1">Wallet conectada</div>
                  <span className="font-mono text-[11px] text-slate-300">
                    {address ? shortAddress(address) : '— sin wallet —'}
                  </span>
                </div>
              </div>
              <button
                className="btn-primary w-full"
                onClick={register}
                disabled={busy || (mode === 'chain' && !walletIsAdmin)}
              >
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
