import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import BidForm from '../components/BidForm'
import BidResults from '../components/BidResults'
import PrivacyPanel from '../components/PrivacyPanel'
import Countdown from '../components/Countdown'
import { EmptyState, ErrorNotice, PageHeader, RuledPanel, SkeletonRows, Toast } from '../components/Primitives'
import StatusBadge from '../components/StatusBadge'
import { settle, revealBid, revealBidManual, getSalt, payWinner, resetDemo, getMode } from '../services/data'
import { can } from '../services/role'
import { useAuctions } from '../utils/useAuctions'
import { useRole } from '../utils/useRole'
import { fmtUSD, timeLeft, statusHint } from '../utils/format'
import { ASSET_TYPES, type AssetType, type Auction } from '../types'

interface Props {
  address: string | null
}

type StatusFilter = 'all' | 'open' | 'settled'

export default function Auctions({ address }: Props) {
  const { auctions, loading, error } = useAuctions()
  const role = useRole()
  const [bidding, setBidding] = useState<Auction | null>(null)
  const [filter, setFilter] = useState<StatusFilter>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | AssetType>('all')
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<'closing' | 'amount' | 'bids'>('closing')
  const [busy, setBusy] = useState<number | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [notice, setNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null)

  // En testnet, las escrituras requieren wallet conectada.
  function requireWallet(): boolean {
    if (getMode() === 'chain' && !address) {
      setNotice({ type: 'info', message: 'Conecta tu wallet Stellar para operar en Testnet.' })
      return false
    }
    return true
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = auctions
      .filter((auction) =>
        filter === 'all' ? true : filter === 'open' ? auction.status === 'BiddingOpen' : auction.status === 'Settled'
      )
      .filter((auction) => (typeFilter === 'all' ? true : auction.assetType === typeFilter))
      .filter((auction) => (q === '' ? true : auction.asset.toLowerCase().includes(q) || auction.issuer.toLowerCase().includes(q)))
    const sorted = [...list]
    if (sortBy === 'amount') sorted.sort((a, b) => b.amount - a.amount)
    else if (sortBy === 'bids') sorted.sort((a, b) => b.bids.length - a.bids.length)
    else sorted.sort((a, b) => a.endTime - b.endTime) // closing soonest first
    return sorted
  }, [auctions, filter, typeFilter, query, sortBy])

  const selected = filtered.find((auction) => auction.id === selectedId) ?? filtered[0] ?? null

  function openBid(auction: Auction) {
    if (!requireWallet()) return
    setBidding(auction)
  }

  async function onPay(auction: Auction) {
    if (!requireWallet()) return
    if (!window.confirm(`Pagar al emisor de #${String(auction.id).padStart(3, '0')} de forma confidencial. El monto queda oculto on-chain. ¿Confirmás?`)) return
    setBusy(auction.id)
    setNotice(null)
    try {
      await payWinner(auction.id, auction.winner ?? address ?? '', auction.winningAmount ?? 0)
      setNotice({ type: 'success', message: 'Pago confidencial enviado: el monto queda oculto on-chain.' })
    } catch (e) {
      setNotice({ type: 'error', message: (e as Error).message })
    } finally {
      setBusy(null)
    }
  }

  async function onSettle(auction: Auction) {
    if (!requireWallet()) return
    if (!window.confirm(`Liquidar la subasta #${String(auction.id).padStart(3, '0')}: se revelan las ofertas y se elige al ganador. Es irreversible. ¿Confirmás?`)) return
    setBusy(auction.id)
    setNotice(null)
    try {
      if (getMode() === 'chain' && address) {
        if (getSalt(auction.id, address)) {
          try {
            await revealBid(auction.id, address)
          } catch {
            /* already revealed or not owned by caller */
          }
        } else {
          const amountStr = window.prompt('Bid amount to reveal, for example 15000000:')
          const salt = amountStr ? window.prompt('Bid salt in hex:') : null
          if (amountStr && salt) await revealBidManual(auction.id, address, Number(amountStr), salt.trim())
        }
      }
      await settle(auction.id, address ?? '')
      setNotice({ type: 'success', message: 'Subasta liquidada. Los resultados ya son públicos.' })
    } catch (e) {
      setNotice({ type: 'error', message: (e as Error).message })
    } finally {
      setBusy(null)
    }
  }

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Auction registry"
        title="Records, commitments and settlement status."
        description="Inspect active and settled auctions. Bid amounts remain private until reveal."
        actions={
          getMode() === 'demo' && (
            <button className="btn-ghost" onClick={resetDemo}>
              Reset demo
            </button>
          )
        }
      />

      <div className="flex flex-wrap gap-2">
        {(['all', 'open', 'settled'] as const).map((item) => (
          <button
            key={item}
            onClick={() => setFilter(item)}
            className={`min-h-10 border px-3 text-sm font-semibold transition ${
              filter === item ? 'border-brand bg-brand text-ink' : 'border-edge bg-white/[0.02] text-slate-400 hover:text-white'
            }`}
          >
            {item === 'all' ? 'All records' : item === 'open' ? 'Open' : 'Settled'}
          </button>
        ))}
        <button
          onClick={() => setTypeFilter('all')}
          className={`min-h-10 border px-3 text-sm font-semibold transition ${
            typeFilter === 'all' ? 'border-white/50 bg-white text-ink' : 'border-edge bg-white/[0.02] text-slate-400 hover:text-white'
          }`}
        >
          All classes
        </button>
        {ASSET_TYPES.map((type) => (
          <button
            key={type.id}
            onClick={() => setTypeFilter(type.id)}
            className={`min-h-10 border px-3 text-sm font-semibold transition ${
              typeFilter === type.id ? 'border-white/50 bg-white text-ink' : 'border-edge bg-white/[0.02] text-slate-400 hover:text-white'
            }`}
          >
            {type.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="input max-w-xs"
          placeholder="Buscar por activo o emisor…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-slate-400">
          Ordenar:
          <select className="input w-auto" value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)}>
            <option value="closing">Cierre (más pronto)</option>
            <option value="amount">Monto (mayor)</option>
            <option value="bids">Ofertas (más)</option>
          </select>
        </label>
        <span className="text-xs text-slate-500">{filtered.length} resultado(s)</span>
      </div>

      {error && <ErrorNotice message={`Chain read failed: ${error}`} />}
      <Toast notice={notice} onClose={() => setNotice(null)} />

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          {loading ? (
            <SkeletonRows rows={6} />
          ) : filtered.length === 0 ? (
            <EmptyState
              title="No records in this view"
              description="Adjust filters or issue a demo auction from the issuer desk."
              action={role === 'emisor' && <Link className="btn-primary" to="/create">Issue auction</Link>}
            />
          ) : (
            <>
              <div className="hidden overflow-x-auto border border-edge bg-panel md:block">
                <table className="w-full min-w-[860px] text-sm">
                  <thead>
                    <tr className="border-b border-edge text-left">
                      <th className="px-4 py-3 micro-label">Record</th>
                      <th className="px-4 py-3 micro-label">Asset</th>
                      <th className="px-4 py-3 micro-label">Status</th>
                      <th className="px-4 py-3 micro-label text-right">Issue amount</th>
                      <th className="px-4 py-3 micro-label text-right">Min bid</th>
                      <th className="px-4 py-3 micro-label text-right">Bids</th>
                      <th className="px-4 py-3 micro-label text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((auction) => (
                      <tr
                        key={auction.id}
                        className={`data-row ${selected?.id === auction.id ? 'data-row-active' : ''}`}
                        onClick={() => setSelectedId(auction.id)}
                      >
                        <td className="px-4 py-4 font-mono text-xs text-slate-500">
                          #{String(auction.id).padStart(3, '0')}
                        </td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-white">{auction.asset}</div>
                          <div className="mt-1 text-xs text-slate-500">{auction.currency} / {auction.assetType}</div>
                        </td>
                        <td className="px-4 py-4"><StatusBadge status={auction.status} /></td>
                        <td className="px-4 py-4 text-right font-mono text-slate-200">{fmtUSD(auction.amount)}</td>
                        <td className="px-4 py-4 text-right font-mono text-slate-400">{fmtUSD(auction.minBid)}</td>
                        <td className="px-4 py-4 text-right font-mono text-slate-400">{auction.bids.length}</td>
                        <td className="px-4 py-4 text-right">
                          <AuctionAction
                            auction={auction}
                            role={role}
                            busy={busy === auction.id}
                            address={address}
                            onBid={openBid}
                            onSettle={onSettle}
                            onPay={onPay}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="space-y-3 md:hidden">
                {filtered.map((auction) => (
                  <div
                    key={auction.id}
                    onClick={() => setSelectedId(auction.id)}
                    className={`w-full border p-4 text-left ${
                      selected?.id === auction.id ? 'border-brand bg-brand/10' : 'border-edge bg-panel'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-mono text-xs text-brand">#{String(auction.id).padStart(3, '0')}</div>
                        <div className="mt-2 font-semibold text-white">{auction.asset}</div>
                        <div className="mt-1 text-sm text-slate-500">{fmtUSD(auction.amount)} / {auction.bids.length} bids</div>
                      </div>
                      <StatusBadge status={auction.status} />
                    </div>
                    <div className="mt-4">
                      <AuctionAction
                        auction={auction}
                        role={role}
                        busy={busy === auction.id}
                            address={address}
                        onBid={openBid}
                        onSettle={onSettle}
                        onPay={onPay}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <InspectionPanel auction={selected} role={role} address={address} />
      </section>

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

function AuctionAction({
  auction,
  role,
  busy,
  address,
  onBid,
  onSettle,
  onPay,
}: {
  auction: Auction
  role: ReturnType<typeof useRole>
  busy: boolean
  address: string | null
  onBid: (auction: Auction) => void
  onSettle: (auction: Auction) => void
  onPay: (auction: Auction) => void
}) {
  const open = auction.status === 'BiddingOpen'
  const closed = open && auction.endTime <= Date.now()
  const alreadyBid = !!address && auction.bids.some((b) => b.bidderAddress === address)

  if (auction.status === 'Settled') {
    if (auction.paid) return <span className="pill bg-brand/15 text-brand">Paid</span>
    if (can(role, 'pay')) {
      return <button className="btn-primary min-h-9 px-3 py-1 text-xs" disabled={busy} onClick={(event) => {
        event.stopPropagation()
        onPay(auction)
      }}>Pay confidential</button>
    }
    return <span className="text-xs text-slate-500">Settled</span>
  }

  if (closed) {
    if (can(role, 'settle')) {
      return <button className="btn-ghost min-h-9 px-3 py-1 text-xs" disabled={busy} onClick={(event) => {
        event.stopPropagation()
        onSettle(auction)
      }}>Reveal and settle</button>
    }
    return <span className="text-xs text-slate-500">Awaiting settlement</span>
  }

  if (can(role, 'bid')) {
    return <button className="btn-primary min-h-9 px-3 py-1 text-xs" onClick={(event) => {
      event.stopPropagation()
      onBid(auction)
    }}>{alreadyBid ? 'Update bid' : 'Submit bid'}</button>
  }

  return <span className="text-xs text-slate-500">{timeLeft(auction.endTime)}</span>
}

function InspectionPanel({
  auction,
  role,
  address,
}: {
  auction: Auction | null
  role: ReturnType<typeof useRole>
  address: string | null
}) {
  if (!auction) {
    return (
      <RuledPanel title="Inspection">
        <p className="text-sm leading-6 text-slate-500">Select an auction record to inspect proof, issuer and bid state.</p>
      </RuledPanel>
    )
  }

  const hint = statusHint(auction, role, address)

  return (
    <RuledPanel title="Inspection">
      <div className="space-y-5">
        <div>
          <div className="font-mono text-xs text-brand">#{String(auction.id).padStart(3, '0')}</div>
          <h2 className="mt-2 text-xl font-semibold text-white">{auction.asset}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">{auction.description}</p>
        </div>
        {hint && (
          <div
            className={`border px-3 py-2 text-sm ${
              hint.tone === 'success'
                ? 'border-brand/40 bg-brand/10 text-brand'
                : hint.tone === 'warn'
                  ? 'border-amber-400/30 bg-amber-500/10 text-amber-200'
                  : 'border-edge bg-white/[0.03] text-slate-300'
            }`}
          >
            {hint.text}
          </div>
        )}
        <PrivacyPanel auction={auction} />
        <div className="divide-y divide-edge border-y border-edge">
          <div className="flex justify-between gap-4 py-3 text-sm">
            <span className="text-slate-500">Closes in</span>
            <span className="text-right font-mono text-xs">
              {auction.status === 'BiddingOpen' ? <Countdown endTime={auction.endTime} /> : 'closed'}
            </span>
          </div>
          {[
            ['Issuer', `${auction.issuer.slice(0, 8)}...${auction.issuer.slice(-4)}`],
            ['Reserve commitment', auction.reservesCommitment],
            ['Minimum bid', fmtUSD(auction.minBid)],
            ['Sealed bids', String(auction.bids.length)],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 py-3 text-sm">
              <span className="text-slate-500">{label}</span>
              <span className="text-right font-mono text-xs text-slate-200">{value}</span>
            </div>
          ))}
        </div>
        {auction.status === 'Settled' && (
          <div>
            <div className="micro-label mb-2">Public results (post-close)</div>
            <BidResults auction={auction} />
          </div>
        )}
        <Link className="btn-ghost w-full" to={`/banco/${auction.issuer}`}>
          View issuer profile
        </Link>
      </div>
    </RuledPanel>
  )
}
