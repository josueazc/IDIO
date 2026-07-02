import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

const STEPS = [
  {
    n: '01',
    title: 'Issue',
    desc: 'El emisor crea la subasta. El browser genera una prueba de reservas (ZK). El contrato la verifica on-chain antes de publicar.',
  },
  {
    n: '02',
    title: 'Bid',
    desc: 'Cada banco envía un compromiso sellado. Solo el hash llega a la blockchain. El monto permanece privado.',
  },
  {
    n: '03',
    title: 'Prove',
    desc: 'Al ofertar, el browser genera una prueba ZK de elegibilidad (cupo ≥ oferta ≥ mínimo). El contrato la verifica on-chain.',
  },
  {
    n: '04',
    title: 'Settle',
    desc: 'Al cerrar se revelan las ofertas, el contrato elige al ganador. El pago queda confidencial en el token Pedersen.',
  },
]

const ROLES = [
  {
    id: 'emisor',
    label: 'Emisor',
    desc: 'Creá emisiones, asigná cupos, auditá resultados y revisá cumplimiento — todo desde una sola cuenta.',
    cta: 'Crear cuenta como emisor',
    to: '/signup/emisor',
    accent: true,
  },
  {
    id: 'oferente',
    label: 'Banco / Oferente',
    desc: 'Conectá tu wallet Stellar, enviá ofertas selladas y competí sin que otros vean tu precio antes del cierre.',
    cta: 'Crear cuenta como banco',
    to: '/signup/oferente',
    accent: false,
  },
]

export default function Welcome() {
  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-edge bg-surface/60 backdrop-blur-md sticky top-0 z-20">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-8">
          <BrandLogo />
          <Link className="btn-ghost btn-sm" to="/login">
            Iniciar sesión
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-4 pt-20 pb-16 sm:px-8 sm:pt-28 sm:pb-24">
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <span className="eyebrow">Stellar Protocol 26</span>
          <span className="pill border-brand/25 bg-brand/10 text-brand text-[11px]">Testnet live</span>
        </div>
        <h1 className="font-display text-4xl leading-[1.06] text-white sm:text-5xl lg:text-[3.5rem] max-w-3xl">
          Subastas institucionales privadas con prueba pública.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
          IDIO usa Zero-Knowledge proofs para que cada banco oferte en secreto y el proceso sea matemáticamente
          verificable por reguladores — sin revelar montos ni estrategias.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/signup/emisor" className="btn-primary">
            Empezar como emisor
          </Link>
          <Link to="/signup/oferente" className="btn-secondary">
            Entrar como banco
          </Link>
          <Link to="/login" className="btn-ghost">
            Ya tengo cuenta →
          </Link>
        </div>

        <div className="mt-8 rounded-xl border border-edge bg-raised/50 px-5 py-3.5 text-sm text-zinc-500 max-w-lg">
          <span className="font-medium text-zinc-300">Modo demo:</span>{' '}
          cualquier email y contraseña funcionan. Datos solo en este navegador — sin wallet requerida.
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-edge bg-surface/40">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-8 sm:py-20">
          <p className="eyebrow mb-4">Protocolo</p>
          <h2 className="font-display text-3xl text-white mb-12">Cómo funciona</h2>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step) => (
              <div key={step.n} className="border border-edge bg-raised/60 p-6 space-y-3">
                <div className="font-mono text-[11px] font-semibold tracking-[0.2em] text-brand">{step.n}</div>
                <div className="text-lg font-semibold text-white">{step.title}</div>
                <p className="text-sm leading-relaxed text-zinc-500">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ZK proof callout */}
      <section className="border-t border-edge">
        <div className="mx-auto max-w-5xl px-4 py-14 sm:px-8">
          <div className="grid gap-8 md:grid-cols-2 items-center">
            <div>
              <p className="eyebrow mb-3">ZK on-chain verificable</p>
              <h2 className="font-display text-2xl text-white mb-4">
                La prueba vive en el contrato, no en la confianza del emisor.
              </h2>
              <p className="text-sm leading-relaxed text-zinc-400">
                Enviá una prueba adulterada al contrato desplegado y recibís{' '}
                <span className="font-mono text-red-300">Error(Crypto, InvalidInput)</span> de{' '}
                <span className="font-mono text-brand">verify_groth16</span>. Eso es verificación real, no simulada.
              </p>
            </div>
            <div className="space-y-2">
              {[
                ['Verificador', 'Groth16 / BN254'],
                ['Host functions', 'g1_mul · g1_add · pairing_check'],
                ['Protocolo', 'Stellar Protocol 26'],
                ['Contratos', '4 desplegados en Testnet'],
                ['Pruebas ZK', '~1–3 s en hardware rápido'],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between border-b border-edge/60 py-2 text-sm last:border-0">
                  <span className="text-zinc-500">{k}</span>
                  <span className="font-mono text-xs text-zinc-200">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Role cards */}
      <section className="border-t border-edge bg-surface/40">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-8">
          <p className="eyebrow mb-8">Entrá por tu rol</p>
          <div className="grid gap-5 md:grid-cols-2">
            {ROLES.map((role) => (
              <Link key={role.id} to={role.to} className="role-card block no-underline">
                <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${
                  role.accent
                    ? 'border-brand/25 bg-brand/10 text-brand'
                    : 'border-white/10 bg-white/[0.04] text-zinc-300'
                }`}>
                  {role.label}
                </span>
                <h2 className="font-display mt-5 text-2xl text-white">{role.cta}</h2>
                <p className="mt-3 text-sm leading-relaxed text-zinc-500">{role.desc}</p>
                <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand">
                  Crear cuenta <span aria-hidden>→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-edge">
        <div className="mx-auto max-w-5xl flex flex-wrap items-center justify-between gap-4 px-4 py-6 sm:px-8 text-xs text-zinc-600">
          <span>IDIO — Institutional Decentralized Issuance & Offerings</span>
          <span>MIT License · Built on Stellar</span>
        </div>
      </footer>
    </main>
  )
}
