import { Link } from 'react-router-dom'
import { EmptyState, PageHeader, RuledPanel } from '../components/Primitives'
import StatusBadge from '../components/StatusBadge'
import ConfidentialBalance from '../components/ConfidentialBalance'
import { useAuctions } from '../utils/useAuctions'
import { getMyOpenings } from '../services/data'
import { fmtUSD } from '../utils/format'

interface Props {
  address: string | null
}

/**
 * Mi actividad: subastas que emití, subastas en las que oferté, y mis aperturas
 * guardadas (para revelar). Todo de solo lectura.
 */
export default function Activity({ address }: Props) {
  const { auctions } = useAuctions()
  const mine = auctions.filter((a) => a.issuer === address)
  const myBids = auctions.filter((a) => a.bids.some((b) => b.bidderAddress === address))
  const openings = getMyOpenings(address)
  const short = address ? `${address.slice(0, 8)}...${address.slice(-4)}` : 'sin wallet'

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="My activity"
        title="Tus subastas, ofertas y aperturas."
        description={`Cuenta: ${short}. Solo lectura.`}
      />

      <RuledPanel title="Subastas que emití">
        {mine.length === 0 ? (
          <EmptyState title="Sin emisiones" description="No creaste subastas con esta cuenta." />
        ) : (
          <Table rows={mine} />
        )}
      </RuledPanel>

      <RuledPanel title="Subastas en las que oferté">
        {myBids.length === 0 ? (
          <EmptyState title="Sin ofertas" description="No ofertaste con esta cuenta." />
        ) : (
          <Table rows={myBids} />
        )}
      </RuledPanel>

      <RuledPanel title="Mis aperturas guardadas (para revelar)">
        {openings.length === 0 ? (
          <EmptyState title="Sin aperturas" description="Cuando ofertás, se guarda el (monto, salt) para revelar luego." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-edge text-left">
                  <th className="px-3 py-3 micro-label">Subasta</th>
                  <th className="px-3 py-3 micro-label text-right">Monto</th>
                  <th className="px-3 py-3 micro-label">Salt</th>
                </tr>
              </thead>
              <tbody>
                {openings.map((o) => (
                  <tr key={`${o.auctionId}-${o.salt}`} className="data-row">
                    <td className="px-3 py-3 font-mono text-xs text-slate-500">#{String(o.auctionId).padStart(3, '0')}</td>
                    <td className="px-3 py-3 text-right font-mono text-slate-200">{fmtUSD(o.amount)}</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-slate-500">{o.salt.slice(0, 16)}…</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </RuledPanel>

      <ConfidentialBalance />
    </div>
  )
}

function Table({ rows }: { rows: ReturnType<typeof useAuctions>['auctions'] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-edge text-left">
            <th className="px-3 py-3 micro-label">Record</th>
            <th className="px-3 py-3 micro-label">Asset</th>
            <th className="px-3 py-3 micro-label">Status</th>
            <th className="px-3 py-3 micro-label text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id} className="data-row">
              <td className="px-3 py-3 font-mono text-xs text-slate-500">
                <Link className="hover:text-brand" to="/auctions">#{String(a.id).padStart(3, '0')}</Link>
              </td>
              <td className="px-3 py-3 font-semibold text-white">{a.asset}</td>
              <td className="px-3 py-3"><StatusBadge status={a.status} /></td>
              <td className="px-3 py-3 text-right font-mono text-slate-200">{fmtUSD(a.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
