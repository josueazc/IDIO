import { Link } from 'react-router-dom'
import BrandLogo from '../components/BrandLogo'

export default function Welcome() {
  return (
    <main className="min-h-screen">
      <header className="border-b border-edge bg-surface/60 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-5 sm:px-8">
          <BrandLogo />
          <Link className="btn-ghost btn-sm" to="/login">
            Iniciar sesión
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-4 py-16 sm:px-8 sm:py-24">
        <p className="eyebrow">Subastas institucionales en Stellar</p>
        <h1 className="font-display mt-5 max-w-3xl text-4xl leading-[1.08] text-white sm:text-5xl lg:text-[3.25rem]">
          Un emisor. Varios bancos. Ofertas a ciegas con prueba pública.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-zinc-400">
          Registrate según tu rol: el emisor publica y audita; los bancos ofertan con wallet Stellar y
          pruebas ZK.
        </p>

        <div className="mt-14 grid gap-5 md:grid-cols-2">
          <Link to="/signup/emisor" className="role-card block no-underline">
            <span className="inline-flex rounded-full border border-brand/25 bg-brand/10 px-3 py-1 text-xs font-semibold text-brand">
              Emisor
            </span>
            <h2 className="font-display mt-5 text-2xl text-white">Publico subastas</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Creá emisiones, asigná cupos, auditá resultados y revisá cumplimiento — todo desde una sola
              cuenta.
            </p>
            <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand">
              Crear cuenta
              <span aria-hidden>→</span>
            </span>
          </Link>

          <Link to="/signup/oferente" className="role-card block no-underline">
            <span className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-semibold text-zinc-300">
              Oferente
            </span>
            <h2 className="font-display mt-5 text-2xl text-white">Oferto como banco</h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Conectá tu wallet, enviá ofertas selladas y competí sin que otros vean tu precio antes del
              cierre.
            </p>
            <span className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-brand">
              Crear cuenta
              <span aria-hidden>→</span>
            </span>
          </Link>
        </div>

        <p className="mt-12 text-center text-sm text-zinc-500">
          ¿Ya tenés cuenta?{' '}
          <Link className="font-semibold text-brand hover:text-brand-soft" to="/login">
            Entrar con email
          </Link>
        </p>

        <div className="mt-10 rounded-2xl border border-edge bg-raised/50 px-5 py-4 text-sm text-zinc-500">
          <span className="font-medium text-zinc-300">Modo demo:</span> cualquier email y contraseña
          funcionan. Los datos se guardan solo en este navegador.
        </div>
      </section>
    </main>
  )
}
