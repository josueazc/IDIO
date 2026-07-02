import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

const STEPS = [
  {
    n: '01',
    title: 'Issue',
    desc: 'El emisor crea la subasta. El browser genera una prueba de reservas ZK. El contrato la verifica on-chain antes de publicar.',
  },
  {
    n: '02',
    title: 'Bid',
    desc: 'Cada banco envía un compromiso sellado. Solo el hash llega a la blockchain. El monto permanece privado.',
  },
  {
    n: '03',
    title: 'Prove',
    desc: 'El browser genera una prueba ZK de elegibilidad. El contrato verifica cupo ≥ oferta ≥ mínimo on-chain.',
  },
  {
    n: '04',
    title: 'Settle',
    desc: 'Al cerrar se revelan las ofertas, el contrato elige al ganador. El pago queda confidencial via Pedersen.',
  },
]

const ROLES = [
  {
    id: 'emisor',
    label: 'Emisor',
    desc: 'Creá emisiones, asigná cupos, auditá resultados y revisá cumplimiento desde una sola cuenta.',
    cta: 'Continuar como emisor',
    to: '/signup/emisor',
    primary: true,
  },
  {
    id: 'oferente',
    label: 'Banco / Oferente',
    desc: 'Conectá tu wallet Stellar, enviá ofertas selladas y competí sin revelar tu precio antes del cierre.',
    cta: 'Continuar como banco',
    to: '/signup/oferente',
    primary: false,
  },
]

export default function Welcome() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Header */}
      <header
        className="sticky top-0 z-20 border-b border-edge"
        style={{ background: 'rgba(10,10,10,0.85)', backdropFilter: 'blur(12px)' }}
      >
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-3.5 sm:px-8">
          <BrandLogo />
          <Link className="btn-secondary btn-sm" to="/login">
            Iniciar sesión
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-5 pt-24 pb-20 sm:px-8 sm:pt-32">
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <span className="eyebrow">Stellar Protocol 26</span>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ borderColor: 'var(--brand-line)', color: 'var(--brand)', background: 'var(--brand-dim)' }}
          >
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
            Testnet live
          </span>
        </div>

        <h1
          className="max-w-2xl text-4xl text-white sm:text-5xl"
          style={{ fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.1 }}
        >
          Subastas institucionales privadas con prueba pública.
        </h1>
        <p className="mt-5 max-w-xl text-base leading-relaxed" style={{ color: 'var(--text-2)' }}>
          IDIO usa Zero-Knowledge proofs para que cada banco oferte en secreto y el proceso sea
          matemáticamente verificable por reguladores — sin revelar montos ni estrategias.
        </p>

        <div className="mt-8 flex flex-wrap gap-2.5">
          <Link to="/signup/emisor" className="btn-primary">
            Empezar como emisor
          </Link>
          <Link to="/signup/oferente" className="btn-secondary">
            Entrar como banco
          </Link>
          <Link to="/login" className="btn-ghost">
            Ya tengo cuenta
          </Link>
        </div>

        <div
          className="mt-7 inline-flex items-start gap-2.5 rounded-lg border border-edge px-4 py-3 text-sm"
          style={{ background: 'var(--surface)' }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5"
            className="mt-0.5 shrink-0" style={{ color: 'var(--text-3)' }}>
            <circle cx="7" cy="7" r="5.5"/>
            <path d="M7 5v2.5L8.5 9"/>
          </svg>
          <span style={{ color: 'var(--text-3)' }}>
            <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>Modo demo disponible —</span>{' '}
            cualquier email y contraseña funcionan. Datos solo en este navegador.
          </span>
        </div>
      </section>

      {/* Steps */}
      <section className="border-t border-edge" style={{ background: 'var(--surface)' }}>
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
          <p className="eyebrow mb-3">Protocolo</p>
          <h2 className="mb-10 text-2xl font-bold tracking-tight text-white">Cómo funciona</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map((step, i) => (
              <div
                key={step.n}
                className="rounded-xl border border-edge p-5"
                style={{ background: 'var(--raised)' }}
              >
                <div
                  className="mb-3 inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold"
                  style={{ background: 'var(--brand-dim)', color: 'var(--brand)' }}
                >
                  {i + 1}
                </div>
                <div className="text-sm font-semibold text-white">{step.title}</div>
                <p className="mt-2 text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>
                  {step.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ZK callout */}
      <section className="border-t border-edge">
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <p className="eyebrow mb-3">ZK on-chain verificable</p>
              <h2 className="mb-4 text-2xl font-bold tracking-tight text-white">
                La prueba vive en el contrato, no en la confianza del emisor.
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                Enviá una prueba adulterada al contrato desplegado y recibís{' '}
                <code
                  className="rounded px-1.5 py-0.5 text-[12px]"
                  style={{ background: 'var(--raised)', color: '#fca5a5' }}
                >
                  Error(Crypto, InvalidInput)
                </code>{' '}
                de{' '}
                <code
                  className="rounded px-1.5 py-0.5 text-[12px]"
                  style={{ background: 'var(--raised)', color: 'var(--brand)' }}
                >
                  verify_groth16
                </code>
                . Verificación real, no simulada.
              </p>
            </div>

            <div
              className="rounded-xl border border-edge p-5"
              style={{ background: 'var(--surface)' }}
            >
              {[
                ['Verificador', 'Groth16 / BN254'],
                ['Host functions', 'g1_mul · g1_add · pairing_check'],
                ['Protocolo', 'Stellar Protocol 26'],
                ['Contratos', '4 desplegados en Testnet'],
                ['Prover', 'arkworks WASM ~1–3s'],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between py-2.5 text-sm"
                  style={{ borderBottom: '1px solid var(--line)' }}
                >
                  <span style={{ color: 'var(--text-3)' }}>{k}</span>
                  <span className="font-mono text-xs text-white">{v}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Role selection */}
      <section className="border-t border-edge" style={{ background: 'var(--surface)' }}>
        <div className="mx-auto max-w-5xl px-5 py-16 sm:px-8">
          <p className="eyebrow mb-3">Elegí tu rol</p>
          <h2 className="mb-8 text-2xl font-bold tracking-tight text-white">Entrá por tu acceso</h2>

          <div className="grid gap-4 md:grid-cols-2">
            {ROLES.map((role) => (
              <Link
                key={role.id}
                to={role.to}
                className="group relative block rounded-xl border border-edge p-6 transition-all duration-200 no-underline"
                style={{ background: 'var(--raised)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand-line)'
                  ;(e.currentTarget as HTMLElement).style.background = 'var(--overlay)'
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'
                  ;(e.currentTarget as HTMLElement).style.background = 'var(--raised)'
                }}
              >
                <span
                  className="inline-flex rounded-md px-2.5 py-1 text-xs font-semibold"
                  style={role.primary
                    ? { background: 'var(--brand-dim)', color: 'var(--brand)', border: '1px solid var(--brand-line)' }
                    : { background: 'var(--overlay)', color: 'var(--text-2)', border: '1px solid var(--line-strong)' }
                  }
                >
                  {role.label}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-white">{role.cta}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--text-3)' }}>
                  {role.desc}
                </p>
                <div
                  className="mt-6 flex items-center gap-1.5 text-sm font-semibold transition-colors"
                  style={{ color: 'var(--brand)' }}
                >
                  Crear cuenta
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 7h8M8 4l3 3-3 3"/>
                  </svg>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-edge">
        <div className="mx-auto max-w-5xl flex flex-wrap items-center justify-between gap-4 px-5 py-5 sm:px-8 text-xs" style={{ color: 'var(--text-3)' }}>
          <span>IDIO — Institutional Decentralized Issuance & Offerings</span>
          <span>MIT · Stellar Testnet</span>
        </div>
      </footer>
    </main>
  )
}
