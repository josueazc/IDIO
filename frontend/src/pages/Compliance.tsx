import { useState } from 'react'
import { useAuctions } from '../utils/useAuctions'

export default function Compliance() {
  const auctions = useAuctions()
  const [selected, setSelected] = useState<number>(auctions[0]?.id ?? 1)
  const auction = auctions.find((a) => a.id === selected)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">Compliance</h1>
        <p className="text-sm text-slate-400">
          El regulador valida participantes contra el ASP (allow-list), OFAC y FATF — sin ver montos.
        </p>
      </div>

      <div>
        <label className="label">Subasta</label>
        <select className="input w-72" value={selected} onChange={(e) => setSelected(Number(e.target.value))}>
          {auctions.map((a) => (
            <option key={a.id} value={a.id}>
              #{String(a.id).padStart(3, '0')} — {a.asset}
            </option>
          ))}
        </select>
      </div>

      {auction && (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div className="card overflow-hidden">
            <div className="border-b border-edge/60 px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Participantes
            </div>
            <ul>
              {auction.bids.map((b, i) => (
                <li key={i} className="flex items-center justify-between border-b border-edge/40 px-5 py-3.5 last:border-0">
                  <div>
                    <div className="font-medium text-slate-200">{b.bidderName}</div>
                    <div className="font-mono text-[11px] text-slate-600">{b.bidderAddress.slice(0, 14)}…</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="pill bg-emerald-500/15 text-emerald-300">Allow-list ✓</span>
                    <span className="pill bg-emerald-500/15 text-emerald-300">No OFAC ✓</span>
                  </div>
                </li>
              ))}
              {auction.bids.length === 0 && (
                <li className="px-5 py-8 text-center text-slate-500">Aún no hay participantes.</li>
              )}
            </ul>
          </div>

          <div className="card space-y-3 p-5">
            <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">Validaciones</div>
            {['FATF compliant', 'KYC verificado', 'AML verificado', 'Jurisdicción permitida'].map((v) => (
              <div key={v} className="flex items-center gap-2 text-sm text-slate-300">
                <span className="grid h-5 w-5 place-items-center rounded bg-emerald-500/20 text-emerald-300">✓</span>
                {v}
              </div>
            ))}
            <div className="mt-4 rounded-xl bg-emerald-500/10 p-4 text-center">
              <div className="text-xs uppercase tracking-wide text-emerald-400/80">Estado</div>
              <div className="text-2xl font-extrabold text-emerald-300">APROBADO</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
