import { ASSET_TYPES, type Auction } from '../types'
import { fmtUSD, timeLeft } from '../utils/format'
import StatusBadge from './StatusBadge'

const ASSET_TYPE_LABEL = Object.fromEntries(ASSET_TYPES.map((t) => [t.id, t.label])) as Record<
  string,
  string
>

interface Props {
  auction: Auction
  onBid?: (a: Auction) => void
  onSettle?: (a: Auction) => void
  onPay?: (a: Auction) => void
}

export default function AuctionCard({ auction, onBid, onSettle, onPay }: Props) {
  const open = auction.status === 'BiddingOpen'
  const closed = open && auction.endTime <= Date.now()
  return (
    <div className="card p-5 transition hover:border-brand-soft/50">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-500">#{String(auction.id).padStart(3, '0')}</span>
            <span className="pill bg-accent/10 text-accent">{ASSET_TYPE_LABEL[auction.assetType]}</span>
          </div>
          <h3 className="mt-0.5 text-lg font-bold text-white">{auction.asset}</h3>
        </div>
        <StatusBadge status={auction.status} />
      </div>

      <p className="mt-1.5 line-clamp-2 text-sm text-slate-400">{auction.description}</p>

      <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
        <Stat label="Monto" value={fmtUSD(auction.amount)} />
        <Stat label="Mín. oferta" value={fmtUSD(auction.minBid)} />
        <Stat label="Cierre" value={open ? timeLeft(auction.endTime) : '—'} />
      </div>

      <div className="mt-4 flex items-center justify-between border-t border-edge/60 pt-3.5">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <LockIcon />
          {auction.bids.length} oferta{auction.bids.length !== 1 ? 's' : ''} sellada
          {auction.bids.length !== 1 ? 's' : ''}
        </div>
        {auction.status === 'Settled' ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">
              Ganador: <span className="font-semibold text-brand-soft">{auction.winnerName}</span>
            </span>
            {auction.paid ? (
              <span className="pill bg-emerald-500/15 text-emerald-300">Pagado</span>
            ) : (
              onPay && (
                <button className="btn-primary py-1.5 text-xs" onClick={() => onPay(auction)}>
                  Pagar confidencial
                </button>
              )
            )}
          </div>
        ) : closed ? (
          onSettle ? (
            <button className="btn-ghost py-1.5 text-xs" onClick={() => onSettle(auction)}>
              Revelar & liquidar
            </button>
          ) : (
            <span className="text-xs text-slate-500">Esperando liquidación</span>
          )
        ) : onBid ? (
          <button className="btn-primary py-1.5 text-xs" onClick={() => onBid(auction)}>
            Ofertar
          </button>
        ) : (
          <span className="text-xs text-slate-500">Abierta</span>
        )}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-ink/50 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="font-semibold text-slate-100">{value}</div>
    </div>
  )
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}
