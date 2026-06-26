import { useEffect, useState } from 'react'
import ConfidentialBalance from '../components/ConfidentialBalance'
import OpeningVerifier from '../components/OpeningVerifier'
import { EmptyState, PageHeader, RuledPanel } from '../components/Primitives'
import StatusBadge from '../components/StatusBadge'
import { useAuctions } from '../utils/useAuctions'
import { useRole } from '../utils/useRole'
import { getStoredWalletAddress } from '../services/wallet'
import { fmtUSD } from '../utils/format'

export default function Audit() {
  const { auctions: all } = useAuctions()
  const role = useRole()
  const myAddress = getStoredWalletAddress()
  // The issuer only audits its own auctions; the auditor sees all.
  const auctions = role === 'emisor' ? all.filter((a) => a.issuer === myAddress) : all
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
        eyebrow={role === 'emisor' ? 'Issuer audit' : 'Audit desk'}
        title={role === 'emisor' ? 'Audit your own auctions.' : 'Reveal evidence with a controlled view key.'}
        description={
          role === 'emisor'
            ? 'Only your auctions. After close you can review every bid and verify the highest one won.'
            : 'Auditors can inspect commitments, revealed amounts and final winner logic without changing protocol state.'
        }
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <RuledPanel title="View key gate">
            <div className="grid gap-4 md:grid-cols-[260px_1fr_auto] md:items-end">
              <label>
                <span className="label">Auction</span>
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
                Unlock
              </button>
            </div>
          </RuledPanel>

          {!auction ? (
            <EmptyState title="No auction selected" description="Create or select an auction to audit its evidence." />
          ) : !unlocked ? (
            <EmptyState
              title="Evidence locked"
              description={`Enter a view key to inspect sealed bids for ${auction.asset}. Public users only see commitments.`}
            />
          ) : (
            <RuledPanel title="Revealed bid evidence">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="border-b border-edge text-left">
                      <th className="px-3 py-3 micro-label">Participant</th>
                      <th className="px-3 py-3 micro-label">Commitment</th>
                      <th className="px-3 py-3 micro-label text-right">Amount</th>
                      <th className="px-3 py-3 micro-label text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...auction.bids].sort((a, b) => b.amount - a.amount).map((bid, index) => (
                      <tr key={`${bid.bidderAddress}-${index}`} className="data-row">
                        <td className="px-3 py-4">
                          <div className="font-semibold text-white">{bid.bidderName || 'Bidder'}</div>
                          <div className="mt-1 font-mono text-[11px] text-slate-600">
                            {bid.bidderAddress.slice(0, 10)}...{bid.bidderAddress.slice(-4)}
                          </div>
                        </td>
                        <td className="px-3 py-4 font-mono text-xs text-slate-500">{bid.commitment}</td>
                        <td className="px-3 py-4 text-right font-mono text-slate-100">{fmtUSD(bid.amount)}</td>
                        <td className="px-3 py-4 text-right">
                          {index === 0 ? <span className="pill bg-brand/15 text-brand">winner</span> : <span className="text-slate-600">cleared</span>}
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

        <RuledPanel title="Audit verdict">
          {auction ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-white">{auction.asset}</h2>
                <div className="mt-3"><StatusBadge status={auction.status} /></div>
              </div>
              <div className="divide-y divide-edge border-y border-edge">
                {[
                  ['Commitment set', `${auction.bids.length} sealed bids`],
                  ['Reserve proof', auction.reservesCommitment],
                  ['Winner rule', 'Highest revealed bid'],
                  ['Report state', unlocked ? 'Ready' : 'Locked'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 py-3 text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="text-right font-mono text-xs text-slate-200">{value}</span>
                  </div>
                ))}
              </div>
              <button className="btn-primary w-full" disabled={!unlocked}>
                Generate signed report
              </button>
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-500">No audit target available.</p>
          )}
        </RuledPanel>
      </section>
    </div>
  )
}
