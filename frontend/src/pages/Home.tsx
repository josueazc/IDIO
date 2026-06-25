import { Link } from 'react-router-dom'
import { PageHeader, Metric, RuledPanel, EmptyState } from '../components/Primitives'
import StatusBadge from '../components/StatusBadge'
import { useAuctions } from '../utils/useAuctions'
import { useRole } from '../utils/useRole'
import { ROLES } from '../services/role'
import { fmtUSD, timeLeft } from '../utils/format'

const ROLE_CTA: Record<string, { to: string; label: string; description: string }> = {
  emisor: {
    to: '/create',
    label: 'Issue auction',
    description: 'Create a private auction after reserve preflight.',
  },
  oferente: {
    to: '/auctions',
    label: 'Open registry',
    description: 'Review auctions and submit sealed bids.',
  },
  auditor: {
    to: '/audit',
    label: 'Open audit desk',
    description: 'Reveal evidence with a view key.',
  },
  regulador: {
    to: '/compliance',
    label: 'Open compliance',
    description: 'Validate participants without seeing bid amounts.',
  },
}

export default function Home() {
  const { auctions } = useAuctions()
  const role = useRole()
  const roleInfo = ROLES.find((item) => item.id === role)
  const cta = role ? ROLE_CTA[role] : null
  const open = auctions.filter((auction) => auction.status === 'BiddingOpen')
  const settled = auctions.filter((auction) => auction.status === 'Settled')
  const volume = auctions.reduce((sum, auction) => sum + (auction.winningAmount ?? 0), 0)

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Protocol overview"
        title="Operational console for private institutional auctions."
        description="Monitor auction state, proof status and role-specific next actions from one surface."
        actions={cta && <Link className="btn-primary" to={cta.to}>{cta.label}</Link>}
      />

      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Active auctions" value={String(open.length)} detail="Bidding window open" />
        <Metric label="Settled auctions" value={String(settled.length)} detail="Winner selected" />
        <Metric label="Settled volume" value={fmtUSD(volume)} detail="Demo or Testnet data" />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <RuledPanel title="Recent auction activity">
          {auctions.length === 0 ? (
            <EmptyState
              title="No auctions yet"
              description="Create a demo auction or switch to Testnet once your wallet is connected."
              action={role === 'emisor' && <Link className="btn-primary" to="/create">Issue auction</Link>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-edge text-left">
                    <th className="px-3 py-3 micro-label">Record</th>
                    <th className="px-3 py-3 micro-label">Asset</th>
                    <th className="px-3 py-3 micro-label">Status</th>
                    <th className="px-3 py-3 micro-label text-right">Amount</th>
                    <th className="px-3 py-3 micro-label text-right">Close</th>
                  </tr>
                </thead>
                <tbody>
                  {auctions.slice(0, 6).map((auction) => (
                    <tr key={auction.id} className="data-row">
                      <td className="px-3 py-4 font-mono text-xs text-slate-500">
                        #{String(auction.id).padStart(3, '0')}
                      </td>
                      <td className="px-3 py-4">
                        <div className="font-semibold text-white">{auction.asset}</div>
                        <div className="mt-1 font-mono text-[11px] text-slate-600">
                          {auction.issuer.slice(0, 8)}...{auction.issuer.slice(-4)}
                        </div>
                      </td>
                      <td className="px-3 py-4"><StatusBadge status={auction.status} /></td>
                      <td className="px-3 py-4 text-right font-mono text-slate-200">{fmtUSD(auction.amount)}</td>
                      <td className="px-3 py-4 text-right text-slate-400">
                        {auction.status === 'BiddingOpen' ? timeLeft(auction.endTime) : 'closed'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </RuledPanel>

        <RuledPanel title="Active authority">
          <div className="space-y-5">
            <div>
              <div className="text-xl font-semibold text-white">{roleInfo?.label}</div>
              <p className="mt-2 text-sm leading-6 text-slate-400">{roleInfo?.desc}</p>
            </div>
            {cta && (
              <div className="border border-edge bg-white/[0.02] p-4">
                <div className="micro-label">Next action</div>
                <div className="mt-3 font-semibold text-white">{cta.label}</div>
                <p className="mt-1 text-sm leading-6 text-slate-500">{cta.description}</p>
                <Link className="btn-primary mt-4 w-full" to={cta.to}>
                  {cta.label}
                </Link>
              </div>
            )}
            <div className="space-y-3 border-t border-edge pt-4">
              {['Reserve proof available before publish', 'Sealed bids remain private', 'Audit trail stays readable'].map((item) => (
                <div key={item} className="flex items-center gap-3 text-sm text-slate-300">
                  <span className="h-2 w-2 rounded-full bg-brand" />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </RuledPanel>
      </section>
    </div>
  )
}
