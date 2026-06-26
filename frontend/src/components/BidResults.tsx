import type { Auction } from '../types'
import { fmtUSD } from '../utils/format'

/**
 * Public post-close results. Shown ONLY when the auction is `Settled`: before
 * the close, bid amounts stay private; after the close the outcome is public
 * and auditable by anyone.
 */
export default function BidResults({ auction }: { auction: Auction }) {
  if (auction.status !== 'Settled') return null
  const bids = [...auction.bids].sort((a, b) => b.amount - a.amount)

  return (
    <div className="overflow-x-auto border border-edge">
      <table className="w-full min-w-[420px] text-sm">
        <thead>
          <tr className="border-b border-edge text-left">
            <th className="px-3 py-3 micro-label">Participant</th>
            <th className="px-3 py-3 micro-label text-right">Bid</th>
            <th className="px-3 py-3 micro-label text-right">Result</th>
          </tr>
        </thead>
        <tbody>
          {bids.map((bid, index) => (
            <tr key={`${bid.bidderAddress}-${index}`} className="data-row">
              <td className="px-3 py-3 font-medium text-white">
                {bid.bidderName || `${bid.bidderAddress.slice(0, 8)}...${bid.bidderAddress.slice(-4)}`}
              </td>
              <td className="px-3 py-3 text-right font-mono text-slate-100">
                {bid.revealed ? fmtUSD(bid.amount) : 'unrevealed'}
              </td>
              <td className="px-3 py-3 text-right">
                {index === 0 && bid.revealed ? (
                  <span className="pill bg-brand/15 text-brand">winner</span>
                ) : (
                  <span className="text-slate-600">cleared</span>
                )}
              </td>
            </tr>
          ))}
          {bids.length === 0 && (
            <tr>
              <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                No bids.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
