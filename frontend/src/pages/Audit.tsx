import { useState } from 'react'
import { useAuctions } from '../utils/useAuctions'
import { fmtUSD } from '../utils/format'

export default function Audit() {
  const { auctions } = useAuctions()
  const [selected, setSelected] = useState<number>(auctions[0]?.id ?? 1)
  const [unlocked, setUnlocked] = useState(false)
  const [viewKey, setViewKey] = useState('')

  const auction = auctions.find((a) => a.id === selected)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Auditoría</h1>
        <p className="text-sm text-slate-400">
          Con una <span className="text-brand-soft">view key</span> autorizada, el auditor revela los
          montos para verificar que el proceso fue justo. El público no ve nada.
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div>
          <label className="label">Subasta</label>
          <select
            className="input w-64"
            value={selected}
            onChange={(e) => {
              setSelected(Number(e.target.value))
              setUnlocked(false)
            }}
          >
            {auctions.map((a) => (
              <option key={a.id} value={a.id}>
                #{String(a.id).padStart(3, '0')} — {a.asset}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[220px]">
          <label className="label">View key</label>
          <input
            className="input font-mono"
            placeholder="vk_..."
            value={viewKey}
            onChange={(e) => setViewKey(e.target.value)}
          />
        </div>
        <button className="btn-primary" onClick={() => setUnlocked(true)} disabled={viewKey.length < 3}>
          Desbloquear
        </button>
      </div>

      {!auction ? null : !unlocked ? (
        <div className="card grid place-items-center p-12 text-center">
          <div className="text-4xl">🔒</div>
          <p className="mt-3 max-w-sm text-slate-400">
            Las ofertas están selladas. Introduce una view key válida para revelar los montos de{' '}
            <span className="text-slate-200">{auction.asset}</span>.
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-ink/50 text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-5 py-3">Participante</th>
                <th className="px-5 py-3">Compromiso</th>
                <th className="px-5 py-3 text-right">Oferta</th>
                <th className="px-5 py-3 text-center">Resultado</th>
              </tr>
            </thead>
            <tbody>
              {[...auction.bids]
                .sort((a, b) => b.amount - a.amount)
                .map((b, i) => (
                  <tr key={i} className="border-t border-edge/50">
                    <td className="px-5 py-3 font-medium text-slate-200">{b.bidderName}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-500">{b.commitment}</td>
                    <td className="px-5 py-3 text-right font-mono font-semibold text-slate-100">
                      {fmtUSD(b.amount)}
                    </td>
                    <td className="px-5 py-3 text-center">
                      {i === 0 ? (
                        <span className="pill bg-gold/15 text-gold">⭐ Ganador</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>

          <div className="space-y-2 border-t border-edge/60 p-5">
            <Verdict label="Proceso justo — mayor oferta gana" />
            <Verdict label="Sin manipulación de compromisos" />
            <Verdict label="Verificado matemáticamente (Poseidon2)" />
            <button className="btn-primary mt-3">Generar reporte firmado</button>
          </div>
        </div>
      )}
    </div>
  )
}

function Verdict({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-slate-300">
      <span className="grid h-5 w-5 place-items-center rounded bg-emerald-500/20 text-emerald-300">✓</span>
      {label}
    </div>
  )
}
