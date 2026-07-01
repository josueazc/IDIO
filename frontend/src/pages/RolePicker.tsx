import { useNavigate } from 'react-router-dom'
import ModeToggle from '../components/ModeToggle'
import WalletConnect from '../components/WalletConnect'
import BrandLogo from '../components/BrandLogo'
import BankAccess from '../components/BankAccess'
import { ROLES, setRole, type Role } from '../services/role'
import { roleHome } from '../utils/roleNav'

interface Props {
  address: string | null
  demo: boolean
  onConnect: (address: string, demo: boolean) => void
  onDisconnect: () => void
}

export default function RolePicker({ address, demo, onConnect, onDisconnect }: Props) {
  const nav = useNavigate()

  function pick(role: Role) {
    setRole(role)
    nav(roleHome(role))
  }

  function enterAsBank() {
    pick('oferente')
  }

  return (
    <main className="min-h-screen bg-ink text-white">
      <header className="sticky top-0 z-30 border-b border-edge bg-ink/95">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <BrandLogo />
            <div>
              <div className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Capa de emisión</div>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 md:flex">
            <a className="transition hover:text-white" href="#protocol">Protocolo</a>
            <a className="transition hover:text-white" href="#roles">Roles</a>
            <a className="transition hover:text-white" href="#wallet">Billetera</a>
          </nav>
          <div className="hidden items-center gap-2 lg:flex">
            <ModeToggle />
            <WalletConnect address={address} demo={demo} onConnect={onConnect} onDisconnect={onDisconnect} />
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:py-20 lg:grid-cols-[1fr_0.92fr] lg:px-8 lg:py-24">
        <div className="flex flex-col justify-center">
          <div className="mb-6 flex w-fit items-center gap-3 border border-edge bg-white/[0.02] px-3 py-2 text-xs text-slate-400">
            <span className="h-2 w-2 rounded-full bg-brand" />
            Listo para Stellar Testnet / modo demo disponible
          </div>
          <h1 className="max-w-5xl text-5xl font-semibold leading-[0.95] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
            Subastas privadas para instituciones que igual necesitan prueba pública.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-400">
            IDIO permite a los emisores publicar subastas respaldadas por reservas, a los oferentes enviar
            ofertas selladas, y a los auditores verificar el resultado sin exponer los montos privados antes
            de la liquidación.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button className="btn-primary" onClick={() => pick('emisor')}>
              Entrar a la mesa del emisor
            </button>
            <a className="btn-ghost text-center" href="#banks">
              Registrarse / ingresar como banco
            </a>
          </div>
          <div className="mt-8 grid max-w-2xl grid-cols-3 border border-edge">
            {[
              ['Prueba', 'predicado de reservas'],
              ['Oferta', 'compromiso sellado'],
              ['Liquidar', 'ganador auditable'],
            ].map(([label, text]) => (
              <div key={label} className="border-r border-edge p-4 last:border-r-0">
                <div className="text-[10px] uppercase tracking-[0.22em] text-slate-600">{label}</div>
                <div className="mt-2 text-sm text-slate-300">{text}</div>
              </div>
            ))}
          </div>
        </div>

        <LandingMockup />
      </section>

      <section id="protocol" className="border-y border-edge">
        <div className="mx-auto grid max-w-7xl gap-0 px-4 py-10 sm:px-6 lg:grid-cols-4 lg:px-8">
          {[
            ['01', 'Emitir', 'El emisor define los términos del activo y genera la prueba de reservas.'],
            ['02', 'Comprometer', 'Los oferentes envían compromisos sellados en vez de montos públicos.'],
            ['03', 'Revelar', 'Las ofertas elegibles se abren cuando las reglas de liquidación lo permiten.'],
            ['04', 'Auditar', 'Los auditores inspeccionan la evidencia y producen un informe firmado.'],
          ].map(([step, title, text]) => (
            <article key={step} className="border-b border-edge p-5 last:border-b-0 lg:border-b-0 lg:border-r lg:last:border-r-0">
              <div className="font-mono text-xs text-white">{step}</div>
              <h2 className="mt-8 text-xl font-semibold text-white">{title}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section id="roles" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <div className="micro-label mb-3">Elegí tu rol de operación</div>
            <h2 className="text-3xl font-semibold tracking-[-0.03em]">Un protocolo, cuatro mesas controladas.</h2>
          </div>
          <p className="max-w-xl text-sm leading-6 text-slate-500">
            Cada rol entra a una interfaz distinta. Los permisos y el modelo de datos del backend no cambian.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {ROLES.map((role, index) => (
            <button
              key={role.id}
              onClick={() => pick(role.id)}
              className="group border border-edge bg-panel p-5 text-left transition hover:border-white/40 hover:bg-raised"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-white">{String(index + 1).padStart(2, '0')}</span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-slate-600">{role.icon}</span>
              </div>
              <h3 className="mt-10 text-xl font-semibold text-white">{role.label}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-500">{role.desc}</p>
              <div className="mt-6 text-sm font-semibold text-brand opacity-0 transition group-hover:opacity-100">
                Entrar
              </div>
            </button>
          ))}
        </div>
      </section>

      <section id="banks" className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
        <BankAccess
          address={address}
          demo={demo}
          onConnect={onConnect}
          onDisconnect={onDisconnect}
          onEnter={enterAsBank}
        />
      </section>

      <section id="wallet" className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="grid gap-6 border border-edge bg-[#050505] p-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="micro-label mb-3">Acceso con billetera</div>
            <h2 className="text-2xl font-semibold tracking-[-0.02em]">Conectá con Stellar Wallets Kit.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
              Los íconos de las billeteras se sirven desde assets locales estables, mientras que la firma sigue usando el módulo real de billetera Stellar elegido en el kit.
            </p>
          </div>
          <div className="space-y-3">
            <ModeToggle />
            <WalletConnect address={address} demo={demo} onConnect={onConnect} onDisconnect={onDisconnect} />
          </div>
        </div>
      </section>
    </main>
  )
}

function LandingMockup() {
  return (
    <div className="relative min-h-[520px] overflow-hidden border border-edge bg-[#050505] p-5">
      <div className="flex items-center justify-between border-b border-edge pb-4">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
          <span className="h-2.5 w-2.5 rounded-full bg-white/20" />
        </div>
        <div className="text-[10px] uppercase tracking-[0.22em] text-slate-600">idio.xyz</div>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-[1fr_220px]">
        <div>
          <div className="micro-label">Mesa del emisor / nuevo registro</div>
          <div className="mt-4 text-3xl font-semibold tracking-[-0.03em] text-white">Emitir una subasta privada.</div>
          <div className="mt-3 max-w-md text-sm leading-6 text-slate-500">
            Se genera una prueba de reservas antes de publicar este registro en el protocolo.
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {['Sovereign Notes', 'Bono soberano', '500000000', 'USDC'].map((value, index) => (
              <div key={value} className="border border-edge bg-[#111] p-4">
                <div className="micro-label">{['Activo', 'Clase de activo', 'Monto emitido', 'Moneda'][index]}</div>
                <div className="mt-3 text-sm font-semibold text-white">{value}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="border border-edge">
          <div className="border-b border-edge p-4 micro-label">Verificación previa</div>
          {['Stellar Testnet', 'Cobertura total', 'Groth16 / BN254', 'Tras validar'].map((item) => (
            <div key={item} className="flex justify-between gap-4 border-b border-edge p-4 text-xs last:border-b-0">
              <span className="text-slate-600">estado</span>
              <span className="font-mono uppercase tracking-[0.16em] text-brand">{item}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="absolute bottom-8 right-8 h-32 w-32 rounded-full border border-white/15" />
      <div className="absolute bottom-16 right-20 h-24 w-52 rotate-[-18deg] border border-white/15 bg-white/[0.03]" />
      <div className="absolute bottom-12 right-28 h-16 w-36 rotate-[18deg] border border-brand/45 bg-brand/10" />
    </div>
  )
}
