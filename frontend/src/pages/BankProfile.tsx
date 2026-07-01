import { Link, useParams } from 'react-router-dom'
import { EmptyState, Metric, PageHeader, RuledPanel } from '../components/Primitives'
import StatusBadge from '../components/StatusBadge'
import { useAuctions } from '../utils/useAuctions'
import { fmtUSD } from '../utils/format'

export default function BankProfile() {
  const { address = '' } = useParams()
  const { auctions } = useAuctions()
  const mine = auctions.filter((auction) => auction.issuer === address)
  const open = mine.filter((auction) => auction.status === 'BiddingOpen').length
  const settled = mine.filter((auction) => auction.status === 'Settled').length
  const volume = mine.reduce((sum, auction) => sum + (auction.winningAmount ?? 0), 0)
  const demand = mine.reduce((sum, auction) => sum + auction.bids.length, 0)
  const short = address ? `${address.slice(0, 8)}...${address.slice(-4)}` : 'desconocido'

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Perfil del emisor"
        title={short}
        description="Registro de solo lectura del emisor con historial de subastas, estado de liquidación y compromisos públicos."
        actions={<Link className="btn-ghost" to="/auctions">Volver al registro</Link>}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Subastas emitidas" value={String(mine.length)} />
        <Metric label="Abiertas / liquidadas" value={`${open} / ${settled}`} />
        <Metric label="Volumen liquidado" value={fmtUSD(volume)} />
        <Metric label="Demanda total (ofertas)" value={String(demand)} />
      </section>

      <RuledPanel title="Dirección del emisor">
        <div className="break-all border border-edge bg-white/[0.02] p-4 font-mono text-sm text-slate-300">{address}</div>
      </RuledPanel>

      {mine.length === 0 ? (
        <EmptyState title="Sin registros del emisor" description="Esta dirección no emitió subastas en la fuente de datos actual." />
      ) : (
        <RuledPanel title="Historial de emisiones">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-edge text-left">
                  <th className="px-3 py-3 micro-label">Registro</th>
                  <th className="px-3 py-3 micro-label">Activo</th>
                  <th className="px-3 py-3 micro-label">Estado</th>
                  <th className="px-3 py-3 micro-label text-right">Monto</th>
                  <th className="px-3 py-3 micro-label text-right">Ganador</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((auction) => (
                  <tr key={auction.id} className="data-row">
                    <td className="px-3 py-4 font-mono text-xs text-slate-500">#{String(auction.id).padStart(3, '0')}</td>
                    <td className="px-3 py-4 font-semibold text-white">{auction.asset}</td>
                    <td className="px-3 py-4"><StatusBadge status={auction.status} /></td>
                    <td className="px-3 py-4 text-right font-mono text-slate-200">{fmtUSD(auction.amount)}</td>
                    <td className="px-3 py-4 text-right font-mono text-xs text-slate-500">{auction.winnerName ?? 'sellado'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </RuledPanel>
      )}
    </div>
  )
}
