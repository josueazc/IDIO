import { Link } from 'react-router-dom'
import { CopyButton, EmptyState, InlineAlert, PageHeader, RuledPanel } from '../components/Primitives'
import StatusBadge from '../components/StatusBadge'
import ConfidentialBalance from '../components/ConfidentialBalance'
import { useAuctions } from '../utils/useAuctions'
import { getMyOpenings, getMode } from '../services/data'
import { fmtUSD } from '../utils/format'

interface Props {
  address: string | null
}

export default function Activity({ address }: Props) {
  const { auctions } = useAuctions()
  const mine = auctions.filter((a) => a.issuer === address)
  const myBids = auctions.filter((a) => a.bids.some((b) => b.bidderAddress === address))
  const openings = getMyOpenings(address)
  const mode = getMode()

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Mi actividad"
        title="Tus subastas, ofertas y aperturas."
        description="Historial de acciones de tu cuenta en el protocolo IDIO."
      />

      {address && (
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-edge bg-raised/50 px-4 py-3 text-sm">
          <span className="text-zinc-500">Cuenta activa:</span>
          <span className="font-mono text-xs text-zinc-300 break-all">{address}</span>
          <CopyButton text={address} />
          {mode === 'chain' && (
            <a
              href={`https://stellar.expert/explorer/testnet/account/${address}`}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-brand hover:underline"
            >
              stellar.expert →
            </a>
          )}
        </div>
      )}

      {!address && (
        <InlineAlert variant="warn">
          No hay wallet conectada. Conectá tu wallet Stellar para ver tu actividad real on-chain.
        </InlineAlert>
      )}

      {mode !== 'chain' && (
        <InlineAlert variant="info">
          Modo Demo activo — las emisiones y ofertas que ves son locales a esta sesión del navegador.
        </InlineAlert>
      )}

      <RuledPanel title={`Subastas que emití (${mine.length})`}>
        {mine.length === 0 ? (
          <EmptyState
            title="Sin emisiones"
            description="No creaste subastas con esta cuenta."
            action={<Link className="btn-primary" to="/create">Crear subasta</Link>}
          />
        ) : (
          <Table rows={mine} />
        )}
      </RuledPanel>

      <RuledPanel title={`Subastas en las que oferté (${myBids.length})`}>
        {myBids.length === 0 ? (
          <EmptyState
            title="Sin ofertas"
            description="No ofertaste con esta cuenta."
            action={<Link className="btn-secondary" to="/auctions">Ver subastas abiertas</Link>}
          />
        ) : (
          <Table rows={myBids} />
        )}
      </RuledPanel>

      <RuledPanel title={`Mis aperturas guardadas — ${openings.length} pendiente(s) de revelar`}>
        {openings.length === 0 ? (
          <EmptyState title="Sin aperturas" description="Cuando ofertás, se guarda el (monto, salt) para revelar luego." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="border-b border-edge text-left">
                  <th className="px-3 py-3 micro-label">Subasta</th>
                  <th className="px-3 py-3 micro-label text-right">Monto</th>
                  <th className="px-3 py-3 micro-label">Salt</th>
                  <th className="px-3 py-3 micro-label">Revelar</th>
                </tr>
              </thead>
              <tbody>
                {openings.map((o) => (
                  <tr key={`${o.auctionId}-${o.salt}`} className="data-row">
                    <td className="px-3 py-3 font-mono text-xs text-zinc-500">
                      <Link className="hover:text-brand" to="/auctions">
                        #{String(o.auctionId).padStart(3, '0')}
                      </Link>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-zinc-200">{fmtUSD(o.amount)}</td>
                    <td className="px-3 py-3 font-mono text-[11px] text-zinc-500">{o.salt.slice(0, 16)}…</td>
                    <td className="px-3 py-3">
                      <Link
                        className="text-xs font-semibold text-brand hover:underline"
                        to="/auctions"
                      >
                        Revelar →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </RuledPanel>

      <ConfidentialBalance />
    </div>
  )
}

function Table({ rows }: { rows: ReturnType<typeof useAuctions>['auctions'] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="border-b border-edge text-left">
            <th className="px-3 py-3 micro-label">Registro</th>
            <th className="px-3 py-3 micro-label">Activo</th>
            <th className="px-3 py-3 micro-label">Estado</th>
            <th className="px-3 py-3 micro-label text-right">Monto</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id} className="data-row">
              <td className="px-3 py-3 font-mono text-xs text-zinc-500">
                <Link className="hover:text-brand" to="/auctions">
                  #{String(a.id).padStart(3, '0')}
                </Link>
              </td>
              <td className="px-3 py-3 font-semibold text-white">{a.asset}</td>
              <td className="px-3 py-3"><StatusBadge status={a.status} /></td>
              <td className="px-3 py-3 text-right font-mono text-zinc-200">{fmtUSD(a.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
