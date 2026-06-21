import { Link } from 'react-router-dom'
import { useAuctions } from '../utils/useAuctions'
import { useRole } from '../utils/useRole'
import { ROLES } from '../services/role'
import { fmtUSD } from '../utils/format'

const ROLE_CTA: Record<string, { to: string; label: string }> = {
  emisor: { to: '/create', label: 'Crear subasta' },
  oferente: { to: '/auctions', label: 'Ver subastas y ofertar' },
  auditor: { to: '/audit', label: 'Abrir auditoría' },
  regulador: { to: '/compliance', label: 'Abrir compliance' },
}

export default function Home() {
  const { auctions } = useAuctions()
  const role = useRole()
  const roleInfo = ROLES.find((r) => r.id === role)
  const cta = role ? ROLE_CTA[role] : null
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
          <div className="mt-6 flex flex-wrap items-center gap-3">
            {cta && (
              <Link to={cta.to} className="btn-primary">
                {cta.label}
              </Link>
            )}
            {roleInfo && (
              <span className="pill bg-white/5 text-slate-300">
                {roleInfo.icon} {roleInfo.label}
              </span>
            )}
          </div>
        </div>
        <div className="pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-brand/20 blur-3xl" />
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <Metric label="Subastas activas" value={String(open.length)} accent="text-emerald-300" />
        <Metric label="Liquidadas" value={String(settled.length)} accent="text-brand-soft" />
        <Metric label="Volumen liquidado" value={fmtUSD(volume)} accent="text-accent" />
      </section>

      {roleInfo && (
        <section className="card p-6">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{roleInfo.icon}</div>
            <div>
              <div className="text-lg font-bold text-white">Estás como {roleInfo.label}</div>
              <div className="text-sm text-slate-400">{roleInfo.desc}</div>
            </div>
          </div>
          <ul className="mt-4 grid gap-2 text-sm text-slate-300 sm:grid-cols-2">
            {ROLE_HELP[role!].map((h) => (
              <li key={h} className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-brand-soft" />
                {h}
              </li>
            ))}
          </ul>
        </section>
      )}

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

const ROLE_HELP: Record<string, string[]> = {
  emisor: [
    'Crear subastas con prueba de reservas (Groth16)',
    'Liquidar la subasta tras el cierre',
    'No podés ofertar ni auditar desde aquí',
  ],
  oferente: [
    'Ofertar de forma sellada con prueba ZK',
    'Pagar de forma confidencial si ganás',
    'No podés crear subastas ni ver compliance',
  ],
  auditor: [
    'Revelar montos con view key y verificar el proceso',
    'Solo lectura: no podés ofertar ni crear',
  ],
  regulador: [
    'Validar participantes contra el ASP (allow-list)',
    'Solo compliance: no podés ofertar ni crear',
  ],
}

function Metric({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="card p-5">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-1 text-3xl font-extrabold ${accent}`}>{value}</div>
    </div>
  )
}

