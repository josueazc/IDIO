import type { AuctionStatus } from '../types'

const MAP: Record<AuctionStatus, { label: string; cls: string }> = {
  BiddingOpen: { label: 'open', cls: 'bg-brand/15 text-brand' },
  BiddingClosed: { label: 'closed', cls: 'bg-amber-500/15 text-amber-300' },
  Settled: { label: 'settled', cls: 'bg-white/10 text-slate-100' },
  Cancelled: { label: 'cancelled', cls: 'bg-rose-500/15 text-rose-300' },
}

export default function StatusBadge({ status }: { status: AuctionStatus }) {
  const s = MAP[status]
  return <span className={`pill ${s.cls}`}>{s.label}</span>
}
