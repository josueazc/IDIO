import { useEffect, useState } from 'react'
import { EmptyState, PageHeader, RuledPanel } from '../components/Primitives'
import StatusBadge from '../components/StatusBadge'
import { useAuctions } from '../utils/useAuctions'

export default function Compliance() {
  const { auctions } = useAuctions()
  const [selected, setSelected] = useState<number | null>(null)

  useEffect(() => {
    if (!selected && auctions[0]) setSelected(auctions[0].id)
  }, [auctions, selected])

  const auction = auctions.find((item) => item.id === selected) ?? null

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Compliance desk"
        title="Participant eligibility without bid exposure."
        description="Regulators inspect allow-list, AML and jurisdiction state while bid amounts remain sealed."
      />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <RuledPanel title="Auction scope">
            <label className="block max-w-lg">
              <span className="label">Auction</span>
              <select className="input" value={selected ?? ''} onChange={(event) => setSelected(Number(event.target.value))}>
                {auctions.map((item) => (
                  <option key={item.id} value={item.id}>
                    #{String(item.id).padStart(3, '0')} / {item.asset}
                  </option>
                ))}
              </select>
            </label>
          </RuledPanel>

          {!auction ? (
            <EmptyState title="No compliance target" description="Create or select an auction to review its participant set." />
          ) : (
            <RuledPanel title="Participants">
              {auction.bids.length === 0 ? (
                <EmptyState title="No participants yet" description="Compliance checks appear once sealed bids are submitted." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-sm">
                    <thead>
                      <tr className="border-b border-edge text-left">
                        <th className="px-3 py-3 micro-label">Participant</th>
                        <th className="px-3 py-3 micro-label">ASP</th>
                        <th className="px-3 py-3 micro-label">OFAC</th>
                        <th className="px-3 py-3 micro-label">FATF</th>
                        <th className="px-3 py-3 micro-label text-right">State</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auction.bids.map((bid, index) => (
                        <tr key={`${bid.bidderAddress}-${index}`} className="data-row">
                          <td className="px-3 py-4">
                            <div className="font-semibold text-white">{bid.bidderName || 'Participant'}</div>
                            <div className="mt-1 font-mono text-[11px] text-slate-600">
                              {bid.bidderAddress.slice(0, 12)}...{bid.bidderAddress.slice(-4)}
                            </div>
                          </td>
                          <td className="px-3 py-4"><Check ok={bid.whitelisted} /></td>
                          <td className="px-3 py-4"><Check ok /></td>
                          <td className="px-3 py-4"><Check ok /></td>
                          <td className="px-3 py-4 text-right">
                            <span className="pill bg-brand/15 text-brand">approved</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </RuledPanel>
          )}
        </div>

        <RuledPanel title="Regulatory summary">
          {auction ? (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-semibold text-white">{auction.asset}</h2>
                <div className="mt-3"><StatusBadge status={auction.status} /></div>
              </div>
              <div className="divide-y divide-edge border-y border-edge">
                {[
                  ['Participants', String(auction.bids.length)],
                  ['Allow-list', 'ASP active'],
                  ['Bid visibility', 'sealed'],
                  ['Jurisdiction', 'permitted'],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-4 py-3 text-sm">
                    <span className="text-slate-500">{label}</span>
                    <span className="text-right font-mono text-xs uppercase tracking-[0.16em] text-brand">{value}</span>
                  </div>
                ))}
              </div>
              <div className="border border-brand/40 bg-brand/10 p-4">
                <div className="micro-label text-brand">State</div>
                <div className="mt-2 text-2xl font-semibold text-brand">Approved</div>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-6 text-slate-500">No auction selected.</p>
          )}
        </RuledPanel>
      </section>
    </div>
  )
}

function Check({ ok }: { ok: boolean }) {
  return (
    <span className={`pill ${ok ? 'bg-brand/15 text-brand' : 'bg-red-500/10 text-red-200'}`}>
      {ok ? 'clear' : 'blocked'}
    </span>
  )
}
