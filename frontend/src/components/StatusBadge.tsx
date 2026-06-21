import type { AuctionStatus } from '../types'

const MAP: Record<AuctionStatus, { label: string; cls: string }> = {
  BiddingOpen: { label: 'Abierta', cls: 'bg-emerald-500/15 text-emerald-300' },
  BiddingClosed: { label: 'Cerrada', cls: 'bg-amber-500/15 text-amber-300' },
  Settled: { label: 'Liquidada', cls: 'bg-brand/20 text-brand-soft' },
  Cancelled: { label: 'Cancelada', cls: 'bg-rose-500/15 text-rose-300' },
}

export default function StatusBadge({ status }: { status: AuctionStatus }) {
  const s = MAP[status]
  return <span className={`pill ${s.cls}`}>{s.label}</span>
}
