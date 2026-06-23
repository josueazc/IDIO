import { useParams, Link } from 'react-router-dom'
import { useAuctions } from '../utils/useAuctions'
import AuctionCard from '../components/AuctionCard'
import { fmtUSD } from '../utils/format'

/**
 * Perfil de un banco emisor: todas las subastas que emitió (filtrando por
 * issuer). Solo lectura, accesible a todos los roles. Respeta el invariante
 * de privacidad (los montos solo se ven cuando la subasta está liquidada).
 */
export default function BankProfile() {
  const { address = '' } = useParams()
  const { auctions } = useAuctions()
  const mine = auctions.filter((a) => a.issuer === address)

  const open = mine.filter((a) => a.status === 'BiddingOpen').length
  const settled = mine.filter((a) => a.status === 'Settled').length
  const volume = mine.reduce((s, a) => s + (a.winningAmount ?? 0), 0)
  const short = address ? `${address.slice(0, 6)}…${address.slice(-4)}` : '—'

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs uppercase tracking-wide text-slate-500">Perfil de banco emisor</div>
          <h1 className="text-2xl font-extrabold text-white">🏛️ {short}</h1>
          <div className="mt-1 break-all font-mono text-[11px] text-slate-600">{address}</div>
        </div>
        <Link to="/auctions" className="btn-ghost text-xs">
          ← Todas las subastas
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Subastas emitidas" value={String(mine.length)} accent="text-white" />
        <Metric label="Abiertas / Liquidadas" value={`${open} / ${settled}`} accent="text-brand-soft" />
        <Metric label="Volumen liquidado" value={fmtUSD(volume)} accent="text-accent" />
      </section>

      {mine.length === 0 ? (
        <div className="card p-10 text-center text-slate-500">Este banco no tiene subastas.</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {mine.map((a) => (
            <AuctionCard key={a.id} auction={a} />
          ))}
        </div>
      )}
    </div>
  )
}

function Metric({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold ${accent}`}>{value}</div>
    </div>
  )
}
