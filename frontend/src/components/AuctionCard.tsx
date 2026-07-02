import { Link } from 'react-router-dom'
import { ASSET_TYPES, type Auction } from '../types'
import { fmtUSD, timeLeft } from '../utils/format'
import StatusBadge from './StatusBadge'

const ASSET_TYPE_LABEL = Object.fromEntries(ASSET_TYPES.map((t) => [t.id, t.label])) as Record<string, string>

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
    <article className="card flex flex-col gap-0 p-5 transition hover:border-brand/30">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[11px] text-zinc-500">
              #{String(auction.id).padStart(3, '0')}
            </span>
            <span className="pill border-zinc-700 bg-zinc-800/60 text-zinc-400 text-[10px]">
              {ASSET_TYPE_LABEL[auction.assetType] ?? auction.assetType}
            </span>
          </div>
          <h3 className="mt-1 truncate text-lg font-bold text-white">{auction.asset}</h3>
        </div>
        <div className="shrink-0"><StatusBadge status={auction.status} /></div>
      </header>

      <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-zinc-500">
        {auction.description}
      </p>

      <Link
        to={`/banco/${auction.issuer}`}
        className="mt-2 inline-block truncate font-mono text-[11px] text-zinc-500 transition hover:text-brand"
        onClick={(e) => e.stopPropagation()}
      >
        {auction.issuer.slice(0, 8)}…{auction.issuer.slice(-4)} →
      </Link>

      <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
        <Stat label="Monto" value={fmtUSD(auction.amount)} />
        <Stat label="Mín." value={fmtUSD(auction.minBid)} />
        <Stat label={open ? 'Cierre' : 'Estado'} value={open ? timeLeft(auction.endTime) : auction.status === 'Settled' ? 'liquidada' : 'cerrada'} />
      </div>

      <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-edge/60 pt-3.5">
        <div className="flex items-center gap-1.5 text-xs text-zinc-500">
          <LockIcon />
          <span>
            {auction.bids.length} oferta{auction.bids.length !== 1 ? 's' : ''} sellada
            {auction.bids.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {auction.status === 'Settled' ? (
            <>
              <span className="text-xs text-zinc-400">
                Ganador: <span className="font-semibold text-brand">{auction.winnerName}</span>
              </span>
              {auction.paid ? (
                <span className="pill border-emerald-700/30 bg-emerald-500/15 text-emerald-300 text-[10px]">Pagado</span>
              ) : (
                onPay && (
                  <button className="btn-primary btn-sm" onClick={() => onPay(auction)}>
                    Pagar
                  </button>
                )
              )}
            </>
          ) : closed ? (
            onSettle ? (
              <button className="btn-ghost btn-sm" onClick={() => onSettle(auction)}>
                Revelar & liquidar
              </button>
            ) : (
              <span className="text-xs text-zinc-500">Esperando liquidación</span>
            )
          ) : onBid ? (
            <button className="btn-primary btn-sm" onClick={() => onBid(auction)}>
              Ofertar
            </button>
          ) : (
            <span className="text-xs text-zinc-500">Abierta</span>
          )}
        </div>
      </footer>
    </article>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-edge/60 bg-white/[0.025] px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
      <div className="mt-0.5 font-semibold text-zinc-100 truncate">{value}</div>
    </div>
  )
}

function LockIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 11V8a4 4 0 1 1 8 0v3" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  )
}
