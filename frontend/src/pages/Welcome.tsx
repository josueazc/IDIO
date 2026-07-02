import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

/* ── Animated counter ──────────────────────────────────────────────────────── */
function Counter({ to, suffix = '' }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      let start = 0
      const step = to / 50
      const t = setInterval(() => {
        start += step
        if (start >= to) { setVal(to); clearInterval(t) }
        else setVal(Math.floor(start))
      }, 30)
    }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [to])
  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>
}

/* ── ZK terminal block ─────────────────────────────────────────────────────── */
function Terminal() {
  const lines = [
    { t: 0,    text: '$ idio bid --auction 042 --amount 5000000', color: '#22c55e' },
    { t: 400,  text: '  Generating Groth16 proof (BN254)…', color: '#6b7280' },
    { t: 1200, text: '  ✓ Proof generated in 1.8s', color: '#22c55e' },
    { t: 1600, text: '  Submitting sealed commitment…', color: '#6b7280' },
    { t: 2200, text: '  ✓ Tx: AABCD…E4F2  [Stellar Testnet]', color: '#22c55e' },
    { t: 2600, text: '  Bid sealed. Amount hidden until reveal.', color: '#a3a3a3' },
  ]
  const [visible, setVisible] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return
      obs.disconnect()
      lines.forEach((l, i) => {
        setTimeout(() => setVisible(i + 1), l.t)
      })
    }, { threshold: 0.4 })
    if (containerRef.current) obs.observe(containerRef.current)
    return () => obs.disconnect()
  }, [])

  return (
    <div ref={containerRef} className="code-block">
      <div className="mb-3 flex gap-1.5">
        <div className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
        <div className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        <span className="ml-2 text-[10px] text-zinc-600">idio-cli — testnet</span>
      </div>
      {lines.map((l, i) => (
        <div
          key={i}
          className="transition-all duration-300"
          style={{
            opacity: visible > i ? 1 : 0,
            transform: visible > i ? 'translateY(0)' : 'translateY(4px)',
            color: l.color,
          }}
        >
          {l.text}
        </div>
      ))}
      {visible >= lines.length && (
        <div className="mt-1 inline-block h-4 w-2 animate-pulse bg-brand/60" />
      )}
    </div>
  )
}

/* ── Main component ────────────────────────────────────────────────────────── */
export default function Welcome() {
  return (
    <main className="min-h-screen overflow-x-hidden" style={{ background: 'var(--bg)' }}>

      {/* ── Header ── */}
      <header
        className="sticky top-0 z-30 border-b border-edge"
        style={{ background: 'rgba(8,8,8,0.88)', backdropFilter: 'blur(16px)' }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 sm:px-8">
          <BrandLogo />
          <div className="flex items-center gap-2">
            <Link className="btn-ghost btn-sm" to="/login">Iniciar sesión</Link>
            <Link className="btn-primary btn-sm" to="/signup/emisor">Registrarse</Link>
          </div>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="hero-section dot-grid relative">
        {/* Orbs animados */}
        <div className="orb orb-green" style={{ width: 600, height: 600, top: -200, left: -100 }} />
        <div className="orb orb-teal"  style={{ width: 500, height: 500, top: 100, right: -150 }} />
        <div className="orb orb-blue"  style={{ width: 400, height: 400, bottom: -100, left: '40%' }} />
        <div className="scan-line" />

        <div className="relative z-10 mx-auto max-w-6xl px-5 pb-28 pt-28 sm:px-8 sm:pt-36">
          <div className="mb-6 flex flex-wrap items-center gap-2.5">
            <span className="eyebrow">Stellar Protocol 26</span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ border: '1px solid var(--brand-line)', color: 'var(--brand)', background: 'var(--brand-dim)' }}
            >
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
              Testnet live
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-semibold"
              style={{ border: '1px solid var(--line-strong)', color: 'var(--text-3)', background: 'var(--raised)' }}
            >
              4 contratos desplegados
            </span>
          </div>

          <h1
            className="max-w-3xl text-5xl text-white sm:text-6xl lg:text-[4rem]"
            style={{ fontWeight: 800, letterSpacing: '-0.04em', lineHeight: 1.05 }}
          >
            Subastas institucionales{' '}
            <span
              className="relative"
              style={{
                background: 'linear-gradient(135deg, #22c55e 0%, #16a34a 60%, #14b8a6 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              privadas
            </span>{' '}
            con prueba pública.
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed" style={{ color: 'var(--text-2)' }}>
            IDIO usa Zero-Knowledge proofs para que cada banco oferte en secreto y el proceso sea
            matemáticamente verificable por reguladores — sin revelar montos ni estrategias. Todo
            on-chain, en Stellar, en segundos.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/signup/emisor" className="btn-primary" style={{ minHeight: 44, padding: '0 24px', fontSize: 14 }}>
              Empezar como emisor →
            </Link>
            <Link to="/signup/oferente" className="btn-secondary" style={{ minHeight: 44, padding: '0 24px', fontSize: 14 }}>
              Entrar como banco
            </Link>
            <Link to="/login" className="btn-ghost" style={{ minHeight: 44 }}>
              Ya tengo cuenta
            </Link>
          </div>

          <div
            className="mt-8 inline-flex items-center gap-2.5 rounded-lg border border-edge px-4 py-2.5 text-sm"
            style={{ background: 'rgba(255,255,255,0.03)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ color: 'var(--text-3)', flexShrink: 0 }}>
              <circle cx="7" cy="7" r="5.5"/><path d="M7 4.5v3l1.5 1.5"/>
            </svg>
            <span style={{ color: 'var(--text-3)' }}>
              <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>Modo demo —</span>{' '}
              cualquier email funciona, datos locales, sin wallet requerida.
            </span>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="border-y border-edge" style={{ background: 'var(--surface)' }}>
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { n: 4,    suf: '',  label: 'Contratos on-chain',     sub: 'auction · verifier · token · asp' },
              { n: 45,   suf: '+', label: 'Tests automatizados',    sub: 'proofs · format · roles · errors' },
              { n: 3,    suf: 's', label: 'Proof generation',       sub: 'Groth16 BN254 en browser' },
              { n: 100,  suf: '%', label: 'Verificación on-chain',  sub: 'sin intermediarios de confianza' },
            ].map((s) => (
              <div key={s.label} className="stat-card text-center">
                <div
                  className="text-3xl font-bold tracking-tight"
                  style={{ color: 'var(--brand)' }}
                >
                  <Counter to={s.n} suffix={s.suf} />
                </div>
                <div className="mt-1 text-sm font-semibold text-white">{s.label}</div>
                <div className="mt-1 text-xs" style={{ color: 'var(--text-3)' }}>{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="relative dot-grid-faint">
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="mb-12">
            <p className="eyebrow mb-3">Protocolo</p>
            <h2 className="text-3xl font-bold tracking-tight text-white">Cómo funciona IDIO</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
              Cuatro pasos. Cada uno verificable matemáticamente por cualquier auditor, sin necesitar
              acceso a los datos privados.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                n: '01', title: 'Issue',
                icon: '◈',
                desc: 'El emisor crea la subasta y el browser genera automáticamente una prueba ZK de reservas. El contrato la verifica on-chain antes de publicar.',
                color: '#22c55e',
              },
              {
                n: '02', title: 'Bid',
                icon: '◉',
                desc: 'Cada banco envía solo el hash del compromiso sellado. El monto real nunca llega a la blockchain. Cero información revelada pre-cierre.',
                color: '#14b8a6',
              },
              {
                n: '03', title: 'Prove',
                icon: '◎',
                desc: 'Al ofertar, el browser genera una prueba ZK de elegibilidad: cupo ≥ oferta ≥ mínimo. El contrato la verifica on-chain en el mismo tx.',
                color: '#3b82f6',
              },
              {
                n: '04', title: 'Settle',
                icon: '◇',
                desc: 'Al cerrar se revelan las ofertas. El contrato elige al ganador por precio más alto. El pago queda confidencial via compromiso Pedersen.',
                color: '#8b5cf6',
              },
            ].map((step) => (
              <div
                key={step.n}
                className="group rounded-xl border border-edge p-6 transition-all duration-300"
                style={{ background: 'var(--surface)' }}
                onMouseEnter={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = step.color + '40'
                  el.style.boxShadow = `0 8px 32px ${step.color}15`
                  el.style.transform = 'translateY(-3px)'
                }}
                onMouseLeave={e => {
                  const el = e.currentTarget as HTMLElement
                  el.style.borderColor = 'var(--line)'
                  el.style.boxShadow = 'none'
                  el.style.transform = 'none'
                }}
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-2xl" style={{ color: step.color }}>{step.icon}</span>
                  <span className="font-mono text-xs font-bold" style={{ color: step.color, opacity: 0.7 }}>
                    {step.n}
                  </span>
                </div>
                <div className="mb-2 text-base font-bold text-white">{step.title}</div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Terminal + ZK deep dive ── */}
      <section className="border-t border-edge" style={{ background: 'var(--surface)' }}>
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="grid gap-14 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="eyebrow mb-3">ZK on-chain real</p>
              <h2 className="mb-5 text-3xl font-bold tracking-tight text-white">
                La prueba vive en el contrato.<br />No en la confianza del emisor.
              </h2>
              <div className="space-y-4">
                {[
                  {
                    title: 'Groth16 / BN254 nativo',
                    desc: 'Soroban Protocol 26 expone host functions g1_mul, g1_add y pairing_check. El verificador usa operaciones de curva elíptica nativamente.',
                  },
                  {
                    title: 'Prover en el browser',
                    desc: 'arkworks compilado a WASM genera las pruebas en 1–3 segundos en el browser del oferente. Cero backend custodio.',
                  },
                  {
                    title: 'Compromisos Pedersen',
                    desc: 'Los balances confidenciales usan C = v·G + r·H. Un banco puede probar su solvencia sin revelar el monto exacto.',
                  },
                  {
                    title: 'Verificación adversarial',
                    desc: 'Enviá una prueba adulterada al contrato y recibís Error(Crypto, InvalidInput) de verify_groth16. Rechazo criptográfico, no lógico.',
                  },
                ].map((f) => (
                  <div key={f.title} className="feature-row">
                    <div
                      className="mt-0.5 flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ background: 'var(--brand-dim)', border: '1px solid var(--brand-line)' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--brand)' }}>
                        <path d="M2 7l3.5 3.5L12 3"/>
                      </svg>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{f.title}</div>
                      <div className="mt-1 text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>{f.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <Terminal />
          </div>
        </div>
      </section>

      {/* ── Architecture ── */}
      <section className="relative overflow-hidden">
        <div className="orb orb-green" style={{ width: 400, height: 400, top: -100, right: -100, opacity: 0.6 }} />
        <div className="dot-grid-faint absolute inset-0" />
        <div className="relative z-10 mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="mb-10">
            <p className="eyebrow mb-3">Arquitectura</p>
            <h2 className="text-3xl font-bold tracking-tight text-white">Stack técnico completo</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                layer: 'Contratos Soroban',
                color: '#22c55e',
                items: [
                  'auction.rs — ciclo de vida de subastas',
                  'verifier.rs — Groth16 BN254 on-chain',
                  'token.rs — Pedersen confidential token',
                  'asp.rs — Auction Settlement Protocol',
                ],
              },
              {
                layer: 'Prover / Browser',
                color: '#14b8a6',
                items: [
                  'arkworks-rs compilado a WASM',
                  'Circuitos Noir: sealed_bid + reserves',
                  'Stellar Wallets Kit (SWK)',
                  'Freighter · xBull · Albedo · LOBSTR',
                ],
              },
              {
                layer: 'Frontend / Auth',
                color: '#3b82f6',
                items: [
                  'React 18 + TypeScript + Vite',
                  'Supabase Auth (email confirm)',
                  'Supabase Postgres + RLS',
                  'Tailwind CSS + Inter',
                ],
              },
            ].map((block) => (
              <div
                key={block.layer}
                className="rounded-xl border border-edge p-6"
                style={{ background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="mb-4 flex items-center gap-2.5">
                  <div className="h-2 w-2 rounded-full" style={{ background: block.color }} />
                  <span className="text-sm font-bold text-white">{block.layer}</span>
                </div>
                <ul className="space-y-2.5">
                  {block.items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs" style={{ color: 'var(--text-3)' }}>
                      <span className="mt-0.5 shrink-0" style={{ color: block.color }}>›</span>
                      <span className="font-mono">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Contratos desplegados */}
          <div className="mt-8 rounded-xl border border-edge p-6" style={{ background: 'rgba(255,255,255,0.015)' }}>
            <div className="mb-4 flex items-center gap-2">
              <span
                className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                style={{ background: 'var(--brand-dim)', color: 'var(--brand)', border: '1px solid var(--brand-line)' }}
              >
                Testnet
              </span>
              <span className="text-sm font-semibold text-white">Contratos desplegados</span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                { name: 'Auction',  id: 'CAY7Z6TRR…R66UVOKRR' },
                { name: 'Verifier', id: 'CDPACMY5B…T7JMTR3IB6' },
                { name: 'Token',    id: 'CBVDXELQK…M3YI3BPQH' },
                { name: 'ASP',      id: 'CBKCM7DFW…G7SJ3ZJNR' },
              ].map((c) => (
                <div key={c.name} className="flex items-center gap-3">
                  <span className="text-xs font-semibold" style={{ color: 'var(--text-2)', minWidth: 56 }}>{c.name}</span>
                  <code className="text-xs" style={{ color: 'var(--text-3)', fontFamily: 'monospace' }}>{c.id}</code>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Security guarantees ── */}
      <section className="border-t border-edge" style={{ background: 'var(--surface)' }}>
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="mb-10">
            <p className="eyebrow mb-3">Garantías de seguridad</p>
            <h2 className="text-3xl font-bold tracking-tight text-white">
              Qué garantiza el protocolo
            </h2>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: '🔒',
                title: 'Ofertas selladas',
                desc: 'Ningún participante puede ver los montos de otros antes del cierre. Solo el hash llega a la blockchain.',
              },
              {
                icon: '✅',
                title: 'Elegibilidad verificable',
                desc: 'La prueba ZK garantiza que cupo ≥ oferta ≥ mínimo sin revelar el cupo real del banco.',
              },
              {
                icon: '🏛️',
                title: 'Auditoría regulatoria',
                desc: 'Cualquier regulador puede verificar el proceso matemáticamente después del cierre, sin datos privados.',
              },
              {
                icon: '🔑',
                title: 'Sin custodia',
                desc: 'Las claves privadas nunca salen del dispositivo del banco. El prover WASM corre en el browser.',
              },
              {
                icon: '⛓️',
                title: 'Resultado inmutable',
                desc: 'El ganador queda determinado on-chain. Nadie puede alterar el resultado post-cierre.',
              },
              {
                icon: '🛡️',
                title: 'Confidencialidad de saldo',
                desc: 'Los balances Pedersen permiten probar solvencia sin revelar el monto. C = v·G + r·H.',
              },
            ].map((g) => (
              <div
                key={g.title}
                className="rounded-xl border border-edge p-5 transition-all duration-200"
                style={{ background: 'var(--raised)' }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--brand-line)'
                  ;(e.currentTarget as HTMLElement).style.background = 'var(--overlay)'
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = 'var(--line)'
                  ;(e.currentTarget as HTMLElement).style.background = 'var(--raised)'
                }}
              >
                <div className="mb-3 text-2xl">{g.icon}</div>
                <div className="mb-1.5 text-sm font-semibold text-white">{g.title}</div>
                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-3)' }}>{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Para quién ── */}
      <section className="relative overflow-hidden border-t border-edge">
        <div className="orb orb-teal" style={{ width: 500, height: 500, bottom: -200, left: -100, opacity: 0.5 }} />
        <div className="dot-grid-faint absolute inset-0" />
        <div className="relative z-10 mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="mb-10">
            <p className="eyebrow mb-3">Roles</p>
            <h2 className="text-3xl font-bold tracking-tight text-white">¿Para quién es IDIO?</h2>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Emisor */}
            <Link
              to="/signup/emisor"
              className="group relative block overflow-hidden rounded-2xl border border-edge p-8 no-underline transition-all duration-300"
              style={{ background: 'var(--surface)' }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'var(--brand-line)'
                el.style.background = 'var(--raised)'
                el.style.transform = 'translateY(-3px)'
                el.style.boxShadow = '0 12px 40px rgba(34,197,94,0.12)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'var(--line)'
                el.style.background = 'var(--surface)'
                el.style.transform = 'none'
                el.style.boxShadow = 'none'
              }}
            >
              <div
                className="mb-5 inline-flex rounded-lg px-3 py-1.5 text-xs font-bold"
                style={{ background: 'var(--brand-dim)', color: 'var(--brand)', border: '1px solid var(--brand-line)' }}
              >
                Emisor institucional
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">Tesorerías y bancos centrales</h3>
              <p className="mb-6 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                Emití subastas de deuda soberana o bonos con prueba matemática de reservas.
                Asigná cupos por banco, auditá resultados y cumplimiento regulatorio desde un
                panel centralizado.
              </p>
              <ul className="mb-6 space-y-2">
                {['Prueba de reservas ZK automática', 'Asignación de cupos por institución', 'Auditoría regulatoria post-cierre', 'Panel de cumplimiento completo'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-3)' }}>
                    <span style={{ color: 'var(--brand)' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <span className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--brand)' }}>
                Crear cuenta como emisor
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7h8M8 4l3 3-3 3"/>
                </svg>
              </span>
            </Link>

            {/* Oferente */}
            <Link
              to="/signup/oferente"
              className="group relative block overflow-hidden rounded-2xl border border-edge p-8 no-underline transition-all duration-300"
              style={{ background: 'var(--surface)' }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'rgba(59,130,246,0.3)'
                el.style.background = 'var(--raised)'
                el.style.transform = 'translateY(-3px)'
                el.style.boxShadow = '0 12px 40px rgba(59,130,246,0.1)'
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement
                el.style.borderColor = 'var(--line)'
                el.style.background = 'var(--surface)'
                el.style.transform = 'none'
                el.style.boxShadow = 'none'
              }}
            >
              <div
                className="mb-5 inline-flex rounded-lg px-3 py-1.5 text-xs font-bold"
                style={{ background: 'rgba(59,130,246,0.1)', color: '#93c5fd', border: '1px solid rgba(59,130,246,0.25)' }}
              >
                Banco oferente
              </div>
              <h3 className="mb-3 text-xl font-bold text-white">Bancos comerciales y fondos</h3>
              <p className="mb-6 text-sm leading-relaxed" style={{ color: 'var(--text-2)' }}>
                Competí en subastas institucionales con total privacidad. Tu oferta y estrategia
                quedan ocultas hasta el reveal. Conectá cualquier wallet Stellar compatible y
                generá las pruebas ZK automáticamente desde el browser.
              </p>
              <ul className="mb-6 space-y-2">
                {['Oferta sellada — 0 información pre-cierre', 'Prueba de elegibilidad automática', 'Compatible con Freighter, xBull, Albedo', 'Historial completo de participaciones'].map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-3)' }}>
                    <span style={{ color: '#93c5fd' }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <span className="inline-flex items-center gap-2 text-sm font-bold" style={{ color: '#93c5fd' }}>
                Crear cuenta como banco
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 7h8M8 4l3 3-3 3"/>
                </svg>
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── Roadmap ── */}
      <section className="border-t border-edge" style={{ background: 'var(--surface)' }}>
        <div className="mx-auto max-w-6xl px-5 py-20 sm:px-8">
          <div className="mb-10">
            <p className="eyebrow mb-3">Roadmap</p>
            <h2 className="text-3xl font-bold tracking-tight text-white">Qué viene</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { phase: 'Fase 1', status: 'done',    title: 'Protocolo core',     items: ['4 contratos desplegados', 'Groth16 on-chain', 'Pedersen token', 'Demo funcional'] },
              { phase: 'Fase 2', status: 'active',  title: 'Auth & usuarios',    items: ['Supabase Auth', 'Email confirmation', 'Perfiles reales', 'RLS Postgres'] },
              { phase: 'Fase 3', status: 'pending', title: 'Liquidación real',   items: ['Reveal on-chain', 'Pago Pedersen', 'Notificaciones', 'Wallet signing'] },
              { phase: 'Fase 4', status: 'pending', title: 'Mainnet',            items: ['Auditoría externa', 'KYC institucional', 'Mainnet deploy', 'Compliance panel'] },
            ].map((r) => (
              <div
                key={r.phase}
                className="rounded-xl border p-5"
                style={{
                  borderColor: r.status === 'done' ? 'var(--brand-line)' : r.status === 'active' ? 'rgba(59,130,246,0.3)' : 'var(--line)',
                  background: r.status === 'done' ? 'var(--brand-dim)' : r.status === 'active' ? 'rgba(59,130,246,0.06)' : 'var(--raised)',
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <span className="micro-label">{r.phase}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold"
                    style={{
                      background: r.status === 'done' ? 'var(--brand-dim)' : r.status === 'active' ? 'rgba(59,130,246,0.15)' : 'var(--overlay)',
                      color: r.status === 'done' ? 'var(--brand)' : r.status === 'active' ? '#93c5fd' : 'var(--text-3)',
                    }}
                  >
                    {r.status === 'done' ? 'listo' : r.status === 'active' ? 'en curso' : 'próximo'}
                  </span>
                </div>
                <div className="mb-3 text-sm font-bold text-white">{r.title}</div>
                <ul className="space-y-1.5">
                  {r.items.map(it => (
                    <li key={it} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-3)' }}>
                      <span style={{ color: r.status === 'done' ? 'var(--brand)' : r.status === 'active' ? '#93c5fd' : 'var(--text-3)' }}>
                        {r.status === 'done' ? '✓' : '·'}
                      </span>
                      {it}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="relative overflow-hidden border-t border-edge">
        <div className="orb orb-green"  style={{ width: 600, height: 600, top: -200, left: '50%', transform: 'translateX(-50%)', opacity: 0.5 }} />
        <div className="dot-grid absolute inset-0 opacity-60" />
        <div className="relative z-10 mx-auto max-w-3xl px-5 py-28 text-center sm:px-8">
          <p className="eyebrow mb-4">Empezá ahora</p>
          <h2
            className="mb-5 text-4xl font-bold text-white sm:text-5xl"
            style={{ letterSpacing: '-0.035em', lineHeight: 1.1 }}
          >
            Probalo en Testnet hoy.
          </h2>
          <p className="mx-auto mb-10 max-w-lg text-base leading-relaxed" style={{ color: 'var(--text-2)' }}>
            Los contratos están vivos en Stellar Testnet. Registrate, conectá una wallet de prueba
            y hacé tu primera oferta sellada en minutos.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/signup/emisor"
              className="btn-primary"
              style={{ minHeight: 48, padding: '0 32px', fontSize: 15 }}
            >
              Empezar como emisor
            </Link>
            <Link
              to="/signup/oferente"
              className="btn-secondary"
              style={{ minHeight: 48, padding: '0 32px', fontSize: 15 }}
            >
              Entrar como banco
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-edge" style={{ background: 'var(--bg-soft)' }}>
        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <BrandLogo compact />
              <span className="text-xs" style={{ color: 'var(--text-3)' }}>
                Institutional Decentralized Issuance & Offerings
              </span>
            </div>
            <div className="flex flex-wrap gap-5 text-xs" style={{ color: 'var(--text-3)' }}>
              <span>MIT License</span>
              <span>Stellar Testnet</span>
              <span>Groth16 / BN254</span>
              <Link to="/login" style={{ color: 'var(--text-3)' }} className="hover:text-white transition-colors">
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </footer>

    </main>
  )
}
