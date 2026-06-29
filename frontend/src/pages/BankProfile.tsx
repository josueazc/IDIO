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
  const short = address ? `${address.slice(0, 8)}...${address.slice(-4)}` : 'unknown'

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Issuer profile"
        title={short}
        description="Read-only issuer record with auction history, settlement state and public commitments."
        actions={<Link className="btn-ghost" to="/auctions">Back to registry</Link>}
      />

      <section className="grid gap-4 md:grid-cols-4">
        <Metric label="Issued auctions" value={String(mine.length)} />
        <Metric label="Open / settled" value={`${open} / ${settled}`} />
        <Metric label="Settled volume" value={fmtUSD(volume)} />
        <Metric label="Total demand (bids)" value={String(demand)} />
      </section>

      <RuledPanel title="Issuer address">
        <div className="break-all border border-edge bg-white/[0.02] p-4 font-mono text-sm text-slate-300">{address}</div>
      </RuledPanel>

      {mine.length === 0 ? (
        <EmptyState title="No issuer records" description="This address has not issued auctions in the current data source." />
      ) : (
        <RuledPanel title="Issuance history">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="border-b border-edge text-left">
                  <th className="px-3 py-3 micro-label">Record</th>
                  <th className="px-3 py-3 micro-label">Asset</th>
                  <th className="px-3 py-3 micro-label">Status</th>
                  <th className="px-3 py-3 micro-label text-right">Amount</th>
                  <th className="px-3 py-3 micro-label text-right">Winner</th>
                </tr>
              </thead>
              <tbody>
                {mine.map((auction) => (
                  <tr key={auction.id} className="data-row">
                    <td className="px-3 py-4 font-mono text-xs text-slate-500">#{String(auction.id).padStart(3, '0')}</td>
                    <td className="px-3 py-4 font-semibold text-white">{auction.asset}</td>
                    <td className="px-3 py-4"><StatusBadge status={auction.status} /></td>
                    <td className="px-3 py-4 text-right font-mono text-slate-200">{fmtUSD(auction.amount)}</td>
                    <td className="px-3 py-4 text-right font-mono text-xs text-slate-500">{auction.winnerName ?? 'sealed'}</td>
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
