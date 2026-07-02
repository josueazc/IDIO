import type { AuctionStatus } from '../types'

const MAP: Record<AuctionStatus, { label: string; cls: string; dot: string }> = {
  BiddingOpen: {
    label: 'abierta',
    cls: 'bg-brand/15 text-brand border-brand/25',
    dot: 'bg-brand animate-pulse',
  },
  BiddingClosed: {
    label: 'cerrada',
    cls: 'bg-amber-500/15 text-amber-300 border-amber-400/25',
    dot: 'bg-amber-400',
  },
  Settled: {
    label: 'liquidada',
    cls: 'bg-white/10 text-zinc-100 border-white/10',
    dot: 'bg-zinc-400',
  },
  Cancelled: {
    label: 'cancelada',
    cls: 'bg-rose-500/15 text-rose-300 border-rose-400/25',
    dot: 'bg-rose-400',
  },
}

export default function StatusBadge({ status }: { status: AuctionStatus }) {
  const s = MAP[status]
  return (
    <span className={`pill border ${s.cls} gap-2`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} aria-hidden="true" />
      {s.label}
    </span>
  )
}
