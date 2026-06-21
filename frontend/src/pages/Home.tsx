import { Link } from 'react-router-dom'
import { useAuctions } from '../utils/useAuctions'
import { fmtUSD } from '../utils/format'

export default function Home() {
  const { auctions } = useAuctions()
  const open = auctions.filter((a) => a.status === 'BiddingOpen')
  const settled = auctions.filter((a) => a.status === 'Settled')
  const volume = settled.reduce((s, a) => s + (a.winningAmount ?? 0), 0)

  return (
    <div className="space-y-10">
      <section className="card relative overflow-hidden p-8 md:p-12">
        <div className="relative z-10 max-w-2xl">
          <span className="pill bg-brand/15 text-brand-soft">Stellar · Protocol 26 · Zero-Knowledge</span>
          <h1 className="mt-4 text-4xl font-extrabold leading-tight text-white md:text-5xl">
            Subastas institucionales{' '}
            <span className="bg-gradient-to-r from-brand-soft to-accent bg-clip-text text-transparent">
              privadas y verificables
            </span>
          </h1>
          <p className="mt-4 text-lg text-slate-300">
            Bancos centrales y gobiernos venden bonos y RWA con ofertas selladas. Privacidad para
            los participantes, transparencia matemática para los reguladores.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link to="/auctions" className="btn-primary">
              Ver subastas
            </Link>
            <Link to="/create" className="btn-ghost">
              Crear subasta
            </Link>
          </div>
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-brand/20 blur-3xl" />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Subastas activas" value={String(open.length)} accent="text-emerald-300" />
        <Metric label="Liquidadas" value={String(settled.length)} accent="text-brand-soft" />
        <Metric label="Volumen liquidado" value={fmtUSD(volume)} accent="text-accent" />
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Roles de la plataforma
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <RoleCard title="Emisor" desc="Crea subastas y prueba reservas." to="/create" icon="🏛️" />
          <RoleCard title="Bidder" desc="Oferta de forma sellada con ZK." to="/auctions" icon="🏦" />
          <RoleCard title="Auditor" desc="Verifica el proceso con view key." to="/audit" icon="🔍" />
          <RoleCard title="Regulador" desc="Valida compliance ASP/FATF." to="/compliance" icon="🛡️" />
        </div>
      </section>

      <section className="card p-6">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-400">
          Cómo funciona
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <div key={i} className="rounded-xl bg-ink/40 p-4">
              <div className="text-xs font-mono text-brand-soft">0{i + 1}</div>
              <div className="mt-1 font-semibold text-white">{s.t}</div>
              <div className="mt-1 text-sm text-slate-400">{s.d}</div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

const STEPS = [
  { t: 'Emisión', d: 'El emisor publica el activo y prueba sus reservas con ZK.' },
  { t: 'Ofertas selladas', d: 'Cada banco oferta con un compromiso; nadie ve los montos.' },
  { t: 'Reveal & liquidación', d: 'Al cerrar, el contrato revela, elige al ganador y liquida.' },
]

function Metric({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-3xl font-extrabold ${accent}`}>{value}</div>
    </div>
  )
}

function RoleCard({ title, desc, to, icon }: { title: string; desc: string; to: string; icon: string }) {
  return (
    <Link to={to} className="card p-5 transition hover:border-brand-soft/50 hover:bg-panel">
      <div className="text-2xl">{icon}</div>
      <div className="mt-2 font-bold text-white">{title}</div>
      <div className="mt-1 text-sm text-slate-400">{desc}</div>
    </Link>
  )
}
