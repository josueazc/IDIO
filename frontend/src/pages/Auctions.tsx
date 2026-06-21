import { useState } from 'react'
import { useAuctions } from '../utils/useAuctions'
import AuctionCard from '../components/AuctionCard'
import BidForm from '../components/BidForm'
import { settle, revealBid, payWinner, resetDemo, getMode } from '../services/data'
import type { Auction } from '../types'

interface Props {
  address: string | null
}

export default function Auctions({ address }: Props) {
  const { auctions, loading, error } = useAuctions()
  const [bidding, setBidding] = useState<Auction | null>(null)
  const [filter, setFilter] = useState<'all' | 'open' | 'settled'>('all')
  const [busy, setBusy] = useState<number | null>(null)

  const filtered = auctions.filter((a) =>
    filter === 'all' ? true : filter === 'open' ? a.status === 'BiddingOpen' : a.status === 'Settled'
  )

  async function onPay(au: Auction) {
    setBusy(au.id)
    try {
      await payWinner(au.id, au.winner ?? address ?? '', au.winningAmount ?? 0)
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  async function onSettle(au: Auction) {
    setBusy(au.id)
    try {
      // En testnet, primero revelamos la oferta propia (con el salt local)
      // y luego liquidamos. Si ya estaba revelada o no es nuestra, seguimos.
      if (getMode() === 'chain' && address) {
        try {
          await revealBid(au.id, address)
        } catch {
          /* sin oferta propia para revelar, o ya revelada */
        }
      }
      await settle(au.id, address ?? '')
    } catch (e) {
      alert((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Subastas</h1>
          <p className="text-sm text-slate-400">Ofertas selladas — los montos son privados hasta el reveal.</p>
        </div>
        {getMode() === 'demo' && (
          <button className="btn-ghost text-xs" onClick={resetDemo} title="Restaurar datos de demo">
            Reset demo
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {(['all', 'open', 'settled'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              filter === f ? 'bg-brand text-white' : 'border border-edge bg-white/5 text-slate-400'
            }`}
          >
            {f === 'all' ? 'Todas' : f === 'open' ? 'Abiertas' : 'Liquidadas'}
          </button>
        ))}
      </div>

      {error && (
        <div className="rounded-lg bg-rose-500/10 px-3 py-2 text-sm text-rose-300">
          Error al leer de la cadena: {error}
        </div>
      )}

      {loading ? (
        <div className="card p-10 text-center text-slate-500">Cargando subastas…</div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((a) => (
            <AuctionCard
              key={a.id}
              auction={a}
              onBid={setBidding}
              onSettle={busy === a.id ? undefined : onSettle}
              onPay={busy === a.id ? undefined : onPay}
            />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="card p-10 text-center text-slate-500">No hay subastas en esta vista.</div>
      )}

      {bidding && (
        <BidForm
          auction={bidding}
          bidderAddress={address ?? 'GDEMO000000000000000000000000000000000000000000000000000'}
          onClose={() => setBidding(null)}
          onDone={() => {}}
        />
      )}
    </div>
  )
}
