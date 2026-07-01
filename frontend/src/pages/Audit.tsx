import { useEffect, useState } from 'react'
import ConfidentialBalance from '../components/ConfidentialBalance'
import OpeningVerifier from '../components/OpeningVerifier'
import { EmptyState, PageHeader, RuledPanel } from '../components/Primitives'
import StatusBadge from '../components/StatusBadge'
import { useAuctions } from '../utils/useAuctions'
import { getStoredWalletAddress } from '../services/wallet'
import { config } from '../config'
import { fmtUSD } from '../utils/format'
import type { Auction } from '../types'

/** Genera y descarga un reporte de auditoría (JSON) con un hash de integridad. */
async function downloadReport(auction: Auction) {
  const bids = [...auction.bids].sort((a, b) => b.amount - a.amount)
  const report = {
    auctionId: auction.id,
    asset: auction.asset,
    issuer: auction.issuer,
    status: auction.status,
    winner: auction.winnerName ?? auction.winner ?? null,
    winningAmount: auction.winningAmount ?? 0,
    bids: bids.map((b, i) => ({
      participant: b.bidderName || b.bidderAddress,
      amount: b.amount,
      revealed: b.revealed,
      rank: i + 1,
    })),
    verdict: 'La oferta más alta revelada ganó. Proceso verificable on-chain.',
    contract: config.contracts.auction,
    network: config.network,
    generatedAt: new Date().toISOString(),
  }
  const body = JSON.stringify(report, null, 2)
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(body) as BufferSource)
  const hash = [...new Uint8Array(digest)].map((x) => x.toString(16).padStart(2, '0')).join('')
  const signed = JSON.stringify({ ...report, reportHash: hash }, null, 2)
  const url = URL.createObjectURL(new Blob([signed], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `idio-audit-${String(auction.id).padStart(3, '0')}.json`
  a.click()
  URL.revokeObjectURL(url)
}

export default function Audit() {
  const { auctions: all } = useAuctions()
  const myAddress = getStoredWalletAddress()
  const auctions = all.filter((a) => a.issuer === myAddress)
  const [selected, setSelected] = useState<number | null>(null)
  const [unlocked, setUnlocked] = useState(false)
  const [viewKey, setViewKey] = useState('')

  useEffect(() => {
    if (!selected && auctions[0]) setSelected(auctions[0].id)
  }, [auctions, selected])

  const auction = auctions.find((item) => item.id === selected) ?? null

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Auditoría del emisor"
        title="Auditá tus propias subastas."
        description="Tras el cierre revisá cada oferta, verificá que ganó la más alta y descargá el informe."
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <RuledPanel title="Acceso con view key">
            <div className="grid gap-4 md:grid-cols-[260px_1fr_auto] md:items-end">
              <label>
                <span className="label">Subasta</span>
                <select
                  className="input"
                  value={selected ?? ''}
                  onChange={(event) => {
                    setSelected(Number(event.target.value))
                    setUnlocked(false)
                  }}
                >
                  {auctions.map((item) => (
                    <option key={item.id} value={item.id}>
                      #{String(item.id).padStart(3, '0')} / {item.asset}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span className="label">View key</span>
                <input
                  className="input font-mono"
                  placeholder="vk_..."
                  value={viewKey}
                  onChange={(event) => setViewKey(event.target.value)}
                />
              </label>
              <button className="btn-primary" onClick={() => setUnlocked(true)} disabled={viewKey.length < 3}>
                Desbloquear
              </button>
            </div>
          </RuledPanel>

          {!auction ? (
            <EmptyState title="Ninguna subasta seleccionada" description="Creá o seleccioná una subasta para auditar su evidencia." />
          ) : !unlocked ? (
            <EmptyState
              title="Evidencia bloqueada"
              description={`Ingresá una view key para inspeccionar las ofertas selladas de ${auction.asset}. El público solo ve los compromisos.`}
            />
          ) : (
            <RuledPanel title="Evidencia de ofertas reveladas">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-edge text-left">
                      <th className="px-3 py-3 micro-label">Participante</th>
                      <th className="px-3 py-3 micro-label">Compromiso</th>
                      <th className="px-3 py-3 micro-label text-right">Monto</th>
                      <th className="px-3 py-3 micro-label text-right">Resultado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...auction.bids].sort((a, b) => b.amount - a.amount).map((bid, index) => (
                      <tr key={`${bid.bidderAddress}-${index}`} className="data-row">
                        <td className="px-3 py-4">
                          <div className="font-semibold text-white">{bid.bidderName || 'Oferente'}</div>
                          <div className="mt-1 font-mono text-[11px] text-slate-600">
                            {bid.bidderAddress.slice(0, 10)}...{bid.bidderAddress.slice(-4)}
                          </div>
                        </td>
                        <td className="px-3 py-4 font-mono text-xs text-slate-500">{bid.commitment}</td>
                        <td className="px-3 py-4 text-right font-mono text-slate-100">{fmtUSD(bid.amount)}</td>
                        <td className="px-3 py-4 text-right">
                          {index === 0 ? <span className="pill bg-brand/15 text-brand">ganador</span> : <span className="text-slate-600">no seleccionado</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </RuledPanel>
          )}

          <OpeningVerifier />
          <ConfidentialBalance />
        </div>

        <RuledPanel title="Veredicto de auditoría">
          {auction ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-white">{auction.asset}</h2>
                <div className="mt-3"><StatusBadge status={auction.status} /></div>
              </div>
              <div className="divide-y divide-edge border-y border-edge">
                {[
                  ['Conjunto de compromisos', `${auction.bids.length} ofertas selladas`],
                  ['Prueba de reservas', auction.reservesCommitment],
                  ['Regla del ganador', 'Oferta revelada más alta'],
                  ['Estado del informe', unlocked ? 'Listo' : 'Bloqueado'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 py-3 text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="text-right font-mono text-xs text-slate-200">{value}</span>
                  </div>
                ))}
              </div>
              <button
                className="btn-primary w-full"
                disabled={!unlocked}
                onClick={() => downloadReport(auction)}
              >
                Generar informe firmado
              </button>
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-500">No hay ninguna subasta para auditar.</p>
          )}
        </RuledPanel>
      </section>
    </div>
  )
}
