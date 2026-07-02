import { Link } from 'react-router-dom'
import { PageHeader, Metric, RuledPanel, EmptyState, Timeline } from '../components/Primitives'
import StatusBadge from '../components/StatusBadge'
import { useAuctions } from '../utils/useAuctions'
import { useRole } from '../utils/useRole'
import { ROLES } from '../services/role'
import { getMode } from '../services/data'
import { config } from '../config'
import { fmtUSD, timeLeft } from '../utils/format'

const ROLE_CTA: Record<string, { to: string; label: string; description: string }> = {
  emisor: {
    to: '/create',
    label: 'Emitir subasta',
    description: 'Publicá una emisión con prueba de reservas ZK.',
  },
  oferente: {
    to: '/auctions',
    label: 'Ver subastas',
    description: 'Enviá ofertas selladas en las subastas abiertas.',
  },
}

const ZK_STACK = [
  { label: 'Verificador', value: 'Groth16 / BN254' },
  { label: 'Host functions', value: 'g1_mul · g1_add · pairing_check' },
  { label: 'Protocolo', value: 'Stellar Protocol 26' },
  { label: 'Prover', value: 'arkworks WASM (~1–3 s)' },
  { label: 'Circuitos Noir', value: 'sealed_bid · proof_of_reserves' },
]

const PROTOCOL_STEPS = [
  { label: 'Emisor publica subasta', detail: 'Prueba de reservas ZK verificada on-chain', done: true },
  { label: 'Bancos envían ofertas selladas', detail: 'Solo el hash llega a la blockchain', done: true },
  { label: 'Prueba ZK de elegibilidad', detail: 'capacity ≥ bid ≥ min, verificado on-chain', done: true },
  { label: 'Reveal y liquidación', detail: 'El monto mayor gana; pago confidencial Pedersen', done: false, active: true },
]

export default function Home() {
  const { auctions } = useAuctions()
  const role = useRole()
  const roleInfo = ROLES.find((item) => item.id === role)
  const cta = role ? ROLE_CTA[role] : null
  const open = auctions.filter((auction) => auction.status === 'BiddingOpen')
  const settled = auctions.filter((auction) => auction.status === 'Settled')
  const volume = auctions.reduce((sum, auction) => sum + (auction.winningAmount ?? 0), 0)
  const mode = getMode()

  return (
    <div className="space-y-8">
      <PageHeader
        eyebrow="Resumen del protocolo"
        title="Consola operativa para subastas institucionales privadas."
        description="Monitoreá el estado de las subastas, pruebas ZK y las próximas acciones de tu rol."
        actions={cta && <Link className="btn-primary" to={cta.to}>{cta.label}</Link>}
      />

      {/* Métricas */}
      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Subastas activas" value={String(open.length)} detail="Ventana de ofertas abierta" />
        <Metric label="Subastas liquidadas" value={String(settled.length)} detail="Ganador seleccionado" />
        <Metric label="Volumen liquidado" value={fmtUSD(volume)} detail={mode === 'chain' ? 'Testnet on-chain' : 'Datos de demo'} />
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        {/* Actividad reciente */}
        <RuledPanel title="Actividad reciente de subastas">
          {auctions.length === 0 ? (
            <EmptyState
              title="Aún sin subastas"
              description="Creá una subasta demo o cambiá a Testnet una vez conectada tu billetera."
              action={role === 'emisor' && <Link className="btn-primary" to="/create">Emitir subasta</Link>}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-edge text-left">
                    <th className="px-3 py-3 micro-label">Registro</th>
                    <th className="px-3 py-3 micro-label">Activo</th>
                    <th className="px-3 py-3 micro-label">Estado</th>
                    <th className="px-3 py-3 micro-label text-right">Monto</th>
                    <th className="px-3 py-3 micro-label text-right">Cierre</th>
                  </tr>
                </thead>
                <tbody>
                  {auctions.slice(0, 6).map((auction) => (
                    <tr key={auction.id} className="data-row">
                      <td className="px-3 py-4 font-mono text-xs text-zinc-500">
                        #{String(auction.id).padStart(3, '0')}
                      </td>
                      <td className="px-3 py-4">
                        <div className="font-semibold text-white">{auction.asset}</div>
                        <div className="mt-1 font-mono text-[11px] text-zinc-600">
                          {auction.issuer.slice(0, 8)}...{auction.issuer.slice(-4)}
                        </div>
                      </td>
                      <td className="px-3 py-4"><StatusBadge status={auction.status} /></td>
                      <td className="px-3 py-4 text-right font-mono text-zinc-200">{fmtUSD(auction.amount)}</td>
                      <td className="px-3 py-4 text-right text-zinc-400">
                        {auction.status === 'BiddingOpen' ? timeLeft(auction.endTime) : 'cerrada'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {auctions.length > 6 && (
            <div className="border-t border-edge px-3 py-3">
              <Link className="text-sm font-semibold text-brand hover:underline" to="/auctions">
                Ver todas las subastas ({auctions.length}) →
              </Link>
            </div>
          )}
        </RuledPanel>

        <div className="space-y-6">
          {/* Rol activo */}
          <RuledPanel title="Rol activo">
            <div className="space-y-5">
              <div>
                <div className="text-xl font-semibold text-white">{roleInfo?.label}</div>
                <p className="mt-2 text-sm leading-6 text-zinc-400">{roleInfo?.desc}</p>
              </div>
              {cta && (
                <div className="border border-edge bg-white/[0.02] p-4">
                  <div className="micro-label">Próxima acción</div>
                  <div className="mt-3 font-semibold text-white">{cta.label}</div>
                  <p className="mt-1 text-sm leading-6 text-zinc-500">{cta.description}</p>
                  <Link className="btn-primary mt-4 w-full" to={cta.to}>{cta.label}</Link>
                </div>
              )}
            </div>
          </RuledPanel>

          {/* Stack ZK */}
          <RuledPanel title="Stack ZK on-chain">
            <div className="space-y-0">
              {ZK_STACK.map(({ label, value }) => (
                <div key={label} className="flex justify-between border-b border-edge/60 py-2.5 text-sm last:border-0">
                  <span className="text-zinc-500">{label}</span>
                  <span className="font-mono text-[11px] text-zinc-300">{value}</span>
                </div>
              ))}
            </div>
            {mode === 'chain' && (
              <a
                href={`https://stellar.expert/explorer/testnet/contract/${config.contracts.auction}`}
                target="_blank"
                rel="noreferrer"
                className="mt-4 block text-sm font-semibold text-brand hover:underline"
              >
                Ver contrato en stellar.expert →
              </a>
            )}
          </RuledPanel>

          {/* Ciclo del protocolo */}
          <RuledPanel title="Ciclo del protocolo">
            <Timeline steps={PROTOCOL_STEPS} />
          </RuledPanel>
        </div>
      </section>
    </div>
  )
}
